# 🔐 HeartWise Configuration Summary

## Database Configuration

### PostgreSQL Credentials
- **Username**: `postgres`
- **Password**: `gugan@2022`
- **Database**: `heartwise_ecg`
- **Host**: `localhost`
- **Port**: `5432`

### Configuration Files Updated
✅ `backend/.env` - Environment variables (already configured)
✅ `backend/server.js` - Database pool configuration
✅ `backend/scripts/setup-commercial-db.js` - Setup script
✅ `backend/scripts/add-cardiac-conditions-migration.js` - Already correct

---

## Quick Database Commands

### Connect to Database
```bash
PGPASSWORD='gugan@2022' psql -U postgres -d heartwise_ecg
```

### Test Connection
```bash
PGPASSWORD='gugan@2022' psql -U postgres -d heartwise_ecg -c "SELECT 1;"
```

### View Tables
```bash
PGPASSWORD='gugan@2022' psql -U postgres -d heartwise_ecg -c "\dt"
```

### View ECG Sessions
```bash
PGPASSWORD='gugan@2022' psql -U postgres -d heartwise_ecg -c "SELECT id, device_id, start_time, status FROM ecg_sessions ORDER BY start_time DESC LIMIT 5;"
```

---

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 5001 | http://localhost:5001 |
| ML Service | 5002 | http://localhost:5002 |
| PostgreSQL | 5432 | localhost:5432 |

---

## Environment Variables

The backend reads configuration from `backend/.env`:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=heartwise_ecg
DB_USER=postgres
DB_PASSWORD=gugan@2022

# Server
PORT=5001
NODE_ENV=development

# ML Service
ML_SERVICE_URL=http://127.0.0.1:5002

# JWT
JWT_SECRET=heartwise_jwt_secret_$(openssl rand -hex 32)

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## Security Notes

⚠️ **For Production:**
1. Change the JWT secret to a strong random value
2. Use environment variables instead of hardcoded passwords
3. Use SSL/TLS for PostgreSQL connections
4. Store passwords in a secure secrets manager

---

## Startup Commands

### Start Everything
```bash
./start-all.sh
```

This will:
1. Kill old processes on ports 3000, 5001, 5002
2. Start Backend (with DB password: gugan@2022)
3. Start ML Service
4. Start Frontend
5. Open browser

### Check Status
```bash
./status.sh
```

Shows:
- Frontend status (Port 3000)
- Backend status (Port 5001)
- ML Service status (Port 5002)
- PostgreSQL connection

---

## Troubleshooting

### Database Connection Failed
```bash
# Test manually
PGPASSWORD='gugan@2022' psql -U postgres -d heartwise_ecg -c "SELECT 1;"

# If fails, check PostgreSQL is running
brew services list | grep postgresql
# or
pg_ctl status -D /usr/local/var/postgres
```

### Backend Can't Connect to Database
1. Check `.env` file has correct password
2. Verify PostgreSQL is running
3. Check backend logs:
   ```bash
   tail -f logs/backend.log
   ```

---

## All Configuration Files

1. **`backend/.env`** - Main environment configuration ✅
2. **`backend/server.js`** - Database pool setup ✅
3. **`backend/scripts/setup-commercial-db.js`** - Setup script ✅
4. **`start-all.sh`** - Startup script (no DB config needed)
5. **`status.sh`** - Status checker (includes DB test)

---

## Quick Reference

```bash
# Start system
./start-all.sh

# Check status  
./status.sh

# View logs
./view-logs.sh

# Stop system
./stop-all.sh

# Test database
PGPASSWORD='gugan@2022' psql -U postgres -d heartwise_ecg
```

---

**🔐 Your PostgreSQL password (`gugan@2022`) is now configured everywhere!**
