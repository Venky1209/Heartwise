# 🤖 AI-Powered Diet Recommendation System - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Get OpenAI API Key (2 minutes)
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. Keep it safe!

### Step 2: Setup ML Service (3 minutes)
```bash
# Navigate to ml-service folder
cd "/Users/gugank/New Idea/heartwise-ecg/ml-service"

# Run the automated setup script
./setup-ai-diet.sh

# When prompted, paste your OpenAI API key
```

### Step 3: Start the Services
```bash
# Terminal 1: Start ML Service
cd "/Users/gugank/New Idea/heartwise-ecg/ml-service"
./start-ml-service.sh

# Terminal 2: Start Backend (if not running)
cd "/Users/gugank/New Idea/heartwise-ecg/backend"
npm start

# Terminal 3: Start Frontend (if not running)
cd "/Users/gugank/New Idea/heartwise-ecg/frontend"
npm start
```

## 🎯 What You Get

### ✨ AI-Powered Features
- **ECG Timeline Analysis**: AI analyzes your last 30 days of ECG readings
- **Personalized Meal Plans**: Custom meals based on your conditions
- **Smart Recommendations**: Considers medications, heart rate trends, abnormalities
- **Grocery Lists**: Automatically generated shopping lists
- **Eating Out Tips**: How to maintain your diet when dining out
- **Recipe Suggestions**: Heart-healthy recipes tailored to you

### 📊 Data Used for AI Analysis
1. **Medical History**:
   - Hypertension, diabetes, cholesterol
   - Previous cardiac events
   - Current conditions

2. **ECG Timeline** (Last 30 days):
   - Heart rate trends (increasing/decreasing/stable)
   - Abnormality frequency
   - Most common classifications

3. **Medications**:
   - Current prescriptions
   - Drug classes
   - Interaction awareness

4. **Lifestyle**:
   - Exercise frequency
   - Alcohol consumption
   - Current diet type

## 🖥️ How to Use

### Option 1: Via Frontend UI
1. Open browser: http://localhost:3000
2. Log in to your account
3. Go to "AI Diet Plan" menu
4. Click "Generate AI Recommendations"
5. See personalized plan instantly!

### Option 2: Via API
```bash
# Get AI diet recommendations
curl -X GET http://localhost:5001/api/diet/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get rule-based recommendations (no AI)
curl -X GET http://localhost:5001/api/diet/recommendations?ai=false \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Option 3: Direct ML Service
```bash
curl -X POST http://localhost:5002/diet/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "age": 55,
      "gender": "male",
      "height_cm": 175,
      "weight_kg": 85
    },
    "medical_history": {
      "has_hypertension": true,
      "has_diabetes": false
    },
    "medications": [],
    "ecg_timeline": [
      {
        "predictions": {
          "heart_rate": 75,
          "classification": "Normal"
        }
      }
    ]
  }'
```

## 💰 Cost Breakdown

### OpenAI Pricing (gpt-4o-mini)
- **Input tokens**: $0.15 per 1M tokens
- **Output tokens**: $0.60 per 1M tokens

### Per Recommendation Cost
- Average tokens per request: ~1,000 input, ~1,500 output
- **Cost per recommendation**: ~$0.0001 (1/100th of a cent)

### Monthly Cost Estimates
| Users/Day | Requests/Month | Monthly Cost |
|-----------|----------------|--------------|
| 10        | 300            | $0.03        |
| 100       | 3,000          | $0.30        |
| 1,000     | 30,000         | $3.00        |
| 10,000    | 300,000        | $30.00       |

**Conclusion**: Essentially free for small to medium deployments!

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Required
OPENAI_API_KEY=sk-your-key-here

# Optional (with defaults)
AI_MODEL=gpt-4o-mini              # Model to use
AI_TIMEOUT_SECONDS=30             # Request timeout
AI_MAX_TOKENS=2000                # Max response length
AI_TEMPERATURE=0.7                # Creativity (0-1)
ENABLE_AI_DIET=true               # Feature flag
```

### Changing AI Models
Edit `ml-service/diet_recommender.py`:
```python
# Line 205
model="gpt-4o-mini",  # Change to:
# - "gpt-4o" (more powerful, more expensive)
# - "gpt-3.5-turbo" (cheaper, faster)
```

## 🐛 Troubleshooting

### Problem: AI not working
```bash
# Check ML service is running
curl http://localhost:5002/health

# Expected response:
# {"status": "healthy", "service": "HeartWise ML Analysis", ...}
```

### Problem: Invalid API key
```bash
# Verify API key is set
cd ml-service
cat .env | grep OPENAI_API_KEY

# Should NOT be: your_openai_api_key_here
```

### Problem: Port 5002 in use
```bash
# Kill existing process
lsof -ti:5002 | xargs kill

# Restart ML service
./start-ml-service.sh
```

### Problem: Backend can't reach ML service
Edit `backend/.env`:
```bash
ML_SERVICE_URL=http://localhost:5002
```

## 📈 Monitoring & Logs

### View ML Service Logs
```bash
cd ml-service
python app.py
# Watch console for:
# - "AI recommendations generated successfully" ✅
# - "AI service error" ⚠️
```

### Check Backend Logs
```bash
cd backend
npm start
# Look for:
# - "Requesting AI-powered diet recommendations" 🤖
# - "AI recommendations generated successfully" ✅
```

## 🎨 Frontend Pages

### 1. AI Diet Recommendations
- **Route**: `/ai-diet`
- **Features**: Full AI-powered plan with ECG insights
- **Components**: Meal plans, grocery lists, personalized tips

### 2. Standard Diet Recommendations  
- **Route**: `/diet`
- **Features**: Rule-based recommendations
- **Fallback**: Always available

## 🔐 Privacy & Security

### Data Handling
- ✅ All data encrypted in transit (HTTPS)
- ✅ OpenAI does NOT store data for >30 days
- ✅ No data used for model training (opt-out)
- ✅ HIPAA-compliant with BAA (Enterprise plan)

### Local Alternative (Privacy-First)
For maximum privacy, use local LLM:
```bash
# Install Ollama
brew install ollama

# Download Llama 3
ollama pull llama3

# Update diet_recommender.py to use local model
# (See AI_DIET_SYSTEM.md for instructions)
```

## 🚀 Advanced Features

### A/B Testing Different Models
```python
# Compare gpt-4o vs gpt-3.5-turbo
# Track which gives better user satisfaction
```

### Multi-Language Support
```python
# Add language parameter
prompt += f"\nPlease respond in {language}"
```

### Cultural Diet Preferences
```python
# Add to context
"dietary_culture": "Mediterranean" / "Indian" / "Asian"
```

### Integration with Meal Delivery APIs
```python
# Send grocery list to DoorDash/Instacart API
```

## 📚 Additional Resources

- **Full Documentation**: `AI_DIET_SYSTEM.md`
- **OpenAI Docs**: https://platform.openai.com/docs
- **Flask Docs**: https://flask.palletsprojects.com/
- **React Docs**: https://react.dev/

## 🎯 Next Steps

1. ✅ Complete the 5-minute setup above
2. ✅ Test with your own profile
3. ✅ Invite beta users for feedback
4. 🚀 Deploy to production
5. 📊 Monitor usage and costs
6. 💡 Add custom features

## 💬 Support

Need help? Check:
1. This README
2. `AI_DIET_SYSTEM.md` (detailed docs)
3. Console logs in ML service
4. Backend API responses

## 🎉 You're All Set!

Your AI-powered diet recommendation system is ready to analyze ECG timelines and generate personalized nutrition plans!

**Test it now**:
```bash
# Start services
./ml-service/start-ml-service.sh

# Open browser
http://localhost:3000/ai-diet
```

Enjoy! 🥗💚🤖
