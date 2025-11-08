-- Migration: Simplify to User-Only Model
-- This migration removes the separate patient concept and makes users the direct owner of all ECG data
-- Date: 2025-10-08

-- Step 1: Add user_id column to ecg_sessions
ALTER TABLE ecg_sessions 
ADD COLUMN user_id UUID;

-- Step 2: Populate user_id from patient_id via user_profiles
UPDATE ecg_sessions es
SET user_id = up.user_id
FROM user_profiles up
WHERE es.patient_id = up.patient_id;

-- Step 3: For any sessions without a matching user (orphaned), we'll handle them
-- Check if there are any orphaned sessions
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM ecg_sessions
    WHERE user_id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Warning: Found % orphaned ECG sessions without a user. These will be deleted.', orphaned_count;
        DELETE FROM ecg_sessions WHERE user_id IS NULL;
    END IF;
END $$;

-- Step 4: Make user_id NOT NULL
ALTER TABLE ecg_sessions 
ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE ecg_sessions
ADD CONSTRAINT ecg_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 6: Create index on user_id for performance
CREATE INDEX idx_ecg_sessions_user_id ON ecg_sessions(user_id);

-- Step 7: Drop the old patient_id constraint and column
ALTER TABLE ecg_sessions DROP CONSTRAINT IF EXISTS ecg_sessions_patient_id_fkey;
DROP INDEX IF EXISTS idx_ecg_sessions_patient;
ALTER TABLE ecg_sessions DROP COLUMN patient_id;

-- Step 8: Update user_profiles to remove patient_id dependency
-- (We'll keep user_profiles with patient_id for now as a transitional step)
-- but make patient_id nullable
ALTER TABLE user_profiles 
ALTER COLUMN patient_id DROP NOT NULL;

-- Step 9: Add comment to document the change
COMMENT ON COLUMN ecg_sessions.user_id IS 'Direct reference to the user who owns this ECG session';

-- Verification queries
SELECT 'Migration complete!' AS status;
SELECT COUNT(*) AS total_sessions, COUNT(DISTINCT user_id) AS unique_users 
FROM ecg_sessions;
