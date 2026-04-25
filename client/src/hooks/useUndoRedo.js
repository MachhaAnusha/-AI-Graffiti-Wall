import { useState, useCallback, useRef } from 'react';

export const useUndoRedo = (canvas) => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const history = useRef([]);
  const historyStep = useRef(-1);

  const saveState = useCallback(() => {
    if (!canvas) return;
    
    try {
      const currentState = canvas.toJSON();
      
      // Remove any states after current step
      history.current = history.current.slice(0, historyStep.current + 1);
      
      // Add new state
      history.current.push(currentState);
      historyStep.current++;
      
      // Limit history to 50 states
      if (history.current.length > 50) {
        history.current.shift();
        historyStep.current--;
      }
      
      setCanUndo(historyStep.current > 0);
      setCanRedo(historyStep.current < history.current.length - 1);
    } catch (error) {
      console.error('Failed to save canvas state:', error);
    }
  }, [canvas]);

  const undo = useCallback(() => {
    if (!canvas || !canUndo) return;
    
    try {
      if (historyStep.current > 0) {
        historyStep.current--;
        const previousState = history.current[historyStep.current];
        canvas.loadFromJSON(previousState, () => {
          canvas.renderAll();
        });
        
        setCanUndo(historyStep.current > 0);
        setCanRedo(historyStep.current < history.current.length - 1);
      }
    } catch (error) {
      console.error('Failed to undo:', error);
    }
  }, [canvas, canUndo]);

  const redo = useCallback(() => {
    if (!canvas || !canRedo) return;
    
    try {
      if (historyStep.current < history.current.length - 1) {
        historyStep.current++;
        const nextState = history.current[historyStep.current];
        canvas.loadFromJSON(nextState, () => {
          canvas.renderAll();
        });
        
        setCanUndo(historyStep.current > 0);
        setCanRedo(historyStep.current < history.current.length - 1);
      }
    } catch (error) {
      console.error('Failed to redo:', error);
    }
  }, [canvas, canRedo]);

  // Initialize with first state when canvas is ready
  useState(() => {
    if (canvas && history.current.length === 0) {
      saveState();
    }
  });

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    saveState
  };
};
