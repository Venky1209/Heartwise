# 🚀 Quick Start Guide - User-Only Model

## What Changed?

**Before:** System had separate patient management - users could add multiple patients and select which one to record ECG for.

**Now:** Each user IS their own patient. When you login, all ECG recordings are automatically associated with your account. No patient selection needed!

---

## 🎯 Key Points

### ✅ What's Removed:
- ❌ **Patients page** (no longer in navigation)
- ❌ **Patient dropdown** in ECG Monitor
- ❌ **Add Patient button**
- ❌ **Patient selection requirement**

### ✅ What's New:
- ✨ **Automatic user detection** - system knows who you are from login
- ✨ **Simpler ECG recording** - just select device and start
- ✨ **Your name displayed** instead of patient selection
- ✨ **Direct data access** - all your sessions, no filtering needed

---

## 📱 How to Use (Frontend)

### Starting an ECG Session:
1. Login to your account
2. Go to **ECG Monitor**
3. You'll see "Recording as: [Your Name]" (no selection needed!)
4. Select your **device** from dropdown
5. Click **"Start ECG Session"**
6. Done! Recording starts automatically for you

### Viewing Your Data:
- **Dashboard** - See your latest ECG stats
- **Weekly Summary** - View your weekly heart health trends
- **Sessions** - Browse all YOUR past ECG recordings
- **Analysis** - See detailed analysis of your ECGs

---

## 🔧 For Developers

### API Changes:

#### Creating a Session (OLD vs NEW):
```javascript
// ❌ OLD WAY (required patientId)
POST /api/sessions
{
  "patientId": "uuid-here",
  "sessionName": "My Session",
  "deviceId": "ESP32-001"
}

// ✅ NEW WAY (no patientId needed)
POST /api/sessions
Headers: { Authorization: "Bearer <token>" }
{
  "sessionName": "My Session", 
  "deviceId": "ESP32-001"
}
// User ID automatically extracted from JWT token
```

#### Fetching Sessions:
```javascript
// ❌ OLD WAY
GET /api/sessions?patientId=uuid-here

// ✅ NEW WAY
GET /api/sessions
Headers: { Authorization: "Bearer <token>" }
// Returns only authenticated user's sessions
```

### Database Schema:
```sql
-- OLD
ecg_sessions.patient_id → patients.id
                           ↓
                    user_profiles.patient_id → user_profiles.user_id → users.id

-- NEW (Simplified!)
ecg_sessions.user_id → users.id
```

---

## 🔐 Security Improvements

1. **Authentication Required:** All session endpoints now require valid JWT token
2. **Data Isolation:** Users can ONLY access their own ECG data
3. **No Cross-User Access:** Impossible to accidentally view another user's recordings
4. **Automatic User Context:** No manual user/patient ID passing needed

---

## 🐛 Troubleshooting

### Issue: "Failed to create session"
**Solution:** Make sure you're logged in and have a valid token

### Issue: "No sessions showing"
**Solution:** Sessions are now filtered by your user ID automatically. Only YOUR sessions will appear.

### Issue: "Patient dropdown missing"
**This is intentional!** The patient dropdown has been removed. The system automatically uses your logged-in user account.

### Issue: "Can't access Patients page"
**This is intentional!** The Patients page has been removed. You are your own patient now.

---

## 📊 Testing Checklist

After deployment, verify:

- [ ] Can login successfully
- [ ] ECG Monitor shows "Recording as: [Your Name]"
- [ ] Can start ECG session without selecting patient
- [ ] Sessions page shows only your recordings
- [ ] Weekly Summary shows your ECG data
- [ ] Patients menu item is gone from sidebar
- [ ] No errors in browser console

---

## 🔄 Need Help?

If you encounter any issues:

1. **Clear browser cache** and refresh
2. **Logout and login again** to get fresh token
3. **Check browser console** for error messages
4. **Check backend logs** at `/logs/backend.log`
5. **Verify user profile** is complete with name info

---

## 📝 Quick Commands

```bash
# Check backend status
tail -f /Users/gugank/New\ Idea/heartwise-ecg/logs/backend.log

# Restart backend
pkill -f "node server.js"
cd /Users/gugank/New\ Idea/heartwise-ecg/backend && node server.js &

# Check database
psql -U postgres -d heartwise_ecg -c "SELECT id, session_name, user_id FROM ecg_sessions LIMIT 5;"

# Verify migration
psql -U postgres -d heartwise_ecg -c "\d ecg_sessions"
```

---

**Last Updated:** October 8, 2025  
**System Status:** ✅ Migrated to User-Only Model  
**Ready for Production:** After frontend refresh and testing
