import { useState } from 'react';

// Simple profanity filter
const PROFANE_WORDS = [
  'damn', 'hell', 'shit', 'fuck', 'bitch', 'ass', 'crap', 'piss'
];

const checkProfanity = (text) => {
  const lowerText = text.toLowerCase();
  return PROFANE_WORDS.some(word => lowerText.includes(word));
};

export const useModeration = () => {
  const [moderationLog, setModerationLog] = useState([]);

  const addToLog = (entry) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...entry
    };
    setModerationLog(prev => [logEntry, ...prev].slice(0, 100)); // Keep last 100 entries
  };

  // Text moderation
  const moderateText = async (text) => {
    try {
      // First check local profanity filter
      if (checkProfanity(text)) {
        addToLog({
          type: 'text',
          content: text,
          status: 'blocked',
          reason: 'Local profanity filter'
        });
        return false;
      }

      // Then check with OpenAI Moderation API (if API key is available)
      if (import.meta.env.VITE_OPENAI_API_KEY) {
        try {
          const response = await fetch('https://api.openai.com/v1/moderations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              input: text,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            const flagged = result.results[0]?.flagged || false;

            if (flagged) {
              addToLog({
                type: 'text',
                content: text,
                status: 'blocked',
                reason: 'OpenAI moderation'
              });
              return false;
            }
          }
        } catch (error) {
          console.error('OpenAI moderation API error:', error);
          // Continue with local filter result if API fails
        }
      }

      addToLog({
        type: 'text',
        content: text,
        status: 'approved',
        reason: 'Passed all checks'
      });
      return true;
    } catch (error) {
      console.error('Text moderation error:', error);
      addToLog({
        type: 'text',
        content: text,
        status: 'error',
        reason: 'Moderation error'
      });
      return false;
    }
  };

  // Image moderation
  const moderateImage = async (imageDataUrl) => {
    try {
      // Convert data URL to base64
      const base64Data = imageDataUrl.split(',')[1];

      // Check with Google Vision SafeSearch API (if API key is available)
      if (import.meta.env.VITE_GOOGLE_VISION_API_KEY) {
        try {
          const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${import.meta.env.VITE_GOOGLE_VISION_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requests: [
                {
                  image: {
                    content: base64Data,
                  },
                  features: [
                    {
                      type: 'SAFE_SEARCH_DETECTION',
                      maxResults: 1,
                    },
                  ],
                },
              ],
            }),
          });

          if (response.ok) {
            const result = await response.json();
            const safeSearch = result.responses[0]?.safeSearchAnnotation;

            if (safeSearch) {
              // Define acceptable thresholds
              const acceptableLevels = ['VERY_UNLIKELY', 'UNLIKELY'];
              const restrictedCategories = ['adult', 'violence', 'racy'];

              const inappropriateCategories = Object.entries(safeSearch)
                .filter(([category, level]) => 
                  restrictedCategories.includes(category) && !acceptableLevels.includes(level)
                )
                .map(([category, level]) => ({ category, level }));

              if (inappropriateCategories.length > 0) {
                addToLog({
                  type: 'image',
                  content: 'Image moderation',
                  status: 'blocked',
                  reason: 'Inappropriate content detected',
                  details: inappropriateCategories
                });
                return false;
              }
            }
          }
        } catch (error) {
          console.error('Google Vision API error:', error);
          // Continue with basic checks if API fails
        }
      }

      addToLog({
        type: 'image',
        content: 'Image moderation',
        status: 'approved',
        reason: 'Passed all checks'
      });
      return true;
    } catch (error) {
      console.error('Image moderation error:', error);
      addToLog({
        type: 'image',
        content: 'Image moderation',
        status: 'error',
        reason: 'Moderation error'
      });
      return false;
    }
  };

  // Canvas snapshot moderation (periodic checking)
  const moderateCanvas = async (canvas) => {
    try {
      if (!canvas) return true;

      const imageData = canvas.toDataURL('image/png');
      return await moderateImage(imageData);
    } catch (error) {
      console.error('Canvas moderation error:', error);
      return false;
    }
  };

  return {
    moderateText,
    moderateImage,
    moderateCanvas,
    moderationLog,
    addToLog
  };
};
