#!/bin/bash

# HeartWise AI Diet Recommendation Setup Script
# This script sets up the AI-powered diet recommendation system

echo "🚀 HeartWise AI Diet Recommendation Setup"
echo "=========================================="
echo ""

# Check if we're in the ml-service directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: Please run this script from the ml-service directory"
    echo "   cd ml-service && ./setup-ai-diet.sh"
    exit 1
fi

# Step 1: Check Python version
echo "📋 Step 1: Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "   Python version: $python_version"

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi
echo "✅ Python is installed"
echo ""

# Step 2: Create virtual environment (recommended)
echo "📋 Step 2: Setting up virtual environment..."
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi
echo ""

# Step 3: Activate virtual environment
echo "📋 Step 3: Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Step 4: Install dependencies
echo "📋 Step 4: Installing Python dependencies..."
echo "   This may take a few minutes..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ All dependencies installed successfully"
else
    echo "⚠️  Some dependencies may have failed to install"
    echo "   Try running: pip install openai python-dotenv"
fi
echo ""

# Step 5: Setup environment variables
echo "📋 Step 5: Setting up environment variables..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo ""
    echo "⚠️  IMPORTANT: You need to add your OpenAI API key!"
    echo ""
    echo "   1. Go to: https://platform.openai.com/api-keys"
    echo "   2. Sign up / Log in"
    echo "   3. Create a new API key"
    echo "   4. Copy the key (starts with 'sk-')"
    echo "   5. Edit ml-service/.env and replace 'your_openai_api_key_here'"
    echo ""
    read -p "Press Enter when you have your API key ready..."
    
    # Open editor to add API key
    if command -v nano &> /dev/null; then
        echo "   Opening nano editor..."
        nano .env
    elif command -v vim &> /dev/null; then
        echo "   Opening vim editor..."
        vim .env
    elif command -v code &> /dev/null; then
        echo "   Opening VS Code..."
        code .env
    else
        echo "   Please manually edit: ml-service/.env"
    fi
else
    echo "✅ .env file already exists"
    
    # Check if API key is set
    if grep -q "your_openai_api_key_here" .env; then
        echo "⚠️  WARNING: OpenAI API key not set!"
        echo "   Please edit .env file and add your API key"
    else
        echo "✅ OpenAI API key appears to be configured"
    fi
fi
echo ""

# Step 6: Test the setup
echo "📋 Step 6: Testing the setup..."
python3 -c "
import sys
try:
    from openai import OpenAI
    print('✅ OpenAI package imported successfully')
except ImportError as e:
    print(f'❌ Error importing OpenAI: {e}')
    sys.exit(1)

try:
    from diet_recommender import DietRecommender
    print('✅ DietRecommender module loaded successfully')
except ImportError as e:
    print(f'❌ Error importing DietRecommender: {e}')
    sys.exit(1)

# Test with dummy data
recommender = DietRecommender()
if recommender.ai_enabled:
    print('✅ AI recommendations enabled')
else:
    print('⚠️  AI recommendations disabled (API key not set)')
    print('   System will use rule-based recommendations')
"

if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed. Please check the errors above."
    exit 1
fi
echo ""

# Step 7: Instructions to start
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Make sure your OpenAI API key is set in .env"
echo ""
echo "2. Start the ML service:"
echo "   cd /Users/gugank/New\ Idea/heartwise-ecg/ml-service"
echo "   source venv/bin/activate"
echo "   python app.py"
echo ""
echo "3. The ML service will run on: http://localhost:5002"
echo ""
echo "4. Test the AI diet endpoint:"
echo "   curl http://localhost:5002/health"
echo ""
echo "5. Your backend will automatically use the AI service at:"
echo "   http://localhost:5001/api/diet/recommendations"
echo ""
echo "💰 Cost Estimate:"
echo "   ~$0.0001 per recommendation (essentially free)"
echo "   100 users/day = $3.65/year"
echo ""
echo "📚 Documentation:"
echo "   See AI_DIET_SYSTEM.md for full details"
echo ""
echo "🎉 Happy coding!"
