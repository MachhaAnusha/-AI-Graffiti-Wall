import React, { useState } from 'react';
import html2canvas from 'html2canvas';

const CanvasActions = ({ 
  onClear, 
  onDownload, 
  onSendToDisplay, 
  disabled = false,
  nickname = '',
  onNicknameChange,
  showNickname = true
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleDownload = async () => {
    if (disabled || isDownloading) return;
    
    try {
      setIsDownloading(true);
      
      const canvas = document.getElementById('graffiti-canvas');
      if (canvas) {
        // Use html2canvas for better quality
        const dataURL = canvas.toDataURL('image/png', 1.0);
        
        // Create download link
        const link = document.createElement('a');
        link.download = `graffiti-${nickname || 'anonymous'}-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendToDisplay = async () => {
    if (disabled || isSending) return;
    
    try {
      setIsSending(true);
      await onSendToDisplay();
    } catch (error) {
      console.error('Send failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    if (disabled) return;
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    onClear();
    setShowClearConfirm(false);
  };

  return (
    <div className="graffiti-panel">
      <h3 className="graffiti-title text-lg mb-4">Canvas Actions</h3>
      
      {/* Nickname Input */}
      {showNickname && (
        <div className="mb-4">
          <label className="text-xs text-muted block mb-2">Artist Name</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            placeholder="Enter your artist name..."
            className="graffiti-input w-full"
            maxLength={20}
            disabled={disabled}
          />
          <div className="text-xs text-muted mt-1">
            {nickname.length}/20 characters
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Clear Canvas */}
        <div className="relative">
          <button
            onClick={handleClear}
            disabled={disabled}
            className="graffiti-button w-full"
            style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-red))' }}
          >
            <span className="flex items-center justify-center gap-2">
              <span>🗑️</span>
              <span>Clear</span>
            </span>
          </button>
          
          {/* Clear Confirmation Modal */}
          {showClearConfirm && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg z-50 p-4">
              <div className="graffiti-panel max-w-xs w-full">
                <h4 className="graffiti-title text-sm mb-2">Clear Canvas?</h4>
                <p className="text-xs text-muted mb-4">This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="graffiti-button flex-1 text-xs"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmClear}
                    className="graffiti-button flex-1 text-xs"
                    style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-red))' }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={disabled || isDownloading}
          className="graffiti-button w-full"
          style={{ background: 'linear-gradient(135deg, var(--accent-tertiary), var(--accent-green))' }}
        >
          <span className="flex items-center justify-center gap-2">
            {isDownloading ? (
              <div className="spray-loader">
                <div className="spray-dot"></div>
                <div className="spray-dot"></div>
                <div className="spray-dot"></div>
              </div>
            ) : (
              <>
                <span>💾</span>
                <span>Download</span>
              </>
            )}
          </span>
        </button>

        {/* Send to Display */}
        <button
          onClick={handleSendToDisplay}
          disabled={disabled || isSending}
          className="graffiti-button w-full neon-glow"
        >
          <span className="flex items-center justify-center gap-2">
            {isSending ? (
              <div className="spray-loader">
                <div className="spray-dot"></div>
                <div className="spray-dot"></div>
                <div className="spray-dot"></div>
              </div>
            ) : (
              <>
                <span>🎨</span>
                <span>Send to Wall</span>
              </>
            )}
          </span>
        </button>
      </div>

      {/* Action Info */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>🗑️</span>
          <span>Clear canvas completely</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>💾</span>
          <span>Download as PNG image</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>🎨</span>
          <span>Display on the big screen</span>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="mt-4 p-3 bg-tertiary rounded-lg">
        <h4 className="text-xs font-semibold mb-2 text-muted">Keyboard Shortcuts</h4>
        <div className="space-y-1 text-xs text-muted">
          <div><kbd className="px-1 py-0.5 bg-secondary rounded">Ctrl+Z</kbd> Undo</div>
          <div><kbd className="px-1 py-0.5 bg-secondary rounded">Ctrl+Y</kbd> Redo</div>
          <div><kbd className="px-1 py-0.5 bg-secondary rounded">Ctrl+S</kbd> Download</div>
        </div>
      </div>
    </div>
  );
};

export default CanvasActions;
