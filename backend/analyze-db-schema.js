const Database = require('better-sqlite3');
const path = require('path');

// Adjust path to your database location
const dbPath = path.resolve(__dirname, 'db/kalito.db');
const db = new Database(dbPath);

console.log('='.repeat(80));
console.log('DATABASE SCHEMA ANALYSIS');
console.log('='.repeat(80));
console.log('\n');

// Get all tables
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

console.log(`Total Tables: ${tables.length}\n`);

tables.forEach(table => {
  console.log('='.repeat(80));
  console.log(`TABLE: ${table.name}`);
  console.log('='.repeat(80));
  
  // Get schema
  const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
  console.log('\nColumns:');
  console.table(schema);
  
  // Get row count
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
  console.log(`\nRow Count: ${count.count}`);
  
  // Get foreign keys
  const fks = db.prepare(`PRAGMA foreign_key_list(${table.name})`).all();
  if (fks.length > 0) {
    console.log('\nForeign Keys:');
    console.table(fks);
  }
  
  // Sample data for small tables (<=5 rows)
  if (count.count > 0 && count.count <= 5) {
    const sample = db.prepare(`SELECT * FROM ${table.name} LIMIT 5`).all();
    console.log('\nSample Data:');
    console.table(sample);
  }
  console.log('\n');
});

// Get all indexes
console.log('='.repeat(80));
console.log('INDEXES');
console.log('='.repeat(80));
const indexes = db.prepare(`
  SELECT name, tbl_name, sql 
  FROM sqlite_master 
  WHERE type='index' AND sql IS NOT NULL
  ORDER BY tbl_name, name
`).all();
console.table(indexes);

db.close();
console.log('\nAnalysis complete!');