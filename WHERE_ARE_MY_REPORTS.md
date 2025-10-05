# 📊 How to Access Your ECG Reports

## Current Status ✅

Your system is now running with:
- ✅ **Backend**: Running on port 5001 with 60s timeout
- ✅ **ML Service**: Running on port 5002 with enhanced analyzer
- ✅ **Frontend**: Available at http://localhost:3000
- ✅ **Downsampling**: Large datasets (>5000 points) automatically reduced for faster analysis

## 🎯 Where to Find Your Reports

### Option 1: Weekly Summary (RECOMMENDED)
**URL**: http://localhost:3000/weekly-summary

This shows:
- ✅ All your ECG sessions grouped by week
- ✅ Daily health trends with charts
- ✅ Average heart rate, HRV metrics
- ✅ Health status with color coding
- ✅ **"View Report" button** for each session

**Steps**:
1. Go to **Weekly Summary** from left menu
2. Click on any day to expand sessions
3. Click **"View Report"** button next to any session
4. See full ECG analysis with waveform

### Option 2: Analysis Page (Current Page)
**URL**: http://localhost:3000/analysis/41d23988-1c72-4e27-803b-b77d581f2e06

This page shows:
- List of all ECG sessions
- Data points count for each session
- **"Analyze" button** to run new analysis

**What to do now**:
1. Click the **"Analyze"** button next to any session
2. Wait 10-30 seconds for analysis (larger datasets take longer)
3. You'll see results appear on the page
4. Results are also saved to database

### Option 3: Sessions Page → Session Detail
**URL**: http://localhost:3000/sessions

**Steps**:
1. Click **"Sessions"** from left menu
2. Find your session in the list
3. Click on the session to see details
4. Click **"Analyze"** or **"View Report"**

### Option 4: Direct Report URL
If you have a session ID, go directly to:
**URL**: http://localhost:3000/report/[SESSION_ID]

Example:
http://localhost:3000/report/41d23988-1c72-4e27-803b-b77d581f2e06

## 📋 Your Available Sessions

Based on what I see in your screenshot:

| Session Date | Data Points | Session ID (partial) | Action |
|-------------|-------------|---------------------|---------|
| Oct 05, 2025 11:44 | 6961 | 41d23988... | Click "Analyze" |
| Oct 05, 2025 11:43 | 1027 | ... | Click "Analyze" |
| Oct 05, 2025 11:42 | 2264 | ... | Click "Analyze" |
| Oct 05, 2025 10:59 | 7143 | ... | Click "Analyze" |
| Oct 04, 2025 21:52 | 6800 | ... | Click "Analyze" |
| Oct 03, 2025 22:51 | 1983 | ... | Click "Analyze" |
| Oct 03, 2025 22:48 | 3693 | ... | Click "Analyze" |
| Oct 03, 2025 22:44 | 48989 | ... | Click "Analyze" (will be downsampled) |
| Oct 03, 2025 20:18 | 4950 | ... | Click "Analyze" |

## 🚀 Quick Action Steps (RIGHT NOW)

### To Get Your First Report:

1. **Stay on the current Analysis page** (you're already there)
2. **Click "Analyze"** next to the first session (Oct 05, 11:44, 6961 points)
3. **Wait 10-20 seconds** - You should see:
   - Console log: "API Request: POST /analysis/hybrid/..."
   - Loading indicator
   - Results appear below
4. **View the results** - You'll see:
   - Heart rate
   - Rhythm classification
   - Confidence score
   - Risk level
   - Abnormalities detected
   - Recommendations

### If Analysis Seems Stuck:
- Check browser console (F12) for errors
- Look for "timeout" errors
- Try a smaller session first (1027 points session)
- Refresh the page and try again

## 🔍 What the Analysis Will Show

After clicking "Analyze", you'll get:

```
✅ AI Diagnosis:
- Classification: Normal Sinus Rhythm (or other diagnosis)
- Confidence: 85%
- Heart Rate: 75 BPM
- Rhythm: Regular
- Risk Level: Low

✅ HRV Metrics:
- SDNN: 45 ms
- RMSSD: 38 ms
- pNN50: 25%

✅ Signal Quality:
- Score: Good
- Status: Acceptable

✅ Recommendations:
- Continue regular monitoring
- No significant arrhythmias detected
```

## 📊 Enhanced Features Now Active

Your ML service is now using:
- ✅ **Ensemble Analysis**: 4 parallel methods
- ✅ **Pre-trained Model**: Hugging Face BART (1.63GB)
- ✅ **50+ Features**: Time, frequency, statistical analysis
- ✅ **HRV Analysis**: SDNN, RMSSD, pNN50
- ✅ **Frequency Bands**: VLF, LF, HF power
- ✅ **Pattern Matching**: Rhythm regularity scoring
- ✅ **Deep Learning**: Additional classification layer

## ⚡ Performance Improvements

With the new fixes:
- ✅ **60-second timeout** (up from 30s) - Handles larger datasets
- ✅ **Automatic downsampling** - Datasets >5000 points reduced to 5000
- ✅ **Faster analysis** - Downsampling prevents timeouts
- ✅ **Better error handling** - String→float conversion automatic

## 🎯 Your Next Step

**RIGHT NOW**:
1. Go to http://localhost:3000/analysis (you're already there!)
2. Click **"Analyze"** on the first session
3. Wait 15-20 seconds
4. See your report!

OR

**EASIER WAY**:
1. Go to http://localhost:3000/weekly-summary
2. See all your data with beautiful charts
3. Click **"View Report"** on any session
4. Instant report view!

---

## 🆘 Troubleshooting

### "Analyze button not working"
- Check browser console (F12)
- Look for red error messages
- Backend might be restarting (wait 30 seconds)

### "Timeout errors"
- ✅ **FIXED** - Timeout increased to 60s
- ✅ **FIXED** - Large datasets auto-downsampled
- Try refreshing the page

### "No results showing"
- Check if backend is running: `curl http://localhost:5001/api/sessions`
- Check if ML service is running: `curl http://localhost:5002/health`
- Look at terminal logs for errors

### "Still can't see report"
Try direct URL with your session ID:
```
http://localhost:3000/report/41d23988-1c72-4e27-803b-b77d581f2e06
```

---

**Your reports are waiting! Just click "Analyze" or go to Weekly Summary! 🚀**
