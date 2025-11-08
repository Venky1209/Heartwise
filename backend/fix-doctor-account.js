const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'heartwise_ecg',
  user: 'postgres',
  password: 'gugan@2022'
});

async function fixDoctorAccount() {
  try {
    // Hash the password
    const password = 'doctor123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('\n🔑 Generated password hash for "doctor123"');
    console.log('Hash:', hash);
    
    // Check if doctor exists
    const check = await pool.query("SELECT id, email, role, activated FROM users WHERE email = 'doctor@heartwise.com'");
    
    if (check.rows.length > 0) {
      console.log('\n✅ Doctor account found:', check.rows[0]);
      // Update password
      await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'doctor@heartwise.com']);
      console.log('\n✅ Password hash updated successfully!');
    } else {
      console.log('\n❌ Doctor account does not exist. Creating new account...');
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, role, activated, email_verified) 
         VALUES ($1, $2, 'doctor', TRUE, TRUE) 
         RETURNING id, email, role`,
        ['doctor@heartwise.com', hash]
      );
      console.log('✅ Doctor account created:', result.rows[0]);
    }
    
    // Verify the login would work
    const verify = await pool.query("SELECT password_hash FROM users WHERE email = 'doctor@heartwise.com'");
    const isValid = await bcrypt.compare(password, verify.rows[0].password_hash);
    
    console.log('\n🔍 Verification test:');
    console.log('Password "doctor123" matches hash:', isValid);
    
    if (isValid) {
      console.log('\n✅ Doctor account is ready!');
      console.log('Email: doctor@heartwise.com');
      console.log('Password: doctor123');
    } else {
      console.log('\n❌ Password verification failed!');
    }
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixDoctorAccount();
