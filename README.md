# AI Graffiti Wall

A full-stack AI-powered interactive graffiti wall web application designed for public events and installations. Create digital graffiti artwork with AI enhancement and real-time display synchronization.

## Features

### Creator View (/create)
- Full drawing canvas with 16:9 aspect ratio
- Multiple brush types (Freehand, Spray, Marker, Chalk, Drip, Eraser)
- Color picker with graffiti palettes and neon glow effects
- Background textures (Brick, Concrete, Metal, Wood, etc.)
- Text-to-graffiti AI generation
- Touch-friendly for phones, tablets, and desktop
- Session timer with countdown
- Download and share functionality

### Display View (/display)
- Full-screen artwork display
- Real-time synchronization via Socket.IO
- Animated spray-paint reveal effects
- Gallery slideshow mode (auto-rotates when idle)
- QR code for audience participation
- Keyboard controls (F: fullscreen, N: next, G: gallery, Q: QR)

### Admin View (/admin)
- Password-protected admin panel
- Gallery management and moderation
- Display controls (clear, slideshow toggle)
- Session timer configuration
- Artwork statistics and analytics
- Content moderation log

### Content Moderation
- Multi-layer moderation system
- Text moderation (local filter + OpenAI API)
- Image moderation (Google Vision API)
- Canvas snapshot checking
- Admin override controls

## Tech Stack

- **Frontend**: React 18 + Vite 4 + TailwindCSS 3
- **Canvas**: Fabric.js for drawing functionality
- **Backend**: Node.js + Express + Socket.IO
- **AI Integration**: Ready for Replicate API, OpenAI API, Google Vision API
- **Storage**: File-based JSON (easily upgradeable)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/MachhaAnusha/-AI-Graffiti-Wall.git
cd AI-Graffiti-Wall
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

4. **Set up environment variables**

**Server** (`server/.env`):
```env
REPLICATE_API_KEY=your_replicate_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here
ADMIN_PASSWORD=admin123
PORT=3000
```

**Client** (`client/.env`):
```env
VITE_SERVER_URL=http://localhost:3000
VITE_ADMIN_PASSWORD=admin123
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_GOOGLE_VISION_API_KEY=your_google_vision_api_key_here
```

### Running the Application

1. **Start the server** (in `server/` directory):
```bash
npm start
```

2. **Start the client** (in `client/` directory):
```bash
npm run dev
```

3. **Access the application**:
- Creator View: http://localhost:5173/create
- Display View: http://localhost:5173/display  
- Admin View: http://localhost:5173/admin (password: admin123)

### API Keys Setup

#### 1. Replicate API (for AI image generation)
1. Go to [Replicate](https://replicate.com/)
2. Sign up and get your API token
3. Add it to `REPLICATE_API_KEY`

#### 2. OpenAI API (for text moderation)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add it to `OPENAI_API_KEY`

#### 3. Google Vision API (for image moderation)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Cloud Vision API
3. Create API credentials
4. Add it to `GOOGLE_VISION_API_KEY`

## Usage Guide

### For Event Setup

1. **Display Setup**:
   - Open `/display` on the projector or LED screen
   - Press `F` to enter fullscreen mode
   - The QR code will be visible for audience scanning

2. **Creator Devices**:
   - Participants scan QR code or go to `/create`
   - Works on phones, tablets, and laptops
   - Touch-optimized for mobile devices

3. **Admin Monitoring**:
   - Access `/admin` with your admin password
   - Monitor submitted artwork
   - Remove inappropriate content
   - Control display settings

### Network Configuration

For multi-device usage on the same network:

1. **Find your local IP**:
```bash
# On Windows
ipconfig

# On Mac/Linux  
ifconfig
```

2. **Update client environment**:
```env
VITE_SERVER_URL=http://YOUR_LOCAL_IP:3000
```

3. **Connect devices**:
- All devices must be on the same WiFi network
- Use the local IP address instead of localhost
- Ensure firewall allows connections on port 3000

## Features in Detail

### Brush Types
- **Freehand**: Standard drawing brush
- **Spray**: Simulates aerosol spray paint effect
- **Marker**: Marker-like strokes
- **Chalk**: Chalk texture effect
- **Drip**: Paint drip effect
- **Eraser**: Remove drawn content

### Graffiti Styles
- **Bubble**: Rounded, bubbly letters
- **Wildstyle**: Complex, interlocking letters
- **Block**: Bold, square letters
- **Tag**: Quick, signature style
- **Stencil**: Clean, cut-out style

### Background Textures
- **Brick**: Classic brick wall texture
- **Concrete**: Urban concrete surface
- **Metal**: Industrial metal sheet
- **Wood**: Wooden plank texture
- **Black/White**: Solid colors

## API Endpoints

### Gallery
- `GET /api/gallery` - Get all artworks
- `POST /api/gallery` - Add new artwork
- `DELETE /api/gallery/:id` - Delete artwork

### Socket.IO Events
- `artwork:submit` - Submit new artwork
- `artwork:display` - Display artwork
- `artwork:delete` - Delete artwork
- `display:clear` - Clear display
- `gallery:update` - Update gallery

## Troubleshooting

### Common Issues

1. **Socket Connection Issues**:
   - Check that server is running on port 3000
   - Verify firewall settings
   - Ensure correct VITE_SERVER_URL

2. **API Key Errors**:
   - Verify all API keys are correctly set
   - Check API key permissions and quotas
   - Ensure billing is set up for paid services

3. **Canvas Not Loading**:
   - Check browser console for errors
   - Ensure Fabric.js is loaded correctly
   - Try refreshing the page

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

**Created with for interactive digital art experiences**
