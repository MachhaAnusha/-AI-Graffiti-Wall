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
    alert('Downloaded image!');
  };

  const handleSendToDisplay = async () => {
    alert('Send to Display button clicked!');
    console.log('Send to Display button clicked!');
    
    try {
      const imageData = getCanvasData();
      
      if (!imageData) {
        alert('Please create some artwork first!');
        return;
      }

      alert('Canvas data found! Length: ' + (imageData ? imageData.length : 'null'));
      alert('Starting server request...');

      console.log('Sending artwork to server...');
      console.log('Original image data length:', imageData ? imageData.length : 'null');

      // Optimize image data to reduce payload size
      let optimizedImageData = imageData;
      if (imageData && imageData.length > 1000000) { // If larger than 1MB
        // Reduce quality by scaling down the canvas temporarily
        const canvas = document.getElementById('graffiti-canvas');
        if (canvas) {
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          const scaleFactor = 0.7; // Scale down to 70%
          
          tempCanvas.width = canvas.width * scaleFactor;
          tempCanvas.height = canvas.height * scaleFactor;
          tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
          
          optimizedImageData = tempCanvas.toDataURL('image/jpeg', 0.7); // Use JPEG with 70% quality
          console.log('Optimized image data length:', optimizedImageData.length);
        }
      }

      console.log('Final image data length:', optimizedImageData.length);
      console.log('Server URL:', 'http://10.5.9.139:3000/api/gallery');

      // Submit to server
      const response = await fetch('http://10.5.9.139:3000/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: optimizedImageData,
          nickname: nickname || 'Anonymous',
          timestamp: new Date().toISOString(),
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Server response:', result);
        alert('Artwork sent to display successfully!');
        
        // Clear canvas after successful submission
        setTimeout(() => {
          clearCanvas();
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        alert(`Failed to send artwork to display: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Network error sending artwork:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert(`Error sending artwork to display: ${error.message}`);
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
    <div className="min-h-screen p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Premium Header */}
        <header className="text-center mb-12 slide-in-up">
          <h1 className="premium-header font-boogaloo mb-4">
            AI Graffiti Wall
          </h1>
          <p className="text-xl font-medium" style={{ color: 'var(--text-secondary)' }}>
            Welcome, <span className="neon-blue font-semibold">{nickname}</span>! Create your masterpiece
          </p>
        </header>

        {/* Premium Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Tools */}
          <div className="lg:col-span-1 space-y-6">
            <div className="premium-card fade-in">
              <h3 className="text-lg font-semibold mb-6 font-boogaloo text-gradient">Drawing Tools</h3>
              <Toolbar
                selectedBrush={selectedBrush}
                onBrushChange={handleBrushChange}
                onClearCanvas={handleClearCanvas}
                onDownload={handleDownload}
                onSendToDisplay={handleSendToDisplay}
                isDrawing={isDrawing}
              />
            </div>
            
            <div className="premium-card fade-in" style={{ animationDelay: '0.15s' }}>
              <h3 className="text-lg font-semibold mb-6 font-boogaloo text-gradient">Brush Settings</h3>
              <BrushSelector
                brushSize={brushSize}
                onSizeChange={handleSizeChange}
              />
            </div>
            
            <div className="premium-card fade-in" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-lg font-semibold mb-6 font-boogaloo text-gradient">Session Timer</h3>
              <TimerWidget onComplete={handleTimerComplete} />
            </div>
          </div>

          {/* Center - Canvas */}
          <div className="lg:col-span-2">
            <div className="premium-canvas fade-in" style={{ animationDelay: '0.45s' }}>
              <canvas
                id="graffiti-canvas"
                className="w-full"
                style={{ maxHeight: '500px' }}
              />
            </div>
            
            {/* Premium Background Options */}
            <div className="mt-8 p-6 premium-card fade-in" style={{ animationDelay: '0.6s' }}>
              <h3 className="text-xl font-semibold mb-6 font-boogaloo text-gradient">Canvas Background</h3>
              <div className="grid grid-cols-3 gap-3">
                {['brick', 'concrete', 'metal', 'wood', 'black', 'white'].map((bg) => (
                  <button
                    key={bg}
                    onClick={() => handleBackgroundChange(bg)}
                    className={`premium-button text-sm font-boogaloo transition-all duration-300 transform hover:scale-105 ${
                      background === bg
                        ? 'shadow-lg'
                        : ''
                    }`}
                  >
                    {bg.charAt(0).toUpperCase() + bg.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Colors & Text */}
          <div className="lg:col-span-1 space-y-6">
            <div className="premium-card fade-in" style={{ animationDelay: '0.75s' }}>
              <h3 className="text-lg font-semibold mb-6 font-boogaloo text-gradient">Color Palette</h3>
              <ColorPicker
                selectedColor={selectedColor}
                onColorChange={handleColorChange}
                opacity={opacity}
                onOpacityChange={setOpacity}
                neonGlow={neonGlow}
                onNeonGlowChange={setNeonGlow}
              />
            </div>
            
            <div className="premium-card fade-in" style={{ animationDelay: '0.9s' }}>
              <h3 className="text-lg font-semibold mb-6 font-boogaloo text-gradient">Text to Graffiti</h3>
              <TextToGraffiti onTextSubmit={handleTextSubmit} />
            </div>
          </div>
        </div>

        {/* Premium Footer */}
        <footer className="text-center mt-16 text-base fade-in" style={{ color: 'var(--text-secondary)', animationDelay: '1.05s' }}>
          <div className="premium-glass inline-block px-8 py-4 rounded-2xl">
            <p className="font-medium">
              Create your graffiti and send it to the big screen! 
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CreatorView;
