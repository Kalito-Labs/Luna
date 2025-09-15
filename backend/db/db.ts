import Database from 'better-sqlite3'
import * as path from 'path'

// Path to your SQLite file - always points to source database
const dbFile = path.resolve(__dirname, __dirname.includes('dist') ? '../../../db/kalito.db' : 'kalito.db')

export const db = new Database(dbFile)
