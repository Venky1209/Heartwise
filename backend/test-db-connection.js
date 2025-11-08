const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'heartwise_ecg',
  user: 'postgres',
  password: 'gugan@2022',
});

async function test() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM ecg_sessions');
    console.log('✅ Database connection successful!');
    console.log('Session count:', result.rows[0].count);
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

test();
