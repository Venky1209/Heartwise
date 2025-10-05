# Database Setup Instructions

## Option 1: Automated Setup (Recommended)

### Step 1: Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE heartwise_ecg;

# Exit psql
\q
```

### Step 2: Configure Environment

Create `.env` file in the `backend` directory:

```bash
cd backend

cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=heartwise_ecg
DB_USER=postgres
DB_PASSWORD=your_actual_postgres_password_here

# Server Configuration
PORT=5001
FRONTEND_URL=http://localhost:3000

# JWT Configuration (CHANGE IN PRODUCTION!)
JWT_SECRET=heartwise-super-secret-jwt-key-change-in-production-make-it-very-long-and-random

# Environment
NODE_ENV=development
EOF
```

**Important**: Replace `your_actual_postgres_password_here` with your PostgreSQL password!

### Step 3: Run Setup Script

```bash
node scripts/setup-commercial-db.js
```

This will:
- Create all 30+ tables
- Set up triggers and indexes
- Generate 10 sample device activation codes
- Seed meal library
- Print activation codes for testing

---

## Option 2: Manual Setup (If Script Fails)

### Step 1: Run SQL Schema Directly

```bash
# Connect to database
psql -U postgres -d heartwise_ecg

# Run schema file
\i /path/to/heartwise-ecg/database/commercial_schema.sql

# Verify tables created
\dt

# Should see 30+ tables: users, user_profiles, devices, etc.

# Exit
\q
```

### Step 2: Manually Create Sample Devices

```bash
psql -U postgres -d heartwise_ecg

# Insert 5 sample devices
INSERT INTO devices (device_id, serial_number, model_number, activation_code, firmware_version, hardware_version, manufacturing_date, warranty_start_date, warranty_end_date)
VALUES 
('AA:BB:CC:DD:EE:01', 'HW-2025-1001', 'HW-ECG-V1', 'HW-A1B2-C3D4-E5F6', '1.0.0', 'v1.0', CURRENT_DATE, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years'),
('AA:BB:CC:DD:EE:02', 'HW-2025-1002', 'HW-ECG-V1', 'HW-F7G8-H9I0-J1K2', '1.0.0', 'v1.0', CURRENT_DATE, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years'),
('AA:BB:CC:DD:EE:03', 'HW-2025-1003', 'HW-ECG-V1', 'HW-L3M4-N5O6-P7Q8', '1.0.0', 'v1.0', CURRENT_DATE, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years'),
('AA:BB:CC:DD:EE:04', 'HW-2025-1004', 'HW-ECG-V1', 'HW-R9S0-T1U2-V3W4', '1.0.0', 'v1.0', CURRENT_DATE, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years'),
('AA:BB:CC:DD:EE:05', 'HW-2025-1005', 'HW-ECG-V1', 'HW-X5Y6-Z7A8-B9C0', '1.0.0', 'v1.0', CURRENT_DATE, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years');

# Verify devices created
SELECT activation_code, serial_number, activated FROM devices;

\q
```

**Save these activation codes for testing:**
- `HW-A1B2-C3D4-E5F6`
- `HW-F7G8-H9I0-J1K2`
- `HW-L3M4-N5O6-P7Q8`
- `HW-R9S0-T1U2-V3W4`
- `HW-X5Y6-Z7A8-B9C0`

---

## Verify Setup

```bash
psql -U postgres -d heartwise_ecg

# Check all tables exist
\dt

# Should see tables like:
# - users
# - user_profiles
# - medical_history
# - medications
# - devices
# - ecg_sessions
# - ecg_data_points
# - diet_plans
# - meals
# ... and more

# Check sample devices
SELECT COUNT(*) as device_count FROM devices;

# Should return at least 5

# Check meal library (if using automated script)
SELECT COUNT(*) as meal_count FROM meals;

\q
```

---

## Test Backend Connection

```bash
cd backend

# Start server
npm start

# In another terminal, test health endpoint
curl http://localhost:5001/api/health

# Should return:
# {"status":"healthy","timestamp":"2025-10-03T...","database":"connected"}
```

---

## Test Registration API

```bash
# Test registration (replace with your activation code)
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@heartwise.com",
    "password": "testpass123",
    "activationCode": "HW-A1B2-C3D4-E5F6"
  }'

# Should return:
# {
#   "message": "Registration successful",
#   "user": { ... },
#   "deviceActivated": true,
#   "accessToken": "eyJhbGc...",
#   "refreshToken": "...",
#   "nextStep": "complete_profile"
# }
```

---

## Common Issues

### Issue: "password authentication failed"
**Solution**: Update `DB_PASSWORD` in `.env` file with correct PostgreSQL password

### Issue: "database does not exist"
**Solution**: Create database first:
```bash
psql -U postgres -c "CREATE DATABASE heartwise_ecg;"
```

### Issue: "relation does not exist"
**Solution**: Run schema file:
```bash
psql -U postgres -d heartwise_ecg -f database/commercial_schema.sql
```

### Issue: "activation code already used"
**Solution**: Use a different activation code or check:
```sql
SELECT activation_code, activated FROM devices WHERE activated = FALSE;
```

---

## Quick Reset (For Development)

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS heartwise_ecg;"
psql -U postgres -c "CREATE DATABASE heartwise_ecg;"

# Run schema again
psql -U postgres -d heartwise_ecg -f database/commercial_schema.sql

# Re-insert devices
psql -U postgres -d heartwise_ecg -c "
INSERT INTO devices (device_id, serial_number, model_number, activation_code, firmware_version, hardware_version, manufacturing_date, warranty_start_date, warranty_end_date)
VALUES 
('AA:BB:CC:DD:EE:01', 'HW-2025-1001', 'HW-ECG-V1', 'HW-TEST-0001-0001', '1.0.0', 'v1.0', CURRENT_DATE, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years');
"
```

---

## Production Deployment

For production:

1. **Use strong passwords**:
   ```bash
   # Generate strong JWT secret
   openssl rand -base64 64
   ```

2. **Enable SSL/TLS** for PostgreSQL connection

3. **Set up environment variables** securely (AWS Secrets Manager, etc.)

4. **Create separate database user**:
   ```sql
   CREATE USER heartwise_app WITH PASSWORD 'strong_password';
   GRANT ALL PRIVILEGES ON DATABASE heartwise_ecg TO heartwise_app;
   ```

5. **Enable audit logging**

6. **Set up automated backups**

---

Ready to continue? Once database is set up, you can start the backend and test the authentication system!
