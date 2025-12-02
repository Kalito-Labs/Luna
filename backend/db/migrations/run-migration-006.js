/**
 * Runner script for migration 006
 * Execute with: node run-migration-006.js
 */

require('esbuild-register/dist/node').register()
require('./006-add-journal-tracking-fields.ts')
