#!/bin/bash

# Quick Start Script for ML Service with AI Diet Recommendations
# Run this after setup-ai-diet.sh

echo "🚀 Starting HeartWise ML Service with AI Diet Recommendations"
echo "=============================================================="
echo ""

# Check if we're in the ml-service directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: Please run this script from the ml-service directory"
    echo "   cd ml-service && ./start-ml-service.sh"
    exit 1
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "⚠️  No virtual environment found. Using system Python."
    echo "   Tip: Run ./setup-ai-diet.sh first"
fi
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  WARNING: .env file not found!"
    echo "   Creating from template..."
    cp .env.example .env
    echo "   Please edit .env and add your OpenAI API key"
    echo ""
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if API key is set
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ]; then
    echo "⚠️  OpenAI API key not set!"
    echo "   AI diet recommendations will be DISABLED"
    echo "   System will use rule-based recommendations instead"
    echo ""
    echo "   To enable AI:"
    echo "   1. Get API key from: https://platform.openai.com/api-keys"
    echo "   2. Edit .env file: nano .env"
    echo "   3. Replace 'your_openai_api_key_here' with your key"
    echo "   4. Restart this script"
    echo ""
    read -p "Press Enter to continue with rule-based recommendations..."
else
    echo "✅ OpenAI API key detected"
    echo "🤖 AI diet recommendations ENABLED"
fi
echo ""

# Check port availability
if lsof -Pi :5002 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 5002 is already in use!"
    echo "   Killing existing process..."
    kill $(lsof -t -i:5002)
    sleep 2
fi

# Start the ML service
echo "🚀 Starting ML Service on http://localhost:5002"
echo "=============================================================="
echo ""
echo "📊 Available Endpoints:"
echo "   - Health Check:      http://localhost:5002/health"
echo "   - Analyze ECG:       POST http://localhost:5002/analyze"
echo "   - AI Diet Recommend: POST http://localhost:5002/diet/recommend"
echo ""
echo "📝 Logs will appear below..."
echo "   Press Ctrl+C to stop"
echo ""
echo "=============================================================="
echo ""

# Run the Flask app
python app.py
