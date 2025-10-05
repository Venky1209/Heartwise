/**
 * Diet Recommendation Routes
 * AI-powered personalized diet recommendations ba        // Try AI-powered recommendations if enabled
        if (useAI) {
            try {
                // Use 127.0.0.1 instead of localhost to force IPv4
                const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5002';
                
                console.log('🤖 Requesting AI-powered diet recommendations from ML service...');
                
                const aiResponse = await axios.post(`${mlServiceUrl}/diet/recommend`, {
                    profile: {
                        age: profile.age,
                        gender: profile.gender,t health
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticateToken } = require('./auth');

let pool;

// Initialize with database pool
router.initializePool = (dbPool) => {
    pool = dbPool;
};

/**
 * GET /api/diet/recommendations
 * Get AI-powered personalized diet recommendations based on user's health profile and ECG timeline
 */
router.get('/recommendations', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const useAI = req.query.ai !== 'false'; // Enable AI by default

    try {
        // Get user's health profile
        const profileResult = await pool.query(
            `SELECT 
                EXTRACT(YEAR FROM AGE(date_of_birth)) as age,
                gender, 
                height_cm, 
                weight_kg
             FROM user_profiles 
             WHERE user_id = $1`,
            [userId]
        );

        // Get medical history
        const medicalResult = await pool.query(
            `SELECT *
             FROM medical_history 
             WHERE user_id = $1`,
            [userId]
        );

        // Get current medications
        const medicationsResult = await pool.query(
            `SELECT medication_name, generic_name, medication_class, dosage, unit, purpose
             FROM medications 
             WHERE user_id = $1 AND is_current = TRUE`,
            [userId]
        );

        // Get ECG timeline (last 30 days)
        const ecgTimelineResult = await pool.query(
            `SELECT 
                session_id,
                predictions,
                processed_at
             FROM ecg_analysis_results
             WHERE user_id = $1 
               AND processed_at >= NOW() - INTERVAL '30 days'
             ORDER BY processed_at DESC
             LIMIT 50`,
            [userId]
        );

        const profile = profileResult.rows[0] || {};
        const medical = medicalResult.rows[0] || {};
        const medications = medicationsResult.rows;
        const ecgTimeline = ecgTimelineResult.rows;

        // Check if user has basic profile information
        if (!profile.age || !profile.weight_kg) {
            return res.status(200).json({
                message: 'Please complete your profile to get personalized diet recommendations',
                profileIncomplete: true,
                recommendations: getGeneralHealthyDietRecommendations()
            });
        }

        let recommendations;

        // Try AI-powered recommendations if enabled
        if (useAI) {
            try {
                const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5002';
                
                console.log('🤖 Requesting AI-powered diet recommendations from ML service...');
                
                const aiResponse = await axios.post(`${mlServiceUrl}/diet/recommend`, {
                    profile: {
                        age: profile.age,
                        gender: profile.gender,
                        height_cm: profile.height_cm,
                        weight_kg: profile.weight_kg
                    },
                    medical_history: medical,
                    medications: medications,
                    ecg_timeline: ecgTimeline.map(row => ({
                        session_id: row.session_id,
                        predictions: row.predictions,
                        processed_at: row.processed_at
                    }))
                }, {
                    timeout: 30000 // 30 second timeout
                });

                recommendations = aiResponse.data;
                console.log('✅ AI recommendations generated successfully');

            } catch (aiError) {
                console.error('⚠️  AI service error, falling back to rule-based:', aiError.message);
                // Fallback to rule-based recommendations
                // Calculate health metrics from ECG timeline
                const health = {
                    avg_hr: ecgTimeline.length > 0 
                        ? Math.round(ecgTimeline.reduce((sum, r) => sum + (r.predictions?.heart_rate || 0), 0) / ecgTimeline.length)
                        : null
                };
                recommendations = generateDietRecommendations({
                    profile,
                    medical,
                    medications,
                    health
                });
            }
        } else {
            // Use rule-based recommendations
            const health = {
                avg_hr: ecgTimeline.length > 0 
                    ? Math.round(ecgTimeline.reduce((sum, r) => sum + (r.predictions?.heart_rate || 0), 0) / ecgTimeline.length)
                    : null
            };
            recommendations = generateDietRecommendations({
                profile,
                medical,
                medications,
                health
            });
        }

        // Get or create active diet plan (simplified to work with existing schema)
        let dietPlanResult = await pool.query(
            `SELECT id, plan_name, start_date, end_date
             FROM diet_plans 
             WHERE user_id = $1 AND is_active = TRUE
             ORDER BY created_at DESC
             LIMIT 1`,
            [userId]
        );

        let activePlan = null;
        if (dietPlanResult.rows.length === 0) {
            // Create new diet plan
            const newPlanResult = await pool.query(
                `INSERT INTO diet_plans 
                    (user_id, plan_name, start_date, end_date, is_active, diet_style)
                 VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE, $3)
                 RETURNING id, plan_name, start_date, end_date`,
                [
                    userId,
                    'AI-Powered Heart-Healthy Plan',
                    'heart_healthy'
                ]
            );
            activePlan = newPlanResult.rows[0];
        } else {
            activePlan = dietPlanResult.rows[0];
        }

        console.log('📤 Sending response with recommendations...');
        const responseData = {
            recommendations,
            activePlan: {
                id: activePlan.id,
                name: activePlan.plan_name,
                startDate: activePlan.start_date,
                endDate: activePlan.end_date
            }
        };
        
        // Log response size for debugging
        const responseSize = JSON.stringify(responseData).length;
        console.log(`📊 Response size: ${responseSize} bytes`);
        
        try {
            res.json(responseData);
            console.log('✅ Response sent successfully');
        } catch (jsonError) {
            console.error('❌ Error sending JSON response:', jsonError);
            throw jsonError;
        }

    } catch (err) {
        console.error('❌ Diet recommendations error:', err);
        console.error('Error stack:', err.stack);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            name: err.name
        });
        res.status(500).json({ 
            error: 'Failed to generate diet recommendations',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

/**
 * Generate personalized diet recommendations
 */
function generateDietRecommendations(data) {
    const { profile, medical, medications, health } = data;
    
    const recommendations = {
        goals: [],
        restrictions: [],
        nutrients: {
            prioritize: [],
            limit: [],
            avoid: []
        },
        foodGroups: {
            increase: [],
            moderate: [],
            reduce: []
        },
        mealPlan: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
        },
        tips: [],
        waterIntake: '8-10 glasses per day'
    };

    // Calculate BMI if height and weight available
    let bmi = null;
    if (profile.height_cm && profile.weight_kg) {
        const heightM = profile.height_cm / 100;
        bmi = (profile.weight_kg / (heightM * heightM)).toFixed(1);
    }

    // Set goals based on health conditions
    if (medical.has_hypertension) {
        recommendations.goals.push('Reduce blood pressure through diet');
        recommendations.restrictions.push('Limit sodium to 1500mg per day');
        recommendations.nutrients.limit.push('Sodium', 'Saturated fats');
        recommendations.nutrients.prioritize.push('Potassium', 'Magnesium', 'Calcium');
        recommendations.foodGroups.increase.push({
            name: 'Leafy Greens',
            examples: ['Spinach', 'Kale', 'Swiss chard', 'Collard greens'],
            benefit: 'Rich in potassium, helps lower blood pressure'
        });
        recommendations.foodGroups.reduce.push({
            name: 'Processed Foods',
            examples: ['Canned soups', 'Frozen meals', 'Deli meats', 'Chips'],
            reason: 'High in sodium'
        });
        recommendations.tips.push('Follow the DASH diet (Dietary Approaches to Stop Hypertension)');
        recommendations.tips.push('Use herbs and spices instead of salt for flavoring');
    }

    if (medical.has_high_cholesterol) {
        recommendations.goals.push('Lower LDL cholesterol naturally');
        recommendations.restrictions.push('Limit saturated fats and trans fats');
        recommendations.nutrients.avoid.push('Trans fats');
        recommendations.nutrients.limit.push('Saturated fats', 'Dietary cholesterol');
        recommendations.nutrients.prioritize.push('Omega-3 fatty acids', 'Soluble fiber');
        recommendations.foodGroups.increase.push({
            name: 'Fatty Fish',
            examples: ['Salmon', 'Mackerel', 'Sardines', 'Tuna'],
            benefit: 'Rich in omega-3s, reduces inflammation'
        });
        recommendations.foodGroups.increase.push({
            name: 'Nuts & Seeds',
            examples: ['Almonds', 'Walnuts', 'Flaxseeds', 'Chia seeds'],
            benefit: 'Contains heart-healthy fats and fiber'
        });
        recommendations.foodGroups.reduce.push({
            name: 'Red Meat',
            examples: ['Beef', 'Pork', 'Lamb'],
            reason: 'High in saturated fats'
        });
        recommendations.tips.push('Choose lean proteins like chicken breast, turkey, and legumes');
        recommendations.tips.push('Eat oatmeal daily for soluble fiber');
    }

    if (medical.has_diabetes) {
        recommendations.goals.push('Maintain stable blood sugar levels');
        recommendations.restrictions.push('Limit simple carbohydrates and added sugars');
        recommendations.nutrients.prioritize.push('Complex carbohydrates', 'Fiber', 'Protein');
        recommendations.nutrients.limit.push('Simple sugars', 'Refined carbohydrates');
        recommendations.foodGroups.increase.push({
            name: 'Whole Grains',
            examples: ['Quinoa', 'Brown rice', 'Whole wheat', 'Oats'],
            benefit: 'Slower glucose absorption, stable blood sugar'
        });
        recommendations.foodGroups.reduce.push({
            name: 'Sugary Foods',
            examples: ['Candy', 'Soda', 'White bread', 'Pastries'],
            reason: 'Rapid blood sugar spikes'
        });
        recommendations.tips.push('Eat smaller, frequent meals to maintain blood sugar');
        recommendations.tips.push('Pair carbs with protein or healthy fats');
    }

    // Heart disease history
    const hasHeartDisease = medical.previous_heart_attack || medical.previous_heart_failure || 
                           medical.previous_angina || medical.previous_arrhythmia;
    
    if (hasHeartDisease) {
        recommendations.goals.push('Support cardiovascular health and prevent complications');
        recommendations.restrictions.push('Mediterranean-style diet recommended');
        recommendations.nutrients.prioritize.push('Antioxidants', 'Omega-3s', 'Fiber', 'Plant sterols');
        recommendations.foodGroups.increase.push({
            name: 'Berries',
            examples: ['Blueberries', 'Strawberries', 'Raspberries', 'Blackberries'],
            benefit: 'High in antioxidants, reduces inflammation'
        });
        recommendations.foodGroups.increase.push({
            name: 'Olive Oil',
            examples: ['Extra virgin olive oil'],
            benefit: 'Monounsaturated fats, heart-protective'
        });
        recommendations.tips.push('Adopt a Mediterranean diet pattern');
        recommendations.tips.push('Limit alcohol consumption');
    }

    // Heart rate based recommendations
    if (health.avg_hr) {
        if (health.avg_hr > 90) {
            recommendations.tips.push('Reduce caffeine intake - high heart rate detected');
            recommendations.nutrients.limit.push('Caffeine');
            recommendations.foodGroups.reduce.push({
                name: 'Caffeinated Beverages',
                examples: ['Coffee', 'Energy drinks', 'Strong tea'],
                reason: 'Can elevate heart rate'
            });
        }
    }

    // BMI-based recommendations
    if (bmi) {
        if (bmi > 25) {
            recommendations.goals.push('Achieve healthy weight (Current BMI: ' + bmi + ')');
            recommendations.tips.push('Focus on portion control and calorie deficit');
            recommendations.tips.push('Increase physical activity gradually');
        } else if (bmi < 18.5) {
            recommendations.goals.push('Gain healthy weight (Current BMI: ' + bmi + ')');
            recommendations.tips.push('Increase calorie intake with nutrient-dense foods');
        }
    }

    // General heart-healthy recommendations
    if (recommendations.foodGroups.increase.length === 0) {
        recommendations.foodGroups.increase.push(
            {
                name: 'Fruits & Vegetables',
                examples: ['Apples', 'Oranges', 'Broccoli', 'Carrots', 'Tomatoes'],
                benefit: 'Rich in vitamins, minerals, and antioxidants'
            },
            {
                name: 'Whole Grains',
                examples: ['Oatmeal', 'Brown rice', 'Whole wheat bread', 'Quinoa'],
                benefit: 'Provides fiber and sustained energy'
            },
            {
                name: 'Lean Proteins',
                examples: ['Chicken breast', 'Turkey', 'Fish', 'Legumes', 'Tofu'],
                benefit: 'Essential for muscle health without excess fat'
            }
        );
    }

    if (recommendations.tips.length === 0) {
        recommendations.tips.push('Eat 5-7 servings of fruits and vegetables daily');
        recommendations.tips.push('Stay hydrated with water throughout the day');
        recommendations.tips.push('Practice mindful eating and avoid eating late at night');
    }

    // Sample meal plans
    recommendations.mealPlan = {
        breakfast: [
            { name: 'Oatmeal with Berries', description: 'Steel-cut oats topped with fresh blueberries, walnuts, and a drizzle of honey', calories: 320, hearthealthy: true },
            { name: 'Greek Yogurt Parfait', description: 'Low-fat Greek yogurt layered with granola and mixed berries', calories: 280, hearthealthy: true },
            { name: 'Avocado Toast', description: 'Whole grain toast with mashed avocado, tomatoes, and a poached egg', calories: 350, hearthealthy: true },
            { name: 'Smoothie Bowl', description: 'Blend of banana, spinach, almond milk, topped with chia seeds and sliced almonds', calories: 290, hearthealthy: true }
        ],
        lunch: [
            { name: 'Mediterranean Salad', description: 'Mixed greens, grilled chicken, chickpeas, feta, olives, olive oil dressing', calories: 420, hearthealthy: true },
            { name: 'Quinoa Buddha Bowl', description: 'Quinoa base with roasted vegetables, avocado, and tahini dressing', calories: 390, hearthealthy: true },
            { name: 'Grilled Salmon Bowl', description: 'Brown rice, grilled salmon, steamed broccoli, and teriyaki glaze', calories: 480, hearthealthy: true },
            { name: 'Turkey Wrap', description: 'Whole wheat wrap with turkey breast, hummus, lettuce, and tomatoes', calories: 340, hearthealthy: true }
        ],
        dinner: [
            { name: 'Baked Cod with Vegetables', description: 'Herb-crusted cod with roasted Brussels sprouts and sweet potato', calories: 410, hearthealthy: true },
            { name: 'Chicken Stir-Fry', description: 'Lean chicken breast with colorful vegetables in light sauce over brown rice', calories: 450, hearthealthy: true },
            { name: 'Lentil Curry', description: 'Red lentils in tomato-coconut curry with spinach, served with quinoa', calories: 380, hearthealthy: true },
            { name: 'Grilled Shrimp Skewers', description: 'Marinated shrimp with bell peppers and onions, side of wild rice', calories: 360, hearthealthy: true }
        ],
        snacks: [
            { name: 'Apple with Almond Butter', description: '1 medium apple sliced with 2 tbsp almond butter', calories: 180, hearthealthy: true },
            { name: 'Handful of Mixed Nuts', description: 'Unsalted almonds, walnuts, and cashews', calories: 170, hearthealthy: true },
            { name: 'Carrot Sticks with Hummus', description: 'Baby carrots with 1/4 cup hummus', calories: 120, hearthealthy: true },
            { name: 'Dark Chocolate Square', description: '70% dark chocolate (1 oz) with green tea', calories: 150, hearthealthy: true }
        ]
    };

    return recommendations;
}

/**
 * POST /api/diet/meal-log
 * Log a meal consumption
 */
router.post('/meal-log', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { mealType, foodName, calories, carbs, protein, fats, notes, eatenAt } = req.body;

    if (!mealType || !foodName) {
        return res.status(400).json({ error: 'Meal type and food name are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO meals 
                (user_id, meal_type, food_name, calories, carbohydrates_g, protein_g, fats_g, notes, eaten_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, meal_type, food_name, calories, eaten_at`,
            [userId, mealType, foodName, calories, carbs, protein, fats, notes, eatenAt || new Date()]
        );

        res.status(201).json({
            message: 'Meal logged successfully',
            meal: result.rows[0]
        });

    } catch (err) {
        console.error('Meal log error:', err);
        res.status(500).json({ error: 'Failed to log meal' });
    }
});

/**
 * GET /api/diet/meal-history
 * Get meal history for user
 */
router.get('/meal-history', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const days = parseInt(req.query.days) || 7;

    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const result = await pool.query(
            `SELECT 
                id, meal_type, food_name, calories, 
                carbohydrates_g, protein_g, fats_g, notes, eaten_at
             FROM meals 
             WHERE user_id = $1 AND eaten_at >= $2
             ORDER BY eaten_at DESC`,
            [userId, startDate]
        );

        // Group by date
        const mealsByDate = {};
        result.rows.forEach(meal => {
            const date = new Date(meal.eaten_at).toISOString().split('T')[0];
            if (!mealsByDate[date]) {
                mealsByDate[date] = { date, meals: [], totalCalories: 0 };
            }
            mealsByDate[date].meals.push(meal);
            mealsByDate[date].totalCalories += meal.calories || 0;
        });

        res.json({
            period: { days, start: startDate.toISOString() },
            history: Object.values(mealsByDate)
        });

    } catch (err) {
        console.error('Meal history error:', err);
        res.status(500).json({ error: 'Failed to retrieve meal history' });
    }
});

/**
 * Get general healthy diet recommendations when profile is incomplete
 */
function getGeneralHealthyDietRecommendations() {
    return {
        goals: [
            'Maintain heart health',
            'Support overall wellness',
            'Balanced nutrition'
        ],
        restrictions: [
            'Limit processed foods',
            'Reduce excess sodium',
            'Minimize added sugars'
        ],
        nutrients: {
            prioritize: [
                'Omega-3 Fatty Acids',
                'Fiber',
                'Potassium',
                'Antioxidants',
                'Vitamins & Minerals'
            ],
            limit: [
                'Saturated Fats',
                'Sodium',
                'Added Sugars'
            ],
            avoid: [
                'Trans Fats',
                'Excessive Sodium',
                'Processed Foods'
            ]
        },
        foodGroups: {
            increase: [
                {
                    name: 'Fruits & Vegetables',
                    benefit: 'Rich in vitamins, minerals, and antioxidants',
                    examples: ['Leafy greens', 'Berries', 'Citrus fruits', 'Cruciferous vegetables']
                },
                {
                    name: 'Whole Grains',
                    benefit: 'Provide sustained energy and fiber',
                    examples: ['Brown rice', 'Quinoa', 'Oats', 'Whole wheat bread']
                },
                {
                    name: 'Lean Proteins',
                    benefit: 'Essential for tissue repair and satiety',
                    examples: ['Fish', 'Chicken breast', 'Legumes', 'Tofu']
                },
                {
                    name: 'Healthy Fats',
                    benefit: 'Support heart health and nutrient absorption',
                    examples: ['Olive oil', 'Avocados', 'Nuts', 'Seeds']
                }
            ],
            moderate: [],
            reduce: []
        },
        mealPlan: {
            breakfast: [
                {
                    name: 'Oatmeal with Berries',
                    description: 'Steel-cut oats topped with mixed berries and almonds',
                    calories: 280,
                    hearthealthy: true
                },
                {
                    name: 'Veggie Omelet',
                    description: 'Egg white omelet with spinach, tomatoes, and mushrooms',
                    calories: 220,
                    hearthealthy: true
                }
            ],
            lunch: [
                {
                    name: 'Grilled Chicken Salad',
                    description: 'Mixed greens with grilled chicken, vegetables, and olive oil dressing',
                    calories: 380,
                    hearthealthy: true
                },
                {
                    name: 'Quinoa Bowl',
                    description: 'Quinoa with roasted vegetables and chickpeas',
                    calories: 350,
                    hearthealthy: true
                }
            ],
            dinner: [
                {
                    name: 'Baked Salmon',
                    description: 'Wild-caught salmon with steamed broccoli and brown rice',
                    calories: 420,
                    hearthealthy: true
                },
                {
                    name: 'Mediterranean Bowl',
                    description: 'Whole grain pasta with vegetables, olive oil, and herbs',
                    calories: 400,
                    hearthealthy: true
                }
            ],
            snacks: [
                {
                    name: 'Mixed Nuts',
                    description: 'Handful of unsalted almonds and walnuts',
                    calories: 160,
                    hearthealthy: true
                },
                {
                    name: 'Fresh Fruit',
                    description: 'Apple or banana with almond butter',
                    calories: 150,
                    hearthealthy: true
                }
            ]
        },
        tips: [
            '🍎 Fill half your plate with colorful fruits and vegetables',
            '🥗 Choose whole grains over refined grains whenever possible',
            '🐟 Include fatty fish (like salmon) at least twice per week',
            '🥜 Snack on nuts and seeds for healthy fats and protein',
            '💧 Stay hydrated with plenty of water throughout the day',
            '🧂 Read nutrition labels and limit sodium to 2,300mg per day'
        ]
    };
}

module.exports = router;
