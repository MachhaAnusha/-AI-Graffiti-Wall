import React, { useRef, useState } from 'react';

const BackgroundSelector = ({ 
  selectedBackground, 
  onBackgroundChange, 
  onCustomBackgroundUpload,
  disabled = false 
}) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const backgrounds = [
    { 
      id: 'brick', 
      name: 'Brick Wall', 
      icon: '🧱',
      description: 'Classic brick texture',
      preview: 'linear-gradient(45deg, #8B4513 25%, #A0522D 25%, #A0522D 50%, #8B4513 50%, #8B4513 75%, #A0522D 75%, #A0522D)'
    },
    { 
      id: 'concrete', 
      name: 'Concrete', 
      icon: '🏗️',
      description: 'Urban concrete surface',
      preview: 'linear-gradient(45deg, #808080 25%, #A9A9A9 25%, #A9A9A9 50%, #808080 50%, #808080 75%, #A9A9A9 75%, #A9A9A9)'
    },
    { 
      id: 'metal', 
      name: 'Metal', 
      icon: '🔧',
      description: 'Industrial metal surface',
      preview: 'linear-gradient(45deg, #708090 25%, #B0C4DE 25%, #B0C4DE 50%, #708090 50%, #708090 75%, #B0C4DE 75%, #B0C4DE)'
    },
    { 
      id: 'wood', 
      name: 'Wood', 
      icon: '🪵',
      description: 'Natural wood texture',
      preview: 'linear-gradient(45deg, #8B4513 25%, #D2691E 25%, #D2691E 50%, #8B4513 50%, #8B4513 75%, #D2691E 75%, #D2691E)'
    },
    { 
      id: 'black', 
      name: 'Black', 
      icon: '⚫',
      description: 'Solid black background',
      preview: '#000000'
    },
    { 
      id: 'white', 
      name: 'White', 
      icon: '⚪',
      description: 'Clean white background',
      preview: '#FFFFFF'
    }
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !onCustomBackgroundUpload || disabled) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file must be smaller than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      await onCustomBackgroundUpload(file);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload background image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="graffiti-panel">
      <h3 className="graffiti-title text-lg mb-4">Canvas Background</h3>
      
      {/* Background Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {backgrounds.map((bg) => (
          <button
            key={bg.id}
            onClick={() => onBackgroundChange(bg.id)}
            disabled={disabled}
            className={`
              relative overflow-hidden rounded-lg p-3 transition-all duration-300 transform hover:scale-105
              ${selectedBackground === bg.id 
                ? 'ring-2 ring-accent-primary neon-glow' 
                : 'hover:ring-2 hover:ring-accent-tertiary'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {/* Preview */}
            <div 
              className="w-full h-16 rounded mb-2 border border-secondary"
              style={{ background: bg.preview }}
            />
            
            {/* Info */}
            <div className="text-center">
              <span className="text-lg block mb-1">{bg.icon}</span>
              <span className="text-xs font-semibold block">{bg.name}</span>
            </div>
            
            {/* Selected indicator */}
            {selectedBackground === bg.id && (
              <div className="absolute top-1 right-1 w-6 h-6 bg-accent-primary rounded-full flex items-center justify-center">
                <span className="text-xs text-primary">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Upload */}
      <div className="space-y-3">
        <div className="border-t border-secondary pt-3">
          <h4 className="ui-text text-sm mb-3">Custom Background</h4>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={disabled}
          />
          
          <button
            onClick={triggerFileUpload}
            disabled={disabled || isUploading}
            className="graffiti-button w-full"
            style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-tertiary))' }}
          >
            <span className="flex items-center justify-center gap-2">
              {isUploading ? (
                <div className="spray-loader">
                  <div className="spray-dot"></div>
                  <div className="spray-dot"></div>
                  <div className="spray-dot"></div>
                </div>
              ) : (
                <>
                  <span>📁</span>
                  <span>Upload Image</span>
                </>
              )}
            </span>
          </button>
          
          <div className="text-xs text-muted text-center">
            <p>JPG, PNG, GIF (max 5MB)</p>
            <p>Images will be scaled to fit canvas</p>
          </div>
        </div>
      </div>

      {/* Current Background Info */}
      <div className="mt-4 p-3 bg-tertiary rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-lg">
            {backgrounds.find(bg => bg.id === selectedBackground)?.icon || '🎨'}
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold">
              {backgrounds.find(bg => bg.id === selectedBackground)?.name || 'Custom'}
            </div>
            <div className="text-xs text-muted">
              {backgrounds.find(bg => bg.id === selectedBackground)?.description || 'Uploaded image'}
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 text-xs text-muted space-y-1">
        <p>• Choose a background that complements your artwork</p>
        <p>• Dark backgrounds work well with bright colors</p>
        <p>• Custom images are automatically scaled to fit</p>
      </div>
    </div>
  );
};

export default BackgroundSelector;
