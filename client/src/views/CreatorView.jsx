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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [textToGraffitiText, setTextToGraffitiText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('bubble');
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const socket = useSocket();
  const { canvas, clearCanvas, getCanvasData, setCanvasBackground, addTextToCanvas, enhanceBrush } = useCanvas();
  const { moderateText, moderateImage } = useModeration();
  const { undo, redo, canUndo, canRedo, saveState } = useUndoRedo(canvas);
  
  // Note: Brush system is now handled in useCanvas hook
  // Canvas drawing events are handled automatically by the enhanced brush system

  // Note: Pointer events are now handled by useCanvas hook with enhanced brush system

  // Note: Zoom and pinch gestures are handled by useCanvas hook

  // Note: Keyboard shortcuts are handled by useCanvas hook with undo/redo functionality

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
    }
  }, [canvas, background]);

  // Brush enhancement is now handled by useCanvas hook

  // Socket events
  useEffect(() => {
    if (!socket) return;

    socket.emit('creator:connect');
    
    socket.on('session:update', (settings) => {
      setSessionSettings(settings);
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
      socket.off('timer:expired');
      socket.off('canvas:warning');
      socket.off('canvas:blocked');
    };
  }, [socket]);

  // Note: Canvas moderation is now handled by useModeration hook with 4-layer system

  const handleNicknameSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim()) {
      setShowNicknameModal(false);
    }
  };

  // Brush handling is now handled by useCanvas hook
  const handleBrushChange = (brush) => {
    setSelectedBrush(brush);
    enhanceBrush(brush, {
      size: brushSize,
      color: selectedColor,
      opacity,
      neonGlow
    });
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    enhanceBrush(selectedBrush, {
      size: brushSize,
      color,
      opacity,
      neonGlow
    });
  };

  const handleSizeChange = (size) => {
    setBrushSize(size);
    enhanceBrush(selectedBrush, {
      size,
      color: selectedColor,
      opacity,
      neonGlow
    });
  };

  const handleOpacityChange = (opacityValue) => {
    setOpacity(opacityValue);
    enhanceBrush(selectedBrush, {
      size: brushSize,
      color: selectedColor,
      opacity: opacityValue,
      neonGlow
    });
  };

  const handleNeonGlowToggle = () => {
    setNeonGlow(!neonGlow);
    enhanceBrush(selectedBrush, {
      size: brushSize,
      color: selectedColor,
      opacity,
      neonGlow: !neonGlow
    });
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
    <div className="min-h-screen bg-primary text-primary flex flex-col">
      <Toaster 
        position="bottom-center"
        toastOptions={{
          className: 'toast',
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
              className="bg-secondary border border-subtle rounded-12px p-20px max-w-md w-full"
            >
              <h2 className="font-display text-2xl mb-4 text-accent-yellow">Enter Your Nickname</h2>
              <form onSubmit={handleNicknameSubmit} className="space-y-4">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your artist name..."
                  className="color-input w-full"
                  maxLength={20}
                  required
                />
                <button
                  type="submit"
                  className="generate-button w-full"
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
              className="bg-secondary border border-subtle rounded-12px p-20px max-w-4xl w-full"
            >
              <h2 className="font-display text-2xl mb-4 text-accent-yellow">AI Enhancement Complete!</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="section-header mb-2">ORIGINAL</h3>
                  <div className="canvas-container">
                    <canvas ref={canvasRef} className="w-full h-48 object-contain" />
                  </div>
                </div>
                <div>
                  <h3 className="section-header mb-2">ENHANCED</h3>
                  <div className="canvas-container">
                    <img src={enhancedImage} alt="Enhanced artwork" className="w-full h-48 object-contain" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleRejectEnhancement}
                  className="action-button clear-button flex-1"
                >
                  Keep Original
                </button>
                <button
                  onClick={handleAcceptEnhancement}
                  className="send-button flex-1"
                >
                  Use Enhanced
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-title">GRAFFITI WALL</div>
        <div className="top-bar-brush-info">
          <div className="brush-indicator" style={{ backgroundColor: selectedColor }}></div>
          <span>{selectedBrush.toUpperCase()}</span>
        </div>
        <div className="top-bar-right">
          <div className="countdown-timer">
            <svg className="countdown-circle" width="60" height="60">
              <circle
                cx="30"
                cy="30"
                r="28"
                fill="none"
                stroke="var(--border-subtle)"
                strokeWidth="3"
              />
              <circle
                cx="30"
                cy="30"
                r="28"
                fill="none"
                stroke="var(--accent-yellow)"
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - (sessionTimer / 180))}`}
              />
            </svg>
            <div className="countdown-text">
              {Math.floor(sessionTimer / 60)}:{(sessionTimer % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="nickname-badge">{nickname || 'ANONYMOUS'}</div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 relative">
        {/* Left Sidebar - Desktop Only */}
        <div className="left-sidebar hidden md:flex">
          {/* Brush Buttons */}
          {['freehand', 'spray', 'marker', 'chalk', 'drip', 'eraser'].map((brush) => (
            <button
              key={brush}
              onClick={() => handleBrushChange(brush)}
              className={`brush-button ${selectedBrush === brush ? 'active' : ''}`}
              disabled={isBlocked}
            >
              <span className="brush-icon">
                {brush === 'freehand' && '✏️'}
                {brush === 'spray' && '💨'}
                {brush === 'marker' && '🖊️'}
                {brush === 'chalk' && '🪨'}
                {brush === 'drip' && '💧'}
                {brush === 'eraser' && '⬜'}
              </span>
              <span className="brush-label">{brush.slice(0, 3).toUpperCase()}</span>
            </button>
          ))}
          
          <div className="brush-divider"></div>
          
          {/* Undo/Redo */}
          <div className="undo-redo-buttons">
            <button
              onClick={undo}
              disabled={!canUndo || isBlocked}
              className="undo-button"
            >
              <span>↩</span>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo || isBlocked}
              className="redo-button"
            >
              <span>↪</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col p-4">
          <div 
            ref={containerRef}
            className="canvas-container canvas-aspect-16-9 flex-1"
          >
            <canvas 
              ref={canvasRef}
              id="graffiti-canvas"
              className="w-full h-full"
            />
            
            {/* Blocked Overlay */}
            {isBlocked && (
              <div className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="text-6xl mb-4">🚫</div>
                  <h3 className="font-display text-xl mb-2 text-accent-yellow">Canvas Blocked</h3>
                  <p className="text-muted">Content violation detected</p>
                  <p className="text-sm mt-2">Unblocks in: {Math.ceil(blockTimeRemaining / 1000)}s</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Desktop Only */}
        <div className="right-panel hidden md:block">
          {/* Color Section */}
          <div>
            <div className="section-header">COLOR</div>
            <div 
              className="active-color-display"
              style={{ backgroundColor: selectedColor }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            ></div>
            
            {showColorPicker && (
              <div className="color-picker-popup">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="color-input mb-2"
                />
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="color-input mb-2"
                  placeholder="#FFE500"
                />
                <div className="opacity-slider"></div>
              </div>
            )}
            
            {/* Color Palettes */}
            <div className="color-palette">
              <div className="palette-label">OLD SCHOOL</div>
              {['#FF0000', '#FF8C00', '#FFD700', '#228B22', '#0000CD', '#8B008B'].map(color => (
                <div
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
              
              <div className="palette-label">NEON</div>
              {['#FF006E', '#00F5FF', '#39FF14', '#FFE500', '#FF4500', '#BF00FF'].map(color => (
                <div
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
              
              <div className="palette-label">PASTEL</div>
              {['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#DDA0DD'].map(color => (
                <div
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
              
              <div className="palette-label">FIRE</div>
              {['#FF0000', '#FF4500', '#FF8C00', '#FFD700', '#FF6347', '#B22222'].map(color => (
                <div
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
              
              <div className="palette-label">CHROME</div>
              {['#E8E8E8', '#C0C0C0', '#A8A9AD', '#808080', '#696969', '#404040'].map(color => (
                <div
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
              
              <div className="palette-label">DARK</div>
              {['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#f5a623'].map(color => (
                <div
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
              
              <div className="palette-label">RAINBOW</div>
              {['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'].map(color => (
                <div
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
          </div>

          {/* Brush Settings */}
          <div>
            <div className="section-header">BRUSH</div>
            <div className="brush-setting-row">
              <span className="brush-setting-label">SIZE</span>
              <span className="brush-setting-value">{brushSize}px</span>
            </div>
            <div className="brush-preview" style={{ backgroundColor: selectedColor, width: brushSize, height: brushSize }}></div>
            <input
              type="range"
              min="1"
              max="80"
              value={brushSize}
              onChange={(e) => handleSizeChange(parseInt(e.target.value))}
              className="brush-slider"
              disabled={isBlocked}
              style={{ '--thumb-color': selectedColor }}
            />
            
            <div className="brush-setting-row mt-4">
              <span className="brush-setting-label">OPACITY</span>
              <span className="brush-setting-value">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity * 100}
              onChange={(e) => handleOpacityChange(parseInt(e.target.value) / 100)}
              className="brush-slider"
              disabled={isBlocked}
              style={{ 
                background: `linear-gradient(90deg, transparent, ${selectedColor})`,
                '--thumb-color': selectedColor 
              }}
            />
            
            <div className="brush-setting-row mt-4">
              <span className="brush-setting-label">NEON GLOW</span>
              <div 
                className={`neon-glow-toggle ${neonGlow ? 'on' : ''}`}
                onClick={handleNeonGlowToggle}
              >
                <div className="neon-glow-thumb"></div>
              </div>
            </div>
          </div>

          {/* Background Section */}
          <div>
            <div className="section-header">BACKGROUND</div>
            <div className="background-grid">
              {['brick', 'concrete', 'metal', 'wood', 'black', 'white'].map(bg => (
                <div
                  key={bg}
                  className={`background-option bg-${bg} ${background === bg ? 'active' : ''}`}
                  onClick={() => handleBackgroundChange(bg)}
                />
              ))}
              <div className="background-option upload-button" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon">+</div>
                <div className="upload-text">Upload</div>
              </div>
            </div>
          </div>

          {/* Text to Graffiti Section */}
          <div>
            <div className="section-header">AI TEXT</div>
            <div className="relative">
              <input
                type="text"
                value={textToGraffitiText}
                onChange={(e) => setTextToGraffitiText(e.target.value)}
                placeholder="Type your word..."
                className="text-input"
                maxLength={50}
              />
              <div className="char-count">{textToGraffitiText.length}/50</div>
            </div>
            
            <div className="style-pills">
              {['bubble', 'wildstyle', 'block', 'tag', 'stencil'].map(style => (
                <div
                  key={style}
                  className={`style-pill ${selectedStyle === style ? 'active' : ''}`}
                  onClick={() => setSelectedStyle(style)}
                >
                  {style.toUpperCase()}
                </div>
              ))}
            </div>
            
            <button
              onClick={() => handleTextToGraffiti(textToGraffitiText, selectedStyle)}
              disabled={isEnhancing || isBlocked || !textToGraffitiText}
              className="generate-button"
            >
              {isEnhancing ? (
                <div className="spray-loader">
                  <div className="spray-dot"></div>
                  <div className="spray-dot"></div>
                  <div className="spray-dot"></div>
                </div>
              ) : (
                'GENERATE'
              )}
            </button>
            
            <button
              onClick={handleEnhanceDrawing}
              disabled={isEnhancing || isBlocked}
              className="enhance-button"
            >
              AI ENHANCE
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bottom-action-bar">
        <div className="flex gap-3">
          <button
            onClick={handleClearCanvas}
            disabled={isBlocked}
            className="action-button clear-button"
          >
            CLEAR
          </button>
          <button
            onClick={handleDownload}
            className="action-button download-button"
          >
            DOWNLOAD
          </button>
        </div>
        
        <div className="flex-1 max-w-160px">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Your tag name..."
            className="text-input h-32px"
            maxLength={20}
          />
        </div>
        
        <button
          onClick={handleSendToDisplay}
          disabled={isBlocked}
          className="send-button"
        >
          SEND TO WALL
        </button>
      </div>

      {/* Mobile Toolbar */}
      <div className="mobile-toolbar md:hidden">
        {['freehand', 'spray', 'marker', 'chalk', 'drip', 'eraser'].map((brush) => (
          <button
            key={brush}
            onClick={() => handleBrushChange(brush)}
            className={`mobile-brush-button ${selectedBrush === brush ? 'active' : ''}`}
            disabled={isBlocked}
          >
            <span className="mobile-brush-icon">
              {brush === 'freehand' && '✏️'}
              {brush === 'spray' && '💨'}
              {brush === 'marker' && '🖊️'}
              {brush === 'chalk' && '🪨'}
              {brush === 'drip' && '💧'}
              {brush === 'eraser' && '⬜'}
            </span>
            <span className="mobile-brush-label">{brush.slice(0, 3).toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {showMobileSheet && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="mobile-bottom-sheet md:hidden"
          >
            <div className="bottom-sheet-handle"></div>
            <div className="p-4">
              {/* Mobile Color Section */}
              <div className="mb-6">
                <div className="section-header">COLOR</div>
                <div 
                  className="active-color-display mx-auto"
                  style={{ backgroundColor: selectedColor }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                ></div>
                
                {/* Mobile Color Palettes */}
                <div className="color-palette">
                  {['#FF006E', '#00F5FF', '#39FF14', '#FFE500', '#FF4500', '#BF00FF'].map(color => (
                    <div
                      key={color}
                      className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                    />
                  ))}
                </div>
              </div>
              
              {/* Mobile Brush Settings */}
              <div className="mb-6">
                <div className="section-header">BRUSH</div>
                <div className="brush-setting-row">
                  <span className="brush-setting-label">SIZE</span>
                  <span className="brush-setting-value">{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="80"
                  value={brushSize}
                  onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                  className="brush-slider"
                  disabled={isBlocked}
                  style={{ '--thumb-color': selectedColor }}
                />
              </div>
              
              {/* Mobile Background */}
              <div className="mb-6">
                <div className="section-header">BACKGROUND</div>
                <div className="background-grid">
                  {['brick', 'concrete', 'metal', 'wood', 'black', 'white'].map(bg => (
                    <div
                      key={bg}
                      className={`background-option bg-${bg} ${background === bg ? 'active' : ''}`}
                      onClick={() => handleBackgroundChange(bg)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleCustomBackgroundUpload(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
};

export default CreatorView;
