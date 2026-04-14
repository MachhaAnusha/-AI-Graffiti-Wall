import React, { useState } from 'react';

const TextToGraffiti = ({ onTextSubmit }) => {
  const [text, setText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('bubble');
  const [isGenerating, setIsGenerating] = useState(false);

  const graffitiStyles = [
    { id: 'bubble', name: 'Bubble', description: 'Rounded bubbly letters' },
    { id: 'wildstyle', name: 'Wildstyle', description: 'Complex interlocking letters' },
    { id: 'block', name: 'Block', description: 'Bold square letters' },
    { id: 'tag', name: 'Tag', description: 'Quick signature style' },
    { id: 'stencil', name: 'Stencil', description: 'Clean cut-out style' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      alert('Please enter some text');
      return;
    }

    setIsGenerating(true);
    
    try {
      await onTextSubmit(text, selectedStyle);
      setText(''); // Clear input after successful submission
    } catch (error) {
      console.error('Error generating graffiti:', error);
      alert('Failed to generate graffiti text');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg border-2 border-pink-500">
      <h3 className="text-lg font-bold mb-4 neon-pink font-boogaloo">
        Text to Graffiti
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Your Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your text..."
            className="w-full px-3 py-2 bg-black border-2 border-pink-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
            maxLength={50}
          />
          <p className="text-xs text-gray-400 mt-1">
            {text.length}/50 characters
          </p>
        </div>

        {/* Style Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Graffiti Style
          </label>
          <div className="space-y-2">
            {graffitiStyles.map((style) => (
              <label
                key={style.id}
                className="flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-gray-800"
              >
                <input
                  type="radio"
                  name="style"
                  value={style.id}
                  checked={selectedStyle === style.id}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{style.name}</div>
                  <div className="text-xs text-gray-400">{style.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isGenerating || !text.trim()}
          className="w-full graffiti-btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Generating...
            </span>
          ) : (
            'Add to Canvas'
          )}
        </button>
      </form>

      {/* AI Enhancement Notice */}
      <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-400">
        <p className="font-medium text-yellow-400 mb-1">AI Enhancement</p>
        <p>This feature uses AI to transform your text into authentic graffiti styles. Premium styles require API keys.</p>
      </div>
    </div>
  );
};

export default TextToGraffiti;
