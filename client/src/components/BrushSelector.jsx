import React from 'react';

const BrushSelector = ({ brushSize, onSizeChange }) => {
  const presetSizes = [
    { name: 'XS', size: 2 },
    { name: 'S', size: 5 },
    { name: 'M', size: 10 },
    { name: 'L', size: 15 },
    { name: 'XL', size: 20 },
    { name: 'XXL', size: 30 },
  ];

  return (
    <div className="bg-gray-900 p-4 rounded-lg border-2 border-pink-500">
      <h3 className="text-lg font-bold mb-4 neon-pink font-boogaloo">
        Brush Size
      </h3>

      {/* Preset Sizes */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {presetSizes.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onSizeChange(preset.size)}
            className={`p-2 rounded text-sm font-boogaloo transition-all ${
              brushSize === preset.size
                ? 'bg-pink-500 text-white neon-pink'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div>{preset.name}</div>
            <div className="text-xs">{preset.size}px</div>
          </button>
        ))}
      </div>

      {/* Custom Size Slider */}
      <div>
        <p className="text-sm font-medium mb-2">Custom Size: {brushSize}px</p>
        <input
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => onSizeChange(parseInt(e.target.value))}
          className="w-full"
        />
        
        {/* Visual Preview */}
        <div className="mt-4 flex justify-center">
          <div className="bg-gray-800 p-4 rounded">
            <div
              className="rounded-full bg-pink-500"
              style={{
                width: `${Math.min(brushSize, 40)}px`,
                height: `${Math.min(brushSize, 40)}px`,
                opacity: Math.min(brushSize / 20, 1)
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrushSelector;
