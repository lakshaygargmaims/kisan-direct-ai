#!/usr/bin/env node

/**
 * KisanDirect AI — Database Migration Script
 * 
 * This script handles switching between SQLite (development) and PostgreSQL (production).
 * 
 * Usage:
 *   node scripts/migrate.js sqlite     — Switch to SQLite
 *   node scripts/migrate.js postgres   — Switch to PostgreSQL
 *   node scripts/migrate.js push       — Push schema to database
 *   node scripts/migrate.js seed       — Seed the database
 *   node scripts/migrate.js reset      — Reset and re-seed database
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');
const ENV_PATH = path.join(__dirname, '../.env');

// Read current schema
let schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

function switchToSQLite() {
  console.log('🔄 Switching to SQLite...\n');
  
  // Update schema — only change the datasource provider, not the generator
  schema = schema.replace(
    /(datasource\s+db\s*\{[\s\S]*?provider\s*=\s*)"[^"]*"/,
    '$1"sqlite"'
  );
  fs.writeFileSync(SCHEMA_PATH, schema);
  console.log('✅ Updated schema.prisma to use SQLite');
  
  // Update .env if it exists
  if (fs.existsSync(ENV_PATH)) {
    let env = fs.readFileSync(ENV_PATH, 'utf-8');
    env = env.replace(
      /DATABASE_URL\s*=\s*"[^"]*"/,
      'DATABASE_URL="file:./prisma/dev.db"'
    );
    fs.writeFileSync(ENV_PATH, env);
    console.log('✅ Updated .env to use SQLite');
  }
  
  console.log('\n📦 Run the following commands:');
  console.log('   npx prisma generate');
  console.log('   npx prisma db push');
  console.log('   npm run db:seed');
}

function switchToPostgreSQL() {
  console.log('🔄 Switching to PostgreSQL...\n');
  
  // Update schema — only change the datasource provider, not the generator
  schema = schema.replace(
    /(datasource\s+db\s*\{[\s\S]*?provider\s*=\s*)"[^"]*"/,
    '$1"postgresql"'
  );
  fs.writeFileSync(SCHEMA_PATH, schema);
  console.log('✅ Updated schema.prisma to use PostgreSQL');
  
  console.log('\n📋 Next steps:');
  console.log('   1. Create a Supabase account at https://supabase.com');
  console.log('   2. Create a new project');
  console.log('   3. Get the connection string from Settings → Database');
  console.log('   4. Update your .env file with:');
  console.log('      DATABASE_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"');
  console.log('   5. Run: npx prisma db push');
  console.log('   6. Run: npm run db:seed');
}

function pushSchema() {
  console.log('🚀 Pushing schema to database...\n');
  
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('\n✅ Schema pushed successfully!');
  } catch (error) {
    console.error('\n❌ Failed to push schema:', error.message);
    process.exit(1);
  }
}

function seedDatabase() {
  console.log('🌱 Seeding database...\n');
  
  try {
    execSync('npm run db:seed', { stdio: 'inherit' });
    console.log('\n✅ Database seeded successfully!');
  } catch (error) {
    console.error('\n❌ Failed to seed database:', error.message);
    process.exit(1);
  }
}

function resetDatabase() {
  console.log('🔄 Resetting database...\n');
  
  try {
    // Force reset
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    console.log('\n✅ Database reset successfully!');
    
    // Re-seed
    seedDatabase();
  } catch (error) {
    console.error('\n❌ Failed to reset database:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case 'sqlite':
    switchToSQLite();
    break;
  case 'postgres':
  case 'postgresql':
    switchToPostgreSQL();
    break;
  case 'push':
    pushSchema();
    break;
  case 'seed':
    seedDatabase();
    break;
  case 'reset':
    resetDatabase();
    break;
  default:
    console.log(`
KisanDirect AI — Database Migration Script

Usage:
  node scripts/migrate.js sqlite     — Switch to SQLite (development)
  node scripts/migrate.js postgres   — Switch to PostgreSQL (production)
  node scripts/migrate.js push       — Push schema to database
  node scripts/migrate.js seed       — Seed the database
  node scripts/migrate.js reset      — Reset and re-seed database

Examples:
  # For local development with SQLite:
  node scripts/migrate.js sqlite
  node scripts/migrate.js push
  node scripts/migrate.js seed

  # For production with PostgreSQL:
  node scripts/migrate.js postgres
  # Then update .env with your DATABASE_URL
  node scripts/migrate.js push
  node scripts/migrate.js seed
    `);
    break;
}
