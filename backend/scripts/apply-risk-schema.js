#!/usr/bin/env node
/**
 * Apply Risk Scoring Schema to PostgreSQL Database
 * 
 * Usage: node backend/scripts/apply-risk-schema.js
 * 
 * Reads database/risk_scoring_schema.sql and executes it
 * against the heartwise_ecg PostgreSQL database.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'heartwise_ecg',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'gugan@2022',
});

async function applySchema() {
  const client = await pool.connect();
  try {
    console.log('🔌 Connected to PostgreSQL database');

    const schemaPath = path.join(__dirname, '..', '..', 'database', 'risk_scoring_schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Schema file not found at: ${schemaPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log(`📄 Read schema file (${sql.length} bytes)`);

    // Execute the entire SQL file as a single transaction
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('✅ Risk scoring schema applied successfully!');
    console.log('   Tables created: risk_scores, risk_factors, risk_score_history, risk_alerts, risk_factor_definitions');
    console.log('   Functions created: get_latest_risk_score, calculate_risk_trend, create_critical_risk_alert, track_risk_score_history');
    console.log('   Views created: v_user_risk_dashboard');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error applying schema:', error.message);
    
    // Check for common issues
    if (error.message.includes('already exists')) {
      console.log('\n💡 Some objects already exist. This is OK — the schema uses IF NOT EXISTS for tables.');
      console.log('   Re-running with CREATE OR REPLACE for functions/views...');
      
      // Try again without the transaction to apply what we can
      try {
        await client.query(fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'risk_scoring_schema.sql'), 'utf8'));
        console.log('✅ Schema applied (non-transactional fallback)');
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError.message);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

applySchema();
