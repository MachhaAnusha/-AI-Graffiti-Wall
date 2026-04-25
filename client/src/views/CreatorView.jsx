import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Toolbar from '../components/Toolbar';
import ColorPicker from '../components/ColorPicker';
import BrushSelector from '../components/BrushSelector';
import TextToGraffiti from '../components/TextToGraffiti';
import TimerWidget from '../components/TimerWidget';
import CanvasActions from '../components/CanvasActions';
import BackgroundSelector from '../components/BackgroundSelector';
import { useSocket } from '../hooks/useSocket';
import { useCanvas } from '../hooks/useCanvas';
import { useModeration } from '../hooks/useModeration';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { usePointerEvents } from 'react-pointer-events';

const CreatorView = () => {
  const [nickname, setNickname] = useState('');
  const [showNicknameModal, setShowNicknameModal] = useState(true);
  const [selectedBrush, setSelectedBrush] = useState('freehand');
  const [brushSize, setBrushSize] = useState(5);
  const [selectedColor, setSelectedColor] = useState('#FFE500');
  const [opacity, setOpacity] = useState(1);
  const [neonGlow, setNeonGlow] = useState(false);
  const [background, setBackground] = useState('brick');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [showEnhancementModal, setShowEnhancementModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [sessionSettings, setSessionSettings] = useState({ timerDuration: 3, slideshowEnabled: true });
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const socket = useSocket();
  const { canvas, clearCanvas, getCanvasData, setCanvasBackground, addTextToCanvas, enhanceBrush } = useCanvas();
  const { moderateText, moderateImage } = useModeration();
  const { undo, redo, canUndo, canRedo, saveState } = useUndoRedo(canvas);
  
  // Pointer events for Apple Pencil and touch support
  const pointerEvents = usePointerEvents({
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPinchStart: handlePinchStart,
    onPinchMove: handlePinchMove,
    onPinchEnd: handlePinchEnd,
  });

  function handlePointerDown(event) {
    if (!canvas || isBlocked) return;
    
    const pointer = event.pointer;
    const pressure = pointer.pressure || 1;
    
    // Adjust brush size based on pressure for Apple Pencil
    if (pressure > 0 && pressure < 1) {
      const pressureMultiplier = 0.5 + (pressure * 1.5);
      canvas.freeDrawingBrush.width = brushSize * pressureMultiplier;
    }
    
    setIsDrawing(true);
  }

  function handlePointerMove(event) {
    if (!canvas || !isDrawing || isBlocked) return;
    
    const pointer = event.pointer;
    const pressure = pointer.pressure || 1;
    
    // Real-time pressure adjustment
    if (pressure > 0 && pressure < 1) {
      const pressureMultiplier = 0.5 + (pressure * 1.5);
      canvas.freeDrawingBrush.width = brushSize * pressureMultiplier;
    }
  }

  function handlePointerUp(event) {
    setIsDrawing(false);
    if (canvas) {
      saveState();
    }
  }

  let zoomLevel = 1;
  let isPinching = false;

  function handlePinchStart(event) {
    isPinching = true;
  }

  function handlePinchMove(event) {
    if (!canvas || !isPinching) return;
    
    const scale = event.scale;
    const newZoom = Math.max(0.5, Math.min(3, zoomLevel * scale));
    
    canvas.setZoom(newZoom);
    canvas.renderAll();
    zoomLevel = newZoom;
  }

  function handlePinchEnd(event) {
    isPinching = false;
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            handleDownload();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Canvas initialization with 16:9 aspect ratio
  useEffect(() => {
    if (canvas && containerRef.current) {
      // Set canvas to 16:9 aspect ratio
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const canvasHeight = (containerWidth * 9) / 16;
      
      canvas.setDimensions({
        width: containerWidth,
        height: canvasHeight
      });
      
      setCanvasBackground(background);
      
      // Enhanced brush setup
      canvas.on('path:created', (e) => {
        setIsDrawing(false);
        saveState();
        
        // Add drip effect for drip brush
        if (selectedBrush === 'drip' && e.path) {
          addDripEffect(e.path);
        }
      });
      
      canvas.on('mouse:down', () => {
        setIsDrawing(true);
      });
      
      canvas.on('mouse:up', () => {
        setIsDrawing(false);
        saveState();
      });
    }
  }, [canvas, background, selectedBrush]);

  // Brush enhancement
  useEffect(() => {
    if (canvas) {
      enhanceBrush(selectedBrush, {
        size: brushSize,
        color: selectedColor,
        opacity,
        neonGlow
      });
    }
  }, [selectedBrush, brushSize, selectedColor, opacity, neonGlow, canvas]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    socket.emit('creator:connect');
    
    socket.on('session:update', (settings) => {
      setSessionSettings(settings);
    });
    
    socket.on('timer:start', (duration) => {
      // Timer logic handled by TimerWidget component
    });
    
    socket.on('timer:expired', () => {
      handleAutoSubmit();
    });
    
    socket.on('canvas:warning', (data) => {
      toast(data.message, { icon: '⚠️' });
    });
    
    socket.on('canvas:blocked', (data) => {
      setIsBlocked(true);
      setBlockTimeRemaining(data.duration);
      toast('Canvas blocked for content violations', { icon: '🚫' });
      
      // Unblock after duration
      setTimeout(() => {
        setIsBlocked(false);
        setBlockTimeRemaining(0);
      }, data.duration);
    });
    
    return () => {
      socket.off('session:update');
      socket.off('timer:start');
      socket.off('timer:expired');
      socket.off('canvas:warning');
      socket.off('canvas:blocked');
    };
  }, [socket]);

  // Canvas snapshot moderation (Layer 3)
  useEffect(() => {
    if (!canvas || isBlocked) return;
    
    const moderationInterval = setInterval(async () => {
      try {
        const canvasData = canvas.toDataURL('image/png');
        const violations = await moderateImage(canvasData);
        
        if (violations.length > 0) {
          socket.emit('canvas:moderation', {
            image: canvasData,
            sessionId: socket.id
          });
        }
      } catch (error) {
        console.error('Canvas moderation error:', error);
      }
    }, 45000); // Every 45 seconds
    
    return () => clearInterval(moderationInterval);
  }, [canvas, isBlocked, socket]);

  const addDripEffect = (path) => {
    if (!canvas) return;
    
    // Create drip particles
    const dripCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < dripCount; i++) {
      setTimeout(() => {
        const drip = new fabric.Circle({
          left: path.path[path.path.length - 2] + (Math.random() - 0.5) * 10,
          top: path.path[path.path.length - 1],
          radius: Math.random() * 3 + 1,
          fill: path.stroke,
          opacity: 0.8,
          selectable: false
        });
        
        canvas.add(drip);
        
        // Animate drip falling
        let top = drip.top;
        const dripAnimation = setInterval(() => {
          top += 2;
          drip.set('top', top);
          drip.set('opacity', drip.opacity - 0.02);
          
          if (drip.opacity <= 0) {
            clearInterval(dripAnimation);
            canvas.remove(drip);
          } else {
            canvas.renderAll();
          }
        }, 50);
      }, i * 200);
    }
  };

  const handleNicknameSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim()) {
      setShowNicknameModal(false);
    }
  };

  const handleBrushChange = (brush) => {
    setSelectedBrush(brush);
    if (canvas) {
      enhanceBrush(brush, {
        size: brushSize,
        color: selectedColor,
        opacity,
        neonGlow
      });
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

  const handleOpacityChange = (opacityValue) => {
    setOpacity(opacityValue);
    if (canvas) {
      canvas.freeDrawingBrush.opacity = opacityValue;
    }
  };

  const handleNeonGlowToggle = () => {
    setNeonGlow(!neonGlow);
    if (canvas) {
      const brush = canvas.freeDrawingBrush;
      if (!neonGlow) {
        brush.shadow = new fabric.Shadow({
          color: selectedColor,
          blur: 20,
          offsetX: 0,
          offsetY: 0
        });
      } else {
        brush.shadow = null;
      }
    }
  };

  const handleBackgroundChange = (newBackground) => {
    setBackground(newBackground);
    setCanvasBackground(newBackground);
  };

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
      clearCanvas();
      toast.success('Canvas cleared');
    }
  };

  const handleDownload = () => {
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `graffiti-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    
    toast.success('Image downloaded');
  };

  const handleCustomBackgroundUpload = (file) => {
    if (!file || !canvas) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      fabric.Image.fromURL(e.target.result, (img) => {
        // Scale image to fit canvas
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgWidth = img.width;
        const imgHeight = img.height;
        
        const scaleX = canvasWidth / imgWidth;
        const scaleY = canvasHeight / imgHeight;
        const scale = Math.max(scaleX, scaleY);
        
        img.set({
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false
        });
        
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        toast.success('Custom background uploaded');
      });
    };
    reader.readAsDataURL(file);
  };

  const handleTextToGraffiti = async (text, style) => {
    try {
      toast.loading('Generating graffiti...', { id: 'text-graffiti' });
      
      const response = await fetch('/api/text-to-graffiti', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, style }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.fallback) {
          // Use fallback text rendering
          addTextToCanvas(text, style, result.data.font);
          toast.success('Graffiti text added', { id: 'text-graffiti' });
        } else {
          // Add AI-generated image to canvas
          fabric.Image.fromURL(result.data, (img) => {
            const scale = 0.5; // Scale down to fit
            img.set({
              scaleX: scale,
              scaleY: scale,
              left: canvas.width / 2 - (img.width * scale) / 2,
              top: canvas.height / 2 - (img.height * scale) / 2,
              selectable: true,
              evented: true
            });
            
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            
            toast.success('AI graffiti added to canvas', { id: 'text-graffiti' });
          });
        }
      } else {
        toast.error(result.error, { id: 'text-graffiti' });
      }
    } catch (error) {
      console.error('Text to graffiti error:', error);
      toast.error('Failed to generate graffiti', { id: 'text-graffiti' });
    }
  };

  const handleEnhanceDrawing = async () => {
    if (!canvas || isEnhancing) return;
    
    try {
      setIsEnhancing(true);
      toast.loading('Enhancing your artwork...', { id: 'enhance' });
      
      const canvasData = canvas.toDataURL('image/png');
      
      const response = await fetch('/api/enhance-drawing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: canvasData }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setEnhancedImage(result.enhanced);
        setShowEnhancementModal(true);
        toast.success('Artwork enhanced!', { id: 'enhance' });
      } else {
        toast.error(result.error, { id: 'enhance' });
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      toast.error('Failed to enhance artwork', { id: 'enhance' });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAcceptEnhancement = () => {
    if (!enhancedImage || !canvas) return;
    
    fabric.Image.fromURL(enhancedImage, (img) => {
      // Clear canvas and add enhanced image
      canvas.clear();
      
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );
      
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: canvas.width / 2 - (img.width * scale) / 2,
        top: canvas.height / 2 - (img.height * scale) / 2,
        selectable: false,
        evented: false
      });
      
      canvas.add(img);
      canvas.renderAll();
      
      toast.success('Enhancement applied!');
      setShowEnhancementModal(false);
      setEnhancedImage(null);
    });
  };

  const handleRejectEnhancement = () => {
    setShowEnhancementModal(false);
    setEnhancedImage(null);
    toast('Original artwork kept');
  };

  const handleAutoSubmit = () => {
    if (!canvas || isBlocked) return;
    
    toast('Timer expired! Auto-submitting artwork...');
    handleSendToDisplay();
  };

  const handleSendToDisplay = async () => {
    if (!canvas || isBlocked) {
      if (isBlocked) {
        toast.error('Canvas is blocked. Please wait.');
      }
      return;
    }
    
    try {
      const imageData = getCanvasData();
      
      if (!imageData) {
        toast.error('Please create some artwork first!');
        return;
      }

      toast.loading('Sending artwork to display...', { id: 'send-artwork' });

      // Optimize image data to reduce payload size
      let optimizedImageData = imageData;
      if (imageData && imageData.length > 1000000) { // If larger than 1MB
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const scaleFactor = 0.7; // Scale down to 70%
        
        tempCanvas.width = canvas.width * scaleFactor;
        tempCanvas.height = canvas.height * scaleFactor;
        tempCtx.drawImage(canvas.getElement(), 0, 0, tempCanvas.width, tempCanvas.height);
        
        optimizedImageData = tempCanvas.toDataURL('image/jpeg', 0.7); // Use JPEG with 70% quality
      }

      const response = await fetch('/api/gallery', {
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

      if (response.ok) {
        const result = await response.json();
        toast.success('Artwork sent to display successfully!', { id: 'send-artwork' });
        
        // Clear canvas after successful submission
        setTimeout(() => {
          clearCanvas();
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        toast.error(`Failed to send artwork: ${response.status}`, { id: 'send-artwork' });
      }
    } catch (error) {
      console.error('Network error sending artwork:', error);
      toast.error(`Error sending artwork: ${error.message}`, { id: 'send-artwork' });
    }
  };

  // Responsive design
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-primary text-primary">
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'graffiti-panel',
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }
        }}
      />
      
      {/* Nickname Modal */}
      <AnimatePresence>
        {showNicknameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="graffiti-panel max-w-md w-full"
            >
              <h2 className="graffiti-title text-2xl mb-4">Enter Your Nickname</h2>
              <form onSubmit={handleNicknameSubmit} className="space-y-4">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your artist name..."
                  className="graffiti-input w-full"
                  maxLength={20}
                  required
                />
                <button
                  type="submit"
                  className="graffiti-button w-full"
                >
                  Start Creating
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhancement Modal */}
      <AnimatePresence>
        {showEnhancementModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="graffiti-panel max-w-4xl w-full"
            >
              <h2 className="graffiti-title text-2xl mb-4">AI Enhancement Complete!</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="ui-text text-sm mb-2">Original</h3>
                  <div className="canvas-container">
                    <canvas ref={canvasRef} className="w-full h-48 object-contain" />
                  </div>
                </div>
                <div>
                  <h3 className="ui-text text-sm mb-2">Enhanced</h3>
                  <div className="canvas-container">
                    <img src={enhancedImage} alt="Enhanced artwork" className="w-full h-48 object-contain" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleRejectEnhancement}
                  className="graffiti-button flex-1 bg-gray-600"
                >
                  Keep Original
                </button>
                <button
                  onClick={handleAcceptEnhancement}
                  className="graffiti-button flex-1"
                >
                  Use Enhanced
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Timer */}
      <TimerWidget 
        duration={sessionSettings.timerDuration}
        onExpire={handleAutoSubmit}
        className="session-timer"
      />

      {/* Main Content */}
      <div className={`flex flex-col ${isMobile ? 'h-screen pb-20' : 'min-h-screen'}`}>
        {/* Header */}
        <header className="graffiti-panel m-4">
          <h1 className="graffiti-title text-3xl md:text-4xl">AI Graffiti Wall</h1>
          <p className="text-secondary mt-2">Create your digital masterpiece</p>
        </header>

        {/* Canvas Container */}
        <div className="flex-1 px-4 mb-4">
          <div 
            ref={containerRef}
            className="canvas-container canvas-aspect-16-9"
            {...pointerEvents}
          >
            <canvas 
              ref={canvasRef}
              id="graffiti-canvas"
              className="w-full h-full"
            />
          </div>
          
          {/* Blocked Overlay */}
          {isBlocked && (
            <div className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h3 className="graffiti-title text-xl mb-2">Canvas Blocked</h3>
                <p className="text-secondary">Content violation detected</p>
                <p className="text-sm mt-2">Unblocks in: {Math.ceil(blockTimeRemaining / 1000)}s</p>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar - Desktop */}
        {!isMobile && (
          <div className="px-4 pb-4 space-y-4">
            {/* Top Toolbar */}
            <Toolbar className="toolbar">
              <BrushSelector
                selectedBrush={selectedBrush}
                onBrushChange={handleBrushChange}
                disabled={isBlocked}
              />
              
              <ColorPicker
                selectedColor={selectedColor}
                onColorChange={handleColorChange}
                disabled={isBlocked}
              />
              
              <div className="flex items-center gap-2">
                <label className="ui-text text-xs">Size:</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={brushSize}
                  onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                  className="w-24"
                  disabled={isBlocked}
                />
                <span className="text-xs w-8">{brushSize}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="ui-text text-xs">Opacity:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  className="w-24"
                  disabled={isBlocked}
                />
                <span className="text-xs w-8">{Math.round(opacity * 100)}%</span>
              </div>
              
              <button
                onClick={handleNeonGlowToggle}
                className={`toolbar-item ${neonGlow ? 'active' : ''}`}
                disabled={isBlocked}
              >
                <span className="text-2xl">✨</span>
                <span className="text-xs">Glow</span>
              </button>
              
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={undo}
                  disabled={!canUndo || isBlocked}
                  className="toolbar-item"
                >
                  <span className="text-lg">↶</span>
                  <span className="text-xs">Undo</span>
                </button>
                
                <button
                  onClick={redo}
                  disabled={!canRedo || isBlocked}
                  className="toolbar-item"
                >
                  <span className="text-lg">↷</span>
                  <span className="text-xs">Redo</span>
                </button>
              </div>
            </Toolbar>

            {/* Middle Toolbar */}
            <Toolbar className="toolbar">
              <BackgroundSelector
                selectedBackground={background}
                onBackgroundChange={handleBackgroundChange}
                onCustomBackgroundUpload={handleCustomBackgroundUpload}
                disabled={isBlocked}
              />
              
              <TextToGraffiti
                onGenerate={handleTextToGraffiti}
                disabled={isBlocked}
              />
              
              <button
                onClick={handleEnhanceDrawing}
                disabled={isEnhancing || isBlocked}
                className="graffiti-button"
              >
                {isEnhancing ? (
                  <div className="spray-loader">
                    <div className="spray-dot"></div>
                    <div className="spray-dot"></div>
                    <div className="spray-dot"></div>
                  </div>
                ) : (
                  'Enhance with AI'
                )}
              </button>
            </Toolbar>

            {/* Bottom Actions */}
            <CanvasActions
              onClear={handleClearCanvas}
              onDownload={handleDownload}
              onSendToDisplay={handleSendToDisplay}
              disabled={isBlocked}
              nickname={nickname}
              onNicknameChange={setNickname}
            />
          </div>
        )}

        {/* Mobile Toolbar */}
        {isMobile && (
          <div className="toolbar toolbar-mobile">
            <BrushSelector
              selectedBrush={selectedBrush}
              onBrushChange={handleBrushChange}
              disabled={isBlocked}
              compact
            />
            
            <ColorPicker
              selectedColor={selectedColor}
              onColorChange={handleColorChange}
              disabled={isBlocked}
              compact
            />
            
            <button
              onClick={undo}
              disabled={!canUndo || isBlocked}
              className="toolbar-item"
            >
              <span className="text-lg">↶</span>
            </button>
            
            <button
              onClick={redo}
              disabled={!canRedo || isBlocked}
              className="toolbar-item"
            >
              <span className="text-lg">↷</span>
            </button>
            
            <button
              onClick={handleSendToDisplay}
              disabled={isBlocked}
              className="graffiti-button flex-1"
            >
              Send to Wall
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorView;
