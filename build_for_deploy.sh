#!/bin/bash

# Stop on error
set -e

echo "🚀 Starting Deployment Build Process..."

# 1. Build Frontend
echo "📦 Building Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
npm run build
cd ..

echo "✅ Frontend Build Complete!"
echo ""
echo "📂 Build artifacts are located in: frontend/dist"
echo ""
echo "🚀 To run the Web Server (Production Mode):"
echo "   cd backend"
echo "   source venv/bin/activate  # If using venv"
echo "   uvicorn main:app --host 0.0.0.0 --port 8000"
echo ""
echo "   Then access: http://localhost:8000"
