#!/bin/bash

# AI Lab Deployment Script
echo "🚀 Starting AI Lab deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Push database schema
echo "💾 Pushing database schema..."
npm run db:push

echo "✅ Deployment preparation complete!"
echo "🌐 Ready for production deployment"