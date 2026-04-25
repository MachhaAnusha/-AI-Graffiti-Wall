import { useState } from 'react';
import Filter from 'bad-words';

const useModeration = () => {
  const [moderationLog, setModerationLog] = useState([]);
  const filter = new Filter();

  const addToLog = (entry) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...entry
    };
    setModerationLog(prev => [logEntry, ...prev].slice(0, 100)); // Keep last 100 entries
  };

  // Text moderation (Layer 1)
  const moderateText = async (text) => {
    try {
      // First check with bad-words library
      if (filter.isProfane(text)) {
        addToLog({
          type: 'text',
          content: text,
          status: 'blocked',
          reason: 'Bad words filter',
          severity: 'high'
        });
        return false;
      }

      // Then check with OpenAI Moderation API (Layer 2)
      try {
        const response = await fetch('/api/moderate-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.flagged) {
            addToLog({
              type: 'text',
              content: text,
              status: 'blocked',
              reason: 'OpenAI moderation',
              severity: 'high',
              categories: result.categories || []
            });
            return false;
          }
        }
      } catch (error) {
        console.error('OpenAI moderation API error:', error);
        // Continue with local filter result if API fails
      }

      addToLog({
        type: 'text',
        content: text,
        status: 'approved',
        reason: 'Passed all checks',
        severity: 'low'
      });
      return true;
    } catch (error) {
      console.error('Text moderation error:', error);
      addToLog({
        type: 'text',
        content: text,
        status: 'error',
        reason: 'Moderation error',
        severity: 'medium'
      });
      return false;
    }
  };

  // Image moderation (Layer 2)
  const moderateImage = async (imageDataUrl) => {
    try {
      // Convert data URL to base64
      const base64Data = imageDataUrl.split(',')[1];

      // Check with Google Vision SafeSearch API
      try {
        const response = await fetch('/api/moderate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64Data }),
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.flagged) {
            addToLog({
              type: 'image',
              content: 'Image moderation',
              status: 'blocked',
              reason: 'Inappropriate content detected',
              severity: 'high',
              details: result.violations || []
            });
            return false;
          }
        }
      } catch (error) {
        console.error('Google Vision API error:', error);
        // Continue with basic checks if API fails
      }

      addToLog({
        type: 'image',
        content: 'Image moderation',
        status: 'approved',
        reason: 'Passed all checks',
        severity: 'low'
      });
      return true;
    } catch (error) {
      console.error('Image moderation error:', error);
      addToLog({
        type: 'image',
        content: 'Image moderation',
        status: 'error',
        reason: 'Moderation error',
        severity: 'medium'
      });
      return false;
    }
  };

  // Canvas snapshot moderation (Layer 3)
  const moderateCanvas = async (canvas) => {
    try {
      if (!canvas) return true;

      const imageData = canvas.toDataURL('image/png');
      const isAppropriate = await moderateImage(imageData);
      
      if (!isAppropriate) {
        addToLog({
          type: 'canvas',n          content: 'Canvas snapshot moderation',
          status: 'blocked',
          reason: 'Inappropriate canvas content detected',
          severity: 'high',
          action: 'canvas_blocked'
        });
      }
      
      return isAppropriate;
    } catch (error) {
      console.error('Canvas moderation error:', error);
      addToLog({
        type: 'canvas',
        content: 'Canvas snapshot moderation',
        status: 'error',
        reason: 'Canvas moderation error',
        severity: 'medium'
      });
      return false;
    }
  };

  // Get moderation statistics
  const getModerationStats = () => {
    const stats = {
      total: moderationLog.length,
      approved: moderationLog.filter(entry => entry.status === 'approved').length,
      blocked: moderationLog.filter(entry => entry.status === 'blocked').length,
      errors: moderationLog.filter(entry => entry.status === 'error').length,
      byType: {
        text: moderationLog.filter(entry => entry.type === 'text').length,
        image: moderationLog.filter(entry => entry.type === 'image').length,
        canvas: moderationLog.filter(entry => entry.type === 'canvas').length
      },
      bySeverity: {
        high: moderationLog.filter(entry => entry.severity === 'high').length,
        medium: moderationLog.filter(entry => entry.severity === 'medium').length,
        low: moderationLog.filter(entry => entry.severity === 'low').length
      }
    };
    return stats;
  };

  // Clear moderation log
  const clearLog = () => {
    setModerationLog([]);
  };

  return {
    moderateText,
    moderateImage,
    moderateCanvas,
    moderationLog,
    addToLog,
    getModerationStats,
    clearLog
  };
};

export default useModeration;
