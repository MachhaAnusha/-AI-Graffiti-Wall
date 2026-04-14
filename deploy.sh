#!/bin/bash

# AI Graffiti Wall Deployment Script

echo "Starting deployment of AI Graffiti Wall..."

# Build client
echo "Building client for production..."
cd client
npm run build

# Install server dependencies
echo "Installing server dependencies..."
cd ../server
npm install

# Create data directory
echo "Creating data directory..."
mkdir -p data

# Set production environment
export NODE_ENV=production

# Start server
echo "Starting server in production mode..."
npm start
