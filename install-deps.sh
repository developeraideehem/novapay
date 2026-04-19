#!/bin/bash

# NovaPay Dependency Installation Script
set -e

echo "🚀 Installing NovaPay Dependencies..."
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

# Install web dependencies
echo "📦 Installing web dependencies..."
cd ../web
npm install
echo "✅ Web dependencies installed"
echo ""

echo "🎉 All dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Update Supabase Service Key in backend/.env"
echo "2. Apply database migrations in Supabase"
echo "3. Run 'npm run dev' in backend folder to start the API"
echo "4. Run 'npm run dev' in web folder to start the frontend"
