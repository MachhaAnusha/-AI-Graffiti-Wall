import React, { useState } from 'react';

const ColorPicker = ({ 
  selectedColor, 
  onColorChange, 
  opacity, 
  onOpacityChange, 
  neonGlow, 
  onNeonGlowChange 
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const presetColors = [
    '#ff006e', '#3a86ff', '#06ffa5', '#ffbe0b', '#8338ec', '#fb5607',
    '#ff4365', '#00d9ff', '#ffffff', '#000000', '#808080', '#ff6b6b'
  ];

  const graffitiPalettes = [
    {
      name: 'Neon Dreams',
      colors: ['#ff006e', '#3a86ff', '#06ffa5', '#ffbe0b', '#8338ec']
    },
    {
      name: 'Street Style',
      colors: ['#ff4365', '#00d9ff', '#ff6b6b', '#4ecdc4', '#f7b731']
    },
    {
      name: 'Classic',
      colors: ['#ffffff', '#000000', '#808080', '#ff0000', '#0000ff']
    }
  ];

  return (
    <div className="bg-gray-900 p-4 rounded-lg border-2 border-pink-500">
      <h3 className="text-lg font-bold mb-4 neon-pink font-boogaloo">
        Colors
      </h3>

      {/* Current Color Display */}
      <div className="mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded border-2 border-white"
            style={{ 
              backgroundColor: selectedColor,
              opacity: opacity,
              boxShadow: neonGlow ? `0 0 20px ${selectedColor}` : 'none'
            }}
          ></div>
          <div>
            <p className="text-sm font-mono">{selectedColor}</p>
            <p className="text-xs text-gray-400">Opacity: {Math.round(opacity * 100)}%</p>
          </div>
        </div>
      </div>

      {/* Preset Colors */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Quick Colors</p>
        <div className="grid grid-cols-6 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-8 h-8 rounded border-2 transition-all ${
                selectedColor === color 
                  ? 'border-white scale-110' 
                  : 'border-gray-600 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Graffiti Palettes */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Graffiti Palettes</p>
        <div className="space-y-2">
          {graffitiPalettes.map((palette) => (
            <div key={palette.name} className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 w-24">{palette.name}</span>
              <div className="flex space-x-1">
                {palette.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onColorChange(color)}
                    className="w-6 h-6 rounded border border-gray-600 hover:border-white transition-all"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div className="mb-4">
        <button
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className="w-full graffiti-btn text-sm"
        >
          Custom Color
        </button>
        
        {showCustomPicker && (
          <div className="mt-2">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Opacity Slider */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Opacity</p>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Neon Glow Toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="neon-glow"
          checked={neonGlow}
          onChange={(e) => onNeonGlowChange(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="neon-glow" className="text-sm font-medium">
          Neon Glow Effect
        </label>
      </div>
    </div>
  );
};

export default ColorPicker;
