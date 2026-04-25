const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// API integrations
const Replicate = require('replicate');
const OpenAI = require('openai');
const { GoogleAuth } = require('google-auth-library');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const badWords = require('bad-words');
const os = require('os');
const qrcode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API initialization
let replicate, openai, visionClient, filter;

try {
  if (process.env.REPLICATE_API_KEY) {
    replicate = new Replicate({
      auth: process.env.REPLICATE_API_KEY,
    });
  }
  
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  if (process.env.GOOGLE_VISION_API_KEY) {
    visionClient = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_VISION_API_KEY,
    });
  }
  
  filter = new badWords();
} catch (error) {
  console.log('Some API services not available:', error.message);
}

// Data storage
const dataDir = path.join(__dirname, 'data');
const galleryFile = path.join(dataDir, 'gallery.json');
const moderationLog = path.join(dataDir, 'moderation.json');
const sessionsFile = path.join(dataDir, 'sessions.json');

// Initialize data directories
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

if (!fs.existsSync(galleryFile)) {
  fs.writeFileSync(galleryFile, JSON.stringify([]));
}

if (!fs.existsSync(moderationLog)) {
  fs.writeFileSync(moderationLog, JSON.stringify([]));
}

if (!fs.existsSync(sessionsFile)) {
  fs.writeFileSync(sessionsFile, JSON.stringify({ timerDuration: 3, slideshowEnabled: true }));
}

// Network info function
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

// Content moderation functions
async function moderateText(text) {
  const violations = [];
  
  // Layer 1: Bad words filter
  if (filter.isProfane(text)) {
    violations.push('profanity');
  }
  
  // Layer 1: OpenAI moderation
  if (openai) {
    try {
      const moderation = await openai.moderations.create({ input: text });
      if (moderation.results[0].flagged) {
        violations.push('openai_flagged');
      }
    } catch (error) {
      console.log('OpenAI moderation failed:', error.message);
    }
  }
  
  return violations;
}

async function moderateImage(imageBase64) {
  if (!visionClient) return [];
  
  try {
    const [result] = await visionClient.safeSearchDetection(imageBase64);
    const violations = [];
    
    if (result.safeSearchAnnotation) {
      const { adult, violence, racy } = result.safeSearchAnnotation;
      if (adult === 'LIKELY' || adult === 'VERY_LIKELY') violations.push('adult_content');
      if (violence === 'LIKELY' || violence === 'VERY_LIKELY') violations.push('violence');
      if (racy === 'LIKELY' || racy === 'VERY_LIKELY') violations.push('racy_content');
    }
    
    return violations;
  } catch (error) {
    console.log('Vision moderation failed:', error.message);
    return [];
  }
}

function logModeration(entry) {
  const log = JSON.parse(fs.readFileSync(moderationLog, 'utf8'));
  log.push({ ...entry, timestamp: new Date().toISOString() });
  fs.writeFileSync(moderationLog, JSON.stringify(log.slice(-100), null, 2)); // Keep last 100 entries
}

// Enhanced API routes
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    apis: {
      replicate: !!replicate,
      openai: !!openai,
      vision: !!visionClient
    }
  });
});

// Network info endpoint
app.get('/api/network-info', (req, res) => {
  const localIP = getLocalIP();
  const port = process.env.PORT || 3000;
  res.json({
    ip: localIP,
    port: port,
    createUrl: `http://${localIP}:${port}/create`,
    displayUrl: `http://${localIP}:${port}/display`,
    adminUrl: `http://${localIP}:${port}/admin`
  });
});

// QR code generation endpoint
app.get('/api/qr-code/:url', async (req, res) => {
  try {
    const { url } = req.params;
    const qrDataUrl = await qrcode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#FFE500',
        light: '#0a0a0a'
      }
    });
    res.json({ qrCode: qrDataUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Text-to-graffiti AI endpoint
app.post('/api/text-to-graffiti', async (req, res) => {
  try {
    const { text, style } = req.body;
    
    if (!text || text.length > 40) {
      return res.status(400).json({ error: 'Text must be 1-40 characters' });
    }
    
    // Layer 1: Text moderation
    const violations = await moderateText(text);
    if (violations.length > 0) {
      logModeration({ type: 'text', content: text, violations });
      return res.status(400).json({ 
        error: "Let's keep it creative! Try something else 🎨",
        violations 
      });
    }
    
    if (!replicate) {
      // Fallback: return styled text using Google Fonts
      return res.json({
        success: true,
        fallback: true,
        data: {
          text: text,
          style: style,
          font: 'Rubik Dirt'
        }
      });
    }
    
    const prompt = `graffiti style lettering of '${text}', ${style} graffiti art, spray paint, urban street art, vibrant colors, black background, high detail, no background clutter`;
    
    const output = await replicate.run(
      "stability-ai/stable-diffusion",
      {
        input: {
          prompt: prompt,
          num_outputs: 1,
          num_inference_steps: 20,
          guidance_scale: 7.5,
          width: 512,
          height: 512
        }
      }
    );
    
    // Layer 2: Image moderation
    if (output && output[0]) {
      const violations = await moderateImage(output[0]);
      if (violations.length > 0) {
        logModeration({ type: 'ai_generated', content: text, violations });
        return res.status(400).json({ 
          error: "That design didn't pass our content check. Try a different idea!" 
        });
      }
    }
    
    res.json({
      success: true,
      data: output[0]
    });
    
  } catch (error) {
    console.error('Text-to-graffiti error:', error);
    res.status(500).json({ error: 'Failed to generate graffiti' });
  }
});

// AI Drawing Enhancement endpoint
app.post('/api/enhance-drawing', async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    
    if (!replicate) {
      return res.status(400).json({ 
        error: 'AI enhancement not available - API key missing' 
      });
    }
    
    const prompt = "graffiti street art style, spray paint, urban art, vibrant colors, detailed, professional graffiti mural";
    
    const output = await replicate.run(
      "stability-ai/stable-diffusion",
      {
        input: {
          prompt: prompt,
          image: image,
          num_outputs: 1,
          num_inference_steps: 20,
          guidance_scale: 7.5,
          strength: 0.7
        }
      }
    );
    
    // Layer 2: Image moderation
    if (output && output[0]) {
      const violations = await moderateImage(output[0]);
      if (violations.length > 0) {
        logModeration({ type: 'ai_enhancement', violations });
        return res.status(400).json({ 
          error: "Enhanced image didn't pass content check" 
        });
      }
    }
    
    res.json({
      success: true,
      enhanced: output[0]
    });
    
  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({ error: 'Failed to enhance drawing' });
  }
});

// Canvas snapshot moderation endpoint
app.post('/api/moderate-canvas', async (req, res) => {
  try {
    const { image, sessionId } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    
    const violations = await moderateImage(image);
    
    if (violations.length > 0) {
      logModeration({ type: 'canvas_snapshot', sessionId, violations });
      res.json({ 
        flagged: true,
        violations,
        action: violations.length > 1 ? 'block' : 'warn'
      });
    } else {
      res.json({ flagged: false });
    }
    
  } catch (error) {
    console.error('Canvas moderation error:', error);
    res.status(500).json({ error: 'Failed to moderate canvas' });
  }
});

// Session management endpoints
app.get('/api/sessions', (req, res) => {
  try {
    const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

app.post('/api/sessions', (req, res) => {
  try {
    const { timerDuration, slideshowEnabled } = req.body;
    const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
    
    if (timerDuration !== undefined) sessions.timerDuration = timerDuration;
    if (slideshowEnabled !== undefined) sessions.slideshowEnabled = slideshowEnabled;
    
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
    
    // Broadcast session updates
    io.emit('session:update', sessions);
    
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sessions' });
  }
});

// Admin endpoints
app.get('/api/admin/moderation-log', (req, res) => {
  try {
    const password = req.headers.authorization;
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const log = JSON.parse(fs.readFileSync(moderationLog, 'utf8'));
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load moderation log' });
  }
});

app.get('/api/admin/stats', (req, res) => {
  try {
    const password = req.headers.authorization;
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const gallery = loadGallery();
    const log = JSON.parse(fs.readFileSync(moderationLog, 'utf8'));
    const connectedUsers = io.sockets.sockets.size;
    
    res.json({
      totalArtworks: gallery.length,
      totalModerations: log.length,
      connectedUsers,
      serverUptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// Data storage (file-based for simplicity)
const dataDir = path.join(__dirname, 'data');
const galleryFile = path.join(dataDir, 'gallery.json');

// Initialize data directory and gallery file
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

if (!fs.existsSync(galleryFile)) {
  fs.writeFileSync(galleryFile, JSON.stringify([]));
}

// Gallery management
function loadGallery() {
  try {
    return JSON.parse(fs.readFileSync(galleryFile, 'utf8'));
  } catch (error) {
    return [];
  }
}

function saveGallery(gallery) {
  // Keep only last 50 artworks
  const limitedGallery = gallery.slice(-50);
  fs.writeFileSync(galleryFile, JSON.stringify(limitedGallery, null, 2));
  return limitedGallery;
}

// Simple gallery API routes
app.get('/api/gallery', (req, res) => {
  try {
    const gallery = loadGallery();
    gallery.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(gallery);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

app.post('/api/gallery', (req, res) => {
  try {
    const { image, nickname, timestamp } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    
    const gallery = loadGallery();
    const newArtwork = {
      id: Date.now().toString(),
      image,
      nickname: nickname || 'Anonymous',
      timestamp: timestamp || new Date().toISOString(),
    };
    
    gallery.push(newArtwork);
    saveGallery(gallery);
    
    // Broadcast to display screens
    io.emit('artwork:display', newArtwork);
    
    res.status(201).json(newArtwork);
  } catch (error) {
    console.error('Error adding artwork:', error);
    res.status(500).json({ error: 'Failed to add artwork' });
  }
});

app.delete('/api/gallery/:id', (req, res) => {
  try {
    const gallery = loadGallery();
    const filteredGallery = gallery.filter(art => art.id !== req.params.id);
    
    if (gallery.length === filteredGallery.length) {
      return res.status(404).json({ error: 'Artwork not found' });
    }
    
    saveGallery(filteredGallery);
    res.json({ success: true, message: 'Artwork deleted successfully' });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    res.status(500).json({ error: 'Failed to delete artwork' });
  }
});

// Enhanced Socket.IO events
let connectedUsers = 0;
let userSessions = new Map();

io.on('connection', (socket) => {
  connectedUsers++;
  console.log('User connected:', socket.id, 'Total users:', connectedUsers);
  
  // Broadcast user count to admin
  io.emit('user:count', connectedUsers);
  
  // User session management
  const sessionId = socket.id;
  userSessions.set(sessionId, {
    connectedAt: new Date().toISOString(),
    warnings: 0,
    blocked: false
  });
  
  // Display connection
  socket.on('display:connect', () => {
    const gallery = loadGallery();
    socket.emit('gallery:update', gallery);
    socket.join('displays');
  });
  
  // Creator connection
  socket.on('creator:connect', () => {
    socket.join('creators');
    
    // Send session settings
    const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
    socket.emit('session:update', sessions);
  });
  
  // Enhanced artwork submission with moderation
  socket.on('artwork:submit', async (data) => {
    try {
      const { image, nickname, sessionId } = data;
      
      // Layer 3: Canvas snapshot moderation
      const violations = await moderateImage(image);
      if (violations.length > 0) {
        const session = userSessions.get(sessionId);
        if (session) {
          session.warnings++;
          
          if (session.warnings >= 2) {
            session.blocked = true;
            socket.emit('canvas:blocked', { duration: 60000 }); // 60 seconds
            logModeration({ type: 'canvas_blocked', sessionId, violations });
          } else {
            socket.emit('canvas:warning', { message: 'Content warning issued' });
            logModeration({ type: 'canvas_warning', sessionId, violations });
          }
        }
        return;
      }
      
      const gallery = loadGallery();
      const newArtwork = {
        id: Date.now().toString(),
        image,
        nickname: nickname || 'Anonymous',
        timestamp: new Date().toISOString(),
        sessionId
      };
      
      gallery.push(newArtwork);
      saveGallery(gallery);
      
      // Broadcast to all display screens with animation
      io.to('displays').emit('artwork:display', newArtwork);
      
      // Acknowledge submission
      socket.emit('artwork:submitted', { success: true, id: newArtwork.id });
      
      // Update admin gallery
      io.emit('gallery:update', gallery);
      
    } catch (error) {
      console.error('Artwork submission error:', error);
      socket.emit('artwork:submitted', { success: false, error: 'Submission failed' });
    }
  });
  
  // Admin controls
  socket.on('admin:connect', (password) => {
    if (password === process.env.ADMIN_PASSWORD) {
      socket.join('admins');
      socket.emit('admin:authenticated', true);
      
      // Send admin data
      const gallery = loadGallery();
      const log = JSON.parse(fs.readFileSync(moderationLog, 'utf8'));
      const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
      
      socket.emit('admin:data', {
        gallery,
        moderationLog: log,
        sessions,
        connectedUsers
      });
    } else {
      socket.emit('admin:authenticated', false);
    }
  });
  
  socket.on('display:clear', () => {
    if (socket.rooms.has('admins')) {
      io.to('displays').emit('display:clear');
      io.emit('display:cleared', { timestamp: new Date().toISOString() });
    }
  });
  
  socket.on('artwork:delete', (artworkId) => {
    if (socket.rooms.has('admins')) {
      const gallery = loadGallery();
      const filteredGallery = gallery.filter(artwork => artwork.id !== artworkId);
      
      if (gallery.length !== filteredGallery.length) {
        saveGallery(filteredGallery);
        io.emit('gallery:update', filteredGallery);
        io.to('displays').emit('artwork:removed', artworkId);
      }
    }
  });
  
  socket.on('artwork:push', (artworkId) => {
    if (socket.rooms.has('admins')) {
      const gallery = loadGallery();
      const artwork = gallery.find(art => art.id === artworkId);
      
      if (artwork) {
        io.to('displays').emit('artwork:display', artwork);
      }
    }
  });
  
  // Session timer controls
  socket.on('timer:start', (duration) => {
    if (socket.rooms.has('admins')) {
      const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
      sessions.timerDuration = duration;
      fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
      
      io.to('creators').emit('timer:start', duration);
      io.emit('session:update', sessions);
    }
  });
  
  socket.on('slideshow:toggle', (enabled) => {
    if (socket.rooms.has('admins')) {
      const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
      sessions.slideshowEnabled = enabled;
      fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
      
      io.to('displays').emit('slideshow:toggle', enabled);
      io.emit('session:update', sessions);
    }
  });
  
  // Timer countdown events
  socket.on('timer:tick', (timeRemaining) => {
    socket.to('creators').emit('timer:tick', timeRemaining);
  });
  
  socket.on('timer:expired', () => {
    // Auto-submit current artwork if any
    socket.to('creators').emit('timer:expired');
    io.to('admins').emit('timer:expired');
  });
  
  // Gallery slideshow
  socket.on('gallery:next', () => {
    const gallery = loadGallery();
    if (gallery.length > 0) {
      const randomArtwork = gallery[Math.floor(Math.random() * gallery.length)];
      io.to('displays').emit('artwork:display', randomArtwork);
    }
  });
  
  socket.on('disconnect', () => {
    connectedUsers--;
    userSessions.delete(sessionId);
    console.log('User disconnected:', socket.id, 'Total users:', connectedUsers);
    
    // Broadcast updated user count
    io.emit('user:count', connectedUsers);
  });
});

// Serve static files from client build
app.use(express.static(path.join(__dirname, '../client/dist')));

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Bind to all interfaces
server.listen(PORT, HOST, () => {
  console.log(`AI Graffiti Wall server running on port ${PORT}`);
  console.log(`Application: http://localhost:${PORT}`);
  console.log(`External Access: http://10.5.9.139:${PORT}`);
  console.log(`API Status: http://localhost:${PORT}/api/status`);
  console.log(`Gallery API: http://localhost:${PORT}/api/gallery`);
});
