# AI Graffiti Wall Deployment Guide

## Quick Deployment Options

### Option 1: GitHub Pages (Frontend Only) - Fastest

1. **Deploy Frontend to GitHub Pages:**
   ```bash
   cd client
   npm run build
   git checkout --orphan gh-pages
   cp -r dist/* .
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages
   ```

2. **Access:** `https://MachhaAnusha.github.io/-AI-Graffiti-Wall/`

3. **Backend:** Deploy separately (see Option 3)

### Option 2: Vercel (Full Stack) - Recommended

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Configure:**
   - Root directory: `.`
   - Build command: `npm run build`
   - Start command: `npm start`
   - Add environment variables

### Option 3: Railway (Full Stack) - Easiest

1. **Go to [railway.app](https://railway.app)**
2. **Connect GitHub repository**
3. **Select `AI-Graffiti-Wall` repository**
4. **Auto-deploy from master branch**
5. **Add environment variables**

### Option 4: Self-Hosted (VPS)

1. **On your server:**
   ```bash
   git clone https://github.com/MachhaAnusha/-AI-Graffiti-Wall.git
   cd AI-Graffiti-Wall
   npm install
   npm run build
   npm start
   ```

2. **Use PM2 for production:**
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name "ai-graffiti-wall"
   ```

## Environment Variables

Add these to your hosting platform:

```env
REPLICATE_API_KEY=your_replicate_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here
ADMIN_PASSWORD=admin123
PORT=3000
NODE_ENV=production
```

## Testing Your Deployment

After deployment, test these URLs:
- `/` - Home/Creator View
- `/display` - Display View
- `/admin` - Admin Panel (password: admin123)
- `/api/status` - API Status

## Troubleshooting

- **Socket.IO Issues:** Ensure WebSocket support on hosting platform
- **Canvas Issues:** Check browser compatibility
- **API Errors:** Verify environment variables
- **Build Failures:** Check Node.js version (18.x)

## Support

For deployment issues:
1. Check the logs in your hosting platform
2. Verify all environment variables
3. Ensure Node.js 18.x is available
4. Check that all dependencies are installed
