import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

const AdminView = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slideshowEnabled, setSlideshowEnabled] = useState(true);
  const [timerDuration, setTimerDuration] = useState(300); // 5 minutes
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [moderationLog, setModerationLog] = useState([]);
  
  const socket = useSocket();

  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem('adminAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadGallery();
      loadModerationLog();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (socket && isAuthenticated) {
      // Listen for gallery updates
      socket.on('gallery:update', setGallery);
      
      // Listen for new artwork submissions
      socket.on('artwork:submitted', (data) => {
        if (data.success) {
          loadGallery();
        }
      });

      return () => {
        socket.off('gallery:update');
        socket.off('artwork:submitted');
      };
    }
  }, [socket, isAuthenticated]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/gallery');
      if (response.ok) {
        const data = await response.json();
        setGallery(data);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModerationLog = () => {
    // Mock moderation log - in real app this would come from server
    const mockLog = [
      { id: 1, type: 'text', content: 'test message', status: 'approved', timestamp: new Date().toISOString() },
      { id: 2, type: 'image', content: 'artwork_123', status: 'approved', timestamp: new Date().toISOString() },
    ];
    setModerationLog(mockLog);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuthenticated', 'true');
    } else {
      alert('Invalid password. Please try again.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
    setPassword('');
  };

  const handleDeleteArtwork = async (artworkId) => {
    if (!confirm('Are you sure you want to delete this artwork?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/gallery/${artworkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadGallery();
        if (socket) {
          socket.emit('artwork:delete', artworkId);
        }
      } else {
        alert('Failed to delete artwork');
      }
    } catch (error) {
      console.error('Error deleting artwork:', error);
      alert('Error deleting artwork');
    }
  };

  const handlePushToDisplay = (artwork) => {
    if (socket) {
      socket.emit('artwork:display', artwork);
      setSelectedArtwork(artwork);
    }
  };

  const handleClearDisplay = () => {
    if (socket) {
      socket.emit('display:clear');
      setSelectedArtwork(null);
    }
  };

  const handleStartTimer = () => {
    if (socket) {
      socket.emit('timer:start', timerDuration);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-gray-900 p-8 rounded-lg border-2 border-pink-500 max-w-md w-full mx-4">
          <h2 className="text-3xl font-bold text-center mb-6 neon-pink font-boogaloo">
            Admin Access
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password..."
                className="w-full px-4 py-3 bg-black border-2 border-pink-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full graffiti-btn font-boogaloo"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold neon-pink font-boogaloo mb-2">
              Admin Panel
            </h1>
            <p className="text-gray-400">Manage the AI Graffiti Wall</p>
          </div>
          <button
            onClick={handleLogout}
            className="graffiti-btn"
          >
            Logout
          </button>
        </header>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Display Controls */}
          <div className="bg-gray-900 p-6 rounded-lg border-2 border-pink-500">
            <h2 className="text-xl font-bold mb-4 neon-blue font-boogaloo">
              Display Controls
            </h2>
            <div className="space-y-4">
              <button
                onClick={handleClearDisplay}
                className="w-full graffiti-btn bg-red-600"
              >
                Clear Display
              </button>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="slideshow"
                  checked={slideshowEnabled}
                  onChange={(e) => setSlideshowEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="slideshow" className="text-sm">
                  Enable Slideshow
                </label>
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="bg-gray-900 p-6 rounded-lg border-2 border-green-500">
            <h2 className="text-xl font-bold mb-4 neon-green font-boogaloo">
              Session Timer
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Duration (seconds): {timerDuration}
                </label>
                <input
                  type="range"
                  min="60"
                  max="1800"
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                onClick={handleStartTimer}
                className="w-full graffiti-btn bg-green-600"
              >
                Start Timer
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-gray-900 p-6 rounded-lg border-2 border-yellow-500">
            <h2 className="text-xl font-bold mb-4 neon-yellow font-boogaloo">
              Statistics
            </h2>
            <div className="space-y-2 text-sm">
              <p>Total Artworks: {gallery.length}</p>
              <p>Gallery Capacity: {gallery.length}/50</p>
              <p>Display Status: {selectedArtwork ? 'Active' : 'Idle'}</p>
              <p>Slideshow: {slideshowEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </div>

        {/* Gallery Management */}
        <div className="bg-gray-900 p-6 rounded-lg border-2 border-pink-500">
          <h2 className="text-2xl font-bold mb-6 neon-pink font-boogaloo">
            Gallery Management
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto animate-spin"></div>
              <p className="mt-4 text-gray-400">Loading gallery...</p>
            </div>
          ) : gallery.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No artworks in gallery yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map((artwork) => (
                <div
                  key={artwork.id}
                  className="bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 hover:border-pink-500 transition-colors"
                >
                  <img
                    src={artwork.image}
                    alt={artwork.nickname}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-lg neon-blue font-boogaloo mb-1">
                      {artwork.nickname}
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      {new Date(artwork.timestamp).toLocaleString()}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePushToDisplay(artwork)}
                        className="flex-1 graffiti-btn text-sm bg-blue-600"
                      >
                        Push to Display
                      </button>
                      <button
                        onClick={() => handleDeleteArtwork(artwork.id)}
                        className="flex-1 graffiti-btn text-sm bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Moderation Log */}
        <div className="mt-8 bg-gray-900 p-6 rounded-lg border-2 border-purple-500">
          <h2 className="text-2xl font-bold mb-6 neon-purple font-boogaloo">
            Moderation Log
          </h2>
          <div className="space-y-2">
            {moderationLog.length === 0 ? (
              <p className="text-gray-400">No moderation activity</p>
            ) : (
              moderationLog.map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center p-3 bg-gray-800 rounded"
                >
                  <div>
                    <span className="text-sm font-medium">{log.type}</span>
                    <span className="text-xs text-gray-400 ml-2">{log.content}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded ${
                      log.status === 'approved' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {log.status}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
