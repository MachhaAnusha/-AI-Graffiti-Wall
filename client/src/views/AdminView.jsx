import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import useModeration from '../hooks/useModeration';

const AdminView = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slideshowEnabled, setSlideshowEnabled] = useState(true);
  const [timerDuration, setTimerDuration] = useState(180); // 3 minutes
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [galleryView, setGalleryView] = useState('grid'); // 'grid' or 'list'
  const [selectedArtworks, setSelectedArtworks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'approved', 'pending', 'blocked'
  
  const socket = useSocket();
  const { moderationLog, getModerationStats, clearLog } = useModeration();
  const moderationStats = getModerationStats();

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
      
      // Listen for user count updates
      socket.on('user:count', setUserCount);
      
      // Listen for session status
      socket.on('session:status', (status) => {
        setSessionActive(status.active);
      });
      
      // Listen for emergency mode
      socket.on('emergency:mode', (enabled) => {
        setEmergencyMode(enabled);
      });

      return () => {
        socket.off('gallery:update');
        socket.off('artwork:submitted');
        socket.off('user:count');
        socket.off('session:status');
        socket.off('emergency:mode');
      };
    }
  }, [socket, isAuthenticated]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gallery');
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

  const handleLogin = useCallback((e) => {
    e.preventDefault();
    // Verify password with server
    fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('adminAuthenticated', 'true');
      } else {
        alert('Invalid password. Please try again.');
        setPassword('');
      }
    })
    .catch(error => {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    });
  }, [password]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
    setPassword('');
    setSelectedArtworks([]);
  }, []);

  const handleDeleteArtwork = async (artworkId) => {
    if (!confirm('Are you sure you want to delete this artwork?')) {
      return;
    }

    try {
      const response = await fetch(`/api/gallery/${artworkId}`, {
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

  const handleBulkDelete = async () => {
    if (selectedArtworks.length === 0) {
      alert('No artworks selected');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedArtworks.length} artworks?`)) {
      return;
    }

    try {
      const response = await fetch('/api/gallery/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedArtworks }),
      });

      if (response.ok) {
        loadGallery();
        setSelectedArtworks([]);
        if (socket) {
          selectedArtworks.forEach(id => socket.emit('artwork:delete', id));
        }
      } else {
        alert('Failed to delete artworks');
      }
    } catch (error) {
      console.error('Error bulk deleting artworks:', error);
      alert('Error deleting artworks');
    }
  };

  const handlePushToDisplay = useCallback((artwork) => {
    if (socket) {
      socket.emit('artwork:display', artwork);
      setSelectedArtwork(artwork);
    }
  }, [socket]);

  const handleClearDisplay = useCallback(() => {
    if (socket) {
      socket.emit('display:clear');
      setSelectedArtwork(null);
    }
  }, [socket]);

  const handleStartTimer = useCallback(() => {
    if (socket) {
      socket.emit('timer:start', timerDuration);
    }
  }, [socket, timerDuration]);

  const handleStopTimer = useCallback(() => {
    if (socket) {
      socket.emit('timer:stop');
    }
  }, [socket]);

  const handleKillSwitch = useCallback(() => {
    if (confirm('Are you sure you want to activate emergency mode? This will stop all submissions and clear the display.')) {
      if (socket) {
        socket.emit('emergency:activate');
        setEmergencyMode(true);
      }
    }
  }, [socket]);

  const handleDisableKillSwitch = useCallback(() => {
    if (socket) {
      socket.emit('emergency:deactivate');
      setEmergencyMode(false);
    }
  }, [socket]);

  const toggleSlideshow = useCallback(() => {
    const newState = !slideshowEnabled;
    setSlideshowEnabled(newState);
    if (socket) {
      socket.emit('slideshow:' + (newState ? 'start' : 'stop'));
    }
  }, [slideshowEnabled, socket]);

  const toggleArtworkSelection = useCallback((artworkId) => {
    setSelectedArtworks(prev => 
      prev.includes(artworkId) 
        ? prev.filter(id => id !== artworkId)
        : [...prev, artworkId]
    );
  }, []);

  const filteredGallery = gallery.filter(artwork => {
    const matchesSearch = artwork.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          artwork.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'approved' && artwork.status === 'approved') ||
                         (filterStatus === 'pending' && artwork.status === 'pending') ||
                         (filterStatus === 'blocked' && artwork.status === 'blocked');
    return matchesSearch && matchesFilter;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="graffiti-panel max-w-md w-full"
        >
          <h2 className="graffiti-title text-3xl mb-6 text-center">Admin Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-muted block mb-2">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password..."
                className="graffiti-input w-full"
                required
              />
            </div>
            <button
              type="submit"
              className="graffiti-button w-full neon-glow"
            >
              Login to Admin Panel
            </button>
          </form>
          
          <div className="mt-6 p-3 bg-tertiary rounded-lg">
            <p className="text-xs text-muted text-center">
              🔒 Secure admin access required
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="graffiti-title text-4xl md:text-5xl mb-2">
              Admin Panel
            </h1>
            <p className="text-secondary">Manage the AI Graffiti Wall</p>
          </div>
          <div className="flex gap-3">
            {emergencyMode && (
              <div className="graffiti-button bg-accent-red animate-pulse">
                <span className="flex items-center gap-2">
                  <span>🚨</span>
                  <span>Emergency Mode</span>
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="graffiti-button"
              style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-red))' }}
            >
              Logout
            </button>
          </div>
        </motion.header>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Display Controls */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="graffiti-panel"
          >
            <h2 className="graffiti-title text-lg mb-4">Display Controls</h2>
            <div className="space-y-3">
              <button
                onClick={handleClearDisplay}
                className="graffiti-button w-full"
                style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-red))' }}
              >
                Clear Display
              </button>
              <button
                onClick={toggleSlideshow}
                className="graffiti-button w-full"
                style={{ background: slideshowEnabled ? 'linear-gradient(135deg, var(--accent-green), var(--accent-primary))' : 'var(--bg-tertiary)' }}
              >
                {slideshowEnabled ? 'Disable Slideshow' : 'Enable Slideshow'}
              </button>
              <div className="text-xs text-muted">
                Status: {selectedArtwork ? 'Active' : 'Idle'}
              </div>
            </div>
          </motion.div>

          {/* Session Controls */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="graffiti-panel"
          >
            <h2 className="graffiti-title text-lg mb-4">Session Controls</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted block mb-2">
                  Timer: {Math.floor(timerDuration / 60)}:{(timerDuration % 60).toString().padStart(2, '0')}
                </label>
                <input
                  type="range"
                  min="60"
                  max="1800"
                  step="60"
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                onClick={handleStartTimer}
                disabled={sessionActive}
                className="graffiti-button w-full"
                style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-primary))' }}
              >
                {sessionActive ? 'Session Active' : 'Start Timer'}
              </button>
              {sessionActive && (
                <button
                  onClick={handleStopTimer}
                  className="graffiti-button w-full"
                  style={{ background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-yellow))' }}
                >
                  Stop Timer
                </button>
              )}
            </div>
          </motion.div>

          {/* Emergency Controls */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="graffiti-panel"
          >
            <h2 className="graffiti-title text-lg mb-4">Emergency Controls</h2>
            <div className="space-y-3">
              {!emergencyMode ? (
                <button
                  onClick={handleKillSwitch}
                  className="graffiti-button w-full animate-pulse"
                  style={{ background: 'linear-gradient(135deg, var(--accent-red), var(--accent-secondary))' }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>🚨</span>
                    <span>Emergency Stop</span>
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleDisableKillSwitch}
                  className="graffiti-button w-full"
                  style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-primary))' }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>✅</span>
                    <span>Resume Normal</span>
                  </span>
                </button>
              )}
              <div className="text-xs text-muted text-center">
                {emergencyMode ? 'All submissions blocked' : 'Click to stop all activity'}
              </div>
            </div>
          </motion.div>

          {/* Live Statistics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="graffiti-panel"
          >
            <h2 className="graffiti-title text-lg mb-4">Live Statistics</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Total Artworks:</span>
                <span className="font-semibold">{gallery.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Active Users:</span>
                <span className="font-semibold">{userCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Session:</span>
                <span className={`font-semibold ${sessionActive ? 'text-accent-green' : 'text-muted'}`}>
                  {sessionActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Moderated:</span>
                <span className="font-semibold">{moderationStats.blocked}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Gallery Management */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="graffiti-panel"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h2 className="graffiti-title text-2xl">Gallery Management</h2>
            
            {/* Gallery Controls */}
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Search artworks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="graffiti-input px-3 py-2 text-sm"
              />
              
              {/* Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="graffiti-input px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="blocked">Blocked</option>
              </select>
              
              {/* View Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setGalleryView('grid')}
                  className={`graffiti-button text-sm px-3 py-2 ${galleryView === 'grid' ? 'neon-glow' : ''}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setGalleryView('list')}
                  className={`graffiti-button text-sm px-3 py-2 ${galleryView === 'list' ? 'neon-glow' : ''}`}
                >
                  List
                </button>
              </div>
              
              {/* Bulk Actions */}
              {selectedArtworks.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="graffiti-button text-sm px-3 py-2"
                  style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-red))' }}
                >
                  Delete Selected ({selectedArtworks.length})
                </button>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="spray-loader mx-auto">
                <div className="spray-dot"></div>
                <div className="spray-dot"></div>
                <div className="spray-dot"></div>
              </div>
              <p className="mt-4 text-secondary">Loading gallery...</p>
            </div>
          ) : filteredGallery.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary">
                {searchTerm || filterStatus !== 'all' ? 'No artworks match your filters' : 'No artworks in gallery yet'}
              </p>
            </div>
          ) : (
            <div className={galleryView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
              <AnimatePresence mode="popLayout">
                {filteredGallery.map((artwork, index) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      relative overflow-hidden rounded-lg border-2 transition-all duration-300
                      ${selectedArtwork?.id === artwork.id ? 'border-accent-primary neon-glow' : 'border-secondary hover:border-accent-tertiary'}
                      ${galleryView === 'grid' ? '' : 'flex gap-4 p-4'}
                    `}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedArtworks.includes(artwork.id)}
                        onChange={() => toggleArtworkSelection(artwork.id)}
                        className="w-5 h-5 accent-accent-primary"
                      />
                    </div>
                    
                    {/* Artwork Content */}
                    {galleryView === 'grid' ? (
                      <>
                        <img
                          src={artwork.image}
                          alt={artwork.nickname}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="graffiti-title text-sm mb-1">
                            {artwork.nickname || 'Anonymous'}
                          </h3>
                          <p className="text-xs text-muted mb-3">
                            {new Date(artwork.timestamp).toLocaleString()}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePushToDisplay(artwork)}
                              className="graffiti-button flex-1 text-xs"
                              style={{ background: 'linear-gradient(135deg, var(--accent-tertiary), var(--accent-green))' }}
                            >
                              Display
                            </button>
                            <button
                              onClick={() => handleDeleteArtwork(artwork.id)}
                              className="graffiti-button flex-1 text-xs"
                              style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-red))' }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <img
                          src={artwork.image}
                          alt={artwork.nickname}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1">
                          <h3 className="graffiti-title text-sm mb-1">
                            {artwork.nickname || 'Anonymous'}
                          </h3>
                          <p className="text-xs text-muted mb-2">
                            {new Date(artwork.timestamp).toLocaleString()}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePushToDisplay(artwork)}
                              className="graffiti-button text-xs px-3 py-1"
                              style={{ background: 'linear-gradient(135deg, var(--accent-tertiary), var(--accent-green))' }}
                            >
                              Display
                            </button>
                            <button
                              onClick={() => handleDeleteArtwork(artwork.id)}
                              className="graffiti-button text-xs px-3 py-1"
                              style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-red))' }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Moderation Dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Moderation Statistics */}
          <div className="graffiti-panel">
            <div className="flex justify-between items-center mb-6">
              <h2 className="graffiti-title text-xl">Moderation Stats</h2>
              <button
                onClick={clearLog}
                className="graffiti-button text-xs px-3 py-1"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                Clear Log
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-tertiary rounded-lg">
                <div className="text-2xl font-bold text-accent-green">{moderationStats.approved}</div>
                <div className="text-xs text-muted">Approved</div>
              </div>
              <div className="text-center p-4 bg-tertiary rounded-lg">
                <div className="text-2xl font-bold text-accent-red">{moderationStats.blocked}</div>
                <div className="text-xs text-muted">Blocked</div>
              </div>
              <div className="text-center p-4 bg-tertiary rounded-lg">
                <div className="text-2xl font-bold text-accent-orange">{moderationStats.errors}</div>
                <div className="text-xs text-muted">Errors</div>
              </div>
              <div className="text-center p-4 bg-tertiary rounded-lg">
                <div className="text-2xl font-bold text-accent-tertiary">{moderationStats.total}</div>
                <div className="text-xs text-muted">Total</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted mb-3">By Type</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Text:</span>
                <span>{moderationStats.byType.text}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Image:</span>
                <span>{moderationStats.byType.image}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Canvas:</span>
                <span>{moderationStats.byType.canvas}</span>
              </div>
            </div>
          </div>

          {/* Recent Moderation Activity */}
          <div className="graffiti-panel">
            <h2 className="graffiti-title text-xl mb-6">Recent Activity</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {moderationLog.length === 0 ? (
                <p className="text-muted text-center py-8">No moderation activity</p>
              ) : (
                moderationLog.slice(0, 10).map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center p-3 bg-tertiary rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          log.status === 'approved' ? 'bg-accent-green' :
                          log.status === 'blocked' ? 'bg-accent-red' :
                          log.status === 'error' ? 'bg-accent-orange' : 'bg-muted'
                        }`}></span>
                        <span className="text-sm font-medium capitalize">{log.type}</span>
                        <span className="text-xs text-muted truncate max-w-xs">
                          {log.content?.substring(0, 30)}...
                        </span>
                      </div>
                      {log.reason && (
                        <div className="text-xs text-muted mt-1">{log.reason}</div>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminView;
