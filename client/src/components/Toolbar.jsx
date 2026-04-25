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
    <div className="p-8">
      <h3 className="text-2xl font-bold mb-8 premium-header font-boogaloo">
        Drawing Tools
      </h3>
      
      {/* Premium Brush Selection */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {brushes.map((brush) => (
          <button
            key={brush.id}
            onClick={() => onBrushChange(brush.id)}
            className={`premium-button text-sm font-boogaloo transition-all duration-400 transform hover:scale-105 ${
              selectedBrush === brush.id
                ? 'shadow-xl'
                : ''
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              <div className="font-semibold text-lg">{brush.name}</div>
              <div className="text-xs opacity-60 uppercase tracking-wider">{brush.icon}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Premium Action Buttons */}
      <div className="space-y-4">
        <button
          onClick={onClearCanvas}
          className="w-full premium-button text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600"
          disabled={isDrawing}
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 01-2.828 2.828l-12-12a2 2 0 012.828 2.828A2 2 0 012.828 2.828L17 13a2 2 0 00-2.828-2.828z"/>
            </svg>
            <span>Clear Canvas</span>
          </div>
        </button>
        
        <button
          onClick={onDownload}
          className="w-full premium-button text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600"
          disabled={isDrawing}
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a1 1 011-1h1m-1 10a1 1 011 1v1a1 1 011-1 1m-1 10a1 1 011 1 4 1v1a1 1 011-1 1m-1 10a1 1 011 1 4 1v1a1 1 011-1 1z"/>
            </svg>
            <span>Download Artwork</span>
          </div>
        </button>
        
        <button
          onClick={onSendToDisplay}
          className="w-full premium-button text-sm font-bold bg-gradient-to-r from-green-500 to-green-600 shadow-xl"
          disabled={isDrawing}
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h10m-7 8v8m0 4h18M9 16v-6h6"/>
            </svg>
            <span>Send to Display</span>
          </div>
        </button>
      </div>

      {/* Premium Drawing Status */}
      {isDrawing && (
        <div className="mt-8 text-center p-4 premium-glass rounded-2xl">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">Drawing in progress...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
