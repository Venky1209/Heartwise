/**
 * Database Migration Script
 * Adds new cardiac condition fields to medical_history table
 * 
 * Run this script to add the new cardiac conditions:
 * node backend/scripts/add-cardiac-conditions-migration.js
 */

const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'heartwise_ecg',
    password: process.env.DB_PASSWORD || 'gugan@2022',
    port: process.env.DB_PORT || 5432,
});

async function runMigration() {
    const client = await pool.connect();
    
    try {
        console.log('Starting migration: Adding new cardiac condition fields...');
        
        await client.query('BEGIN');
        
        // Add new cardiac condition columns
        const alterTableSQL = `
            ALTER TABLE medical_history 
            ADD COLUMN IF NOT EXISTS previous_valve_disease BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS previous_cardiomyopathy BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS previous_congenital_heart_disease BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS previous_peripheral_artery_disease BOOLEAN DEFAULT FALSE;
        `;
        
        await client.query(alterTableSQL);
        
        await client.query('COMMIT');
        
        console.log('✅ Migration completed successfully!');
        console.log('Added columns:');
        console.log('  - previous_valve_disease');
        console.log('  - previous_cardiomyopathy');
        console.log('  - previous_congenital_heart_disease');
        console.log('  - previous_peripheral_artery_disease');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
runMigration()
    .then(() => {
        console.log('\n✅ Database migration complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
