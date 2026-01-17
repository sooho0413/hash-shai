#!/bin/bash

# Function to kill processes on exit
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID
    exit
}

trap cleanup INT TERM

echo "Starting Backend..."
cd backend
source venv/bin/activate
# Start backend in background using python module
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Backend started with PID $BACKEND_PID"

echo "Starting Frontend..."
cd ../frontend
npm run dev -- --host &
FRONTEND_PID=$!

echo "Frontend started with PID $FRONTEND_PID"

echo "Services are running. Access the app at http://localhost:5173"
echo "Press Ctrl+C to stop."

wait
