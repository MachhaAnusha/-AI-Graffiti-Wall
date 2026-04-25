import React, { useState } from 'react';

const ColorPicker = ({ 
  selectedColor, 
  onColorChange, 
  disabled = false,
  compact = false
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showHSLControls, setShowHSLControls] = useState(false);
  const [neonGlow, setNeonGlow] = useState(false);
  const [opacity, setOpacity] = useState(1);

  // Convert hex to HSL
  const hexToHSL = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  // Convert HSL to hex
  const hslToHex = (h, s, l) => {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const hsl = hexToHSL(selectedColor);

  const presetColors = [
    '#FFE500', '#FF006E', '#00F5FF', '#06ffa5', '#8338ec', '#fb5607',
    '#ff4365', '#00d9ff', '#ffffff', '#000000', '#808080', '#ff6b6b'
  ];

  const graffitiPalettes = [
    {
      name: 'Old School',
      colors: ['#FFE500', '#FF006E', '#00F5FF', '#06ffa5', '#8338ec']
    },
    {
      name: 'Neon',
      colors: ['#FF006E', '#00F5FF', '#FFE500', '#FF00FF', '#00FF00']
    },
    {
      name: 'Pastel',
      colors: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF']
    },
    {
      name: 'Fire',
      colors: ['#FF0000', '#FF4500', '#FFA500', '#FFD700', '#FFFF00']
    },
    {
      name: 'Chrome',
      colors: ['#C0C0C0', '#808080', '#FFD700', '#B8860B', '#FFFFFF']
    },
    {
      name: 'Dark',
      colors: ['#000000', '#1a1a1a', '#333333', '#666666', '#999999']
    }
  ];

  if (compact) {
    return (
      <div className="flex gap-2">
        {presetColors.slice(0, 8).map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            disabled={disabled}
            className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="graffiti-panel">
      <h3 className="graffiti-title text-lg mb-4">Color Studio</h3>

      {/* Current Color Display */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-full border-4 border-secondary shadow-lg"
            style={{ 
              backgroundColor: selectedColor,
              opacity: opacity,
              boxShadow: neonGlow ? `0 0 30px ${selectedColor}, 0 0 60px ${selectedColor}` : 'none'
            }}
          />
          <div className="flex-1">
            <div className="font-mono text-sm font-semibold">{selectedColor.toUpperCase()}</div>
            <div className="text-xs text-muted">HSL({hsl.h}°, {hsl.s}%, {hsl.l}%)</div>
            <div className="text-xs text-muted">Opacity: {Math.round(opacity * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Quick Colors */}
      <div className="mb-6">
        <h4 className="ui-text text-sm mb-3">Quick Colors</h4>
        <div className="color-palette">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              disabled={disabled}
              className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Graffiti Palettes */}
      <div className="mb-6">
        <h4 className="ui-text text-sm mb-3">Graffiti Palettes</h4>
        <div className="space-y-3">
          {graffitiPalettes.map((palette) => (
            <div key={palette.name} className="flex items-center gap-3">
              <span className="text-xs text-muted w-20 font-semibold">{palette.name}</span>
              <div className="flex gap-1 flex-1">
                {palette.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onColorChange(color)}
                    disabled={disabled}
                    className="w-8 h-8 rounded border-2 border-secondary hover:border-accent-primary transition-all"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HSL Controls */}
      <div className="mb-6">
        <button
          onClick={() => setShowHSLControls(!showHSLControls)}
          className="graffiti-button w-full text-sm"
        >
          {showHSLControls ? 'Hide' : 'Show'} HSL Controls
        </button>
        
        {showHSLControls && (
          <div className="mt-4 space-y-4">
            {/* Hue */}
            <div>
              <label className="text-xs text-muted block mb-1">Hue: {hsl.h}°</label>
              <input
                type="range"
                min="0"
                max="360"
                value={hsl.h}
                onChange={(e) => onColorChange(hslToHex(parseInt(e.target.value), hsl.s, hsl.l))}
                className="w-full"
                disabled={disabled}
                style={{
                  background: `linear-gradient(to right, 
                    hsl(0, 100%, 50%), 
                    hsl(60, 100%, 50%), 
                    hsl(120, 100%, 50%), 
                    hsl(180, 100%, 50%), 
                    hsl(240, 100%, 50%), 
                    hsl(300, 100%, 50%), 
                    hsl(360, 100%, 50%))`
                }}
              />
            </div>
            
            {/* Saturation */}
            <div>
              <label className="text-xs text-muted block mb-1">Saturation: {hsl.s}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={hsl.s}
                onChange={(e) => onColorChange(hslToHex(hsl.h, parseInt(e.target.value), hsl.l))}
                className="w-full"
                disabled={disabled}
              />
            </div>
            
            {/* Lightness */}
            <div>
              <label className="text-xs text-muted block mb-1">Lightness: {hsl.l}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={hsl.l}
                onChange={(e) => onColorChange(hslToHex(hsl.h, hsl.s, parseInt(e.target.value)))}
                className="w-full"
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>

      {/* Custom Color Picker */}
      <div className="mb-6">
        <button
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className="graffiti-button w-full text-sm"
        >
          {showCustomPicker ? 'Hide' : 'Show'} Custom Picker
        </button>
        
        {showCustomPicker && (
          <div className="mt-4">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-full h-12 rounded cursor-pointer border-2 border-secondary"
              disabled={disabled}
            />
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => onColorChange(e.target.value)}
              placeholder="#000000"
              className="graffiti-input w-full mt-2"
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {/* Opacity Control */}
      <div className="mb-6">
        <label className="text-xs text-muted block mb-2">Opacity: {Math.round(opacity * 100)}%</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full"
          disabled={disabled}
        />
      </div>

      {/* Neon Glow Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setNeonGlow(!neonGlow)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${neonGlow ? 'bg-accent-primary' : 'bg-tertiary'}
          `}
          disabled={disabled}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${neonGlow ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
        <span className="text-sm font-semibold">Neon Glow</span>
      </div>
    </div>
  );
};

export default ColorPicker;
