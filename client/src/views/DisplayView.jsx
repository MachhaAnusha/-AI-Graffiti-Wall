import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { useNetwork } from '../hooks/useNetwork';

const DisplayView = () => {
  const [currentArtwork, setCurrentArtwork] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [showQR, setShowQR] = useState(true);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [sprayAnimation, setSprayAnimation] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [sessionTimer, setSessionTimer] = useState(null);
  
  const controlsTimeoutRef = useRef(null);
  const socket = useSocket();
  const { networkInfo, createQR, loading: networkLoading, error: networkError, formatIPDisplay } = useNetwork();

  // Auto-hide controls after 5 seconds of inactivity
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 5000);
  }, []);

  // Show controls on mouse movement
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [handleMouseMove]);

  useEffect(() => {
    if (socket) {
      // Connect as display
      socket.emit('display:connect');
      
      // Listen for artwork display with spray animation
      socket.on('artwork:display', (artwork) => {
        setSprayAnimation(true);
        setTimeout(() => {
          setCurrentArtwork(artwork);
          setIsSlideshow(false);
          setShowQR(false);
          setSprayAnimation(false);
        }, 500);
        
        // Auto-hide QR after 10 seconds
        setTimeout(() => {
          setShowQR(false);
        }, 10000);
      });
      
      // Listen for gallery updates
      socket.on('gallery:update', (updatedGallery) => {
        setGallery(updatedGallery);
      });
      
      // Listen for display clear
      socket.on('display:clear', () => {
        setCurrentArtwork(null);
        setShowQR(true);
      });
      
      // Listen for timer events
      socket.on('timer:start', (duration) => {
        setSessionTimer(duration);
      });
      
      socket.on('timer:expired', () => {
        setSessionTimer(null);
      });
      
      // Listen for user count updates
      socket.on('user:count', (count) => {
        setUserCount(count);
      });
      
      // Listen for slideshow controls
      socket.on('slideshow:start', () => {
        setIsSlideshow(true);
      });
      
      socket.on('slideshow:stop', () => {
        setIsSlideshow(false);
      });
    }
  }, [socket]);

  useEffect(() => {
    // Slideshow mode with smooth transitions
    if (isSlideshow && gallery.length > 0) {
      const interval = setInterval(() => {
        setSlideshowIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % gallery.length;
          setCurrentArtwork(gallery[nextIndex]);
          return nextIndex;
        });
      }, 8000); // Change every 8 seconds

      return () => clearInterval(interval);
    }
  }, [isSlideshow, gallery]);

  useEffect(() => {
    // Start slideshow if no current artwork and gallery has items
    if (!currentArtwork && gallery.length > 0 && !isSlideshow) {
      setIsSlideshow(true);
      setSlideshowIndex(0);
      setCurrentArtwork(gallery[0]);
    }
  }, [currentArtwork, gallery, isSlideshow]);

  // Enhanced keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key.toLowerCase()) {
        case 'f':
          // Toggle fullscreen
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
          } else {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
          break;
        case 'n':
          // Next artwork in gallery
          if (gallery.length > 0) {
            const nextIndex = (slideshowIndex + 1) % gallery.length;
            setSlideshowIndex(nextIndex);
            setCurrentArtwork(gallery[nextIndex]);
            setIsSlideshow(false);
            setSprayAnimation(true);
            setTimeout(() => setSprayAnimation(false), 500);
          }
          break;
        case 'g':
          // Toggle gallery mode
          setIsSlideshow(!isSlideshow);
          break;
        case 'c':
          // Clear display
          socket?.emit('display:clear');
          break;
        case 'q':
          // Toggle QR code
          setShowQR(!showQR);
          break;
        case 'h':
          // Toggle controls visibility
          setShowControls(!showControls);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gallery, slideshowIndex, showQR, isSlideshow, socket]);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-primary text-primary relative overflow-hidden">
      {/* Spray Paint Animation Overlay */}
      <AnimatePresence>
        {sprayAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: Math.random() * 0.5,
                    ease: "easeOut"
                  }}
                  className="absolute w-8 h-8 rounded-full"
                  style={{
                    backgroundColor: ['#FFE500', '#FF006E', '#00F5FF', '#06ffa5'][Math.floor(Math.random() * 4)]
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Display Area */}
      <div className="flex items-center justify-center min-h-screen p-8">
        <AnimatePresence mode="wait">
          {currentArtwork ? (
            <motion.div
              key={currentArtwork.id || slideshowIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="relative max-w-7xl w-full"
            >
              {/* Artwork Display with Enhanced Frame */}
              <div className="relative">
                {/* Graffiti Frame */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg opacity-20 blur-xl"></div>
                <div className="absolute inset-0 border-4 border-accent-primary rounded-lg"></div>
                
                <img
                  src={currentArtwork.image}
                  alt="Graffiti Artwork"
                  className="relative w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
                
                {/* Artwork Watermark */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary via-primary/80 to-transparent p-6 rounded-b-lg">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="graffiti-title text-2xl">
                        {currentArtwork.nickname || 'Anonymous'}
                      </h3>
                      <p className="text-secondary text-sm">
                        {new Date(currentArtwork.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {isSlideshow && (
                      <div className="text-secondary">
                        <span className="ui-text">{slideshowIndex + 1} / {gallery.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <h1 className="graffiti-title text-6xl md:text-8xl mb-8">
                AI Graffiti Wall
              </h1>
              <p className="text-2xl text-secondary mb-12">
                Waiting for artwork...
              </p>
              <div className="flex justify-center">
                <div className="spray-loader">
                  <div className="spray-dot"></div>
                  <div className="spray-dot"></div>
                  <div className="spray-dot"></div>
                  <div className="spray-dot"></div>
                  <div className="spray-dot"></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced QR Code Overlay */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute top-8 right-8 z-40"
          >
            <div className="graffiti-panel">
              <div className="text-center">
                <div className="mb-4">
                  {networkLoading ? (
                    <div className="w-48 h-48 mx-auto rounded-lg border-2 border-accent-primary flex items-center justify-center">
                      <div className="spray-loader">
                        <div className="spray-dot"></div>
                        <div className="spray-dot"></div>
                        <div className="spray-dot"></div>
                      </div>
                    </div>
                  ) : networkError ? (
                    <div className="w-48 h-48 mx-auto rounded-lg border-2 border-accent-red flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-2xl mb-2 block">⚠️</span>
                        <span className="text-xs text-accent-red">Network Error</span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={createQR}
                      alt="QR Code"
                      className="w-48 h-48 mx-auto rounded-lg border-2 border-accent-primary"
                    />
                  )}
                </div>
                <h4 className="graffiti-title text-lg mb-2">Scan to Create!</h4>
                <p className="text-xs text-secondary mb-2">Join the graffiti wall</p>
                <p className="text-xs text-muted">{formatIPDisplay()}:{networkInfo.port}/create</p>
                {networkError && (
                  <p className="text-xs text-accent-red mt-2">Using fallback URL</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Status Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-8 left-8 z-40"
          >
            <div className="graffiti-panel">
              <div className="flex items-center gap-4">
                {/* Connection Status */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-accent-green rounded-full animate-pulse"></div>
                  <span className="text-sm text-secondary">
                    {isSlideshow ? 'Gallery Mode' : currentArtwork ? 'Live Display' : 'Waiting'}
                  </span>
                </div>
                
                {/* User Count */}
                {userCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    <span className="text-sm text-secondary">{userCount} creators</span>
                  </div>
                )}
                
                {/* Session Timer */}
                {sessionTimer && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⏱️</span>
                    <span className="text-sm text-secondary">{Math.floor(sessionTimer / 60)}:{(sessionTimer % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
                
                {/* Fullscreen Indicator */}
                {isFullscreen && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔳</span>
                    <span className="text-sm text-secondary">Fullscreen</span>
                  </div>
                )}
                
                {/* Network Status */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌐</span>
                  <span className="text-sm text-secondary">{formatIPDisplay()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Keyboard Controls Help */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-8 z-40"
          >
            <div className="graffiti-panel">
              <div className="text-xs text-muted space-y-1">
                <div className="flex gap-4">
                  <span><kbd className="px-2 py-1 bg-tertiary rounded">F</kbd> Fullscreen</span>
                  <span><kbd className="px-2 py-1 bg-tertiary rounded">N</kbd> Next</span>
                  <span><kbd className="px-2 py-1 bg-tertiary rounded">G</kbd> Gallery</span>
                  <span><kbd className="px-2 py-1 bg-tertiary rounded">C</kbd> Clear</span>
                  <span><kbd className="px-2 py-1 bg-tertiary rounded">Q</kbd> QR</span>
                  <span><kbd className="px-2 py-1 bg-tertiary rounded">H</kbd> Hide</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery Counter */}
      <AnimatePresence>
        {showControls && gallery.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-8 right-8 z-40"
          >
            <div className="graffiti-panel">
              <div className="text-sm text-secondary">
                <span className="font-semibold">Gallery:</span> {gallery.length} artworks
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DisplayView;
