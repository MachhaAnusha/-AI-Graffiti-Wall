import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

export const useCanvas = () => {
  const canvasRef = useRef(null);
  const canvas = useRef(null);
  const brushHistory = useRef([]);
  const sprayParticles = useRef([]);
  const currentBrushType = useRef('freehand');
  const isDrawing = useRef(false);
  const chalkDots = useRef([]);

  useEffect(() => {
    // Initialize Fabric.js canvas
    const canvasElement = document.getElementById('graffiti-canvas');
    if (canvasElement && !canvas.current) {
      canvas.current = new fabric.Canvas('graffiti-canvas', {
        width: 800,
        height: 450,
        backgroundColor: '#000000',
        isDrawingMode: true,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        imageSmoothingEnabled: true,
        enableRetinaScaling: true
      });

      // Set default brush
      canvas.current.freeDrawingBrush = new fabric.PencilBrush(canvas.current);
      canvas.current.freeDrawingBrush.width = 5;
      canvas.current.freeDrawingBrush.color = '#FFE500';
      canvas.current.freeDrawingBrush.strokeLineCap = 'round';
      canvas.current.freeDrawingBrush.strokeLineJoin = 'round';

      // Prevent canvas from being too large on mobile
      const resizeCanvas = () => {
        const container = canvasElement.parentElement;
        const containerWidth = container.clientWidth;
        const aspectRatio = 16 / 9;
        
        if (containerWidth < 800) {
          const newWidth = containerWidth - 40; // Account for padding
          const newHeight = newWidth / aspectRatio;
          
          canvas.current.setDimensions({
            width: newWidth,
            height: newHeight
          });
        }
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        if (canvas.current) {
          canvas.current.dispose();
          canvas.current = null;
        }
      };
    }
  }, []);

  const clearCanvas = () => {
    if (canvas.current) {
      canvas.current.clear();
      canvas.current.backgroundColor = '#000000';
      canvas.current.renderAll();
      sprayParticles.current = [];
    }
  };

  const getCanvasData = () => {
    if (canvas.current) {
      return canvas.current.toDataURL('image/png');
    }
    return null;
  };

  const setCanvasBackground = (background) => {
    if (!canvas.current) return;

    const backgrounds = {
      brick: 'linear-gradient(45deg, #8B4513 25%, #A0522D 25%, #A0522D 50%, #8B4513 50%, #8B4513 75%, #A0522D 75%, #A0522D)',
      concrete: 'linear-gradient(45deg, #808080 25%, #A9A9A9 25%, #A9A9A9 50%, #808080 50%, #808080 75%, #A9A9A9 75%, #A9A9A9)',
      metal: 'linear-gradient(45deg, #708090 25%, #B0C4DE 25%, #B0C4DE 50%, #708090 50%, #708090 75%, #B0C4DE 75%, #B0C4DE)',
      wood: 'linear-gradient(45deg, #8B4513 25%, #D2691E 25%, #D2691E 50%, #8B4513 50%, #8B4513 75%, #D2691E 75%, #D2691E)',
      black: '#000000',
      white: '#FFFFFF'
    };

    const bg = backgrounds[background] || backgrounds.black;
    
    if (bg.includes('gradient')) {
      // For gradients, we need to create a pattern
      const patternCanvas = document.createElement('canvas');
      const patternCtx = patternCanvas.getContext('2d');
      patternCanvas.width = 100;
      patternCanvas.height = 100;
      
      // Create gradient pattern
      const gradient = patternCtx.createLinearGradient(0, 0, 100, 100);
      const colors = bg.match(/#[0-9A-Fa-f]{6}/g);
      if (colors) {
        colors.forEach((color, index) => {
          gradient.addColorStop(index / (colors.length - 1), color);
        });
      }
      
      patternCtx.fillStyle = gradient;
      patternCtx.fillRect(0, 0, 100, 100);
      
      const pattern = new fabric.Pattern({
        source: patternCanvas,
        repeat: 'repeat'
      });
      
      canvas.current.setBackgroundColor(pattern, canvas.current.renderAll.bind(canvas.current));
    } else {
      canvas.current.setBackgroundColor(bg, canvas.current.renderAll.bind(canvas.current));
    }
  };

  const addTextToCanvas = (text, style, font = 'Rubik Dirt') => {
    // Ensure canvas is initialized
    if (!canvas.current) {
      // Try to initialize canvas if not already done
      const canvasElement = document.getElementById('graffiti-canvas');
      if (canvasElement) {
        canvas.current = new fabric.Canvas('graffiti-canvas', {
          width: 800,
          height: 450,
          backgroundColor: '#000000',
          isDrawingMode: true,
        });
        canvas.current.freeDrawingBrush.width = 5;
        canvas.current.freeDrawingBrush.color = '#FFE500';
      } else {
        console.error('Canvas element not found');
        return;
      }
    }

    const styles = {
      bubble: {
        fontFamily: font || 'Boogaloo, cursive',
        fontSize: 48,
        fontWeight: 'bold',
        fill: '#FFE500',
        stroke: '#000000',
        strokeWidth: 2,
        shadow: 'rgba(255, 229, 0, 0.5) 5px 5px 10px'
      },
      wildstyle: {
        fontFamily: font || 'Permanent Marker, cursive',
        fontSize: 36,
        fontWeight: 'bold',
        fill: '#00F5FF',
        angle: -15,
        shadow: 'rgba(0, 245, 255, 0.5) 5px 5px 10px'
      },
      block: {
        fontFamily: font || 'Rubik Dirt, cursive',
        fontSize: 42,
        fontWeight: 'bold',
        fill: '#06ffa5',
        stroke: '#000000',
        strokeWidth: 3
      },
      tag: {
        fontFamily: font || 'Permanent Marker, cursive',
        fontSize: 32,
        fontStyle: 'italic',
        fill: '#FF006E',
        angle: 10
      },
      stencil: {
        fontFamily: font || 'Arial, sans-serif',
        fontSize: 40,
        fontWeight: 'bold',
        fill: '#8338ec',
        stroke: '#ffffff',
        strokeWidth: 2
      }
    };

    const textStyle = styles[style] || styles.bubble;

    const fabricText = new fabric.Text(text.toUpperCase(), {
      left: 50,
      top: 50,
      ...textStyle
    });

    canvas.current.add(fabricText);
    canvas.current.setActiveObject(fabricText);
    canvas.current.renderAll();
    
    console.log('Text added to canvas:', text);
  };

  // Enhanced brush system
  const enhanceBrush = (brushType, options = {}) => {
    if (!canvas.current) return;

    const { size = 5, color = '#FFE500', opacity = 1, neonGlow = false } = options;

    switch (brushType) {
      case 'freehand':
        canvas.current.freeDrawingBrush = new fabric.PencilBrush(canvas.current);
        canvas.current.freeDrawingBrush.width = size;
        canvas.current.freeDrawingBrush.color = color;
        break;

      case 'spray':
        canvas.current.freeDrawingBrush = new fabric.SprayBrush(canvas.current);
        canvas.current.freeDrawingBrush.width = size * 2; // Larger spread
        canvas.current.freeDrawingBrush.color = color;
        canvas.current.freeDrawingBrush.density = 40; // More particles
        canvas.current.freeDrawingBrush.dotWidth = 1;
        canvas.current.freeDrawingBrush.dotWidthVariance = 2;
        canvas.current.freeDrawingBrush.randomOpacity = true;
        
        // Enhanced spray spreading effect
        canvas.current.freeDrawingBrush._render = function(ctx) {
          const points = this.points;
          if (!points || points.length === 0) return;
          
          ctx.save();
          ctx.fillStyle = this.color;
          ctx.globalAlpha = this.opacity || opacity;
          
          points.forEach(point => {
            // Create spreading effect
            const spread = Math.random() * 3;
            const offsetX = (Math.random() - 0.5) * spread;
            const offsetY = (Math.random() - 0.5) * spread;
            
            ctx.beginPath();
            ctx.arc(point.x + offsetX, point.y + offsetY, this.dotWidth, 0, 2 * Math.PI);
            ctx.fill();
          });
          
          ctx.restore();
        };
        break;

      case 'marker':
        canvas.current.freeDrawingBrush = new fabric.PencilBrush(canvas.current);
        canvas.current.freeDrawingBrush.width = size;
        canvas.current.freeDrawingBrush.color = color;
        canvas.current.freeDrawingBrush.opacity = opacity * 0.7; // Transparent marker effect
        
        // Marker effect with slight blur
        canvas.current.freeDrawingBrush._render = function(ctx) {
          const points = this.points;
          if (!points || points.length === 0) return;
          
          ctx.save();
          ctx.strokeStyle = this.color;
          ctx.lineWidth = this.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = this.opacity;
          ctx.globalCompositeOperation = 'multiply'; // Marker effect
          
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          
          ctx.stroke();
          ctx.restore();
        };
        break;

      case 'chalk':
        canvas.current.freeDrawingBrush = new fabric.PencilBrush(canvas.current);
        canvas.current.freeDrawingBrush.width = size;
        canvas.current.freeDrawingBrush.color = color;
        canvas.current.freeDrawingBrush.opacity = opacity * 0.8;
        
        // Chalk texture effect
        canvas.current.freeDrawingBrush._render = function(ctx) {
          const points = this.points;
          if (!points || points.length === 0) return;
          
          ctx.save();
          ctx.strokeStyle = this.color;
          ctx.lineWidth = this.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = this.opacity;
          ctx.globalCompositeOperation = 'multiply';
          
          // Add texture
          ctx.setLineDash([2, 4]);
          ctx.lineDashOffset = Math.random() * 10;
          
          ctx.beginPath();
        break;
        
      case 'drip':
        canvas.current.freeDrawingBrush = new fabric.PencilBrush(canvas.current);
        canvas.current.freeDrawingBrush.width = size;
        canvas.current.freeDrawingBrush.color = color;
        canvas.current.freeDrawingBrush.strokeLineCap = 'round';
        canvas.current.freeDrawingBrush.strokeLineJoin = 'round';
        break;
        
      case 'eraser':
        // Use PencilBrush with background color if EraserBrush not available
        canvas.current.freeDrawingBrush = new fabric.PencilBrush(canvas.current);
        canvas.current.freeDrawingBrush.color = '#0a0a0a'; // match background
        canvas.current.freeDrawingBrush.width = size * 2;
        break;
    }
    
    if (neonGlow && canvas.current.freeDrawingBrush.shadow) {
      canvas.current.freeDrawingBrush.shadow = new fabric.Shadow({
        color: color,
        blur: 15,
        offsetX: 0,
        offsetY: 0
      });
    } else if (canvas.current.freeDrawingBrush.shadow) {
      canvas.current.freeDrawingBrush.shadow = null;
    }
    
    canvas.current.renderAll();
  };
  
  // Custom chalk implementation
  const addChalkDot = (x, y, color, size) => {
    if (!canvas.current) return;
    
    const dot = new fabric.Circle({
      left: x,
      top: y,
      radius: Math.random() * 3 + 1,
      fill: color,
      opacity: Math.random() * 0.3 + 0.2,
      selectable: false,
      evented: false
    });
    
    canvas.current.add(dot);
    chalkDots.current.push(dot);
    
    // Remove old dots to keep canvas clean
    if (chalkDots.current.length > 50) {
      const oldDot = chalkDots.current.shift();
      if (oldDot && canvas.current) {
        canvas.current.remove(oldDot);
      }
    }
  };
  
  // Drip effect for drip brush
  const addDripEffect = (path) => {
    if (!canvas.current || !path) return;
    
    const points = path.path || [];
    if (points.length < 2) return;
    
    // Get the last point (bottom-most)
    const lastPoint = points[points.length - 2];
    const currentPoint = points[points.length - 1];
      
      if (triangle.opacity <= 0 || top > currentPoint.y + 100) {
        if (triangle && canvas.current) {
          canvas.current.remove(triangle);
        }
      } else {
        requestAnimationFrame(animateDrip);
      }
    }
  };

  return {
    canvas: canvas.current,
    clearCanvas,
    getCanvasData,
    setCanvasBackground,
    addTextToCanvas,
    enhanceBrush
  };
};
