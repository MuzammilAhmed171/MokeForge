#!/bin/bash

# ===========================================
# MockForge Setup Script
# ===========================================
# This script will help you setup MockForge
# Run: bash setup.sh

echo "🎨 MockForge Setup Script"
echo "========================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install
echo "✅ Frontend dependencies installed"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..
echo "✅ Backend dependencies installed"
echo ""

# Setup environment files
echo "🔧 Setting up environment files..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env and add your VITE_API_URL"
else
    echo "ℹ️  .env file already exists"
fi

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env file"
    echo "⚠️  Please edit backend/.env and add:"
    echo "   - MONGODB_URI (from MongoDB Atlas)"
    echo "   - JWT_SECRET (generate strong random string)"
    echo "   - SMTP_USER (your Gmail)"
    echo "   - SMTP_PASS (Google App Password)"
    echo "   - FRONTEND_URL (your frontend URL)"
else
    echo "ℹ️  backend/.env file already exists"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Setup MongoDB Atlas:"
echo "   - Go to https://www.mongodb.com/cloud/atlas"
echo "   - Create free cluster"
echo "   - Get connection string"
echo "   - Add to backend/.env as MONGODB_URI"
echo ""
echo "2. Setup Google SMTP:"
echo "   - Enable 2FA on your Google account"
echo "   - Generate App Password"
echo "   - Add to backend/.env as SMTP_USER and SMTP_PASS"
echo ""
echo "3. Start development servers:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd backend && npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   npm run dev"
echo ""
echo "4. Visit http://localhost:5173"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""
echo "✅ Setup complete!"
