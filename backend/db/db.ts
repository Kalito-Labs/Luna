import Database from 'better-sqlite3'
import * as path from 'path'
import { logError } from '../utils/logger'

// Path to your SQLite file - always points to db directory
const dbFile = path.resolve(__dirname, __dirname.includes('dist') ? '../../../db/kalito.db' : './kalito.db')

// Create database connection with error handling and optimizations
export const db = (() => {
  try {
    const database = new Database(dbFile)
    
    // Enable foreign key constraints
    database.pragma('foreign_keys = ON')
    
    // Performance optimizations
    database.pragma('journal_mode = WAL')      // Write-Ahead Logging for better concurrency
    database.pragma('synchronous = NORMAL')    // Balance between durability and performance
    database.pragma('cache_size = 1000')       // Larger cache for better performance
    database.pragma('temp_store = MEMORY')     // Store temp tables in memory
    
    console.log(`Database connected successfully: ${dbFile}`)
    return database
  } catch (error) {
    const err = error as Error
    logError('Failed to initialize database connection:', err)
    console.error(`Database connection error: ${err.message}`)
    process.exit(1) // Exit as database is critical for the application
  }
})()
