#!/bin/bash
# Frontend Deployment Script for Don Paolo Restaurant Management System

set -e

echo "🚀 Starting Frontend Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed. Installing..."
    npm install -g netlify-cli
fi

# Configuration
FRONTEND_DIR="frontend"
BUILD_DIR="build"

# Navigate to frontend directory
cd $FRONTEND_DIR

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production not found. Creating template...${NC}"
    cat > .env.production << EOF
REACT_APP_API_URL=https://donpaolo-api.azurewebsites.net
EOF
    echo "📝 Please update .env.production with your API URL"
    echo ""
fi

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
npm install

# Build
echo -e "${GREEN}🏗️  Building production bundle...${NC}"
npm run build

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build failed! Build directory not found."
    exit 1
fi

# Deploy to Netlify
echo -e "${GREEN}☁️  Deploying to Netlify...${NC}"
netlify deploy --prod --dir=$BUILD_DIR

echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
echo ""
echo "🌐 Your frontend is available at the URL shown above"
echo ""
echo "📝 Make sure to:"
echo "   1. Set REACT_APP_API_URL in Netlify environment variables"
echo "   2. Configure custom domain (optional)"
echo "   3. Enable HTTPS (automatic with Netlify)"

