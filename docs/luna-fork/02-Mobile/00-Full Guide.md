# 🚀 Luna Android APK - Step-by-Step Implementation Guide


**Goal**: Convert Luna into a fully functional Android APK with embedded Node.js backend and sql.js database.
**Timeline**: ~1-2 weeks (working a few hours per day)

---


## 📋 Prerequisites Checklist

  

Before starting, make sure you have:

  

- [ ] **Android device or emulator** (Android 7.0+ recommended)

- [ ] **USB debugging enabled** on device (Settings → Developer Options → USB Debugging)

- [ ] **adb installed** (comes with Android SDK)

- [ ] **Node.js 18+** (you already have this)

- [ ] **pnpm** (you already have this)

- [ ] **Luna working locally** (`npm run dev` in both backend and frontend)

- [ ] **Current database backed up** (`./scripts/backup-db`)

- [ ] **Coffee/energy drink ready** ☕

  

---

  

## 🎯 Phase 1: Setup Capacitor (Day 1 - 2 hours)

  

### **Step 1.1: Install Capacitor in Frontend**

  

```bash

cd /home/kalito/kalito-labs/Luna/frontend

  

# Install Capacitor core

pnpm install @capacitor/core @capacitor/cli

  

# Initialize Capacitor

npx cap init

```

  

**When prompted, enter:**

- App name: `Luna`

- App ID: `com.kalitospace.luna` (or your preferred package name)

- Web directory: `dist`

  

**Expected output:**

```

✔ Creating capacitor.config.ts in /home/kalito/kalito-labs/Luna/frontend

✔ Creating package.json in /home/kalito/kalito-labs/Luna/frontend

✓ Capacitor initialized!

```

  

### **Step 1.2: Add Android Platform**

  

```bash

# Still in /home/kalito/kalito-labs/Luna/frontend

pnpm install @capacitor/android

npx cap add android

```

  

**Expected output:**

```

✔ Adding native android project in android

✔ Syncing Gradle

✓ Android platform added!

```

  

**Verify:** Check that `frontend/android/` directory was created.

  

### **Step 1.3: Configure Capacitor**

  

Edit `frontend/capacitor.config.ts`:

  

```typescript

import { CapacitorConfig } from '@capacitor/cli';

  

const config: CapacitorConfig = {

appId: 'com.kalitospace.luna',

appName: 'Luna',

webDir: 'dist',

server: {

androidScheme: 'https',

// We'll configure this later for Node.js Mobile

},

android: {

allowMixedContent: true,

}

};

  

export default config;

```

  

### **Step 1.4: Test Basic Build**

  

```bash

# Build frontend

pnpm run build

  

# Sync to Android

npx cap sync android

  

# Open in Android Studio (optional - just to verify)

npx cap open android

```

  

**Checkpoint:** If this works, you have Capacitor set up! ✅

  

---

  

## 🔧 Phase 2: Install Node.js Mobile Plugin (Day 1-2 - 3 hours)

  

### **Step 2.1: Install nodejs-mobile-cordova Plugin**

  

```bash

cd /home/kalito/kalito-labs/Luna/frontend

  

# Install the plugin

pnpm install nodejs-mobile-cordova

  

# Add to Capacitor Android project

cd android

npx cordova plugin add nodejs-mobile-cordova --save

cd ..

```

  

### **Step 2.2: Verify Installation**

  

Check that these directories were created:

```bash

ls -la android/app/src/main/assets/

# Should see: nodejs-project/ directory

```

  

### **Step 2.3: Create Mobile Backend Directory**

  

```bash

# Create Node.js project directory

mkdir -p android/app/src/main/assets/nodejs-project

  

# We'll copy backend files here in next phase

```

  

**Checkpoint:** Plugin installed successfully! ✅

  

---

  

## 📦 Phase 3: Prepare Backend for Mobile (Day 2-3 - 4 hours)

  

### **Step 3.1: Create Mobile Database Wrapper**

  

Create `backend/db/db-mobile.ts`:

  

```typescript

import initSqlJs from 'sql.js';

import fs from 'fs';

import path from 'path';

  

let SQL: any;

let db: any;

let dbPath: string;

  

export async function initDatabase(filePath: string) {

dbPath = filePath;

console.log('📂 Initializing sql.js database at:', dbPath);

// Initialize sql.js

SQL = await initSqlJs();

// Load existing database or create new

if (fs.existsSync(dbPath)) {

const buffer = fs.readFileSync(dbPath);

db = new SQL.Database(buffer);

console.log('✅ Database loaded from disk');

} else {

db = new SQL.Database();

console.log('✅ New database created');

// Initialize schema

await runSchema();

}

return db;

}

  

// Wrapper to match better-sqlite3 API

export function prepare(sql: string) {

return {

run: (...params: any[]) => {

db.run(sql, params);

saveDatabase();

return { changes: 1 }; // Mock return

},

get: (...params: any[]) => {

const result = db.exec(sql, params);

if (!result[0]) return undefined;

const { columns, values } = result[0];

if (values.length === 0) return undefined;

return Object.fromEntries(

columns.map((col, i) => [col, values[0][i]])

);

},

all: (...params: any[]) => {

const result = db.exec(sql, params);

if (!result[0]) return [];

const { columns, values } = result[0];

return values.map(row =>

Object.fromEntries(columns.map((col, i) => [col, row[i]]))

);

}

};

}

  

// Save database to disk

export function saveDatabase() {

const data = db.export();

fs.writeFileSync(dbPath, data);

}

  

// Get raw database instance

export function getDb() {

return db;

}

  

// Initialize schema (copy from backend/db/init.ts)

async function runSchema() {

// Copy all CREATE TABLE statements from backend/db/init.ts

// We'll do this in next step

}

```

  

### **Step 3.2: Install sql.js in Backend**

  

```bash

cd /home/kalito/kalito-labs/Luna/backend

pnpm install sql.js

```

  

### **Step 3.3: Create Mobile Server Entry Point**

  

Create `backend/server-mobile.js`:

  

```javascript

// Detect platform

const isMobile = process.platform === 'android' || process.platform === 'ios';

  

// Import rn-bridge if on mobile

let rn_bridge;

if (isMobile) {

rn_bridge = require('rn-bridge');

} else {

// Mock for desktop testing

rn_bridge = {

channel: {

on: () => {},

send: (msg) => console.log('[Mock Bridge]', msg)

}

};

}

  

// Import your Express app (we'll create this)

const { startMobileServer } = require('./dist/server-mobile-compiled.js');

  

// Start server

startMobileServer(rn_bridge)

.then(() => {

console.log('✅ Luna mobile backend started');

if (isMobile) {

rn_bridge.channel.send({ type: 'BACKEND_READY' });

}

})

.catch((err) => {

console.error('❌ Failed to start backend:', err);

if (isMobile) {

rn_bridge.channel.send({ type: 'BACKEND_ERROR', error: err.message });

}

});

  

// Handle messages from frontend

rn_bridge.channel.on('message', (msg) => {

console.log('📨 Message from frontend:', msg);

});

```

  

### **Step 3.4: Create Mobile Server Implementation**

  

Create `backend/server-mobile-compiled.ts`:

  

```typescript

import express from 'express';

import path from 'path';

import cors from 'cors';

import helmet from 'helmet';

import { initDatabase } from './db/db-mobile';

  

// Import your existing routers

import agentRouter from './routes/agentRouter';

import journalRouter from './routes/journalRouter';

import sessionRouter from './routes/sessionRouter';

// ... import all other routers

  

export async function startMobileServer(rn_bridge: any) {

const app = express();

const PORT = 3000;

  

// Get storage path (Android internal storage)

const storagePath = process.env.HOME || '/data/local/tmp';

const dbPath = path.join(storagePath, 'luna-data', 'kalito.db');

const backupsPath = path.join(storagePath, 'luna-data', 'backups');

  

console.log('📂 Storage path:', storagePath);

console.log('📂 Database path:', dbPath);

  

// Create directories

const fs = require('fs');

const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {

fs.mkdirSync(dbDir, { recursive: true });

}

if (!fs.existsSync(backupsPath)) {

fs.mkdirSync(backupsPath, { recursive: true });

}

  

// Initialize database

await initDatabase(dbPath);

  

// Middleware

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(helmet({

contentSecurityPolicy: false,

}));

  

// Health check

app.get('/health', (req, res) => {

res.json({

status: 'ok',

platform: process.platform,

dbPath: dbPath,

timestamp: Date.now()

});

});

  

// Register all your existing routes

app.use('/api/agent', agentRouter);

app.use('/api/journal', journalRouter);

app.use('/api/sessions', sessionRouter);

// ... register all other routers

  

// Error handling

app.use((err: any, req: any, res: any, next: any) => {

console.error('❌ Error:', err);

res.status(500).json({ error: err.message });

});

  

// Start server

return new Promise((resolve, reject) => {

const server = app.listen(PORT, '127.0.0.1', () => {

console.log(`✅ Luna backend listening on http://127.0.0.1:${PORT}`);

resolve(server);

});

  

server.on('error', reject);

});

}

```

  

### **Step 3.5: Update Backend Build Script**

  

Edit `backend/package.json`:

  

```json

{

"scripts": {

"build": "tsc",

"build:mobile": "tsc && node build-mobile.js",

"dev": "nodemon",

"start": "node dist/server.js"

}

}

```

  

Create `backend/build-mobile.js`:

  

```javascript

const fs = require('fs');

const path = require('path');

  

console.log('📦 Building mobile backend...');

  

// Copy compiled files to mobile assets

const sourceDir = path.join(__dirname, 'dist');

const targetDir = path.join(__dirname, '../frontend/android/app/src/main/assets/nodejs-project');

  

// Create target directory

if (!fs.existsSync(targetDir)) {

fs.mkdirSync(targetDir, { recursive: true });

}

  

// Copy all JS files

function copyRecursive(src, dest) {

if (fs.statSync(src).isDirectory()) {

if (!fs.existsSync(dest)) fs.mkdirSync(dest);

fs.readdirSync(src).forEach(file => {

copyRecursive(path.join(src, file), path.join(dest, file));

});

} else {

fs.copyFileSync(src, dest);

}

}

  

copyRecursive(sourceDir, targetDir);

  

// Copy package.json (with mobile dependencies only)

const pkg = require('./package.json');

const mobilePkg = {

name: 'luna-mobile-backend',

version: pkg.version,

main: 'server-mobile.js',

dependencies: {

// Only include runtime dependencies

'express': pkg.dependencies.express,

'cors': pkg.dependencies.cors,

'helmet': pkg.dependencies.helmet,

'sql.js': pkg.dependencies['sql.js'],

'zod': pkg.dependencies.zod,

// Add other runtime dependencies (NOT devDependencies)

}

};

  

fs.writeFileSync(

path.join(targetDir, 'package.json'),

JSON.stringify(mobilePkg, null, 2)

);

  

console.log('✅ Mobile backend built successfully!');

```

  

**Checkpoint:** Backend is ready for mobile! ✅

  

---

  

## 🎨 Phase 4: Update Frontend for Mobile (Day 3 - 2 hours)

  

### **Step 4.1: Add Capacitor Detection to App.vue**

  

Edit `frontend/src/App.vue`:

  

```vue

<script setup lang="ts">

import { onMounted, ref } from 'vue';

import { Capacitor } from '@capacitor/core';

  

const isBackendReady = ref(false);

const backendError = ref('');

const isNative = Capacitor.isNativePlatform();

  

onMounted(async () => {

if (isNative) {

console.log('🤖 Running on native platform');

await startMobileBackend();

} else {

console.log('🌐 Running on web platform');

isBackendReady.value = true;

}

});

  

async function startMobileBackend() {

try {

// Check if nodejs plugin is available

if (!(window as any).nodejs) {

throw new Error('nodejs-mobile plugin not found');

}

  

console.log('🚀 Starting Node.js backend...');

// Start Node.js

(window as any).nodejs.start('server-mobile.js');

  

// Listen for backend ready message

(window as any).nodejs.channel.on('message', (msg: any) => {

console.log('📨 Message from backend:', msg);

if (msg.type === 'BACKEND_READY') {

console.log('✅ Backend ready!');

isBackendReady.value = true;

} else if (msg.type === 'BACKEND_ERROR') {

console.error('❌ Backend error:', msg.error);

backendError.value = msg.error;

}

});

  

// Wait for backend to be ready (with timeout)

await waitForBackend(30000); // 30 second timeout

} catch (err: any) {

console.error('❌ Failed to start backend:', err);

backendError.value = err.message;

}

}

  

async function waitForBackend(timeout = 30000) {

const startTime = Date.now();

while (!isBackendReady.value && Date.now() - startTime < timeout) {

try {

const response = await fetch('http://localhost:3000/health');

if (response.ok) {

console.log('✅ Backend health check passed');

isBackendReady.value = true;

return;

}

} catch (e) {

// Backend not ready yet, wait and retry

console.log('⏳ Waiting for backend...');

await new Promise(resolve => setTimeout(resolve, 500));

}

}

if (!isBackendReady.value) {

throw new Error('Backend failed to start within timeout');

}

}

</script>

  

<template>

<div id="app">

<!-- Show loading screen while backend starts -->

<div v-if="isNative && !isBackendReady && !backendError" class="loading-screen">

<div class="loading-content">

<div class="spinner"></div>

<h2>🌙 Luna</h2>

<p>Starting your personal wellness companion...</p>

</div>

</div>

  

<!-- Show error if backend fails -->

<div v-else-if="backendError" class="error-screen">

<h2>❌ Error Starting Backend</h2>

<p>{{ backendError }}</p>

<button @click="() => window.location.reload()">Retry</button>

</div>

  

<!-- Show app when ready -->

<RouterView v-else />

</div>

</template>

  

<style scoped>

.loading-screen {

display: flex;

align-items: center;

justify-content: center;

min-height: 100vh;

background: linear-gradient(135deg, #0e121a 0%, #1a1f2e 100%);

}

  

.loading-content {

text-align: center;

color: white;

}

  

.spinner {

width: 50px;

height: 50px;

border: 4px solid rgba(139, 92, 246, 0.3);

border-top-color: #8b5cf6;

border-radius: 50%;

animation: spin 1s linear infinite;

margin: 0 auto 2rem;

}

  

@keyframes spin {

to { transform: rotate(360deg); }

}

  

.error-screen {

display: flex;

flex-direction: column;

align-items: center;

justify-content: center;

min-height: 100vh;

background: linear-gradient(135deg, #0e121a 0%, #1a1f2e 100%);

color: white;

padding: 2rem;

text-align: center;

}

  

.error-screen button {

margin-top: 1rem;

padding: 0.75rem 2rem;

background: #8b5cf6;

color: white;

border: none;

border-radius: 8px;

cursor: pointer;

font-size: 1rem;

}

</style>

```

  

### **Step 4.2: Update API Base URL**

  

Create or update `frontend/src/utils/api-config.ts`:

  

```typescript

import { Capacitor } from '@capacitor/core';

  

export function getApiBaseUrl(): string {

// On native platform, backend runs on localhost:3000

if (Capacitor.isNativePlatform()) {

return 'http://localhost:3000';

}

// On web, use Vite proxy (development) or relative path (production)

return import.meta.env.DEV ? '/api' : '/api';

}

  

export const API_BASE_URL = getApiBaseUrl();

```

  

Update your API calls to use this:

  

```typescript

// Instead of hardcoded URLs, use:

import { API_BASE_URL } from '@/utils/api-config';

  

const response = await fetch(`${API_BASE_URL}/journal`, {

method: 'POST',

// ...

});

```

  

**Checkpoint:** Frontend ready for mobile! ✅

  

---

  

## 🔨 Phase 5: Build and Test (Day 4 - 4 hours)

  

### **Step 5.1: Build Everything**

  

```bash

# 1. Build backend for mobile

cd /home/kalito/kalito-labs/Luna/backend

pnpm run build:mobile

  

# 2. Build frontend

cd ../frontend

pnpm run build

  

# 3. Sync to Android

npx cap sync android

```

  

### **Step 5.2: Configure Android Permissions**

  

Edit `frontend/android/app/src/main/AndroidManifest.xml`:

  

Add before `<application>`:

  

```xml

<uses-permission android:name="android.permission.INTERNET" />

<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

```

  

Inside `<application>` tag, add:

  

```xml

android:usesCleartextTraffic="true"

android:networkSecurityConfig="@xml/network_security_config"

```

  

Create `frontend/android/app/src/main/res/xml/network_security_config.xml`:

  

```xml

<?xml version="1.0" encoding="utf-8"?>

<network-security-config>

<domain-config cleartextTrafficPermitted="true">

<domain includeSubdomains="true">localhost</domain>

<domain includeSubdomains="true">127.0.0.1</domain>

</domain-config>

</network-security-config>

```

  

### **Step 5.3: Test on Device**

  

```bash

# Connect your Android device via USB

# Make sure USB debugging is enabled

  

# Check device is connected

adb devices

  

# Run on device

npx cap run android

```

  

**Or use Android Studio:**

  

```bash

# Open project in Android Studio

npx cap open android

  

# Click the green "Run" button

```

  

### **Step 5.4: Watch Logs**

  

In a separate terminal:

  

```bash

# Watch all logs

adb logcat

  

# Or filter for Luna/Node.js

adb logcat | grep -E "nodejs|Luna|System.out"

```

  

**Checkpoint:** App running on device! ✅

  

---

  

## 🐛 Phase 6: Debug and Fix Issues (Day 4-5 - Variable)

  

### **Common Issues and Solutions**

  

#### **Issue 1: "nodejs-mobile plugin not found"**

  

**Solution:**

```bash

cd frontend/android

npx cordova plugin add nodejs-mobile-cordova --force

cd ..

npx cap sync android

```

  

#### **Issue 2: Backend not starting**

  

**Check logs:**

```bash

adb logcat | grep nodejs

```

  

**Solution:** Verify `server-mobile.js` exists in:

```

frontend/android/app/src/main/assets/nodejs-project/server-mobile.js

```

  

#### **Issue 3: Database errors**

  

**Solution:** Check sql.js is installed:

```bash

cd backend

pnpm list sql.js

```

  

Make sure it's in `dependencies`, not `devDependencies`.

  

#### **Issue 4: "Cannot find module"**

  

**Solution:** Rebuild mobile backend:

```bash

cd backend

rm -rf ../frontend/android/app/src/main/assets/nodejs-project

pnpm run build:mobile

cd ../frontend

npx cap sync android

```

  

#### **Issue 5: App crashes on startup**

  

**Check crash logs:**

```bash

adb logcat | grep -i "crash\|error\|exception"

```

  

**Common causes:**

- Missing permissions in AndroidManifest.xml

- nodejs-mobile plugin not installed correctly

- Backend compilation errors

  

### **Debug Checklist**

  

- [ ] Check `adb devices` shows your device

- [ ] Verify nodejs-mobile plugin installed

- [ ] Check `server-mobile.js` exists in assets

- [ ] Watch logcat for errors

- [ ] Test `/health` endpoint: `adb shell curl http://localhost:3000/health`

- [ ] Verify database directory created: `adb shell ls /data/data/com.kalitospace.luna/files/`

  

---

  

## 📱 Phase 7: Generate Release APK (Day 6 - 2 hours)

  

### **Step 7.1: Build Release APK**

  

```bash

cd /home/kalito/kalito-labs/Luna/frontend/android

  

# Build unsigned release APK

./gradlew assembleRelease

```

  

**Output location:**

```

frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk

```

  

### **Step 7.2: Sign APK (Optional for personal use)**

  

For personal testing, unsigned APK works fine. For distribution:

  

```bash

# Generate keystore (first time only)

keytool -genkey -v -keystore luna-release-key.keystore -alias luna -keyalg RSA -keysize 2048 -validity 10000

  

# Sign APK

jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore luna-release-key.keystore app-release-unsigned.apk luna

  

# Verify

jarsigner -verify -verbose -certs app-release-unsigned.apk

```

  

### **Step 7.3: Install APK**

  

```bash

# Install on connected device

adb install -r frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk

  

# Or copy APK to device and install manually

```

  

---

  

## ✅ Success Checklist

  

You've successfully created Luna Android APK if:

  

- [ ] APK installs on device without errors

- [ ] App opens and shows Luna interface

- [ ] Backend starts (check with health endpoint)

- [ ] Database operations work (create journal entry)

- [ ] All features work (Chat, Journal, Reflect, Coping, Mindfulness)

- [ ] Data persists after closing app

- [ ] Works offline (no internet needed)

- [ ] Logs show no critical errors

  

---

  

## 🎯 Next Steps After Success

  

### **Continue Development Workflow**

  

```bash

# Daily development (on laptop)

cd /home/kalito/kalito-labs/Luna

cd backend && pnpm run dev # Terminal 1

cd frontend && pnpm run dev # Terminal 2

  

# Test changes on web first (http://localhost:5173)

# When ready to test on Android:

cd backend && pnpm run build:mobile

cd ../frontend && pnpm run build && npx cap sync android && npx cap run android

```

  

### **Backup Strategy**

  

```bash

# Backup Android database

adb pull /data/data/com.kalitospace.luna/files/luna-data/kalito.db ~/luna-android-backup.db

  

# Restore to Android

adb push ~/luna-android-backup.db /data/data/com.kalitospace.luna/files/luna-data/kalito.db

```

  

### **Update Process**

  

When you add new features:

  

1. Develop on laptop (`npm run dev`)

2. Test in browser

3. Rebuild mobile backend: `pnpm run build:mobile`

4. Build frontend: `pnpm run build`

5. Sync: `npx cap sync android`

6. Run: `npx cap run android`

  

---

  

## 📞 Getting Help

  

### **If You Get Stuck**

  

1. **Check logs first:**

```bash

adb logcat | grep -E "nodejs|Luna|Error|Exception"

```

  

2. **Verify plugin installation:**

```bash

cd frontend/android

cordova plugin list

# Should show: nodejs-mobile-cordova

```

  

3. **Test backend separately:**

```bash

# Copy backend to test directory

# Run with: node server-mobile.js

# Check if it starts without errors

```

  

4. **Search for similar issues:**

- [nodejs-mobile Issues](https://github.com/nodejs-mobile/nodejs-mobile/issues)

- [Capacitor Issues](https://github.com/ionic-team/capacitor/issues)

  

### **Resources**

  

- **Node.js Mobile Docs**: https://github.com/nodejs-mobile/nodejs-mobile

- **Capacitor Docs**: https://capacitorjs.com/docs

- **sql.js Docs**: https://sql.js.org/documentation/

- **Your Docs**: `/home/kalito/kalito-labs/Luna/docs/mobile/`

  

---

  

## 🎉 Completion

  

When you see Luna running on your Android device with:

- ✅ Node.js backend running locally

- ✅ sql.js database working

- ✅ All features functional

- ✅ Data persisting offline

  

**You did it! 🌙**

  

Your personal mental health companion now lives on your phone, completely private, completely offline, completely yours.

  

---

  

_Created: November 5, 2025_

_Kalito Space - Building the future of private mental health tech._

  

🌙 **Let's build Luna for Android!**