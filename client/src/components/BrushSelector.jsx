import React from 'react';

const BrushSelector = ({ selectedBrush, onBrushChange, disabled = false, compact = false }) => {
  const brushes = [
    { id: 'freehand', name: 'Freehand', icon: '✏️', description: 'Smooth drawing' },
    { id: 'spray', name: 'Spray', icon: '💨', description: 'Aerosol effect' },
    { id: 'marker', name: 'Marker', icon: '🖊️', description: 'Bold marker' },
    { id: 'chalk', name: 'Chalk', icon: '🪨', description: 'Rough texture' },
    { id: 'drip', name: 'Drip', icon: '💧', description: 'Paint drips' },
    { id: 'eraser', name: 'Eraser', icon: '🧹', description: 'Remove marks' }
  ];

  if (compact) {
    return (
      <div className="flex gap-2">
        {brushes.map((brush) => (
          <button
            key={brush.id}
            onClick={() => onBrushChange(brush.id)}
            disabled={disabled}
            className={`toolbar-item ${selectedBrush === brush.id ? 'active' : ''}`}
            title={brush.description}
          >
            <span className="text-xl">{brush.icon}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="graffiti-panel">
      <h3 className="graffiti-title text-lg mb-4">Brush Tools</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {brushes.map((brush) => (
          <button
            key={brush.id}
            onClick={() => onBrushChange(brush.id)}
            disabled={disabled}
            className={`
              relative overflow-hidden rounded-lg p-4 transition-all duration-300 transform hover:scale-105
              ${selectedBrush === brush.id 
                ? 'bg-gradient-to-br from-accent-primary to-accent-secondary text-primary neon-glow' 
                : 'bg-tertiary text-secondary hover:bg-secondary'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex flex-col items-center space-y-2">
              <span className="text-2xl">{brush.icon}</span>
              <span className="font-semibold text-sm">{brush.name}</span>
              <span className="text-xs opacity-75">{brush.description}</span>
            </div>
            
            {selectedBrush === brush.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse" />
            )}
          </button>
        ))}
      </div>
      
      {/* Brush Info */}
      <div className="mt-4 p-3 bg-tertiary rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {brushes.find(b => b.id === selectedBrush)?.icon}
          </span>
          <div>
            <div className="font-semibold text-sm">
              {brushes.find(b => b.id === selectedBrush)?.name}
            </div>
            <div className="text-xs text-muted">
              {brushes.find(b => b.id === selectedBrush)?.description}
            </div>
          </div>
        </div>
        
        {/* Brush-specific tips */}
        <div className="mt-2 text-xs text-muted">
          {selectedBrush === 'spray' && 'Hold longer for more spreading effect'}
          {selectedBrush === 'drip' && 'Watch the paint drip down automatically'}
          {selectedBrush === 'marker' && 'Semi-transparent bold strokes'}
          {selectedBrush === 'chalk' && 'Rough textured drawing'}
          {selectedBrush === 'eraser' && 'Remove unwanted marks'}
          {selectedBrush === 'freehand' && 'Smooth, natural drawing'}
        </div>
      </div>
    </div>
  );
};

export default BrushSelector;
