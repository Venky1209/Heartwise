-- Migration: Add Diet Plans and Meals Tables
-- Date: 2025-12-19
-- Description: Creates tables for diet recommendations feature

-- Diet plans table
CREATE TABLE IF NOT EXISTS diet_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    plan_name VARCHAR(200) NOT NULL DEFAULT 'Heart-Healthy Diet Plan',
    plan_type VARCHAR(50) DEFAULT 'heart_healthy', -- cardiac_recovery, weight_loss, maintenance
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    
    -- Dietary goals
    daily_calorie_target INTEGER,
    protein_target_g DECIMAL(5,2),
    carbs_target_g DECIMAL(5,2),
    fat_target_g DECIMAL(5,2),
    
    -- Restrictions (based on medical condition)
    sodium_limit_mg INTEGER,
    sugar_limit_g DECIMAL(5,2),
    
    -- Diet style
    diet_style VARCHAR(50) DEFAULT 'balanced', -- dash, mediterranean, low_sodium, diabetic_friendly
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_by VARCHAR(100) DEFAULT 'system', -- ai, nutritionist, self
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meals log table
CREATE TABLE IF NOT EXISTS meals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name VARCHAR(200) NOT NULL,
    
    description TEXT,
    
    -- Nutrition facts
    calories INTEGER,
    carbohydrates_g DECIMAL(5,2),
    protein_g DECIMAL(5,2),
    fats_g DECIMAL(5,2),
    sodium_mg INTEGER,
    fiber_g DECIMAL(5,2),
    
    -- Tags
    is_heart_healthy BOOLEAN DEFAULT TRUE,
    
    notes TEXT,
    eaten_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_active ON diet_plans(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, eaten_at);

-- Add comments
COMMENT ON TABLE diet_plans IS 'Personalized diet plans for users based on health conditions';
COMMENT ON TABLE meals IS 'Meal logging for tracking diet compliance';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Diet tables created successfully!';
END $$;
