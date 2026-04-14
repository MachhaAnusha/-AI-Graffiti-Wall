import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import Toolbar from '../components/Toolbar';
import ColorPicker from '../components/ColorPicker';
import BrushSelector from '../components/BrushSelector';
import TextToGraffiti from '../components/TextToGraffiti';
import TimerWidget from '../components/TimerWidget';
import { useSocket } from '../hooks/useSocket';
import { useCanvas } from '../hooks/useCanvas';
import { useModeration } from '../hooks/useModeration';

const CreatorView = () => {
  const [nickname, setNickname] = useState('');
  const [showNicknameModal, setShowNicknameModal] = useState(true);
  const [selectedBrush, setSelectedBrush] = useState('freehand');
  const [brushSize, setBrushSize] = useState(5);
  const [selectedColor, setSelectedColor] = useState('#ff006e');
  const [opacity, setOpacity] = useState(1);
  const [neonGlow, setNeonGlow] = useState(false);
  const [background, setBackground] = useState('brick');
  const [isDrawing, setIsDrawing] = useState(false);

  const socket = useSocket();
  const { canvas, clearCanvas, getCanvasData, setCanvasBackground, addTextToCanvas } = useCanvas();
  const { moderateText } = useModeration();

  useEffect(() => {
    if (canvas) {
      setCanvasBackground(background);
      
      canvas.on('path:created', () => {
        setIsDrawing(false);
      });
      
      canvas.on('mouse:down', () => {
        setIsDrawing(true);
      });
    }
  }, [canvas, background]);

  const handleNicknameSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim()) {
      setShowNicknameModal(false);
    }
  };

  const handleBrushChange = (brush) => {
    setSelectedBrush(brush);
    if (canvas) {
      switch (brush) {
        case 'freehand':
          canvas.freeDrawingBrush.width = brushSize;
          break;
        case 'spray':
          // Spray paint effect
          canvas.freeDrawingBrush.width = brushSize * 2;
          break;
        case 'marker':
          canvas.freeDrawingBrush.width = brushSize;
          break;
        case 'chalk':
          canvas.freeDrawingBrush.width = brushSize;
          break;
        case 'drip':
          canvas.freeDrawingBrush.width = brushSize;
          break;
        case 'eraser':
          canvas.freeDrawingBrush.width = brushSize * 2;
          break;
      }
    }
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    if (canvas) {
      canvas.freeDrawingBrush.color = color;
    }
  };

  const handleSizeChange = (size) => {
    setBrushSize(size);
    if (canvas) {
      canvas.freeDrawingBrush.width = size;
    }
  };

  const handleBackgroundChange = (bg) => {
    setBackground(bg);
    setCanvasBackground(bg);
  };

  const handleClearCanvas = () => {
    clearCanvas();
  };

  const handleDownload = () => {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `graffiti-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  const handleSendToDisplay = async () => {
    try {
      const imageData = getCanvasData();
      
      if (!imageData) {
        alert('Please create some artwork first!');
        return;
      }

      // Submit to server
      const response = await fetch('http://localhost:3000/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          nickname: nickname || 'Anonymous',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Artwork sent to display successfully!');
        
        // Clear canvas after successful submission
        setTimeout(() => {
          clearCanvas();
        }, 1000);
      } else {
        alert('Failed to send artwork to display');
      }
    } catch (error) {
      console.error('Error sending artwork:', error);
      alert('Error sending artwork to display');
    }
  };

  const handleTextSubmit = async (text, style) => {
    try {
      const isAppropriate = await moderateText(text);
      if (!isAppropriate) {
        alert('Text contains inappropriate content. Please try different text.');
        return;
      }
      
      addTextToCanvas(text, style);
    } catch (error) {
      console.error('Error adding text:', error);
    }
  };

  const handleTimerComplete = () => {
    handleSendToDisplay();
  };

  if (showNicknameModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-lg border-2 border-pink-500 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-center mb-6 neon-pink font-boogaloo">
            Enter Your Nickname
          </h2>
          <form onSubmit={handleNicknameSubmit} className="space-y-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your graffiti name..."
              className="w-full px-4 py-3 bg-black border-2 border-pink-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              maxLength={20}
              required
            />
            <button
              type="submit"
              className="w-full graffiti-btn font-boogaloo"
            >
              Start Creating
            </button>
          </form>
          <p className="text-center text-gray-400 mt-4 text-sm">
            This will be shown with your artwork on the display
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold neon-pink font-boogaloo mb-2">
            AI Graffiti Wall
          </h1>
          <p className="text-gray-400">
            Welcome, <span className="neon-blue">{nickname}</span>! Create your masterpiece
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Tools */}
          <div className="lg:col-span-1 space-y-4">
            <Toolbar
              selectedBrush={selectedBrush}
              onBrushChange={handleBrushChange}
              onClearCanvas={handleClearCanvas}
              onDownload={handleDownload}
              onSendToDisplay={handleSendToDisplay}
              isDrawing={isDrawing}
            />
            
            <BrushSelector
              brushSize={brushSize}
              onSizeChange={handleSizeChange}
            />
            
            <TimerWidget onComplete={handleTimerComplete} />
          </div>

          {/* Center - Canvas */}
          <div className="lg:col-span-2">
            <div className="canvas-container spray-texture">
              <canvas
                id="graffiti-canvas"
                className="w-full"
                style={{ maxHeight: '500px' }}
              />
            </div>
            
            {/* Background Options */}
            <div className="mt-4 flex flex-wrap gap-2">
              {['brick', 'concrete', 'metal', 'wood', 'black', 'white'].map((bg) => (
                <button
                  key={bg}
                  onClick={() => handleBackgroundChange(bg)}
                  className={`px-3 py-1 rounded text-sm font-boogaloo ${
                    background === bg
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {bg.charAt(0).toUpperCase() + bg.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Colors & Text */}
          <div className="lg:col-span-1 space-y-4">
            <ColorPicker
              selectedColor={selectedColor}
              onColorChange={handleColorChange}
              opacity={opacity}
              onOpacityChange={setOpacity}
              neonGlow={neonGlow}
              onNeonGlowChange={setNeonGlow}
            />
            
            <TextToGraffiti onTextSubmit={handleTextSubmit} />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-gray-400 text-sm">
          <p>Create your graffiti and send it to the big screen!</p>
        </footer>
      </div>
    </div>
  );
};

export default CreatorView;
