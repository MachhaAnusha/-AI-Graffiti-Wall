import React from 'react';

const Toolbar = ({ 
  selectedBrush, 
  onBrushChange, 
  onClearCanvas, 
  onDownload, 
  onSendToDisplay,
  isDrawing 
}) => {
  const brushes = [
    { id: 'freehand', name: 'Freehand', icon: ' pencil' },
    { id: 'spray', name: 'Spray', icon: ' spray' },
    { id: 'marker', name: 'Marker', icon: ' marker' },
    { id: 'chalk', name: 'Chalk', icon: ' chalk' },
    { id: 'drip', name: 'Drip', icon: ' drip' },
    { id: 'eraser', name: 'Eraser', icon: ' eraser' },
  ];

  return (
    <div className="bg-gray-900 p-4 rounded-lg border-2 border-pink-500">
      <h3 className="text-lg font-bold mb-4 neon-pink font-boogaloo">
        Tools
      </h3>
      
      {/* Brush Selection */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {brushes.map((brush) => (
          <button
            key={brush.id}
            onClick={() => onBrushChange(brush.id)}
            className={`p-3 rounded text-sm font-boogaloo transition-all ${
              selectedBrush === brush.id
                ? 'bg-pink-500 text-white neon-pink'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {brush.name}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onClearCanvas}
          className="w-full graffiti-btn bg-red-600 text-sm"
          disabled={isDrawing}
        >
          Clear Canvas
        </button>
        
        <button
          onClick={onDownload}
          className="w-full graffiti-btn bg-blue-600 text-sm"
          disabled={isDrawing}
        >
          Download
        </button>
        
        <button
          onClick={onSendToDisplay}
          className="w-full graffiti-btn bg-green-600 text-sm font-bold"
          disabled={isDrawing}
        >
          Send to Display
        </button>
      </div>

      {/* Drawing Status */}
      {isDrawing && (
        <div className="mt-4 text-center">
          <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse mx-auto mb-2"></div>
          <p className="text-xs text-gray-400">Drawing...</p>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
