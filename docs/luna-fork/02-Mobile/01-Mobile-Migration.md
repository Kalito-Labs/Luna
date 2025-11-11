## Overview

This guide explains how to convert Luna from a web application into a native Android app using **Capacitor**, while keeping the entire backend (Express server + SQLite database) running **locally on the device**.

---
## 🎯 Goal

Transform Luna into a fully self-contained Android app where:

- ✅ **Frontend**: Vue 3 app runs as native Android UI
- ✅ **Backend**: Express server runs on the device (no external server needed)
- ✅ **Database**: SQLite database lives entirely on the device
- ✅ **Privacy**: All data stays local, works offline, no network dependency
- ✅ **Portability**: Use Luna anywhere without needing your laptop
---
## 🚧 The Challenge

Luna currently has a **two-process architecture**:

1. **Frontend** (Vue 3 + Vite) - Port 5173
2. **Backend** (Express + TypeScript) - Port 3000

Traditional Capacitor apps are **frontend-only** (static HTML/CSS/JS). Running a Node.js backend inside an Android app requires special approaches.

---

## 🛠️ Solution: 

  ### **Node.js Mobile (Recommended for Luna)**

Run the actual Node.js backend inside the Android app using `nodejs-mobile`.
#### **How It Works:**

- `nodejs-mobile-cordova` plugin embeds a full Node.js runtime in the Android app
- Your Express server runs as a background thread
- Frontend communicates with backend via `localhost:3000`
- SQLite database stored in Android app's private storage
#### **Pros:**

- ✅ Keep existing backend code (Express, better-sqlite3)
- ✅ True offline operation
- ✅ No code rewriting needed
- ✅ Maximum privacy (nothing leaves device)
#### **Cons:**

- ⚠️ Larger app size (~40-50MB due to Node.js runtime)
- ⚠️ More complex build process
- ⚠️ Native modules (like better-sqlite3) may need compilation for Android
#### **Best For:**

Luna's architecture - complex backend logic, existing Express server, full Node.js features

---
## 🚀 Implementation Plan

### **Phase 1: Setup Capacitor**

#### **1.1 Install Capacitor**

```bash

cd /home/kalito/kalito-labs/Luna/frontend

  

# Install Capacitor

npm install @capacitor/core @capacitor/cli

npx cap init

  

# Enter app details when prompted:

# App name: Luna

# App ID: com.kalitospace.luna

# (Use your own package ID)

```

  

#### **1.2 Add Android Platform**

```bash

# Install Android platform

npm install @capacitor/android

npx cap add android

  

# This creates /frontend/android/ directory

```

  

#### **1.3 Configure capacitor.config.ts**

```typescript

// frontend/capacitor.config.ts

import { CapacitorConfig } from '@capacitor/cli';

  

const config: CapacitorConfig = {

appId: 'com.kalitospace.luna',

appName: 'Luna',

webDir: 'dist',

server: {

// Point to Node.js backend running on device

url: 'http://localhost:3000',

cleartext: true // Allow HTTP on localhost

},

android: {

allowMixedContent: true

}

};

  

export default config;

```

  

---

  

### **Phase 2: Integrate Node.js Mobile**

  

#### **2.1 Install nodejs-mobile-cordova**

```bash
cd /home/kalito/kalito-labs/Luna/frontend/android

# Add nodejs-mobile plugin

cordova plugin add nodejs-mobile-cordova

# Or if using npm:

npm install nodejs-mobile-cordova
```

#### **2.2 Copy Backend to Mobile Bundle**

```bash

# Create Node.js project directory

mkdir -p android/app/src/main/assets/nodejs-project

  

# Copy backend files

cp -r ../../backend/* android/app/src/main/assets/nodejs-project/

  

# Copy package.json

cp ../../backend/package.json android/app/src/main/assets/nodejs-project/

```

  

#### **2.3 Configure Backend for Mobile**

```javascript

// backend/server-mobile.ts (new file)

import express from 'express';

import path from 'path';

import { initializeDatabase } from './db/init';

  

const app = express();

const PORT = 3000;

  

// Get Android app's internal storage path

const getDataPath = () => {

// On Android, use app's private directory

if (typeof process.env.ANDROID_DATA !== 'undefined') {

return process.env.ANDROID_DATA;

}

// Fallback for development

return path.join(__dirname, 'db');

};

  

// Initialize database in Android storage

const dbPath = path.join(getDataPath(), 'kalito.db');

initializeDatabase(dbPath);

  

// ... rest of Express setup (middleware, routes, etc.)

  

app.listen(PORT, '127.0.0.1', () => {

console.log(`Luna backend running on device at http://localhost:${PORT}`);

});

```

  

#### **2.4 Create package.json for Mobile Backend**

```json

{

"name": "luna-mobile-backend",

"version": "1.0.0",

"main": "server-mobile.js",

"scripts": {

"start": "node server-mobile.js"

},

"dependencies": {

"express": "^4.18.2",

"better-sqlite3": "^9.2.2",

"helmet": "^7.1.0",

"cors": "^2.8.5",

"zod": "^3.22.4"

// ... all backend dependencies

}

}

```

  

---

  

### **Phase 3: Handle Native Modules**

  

#### **3.1 Problem: better-sqlite3**

`better-sqlite3` is a native module (requires C++ compilation). It may not work directly in nodejs-mobile.

#### **3.2 Solution Options:**

**Use sql.js (Recommended)**
```bash

npm install sql.js

```

```typescript
// backend/db/db-mobile.ts

import initSqlJs from 'sql.js';
import fs from 'fs';

let db: any = null;

export async function initMobileDatabase(dbPath: string) {

const SQL = await initSqlJs();

// Load existing database or create new

if (fs.existsSync(dbPath)) {

const buffer = fs.readFileSync(dbPath);

db = new SQL.Database(buffer);

} else {

db = new SQL.Database();

// Run schema initialization

}

return db;

}

  

// Save database to disk periodically

export function saveMobileDatabase(dbPath: string) {

const data = db.export();

fs.writeFileSync(dbPath, data);

}

```
---

### **Phase 4: Modify Frontend**

#### **4.1 Update API Client**

```typescript

// frontend/src/utils/api-client.ts

const getBaseURL = () => {
// In production (on device), backend runs on localhost:3000
if (import.meta.env.PROD) {
return 'http://localhost:3000';
}
// In development, use Vite proxy
return '/api';
};

export const apiClient = {
baseURL: getBaseURL(),
// ... rest of API client
};
```

  

#### **4.2 Add Startup Logic**

```vue

<!-- frontend/src/App.vue -->

<script setup lang="ts">

import { onMounted } from 'vue';

import { Capacitor } from '@capacitor/core';

  

onMounted(async () => {

if (Capacitor.isNativePlatform()) {

console.log('Running on native platform');

// Start Node.js backend

if (window.nodejs) {

window.nodejs.start('server-mobile.js');

// Wait for backend to be ready

await waitForBackend();

}

}

});

  

async function waitForBackend() {

const maxRetries = 30;

for (let i = 0; i < maxRetries; i++) {

try {

const response = await fetch('http://localhost:3000/health');

if (response.ok) {

console.log('Backend ready!');

return;

}

} catch (e) {

console.log('Waiting for backend...', i);

await new Promise(resolve => setTimeout(resolve, 1000));

}

}

throw new Error('Backend failed to start');

}

</script>

```

  

#### **4.3 Add Health Check Endpoint**

```typescript

// backend/routes/healthRouter.ts

import { Router } from 'express';

  

const router = Router();

  

router.get('/health', (req, res) => {

res.json({ status: 'ok', timestamp: Date.now() });

});

  

export default router;

```

  

---

  

### **Phase 5: Handle Android Permissions**

  

#### **5.1 Update AndroidManifest.xml**

```xml

<!-- frontend/android/app/src/main/AndroidManifest.xml -->

<manifest>

<uses-permission android:name="android.permission.INTERNET" />

<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

<!-- Allow cleartext traffic for localhost -->

<application

android:usesCleartextTraffic="true"

android:networkSecurityConfig="@xml/network_security_config">

<!-- ... -->

</application>

</manifest>

```

  

#### **5.2 Create Network Security Config**

```xml

<!-- frontend/android/app/src/main/res/xml/network_security_config.xml -->

<?xml version="1.0" encoding="utf-8"?>

<network-security-config>

<domain-config cleartextTrafficPermitted="true">

<domain includeSubdomains="true">localhost</domain>

<domain includeSubdomains="true">127.0.0.1</domain>

</domain-config>

</network-security-config>

```

  

---

  

### **Phase 6: Build and Test**

  

#### **6.1 Build Frontend**

```bash

cd /home/kalito/kalito-labs/Luna/frontend

  

# Build production frontend

npm run build

  

# Copy to Capacitor

npx cap sync android

```

  

#### **6.2 Open Android Studio**

```bash

npx cap open android

```

  

#### **6.3 Configure Android Studio**

1. Install Android Studio (if not already installed)
2. Open the `frontend/android` project
3. Let Gradle sync
4. Connect Android device or start emulator
5. Click "Run" (green play button)
#### **6.4 Debug Backend**

```bash

# View Android logs (including Node.js console.log)

adb logcat | grep -i nodejs

```

  

---

  

### **Phase 7: Database Storage Path**

  

#### **7.1 Android Storage Locations**

```typescript

// backend/utils/storage.ts

import path from 'path';

  

export function getStoragePath() {

// Android app's private internal storage

// e.g., /data/data/com.kalitospace.luna/files/

const androidDataPath = process.env.ANDROID_DATA ||

process.env.HOME ||

'/data/local/tmp';

return path.join(androidDataPath, 'luna-data');

}

  

export function getDatabasePath() {

return path.join(getStoragePath(), 'kalito.db');

}

  

export function getBackupsPath() {

return path.join(getStoragePath(), 'backups');

}

```

  

#### **7.2 Initialize Directories**

```typescript

// backend/server-mobile.ts

import fs from 'fs';

import { getStoragePath, getDatabasePath, getBackupsPath } from './utils/storage';

  

// Create directories on startup

const storagePath = getStoragePath();

const backupsPath = getBackupsPath();

  

if (!fs.existsSync(storagePath)) {

fs.mkdirSync(storagePath, { recursive: true });

}

  

if (!fs.existsSync(backupsPath)) {

fs.mkdirSync(backupsPath, { recursive: true });

}

  

console.log('Database path:', getDatabasePath());

console.log('Backups path:', backupsPath);

```

  

---

  

## 🔧 Alternative: Simplified Approach (If nodejs-mobile is too complex)

  

If `nodejs-mobile` proves too difficult, consider a **hybrid approach**:

  

### **Step 1: Move Database to Frontend**

```bash

npm install @capacitor-community/sqlite

```

  

### **Step 2: Create Database Service**

```typescript

// frontend/src/services/database.ts

import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

  

class DatabaseService {

private sqlite = new SQLiteConnection(CapacitorSQLite);

private db: any;

  

async init() {

this.db = await this.sqlite.createConnection('luna', false, 'no-encryption', 1);

await this.db.open();

await this.runMigrations();

}

  

async runMigrations() {

// Run all CREATE TABLE statements

const schema = `

CREATE TABLE IF NOT EXISTS journal_entries (

id INTEGER PRIMARY KEY AUTOINCREMENT,

content TEXT NOT NULL,

created_at INTEGER NOT NULL

);

-- ... all other tables

`;

await this.db.execute(schema);

}

  

async query(sql: string, params: any[] = []) {

return await this.db.query(sql, params);

}

}

  

export const db = new DatabaseService();

```

  

### **Step 3: Minimal Backend for AI Only**

Keep a tiny Express server that ONLY handles:

- OpenAI API calls

- Tavily search

- Other external APIs

  

But move ALL database operations to frontend.

  

---

  

## 📦 Project Structure After Migration

  

```

Luna/

├── frontend/

│ ├── src/ # Vue 3 app

│ ├── android/ # Capacitor Android project

│ │ ├── app/

│ │ │ └── src/

│ │ │ └── main/

│ │ │ ├── assets/

│ │ │ │ └── nodejs-project/ # Embedded backend

│ │ │ │ ├── server-mobile.js

│ │ │ │ ├── db/

│ │ │ │ ├── routes/

│ │ │ │ └── package.json

│ │ │ └── AndroidManifest.xml

│ │ └── build.gradle

│ ├── capacitor.config.ts

│ └── package.json

│

├── backend/ # Original backend (for development)

│ ├── server.ts # Development server

│ ├── server-mobile.ts # Mobile server (NEW)

│ └── ...

│

└── docs/

└── mobile/

└── android-migration-guide.md

```

  

---

  

## 🔍 Testing Strategy

  

### **Development Testing**

1. **Web version**: Continue using `npm run dev` with laptop backend

2. **Android emulator**: Test with embedded backend

3. **Physical device**: Install APK for real-world testing

  

### **Database Testing**

```typescript

// Add debug endpoint

router.get('/debug/database-info', (req, res) => {

res.json({

dbPath: getDatabasePath(),

exists: fs.existsSync(getDatabasePath()),

size: fs.statSync(getDatabasePath()).size,

tables: db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()

});

});

```

  

### **Log Everything**

```typescript

// backend/server-mobile.ts

console.log('=== Luna Mobile Backend Starting ===');

console.log('Platform:', process.platform);

console.log('Arch:', process.arch);

console.log('Node version:', process.version);

console.log('Database path:', getDatabasePath());

console.log('Storage path:', getStoragePath());

```

  

---

  

## ⚠️ Potential Issues & Solutions

  

### **Issue 1: Backend Takes Too Long to Start**

**Solution:** Add splash screen with loading indicator

```typescript

// frontend/src/App.vue

const isBackendReady = ref(false);

  

onMounted(async () => {

showSplashScreen();

await waitForBackend();

isBackendReady.value = true;

hideSplashScreen();

});

```

  

### **Issue 2: Native Module Compilation Fails**

**Solution:** Use pure JavaScript alternatives

- `better-sqlite3` → `sql.js`

- Native crypto → `crypto-js`

  

### **Issue 3: Large App Size**

**Solution:**

- Remove dev dependencies from mobile bundle

- Use ProGuard for code shrinking

- Expected size: 40-60MB (acceptable for modern phones)

  

### **Issue 4: Memory Usage**

**Solution:**

- Limit AI context window size

- Implement database query pagination

- Clear old memories periodically

  

### **Issue 5: Battery Drain**

**Solution:**

- Shut down backend when app is backgrounded

- Use Android WorkManager for background tasks

- Implement efficient database indexing

  

---

  

## 🎯 Estimated Timeline

  

### **Week 1: Setup & Infrastructure**

- [ ] Install Capacitor

- [ ] Add Android platform

- [ ] Integrate nodejs-mobile plugin

- [ ] Configure basic Android build

  

### **Week 2: Backend Migration**

- [ ] Create server-mobile.ts

- [ ] Handle native modules (better-sqlite3 → sql.js)

- [ ] Test database operations on Android

- [ ] Implement storage paths

  

### **Week 3: Frontend Integration**

- [ ] Update API client for native platform

- [ ] Add backend startup logic

- [ ] Implement health checks

- [ ] Handle loading states

  

### **Week 4: Testing & Polish**

- [ ] Test all features on emulator

- [ ] Test on physical device

- [ ] Fix bugs and performance issues

- [ ] Add error handling

  

### **Week 5: Optimization**

- [ ] Reduce app size

- [ ] Improve startup time

- [ ] Battery optimization

- [ ] Add splash screen

  

---

  

## 📚 Resources

  

### **Official Documentation**

- [Capacitor Docs](https://capacitorjs.com/docs)

- [nodejs-mobile](https://github.com/nodejs-mobile/nodejs-mobile)

- [nodejs-mobile-cordova](https://github.com/nodejs-mobile/nodejs-mobile-cordova)

  

### **Tutorials**

- [Running Node.js in Android Apps](https://www.janeasystems.com/blog/running-node-js-on-android/)

- [Capacitor SQLite Plugin](https://github.com/capacitor-community/sqlite)

  

### **Community**

- [Capacitor Discord](https://discord.gg/capacitor)

- [nodejs-mobile Issues](https://github.com/nodejs-mobile/nodejs-mobile/issues)

  

---

  

## 🚀 Next Steps

  

1. **Experiment with nodejs-mobile**

- Create a minimal test app

- Verify native modules work

- Test backend startup time

  

2. **Evaluate Alternatives**

- If nodejs-mobile is too complex, try Capacitor SQLite approach

- Consider React Native if complete rewrite is acceptable

  

3. **Plan Data Migration**

- Export existing database

- Import into mobile app

- Test data integrity

  

4. **Security Considerations**

- Implement app-level encryption

- Add biometric authentication

- Secure API keys (use Android Keystore)

  

---

  

## 💡 Final Recommendation

  

**For Luna specifically, I recommend starting with Approach 1 (nodejs-mobile)** because:

  

1. ✅ **Minimal Code Changes**: Keep 95% of backend code unchanged

2. ✅ **True Offline**: No network dependency

3. ✅ **Maximum Privacy**: All AI processing can stay local (Phi3 via Ollama)

4. ✅ **Feature Parity**: All 13 tables, 9 routers work as-is

5. ✅ **Future-Proof**: Easy to add more backend features

  

**Start small:**

- Build a "Hello World" Capacitor app with nodejs-mobile

- Get backend responding to `/health` endpoint

- Test database read/write

- Then migrate full Luna app

  

The complexity is front-loaded (setup), but once working, development is smooth.

  

---

  

## 📞 Questions to Resolve

  

Before starting, decide:

  

1. **AI Strategy**:

- Keep OpenAI (requires internet)?

- Or bundle Ollama for true offline AI?

  

2. **Database Size**:

- How large will your database grow?

- Need cloud backup strategy?

  

3. **Platform Priority**:

- Android only?

- iOS later? (nodejs-mobile supports iOS too)

  

4. **Development Environment**:

- Need Android device for testing?

- Or emulator sufficient?

  

---

  

_Last Updated: November 5, 2025_

_Kalito Space - Building privacy-first mobile mental health tools._

  

🌙 **Luna on Android - Your wellness companion, anywhere you go.**