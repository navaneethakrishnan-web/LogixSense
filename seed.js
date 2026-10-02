/**
 * LogixSense Standalone Seed Script (seed.js)
 * Initializes SQL database tables and inserts demo logistics data.
 */

const db = require('./db');

async function runSeed() {
  console.log('LogixSense Seed: Starting database initialization...');
  const success = await db.initDatabase();
  if (success) {
    console.log('LogixSense Seed: Database schema and initial data loaded successfully!');
    const tables = await db.getTables();
    console.log('Database Summary:', tables);
  } else {
    console.error('LogixSense Seed: Failed to initialize database.');
  }
}

runSeed();
