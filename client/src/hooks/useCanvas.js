import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

export const useCanvas = () => {
  const canvasRef = useRef(null);
  const canvas = useRef(null);

  useEffect(() => {
    // Initialize Fabric.js canvas
    const canvasElement = document.getElementById('graffiti-canvas');
    if (canvasElement && !canvas.current) {
      canvas.current = new fabric.Canvas('graffiti-canvas', {
        width: 800,
        height: 450,
        backgroundColor: '#000000',
        isDrawingMode: true,
      });

      // Set default brush
      canvas.current.freeDrawingBrush.width = 5;
      canvas.current.freeDrawingBrush.color = '#ff006e';

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

  const addTextToCanvas = (text, style) => {
    if (!canvas.current) return;

    const styles = {
      bubble: {
        fontFamily: 'Boogaloo, cursive',
        fontSize: 48,
        fontWeight: 'bold',
        fill: '#ff006e',
        stroke: '#ffffff',
        strokeWidth: 2,
        shadow: 'rgba(255, 0, 110, 0.5) 5px 5px 10px'
      },
      wildstyle: {
        fontFamily: 'Permanent Marker, cursive',
        fontSize: 36,
        fontWeight: 'bold',
        fill: '#3a86ff',
        angle: -15,
        shadow: 'rgba(58, 134, 255, 0.5) 5px 5px 10px'
      },
      block: {
        fontFamily: 'Rubik Dirt, cursive',
        fontSize: 42,
        fontWeight: 'bold',
        fill: '#06ffa5',
        stroke: '#000000',
        strokeWidth: 3
      },
      tag: {
        fontFamily: 'Permanent Marker, cursive',
        fontSize: 32,
        fontStyle: 'italic',
        fill: '#ffbe0b',
        angle: 10
      },
      stencil: {
        fontFamily: 'Arial, sans-serif',
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
  };

  return {
    canvas: canvas.current,
    clearCanvas,
    getCanvasData,
    setCanvasBackground,
    addTextToCanvas
  };
};
