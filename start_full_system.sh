#!/bin/bash
echo "🚀 Starting Full Food & Beverage Management System..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "Starting backend API..."
cd Api
dotnet run &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 5

# Start frontend in background
echo "Starting frontend React app..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ System started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5152"
echo "📊 API Documentation: http://localhost:5152/swagger"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait
