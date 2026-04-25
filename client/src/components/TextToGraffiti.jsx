import React, { useState } from 'react';

const TextToGraffiti = ({ onGenerate, disabled = false }) => {
  const [text, setText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('bubble');
  const [isGenerating, setIsGenerating] = useState(false);

  const graffitiStyles = [
    { 
      id: 'bubble', 
      name: 'Bubble', 
      icon: '🫧',
      description: 'Rounded bubbly letters',
      color: '#FFE500'
    },
    { 
      id: 'wildstyle', 
      name: 'Wildstyle', 
      icon: '🌪️',
      description: 'Complex interlocking letters',
      color: '#00F5FF'
    },
    { 
      id: 'block', 
      name: 'Block', 
      icon: '⬜',
      description: 'Bold square letters',
      color: '#06ffa5'
    },
    { 
      id: 'tag', 
      name: 'Tag', 
      icon: '✒️',
      description: 'Quick signature style',
      color: '#FF006E'
    },
    { 
      id: 'stencil', 
      name: 'Stencil', 
      icon: '🎭',
      description: 'Clean cut-out style',
      color: '#8338ec'
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      return;
    }

    setIsGenerating(true);
    
    try {
      await onGenerate(text, selectedStyle);
      setText(''); // Clear input after successful submission
    } catch (error) {
      console.error('Error generating graffiti:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="graffiti-panel">
      <h3 className="graffiti-title text-lg mb-4">Text to Graffiti</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Text Input */}
        <div>
          <label className="text-xs text-muted block mb-2">
            Your Text ({text.length}/50)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your graffiti text..."
            className="graffiti-input w-full resize-none"
            rows={3}
            maxLength={50}
            disabled={disabled}
          />
        </div>

        {/* Style Selection */}
        <div>
          <label className="text-xs text-muted block mb-3">
            Graffiti Style
          </label>
          <div className="grid grid-cols-1 gap-2">
            {graffitiStyles.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStyle(style.id)}
                disabled={disabled}
                className={`
                  relative overflow-hidden rounded-lg p-3 text-left transition-all duration-300 transform hover:scale-102
                  ${selectedStyle === style.id 
                    ? 'ring-2 ring-accent-primary neon-glow' 
                    : 'hover:ring-2 hover:ring-accent-tertiary'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: style.color + '20', color: style.color }}
                  >
                    {style.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{style.name}</div>
                    <div className="text-xs text-muted">{style.description}</div>
                  </div>
                  {selectedStyle === style.id && (
                    <div className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isGenerating || !text.trim() || disabled}
          className="graffiti-button w-full neon-glow"
        >
          <span className="flex items-center justify-center gap-2">
            {isGenerating ? (
              <div className="spray-loader">
                <div className="spray-dot"></div>
                <div className="spray-dot"></div>
                <div className="spray-dot"></div>
              </div>
            ) : (
              <>
                <span>🎨</span>
                <span>Generate Graffiti</span>
              </>
            )}
          </span>
        </button>
      </form>

      {/* Style Preview */}
      <div className="mt-4 p-3 bg-tertiary rounded-lg">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: graffitiStyles.find(s => s.id === selectedStyle)?.color + '20', color: graffitiStyles.find(s => s.id === selectedStyle)?.color }}
          >
            {graffitiStyles.find(s => s.id === selectedStyle)?.icon}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">
              {graffitiStyles.find(s => s.id === selectedStyle)?.name} Style
            </div>
            <div className="text-xs text-muted">
              {text ? `"${text}" will be transformed` : 'Enter text to see preview'}
            </div>
          </div>
        </div>
      </div>

      {/* AI Enhancement Notice */}
      <div className="mt-4 p-3 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-lg border border-accent-primary/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🤖</span>
          <span className="text-sm font-semibold text-accent-primary">AI-Powered</span>
        </div>
        <div className="text-xs text-muted space-y-1">
          <p>• Uses Replicate API for authentic graffiti generation</p>
          <p>• Falls back to styled text if AI is unavailable</p>
          <p>• Results vary based on text complexity</p>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 text-xs text-muted space-y-1">
        <p>💡 Shorter text works better (2-3 words ideal)</p>
        <p>💡 Try different styles for unique effects</p>
        <p>💡 AI generation may take a few seconds</p>
      </div>
    </div>
  );
};

export default TextToGraffiti;
