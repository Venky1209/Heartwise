/**
 * Database Setup Script
 * Creates commercial schema and seeds initial data
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'heartwise_ecg',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'gugan@2022',
});

/**
 * Generate activation code
 */
const generateActivationCode = () => {
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part3 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `HW-${part1}-${part2}-${part3}`;
};

/**
 * Generate device ID (MAC address style)
 */
const generateDeviceId = () => {
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(':');
};

/**
 * Main setup function
 */
async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Starting database setup...\n');

    // Read and execute commercial schema
    console.log('1️⃣ Creating commercial schema...');
    const schemaPath = path.join(__dirname, '../database/commercial_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schema);
    console.log('✅ Commercial schema created successfully\n');

    // Seed sample devices
    console.log('2️⃣ Seeding sample devices...');
    const deviceCount = 10; // Create 10 sample devices
    const devices = [];

    for (let i = 0; i < deviceCount; i++) {
      const deviceId = generateDeviceId();
      const activationCode = generateActivationCode();
      const serialNumber = `HW-2025-${String(1000 + i).padStart(4, '0')}`;
      const modelNumber = 'HW-ECG-V1';

      await client.query(
        `INSERT INTO devices (
          device_id, serial_number, model_number, activation_code,
          firmware_version, hardware_version, manufacturing_date,
          warranty_start_date, warranty_end_date
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years')`,
        [deviceId, serialNumber, modelNumber, activationCode, '1.0.0', 'v1.0']
      );

      devices.push({ deviceId, serialNumber, activationCode });
    }
    
    console.log(`✅ Created ${deviceCount} sample devices\n`);

    // Print activation codes for testing
    console.log('📦 SAMPLE ACTIVATION CODES (use for testing registration):');
    console.log('=' .repeat(60));
    devices.forEach((device, index) => {
      console.log(`Device ${index + 1}: ${device.activationCode}`);
      console.log(`  Serial: ${device.serialNumber}`);
      console.log(`  MAC: ${device.deviceId}\n`);
    });
    console.log('=' .repeat(60));

    // Create sample meal library
    console.log('\n3️⃣ Seeding cardiac-healthy meal library...');
    const meals = [
      {
        name: 'Oatmeal with Berries and Almonds',
        type: 'breakfast',
        cuisine: 'american',
        description: 'Heart-healthy steel-cut oats topped with fresh berries and slivered almonds',
        recipe: `1. Cook 1/2 cup steel-cut oats in water
2. Top with 1/2 cup mixed berries
3. Add 1 tbsp slivered almonds
4. Drizzle with 1 tsp honey (optional)`,
        prepTime: 5,
        cookTime: 20,
        servings: 1,
        ingredients: [
          {name: 'Steel-cut oats', quantity: 0.5, unit: 'cup'},
          {name: 'Mixed berries', quantity: 0.5, unit: 'cup'},
          {name: 'Almonds', quantity: 1, unit: 'tbsp'}
        ],
        calories: 280,
        protein: 10,
        carbs: 45,
        fat: 8,
        saturatedFat: 1,
        sodium: 5,
        fiber: 8,
        sugar: 12,
        isHeartHealthy: true,
        isDiabeticFriendly: true,
        isLowSodium: true,
        difficulty: 'easy'
      },
      {
        name: 'Grilled Salmon with Quinoa and Vegetables',
        type: 'lunch',
        cuisine: 'mediterranean',
        description: 'Omega-3 rich salmon with protein-packed quinoa and steamed vegetables',
        recipe: `1. Season 4oz salmon with herbs
2. Grill for 4-5 minutes per side
3. Serve with 1/2 cup cooked quinoa
4. Add steamed broccoli and carrots`,
        prepTime: 10,
        cookTime: 15,
        servings: 1,
        ingredients: [
          {name: 'Salmon fillet', quantity: 4, unit: 'oz'},
          {name: 'Quinoa', quantity: 0.5, unit: 'cup'},
          {name: 'Broccoli', quantity: 1, unit: 'cup'},
          {name: 'Carrots', quantity: 0.5, unit: 'cup'}
        ],
        calories: 420,
        protein: 35,
        carbs: 38,
        fat: 15,
        saturatedFat: 2.5,
        sodium: 180,
        fiber: 8,
        sugar: 6,
        isHeartHealthy: true,
        isLowCholesterol: true,
        difficulty: 'medium'
      },
      {
        name: 'Mediterranean Chickpea Salad',
        type: 'lunch',
        cuisine: 'mediterranean',
        description: 'Fiber-rich chickpeas with fresh vegetables and olive oil',
        recipe: `1. Combine 1 cup chickpeas with diced tomatoes, cucumber, red onion
2. Add 2 tbsp olive oil and lemon juice
3. Season with oregano and black pepper
4. Top with crumbled feta (optional)`,
        prepTime: 15,
        cookTime: 0,
        servings: 1,
        ingredients: [
          {name: 'Chickpeas', quantity: 1, unit: 'cup'},
          {name: 'Tomatoes', quantity: 1, unit: 'cup'},
          {name: 'Cucumber', quantity: 0.5, unit: 'cup'},
          {name: 'Olive oil', quantity: 2, unit: 'tbsp'}
        ],
        calories: 320,
        protein: 12,
        carbs: 42,
        fat: 12,
        saturatedFat: 2,
        sodium: 200,
        fiber: 12,
        sugar: 8,
        isHeartHealthy: true,
        isHighFiber: true,
        isVegetarian: true,
        difficulty: 'easy'
      },
      {
        name: 'Baked Chicken Breast with Sweet Potato',
        type: 'dinner',
        cuisine: 'american',
        description: 'Lean protein with vitamin-rich sweet potato',
        recipe: `1. Season 5oz chicken breast with herbs
2. Bake at 375°F for 25-30 minutes
3. Roast sweet potato wedges alongside
4. Serve with mixed greens`,
        prepTime: 10,
        cookTime: 30,
        servings: 1,
        ingredients: [
          {name: 'Chicken breast', quantity: 5, unit: 'oz'},
          {name: 'Sweet potato', quantity: 1, unit: 'medium'},
          {name: 'Mixed greens', quantity: 2, unit: 'cups'}
        ],
        calories: 380,
        protein: 38,
        carbs: 35,
        fat: 8,
        saturatedFat: 2,
        sodium: 220,
        fiber: 6,
        sugar: 8,
        isHeartHealthy: true,
        isDiabeticFriendly: true,
        difficulty: 'medium'
      },
      {
        name: 'Apple Slices with Almond Butter',
        type: 'snack',
        cuisine: 'american',
        description: 'Simple heart-healthy snack with fiber and healthy fats',
        recipe: `1. Slice 1 medium apple
2. Serve with 1 tbsp almond butter`,
        prepTime: 2,
        cookTime: 0,
        servings: 1,
        ingredients: [
          {name: 'Apple', quantity: 1, unit: 'medium'},
          {name: 'Almond butter', quantity: 1, unit: 'tbsp'}
        ],
        calories: 150,
        protein: 4,
        carbs: 22,
        fat: 7,
        saturatedFat: 0.5,
        sodium: 2,
        fiber: 5,
        sugar: 16,
        isHeartHealthy: true,
        isLowSodium: true,
        isVegetarian: true,
        difficulty: 'easy'
      }
    ];

    for (const meal of meals) {
      await client.query(
        `INSERT INTO meals (
          meal_name, meal_type, cuisine_type, description, recipe_instructions,
          preparation_time_minutes, cooking_time_minutes, servings, ingredients,
          calories, protein_g, carbs_g, fat_g, saturated_fat_g, sodium_mg, fiber_g, sugar_g,
          is_heart_healthy, is_diabetic_friendly, is_low_sodium, is_low_cholesterol,
          is_high_fiber, is_vegetarian, difficulty_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
        [
          meal.name, meal.type, meal.cuisine, meal.description, meal.recipe,
          meal.prepTime, meal.cookTime, meal.servings, JSON.stringify(meal.ingredients),
          meal.calories, meal.protein, meal.carbs, meal.fat, meal.saturatedFat,
          meal.sodium, meal.fiber, meal.sugar,
          meal.isHeartHealthy || false, meal.isDiabeticFriendly || false,
          meal.isLowSodium || false, meal.isLowCholesterol || false,
          meal.isHighFiber || false, meal.isVegetarian || false,
          meal.difficulty
        ]
      );
    }

    console.log(`✅ Created ${meals.length} sample meals\n`);

    console.log('🎉 Database setup completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Start the backend: cd backend && npm start');
    console.log('2. Test registration with one of the activation codes above');
    console.log('3. Complete user profile and medical history');
    console.log('4. Start ECG monitoring!\n');

  } catch (err) {
    console.error('❌ Setup failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run setup
setupDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
