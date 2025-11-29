#!/bin/bash
# Complete System Startup Script

echo "🚀 Starting Diabetic Retinopathy Detection System..."
echo ""

# Check if conda is available
if ! command -v conda &> /dev/null; then
    echo "❌ Error: conda not found. Please install Anaconda/Miniconda first."
    exit 1
fi

# Start backend in background
echo "📡 Starting Backend Server..."
cd /home/koushikvardhan/Desktop/pro/backend
conda run -n dr_project uvicorn main:app --reload &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "   Waiting for backend to initialize..."
sleep 5

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running on http://localhost:8000"
else
    echo "   ⚠️  Backend may still be starting..."
fi

# Start frontend
echo ""
echo "🎨 Starting Frontend..."
cd /home/koushikvardhan/Desktop/pro/frontend
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ System Started!"
echo ""
echo "📍 Access Points:"
echo "   Backend API:  http://localhost:8000"
echo "   Frontend App: http://localhost:5173"
echo "   API Docs:     http://localhost:8000/docs"
echo ""
echo "🛑 To stop all servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📝 Logs:"
echo "   Backend:  Check terminal output"
echo "   Frontend: Check terminal output"
echo ""

# Keep script running
wait
