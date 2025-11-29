#!/bin/bash

echo "🚀 Starting Diabetic Retinopathy Detection System..."

# Check if backend dependencies are installed
if [ ! -d "backend/venv" ]; then
    echo "📦 Setting up backend virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/venv" ]; then
    echo "📦 Setting up frontend virtual environment..."
    cd frontend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
fi

# Start backend in background
echo "🔧 Starting FastAPI backend..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
deactivate
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start frontend
echo "🎨 Starting Streamlit frontend..."
cd frontend
source venv/bin/activate
streamlit run app.py

# Cleanup on exit
kill $BACKEND_PID
