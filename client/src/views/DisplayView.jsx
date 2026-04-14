import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useSocket } from '../hooks/useSocket';

const DisplayView = () => {
  const [currentArtwork, setCurrentArtwork] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [showQR, setShowQR] = useState(true);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      // Connect as display
      socket.emit('display:connect');
      
      // Listen for artwork display
      socket.on('artwork:display', (artwork) => {
        setCurrentArtwork(artwork);
        setIsSlideshow(false);
        setShowQR(false);
        
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
        // Handle timer display if needed
        console.log('Timer started:', duration);
      });
    }
  }, [socket]);

  useEffect(() => {
    // Generate QR code
    const generateQR = async () => {
      try {
        const url = window.location.origin + '/create';
        const qr = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: '#ff006e',
            light: '#000000'
          }
        });
        setQrCodeUrl(qr);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };
    
    generateQR();
  }, []);

  useEffect(() => {
    // Slideshow mode - rotate through gallery when idle
    if (isSlideshow && gallery.length > 0) {
      const interval = setInterval(() => {
        setSlideshowIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % gallery.length;
          setCurrentArtwork(gallery[nextIndex]);
          return nextIndex;
        });
      }, 10000); // Change every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isSlideshow, gallery]);

  useEffect(() => {
    // Start slideshow if no current artwork and gallery has items
    if (!currentArtwork && gallery.length > 0) {
      setIsSlideshow(true);
      setSlideshowIndex(0);
      setCurrentArtwork(gallery[0]);
    }
  }, [currentArtwork, gallery]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key.toLowerCase()) {
        case 'f':
          // Toggle fullscreen
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
        case 'n':
          // Next artwork in gallery
          if (gallery.length > 0) {
            const nextIndex = (slideshowIndex + 1) % gallery.length;
            setSlideshowIndex(nextIndex);
            setCurrentArtwork(gallery[nextIndex]);
            setIsSlideshow(false);
          }
          break;
        case 'g':
          // Toggle gallery mode
          setIsSlideshow(!isSlideshow);
          break;
        case 'q':
          // Toggle QR code
          setShowQR(!showQR);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gallery, slideshowIndex, showQR, isSlideshow]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Main Display Area */}
      <div className="flex items-center justify-center min-h-screen p-8">
        {currentArtwork ? (
          <div className="relative max-w-6xl w-full">
            {/* Artwork Display */}
            <div className="relative spray-animation">
              <img
                src={currentArtwork.image}
                alt="Graffiti Artwork"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg border-4 border-pink-500 shadow-2xl"
              />
              
              {/* Artwork Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 rounded-b-lg">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-bold neon-pink font-boogaloo">
                      {currentArtwork.nickname}
                    </h3>
                    <p className="text-gray-400">
                      {new Date(currentArtwork.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {isSlideshow && (
                    <div className="text-gray-400">
                      {slideshowIndex + 1} / {gallery.length}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-6xl font-bold neon-blue font-boogaloo mb-8">
              AI Graffiti Wall
            </h1>
            <p className="text-2xl text-gray-400 mb-12">
              Waiting for artwork...
            </p>
            <div className="animate-pulse">
              <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Overlay */}
      {showQR && (
        <div className="absolute top-8 right-8 bg-gray-900 p-4 rounded-lg border-2 border-pink-500">
          <div className="text-center">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-48 h-48 mx-auto mb-4"
            />
            <p className="text-sm font-boogaloo neon-green mb-2">
              Scan to Create!
            </p>
            <p className="text-xs text-gray-400">
              Join the graffiti wall
            </p>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="absolute top-8 left-8">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">
            {isSlideshow ? 'Gallery Mode' : currentArtwork ? 'Live Display' : 'Waiting'}
          </span>
        </div>
      </div>

      {/* Keyboard Controls Help */}
      <div className="absolute bottom-8 left-8 text-xs text-gray-500">
        <p>Press F: Fullscreen | N: Next | G: Gallery | Q: QR Code</p>
      </div>

      {/* Gallery Counter */}
      {gallery.length > 0 && (
        <div className="absolute bottom-8 right-8 text-sm text-gray-400">
          <p>Gallery: {gallery.length} artworks</p>
        </div>
      )}
    </div>
  );
};

export default DisplayView;
