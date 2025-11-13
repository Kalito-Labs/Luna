## ✅ Development Workflow After APK Creation

You'll maintain **two separate development modes**:

### **1. Web Development Mode** (95% of your time)
```bash
# Terminal 1: Backend
cd backend
npm run dev
# → Running on http://localhost:3000

# Terminal 2: Frontend  
cd frontend
npm run dev
# → Running on http://localhost:5173
# → Open http://localhost:5173 in browser
```

**Everything works exactly as it does now!**
- ✅ Full hot reload
- ✅ Fast iteration
- ✅ Easy debugging with browser DevTools
- ✅ No need to rebuild APK
- ✅ Desktop SQLite database (better-sqlite3)

### **2. Android Testing Mode** (Only when needed)
```bash
# Build and test on Android
cd frontend
npm run build
npx cap sync android
npx cap run android
```

**Only use this for:**
- Testing mobile-specific features
- Checking UI on real device
- Testing Node.js Mobile integration
- Before release

---

## 🔄 Complete Development Cycle

### **Daily Coding Workflow**

```bash
# 1. Start development servers (like you do now)
cd /home/kalito/kalito-labs/Luna

# Terminal 1
cd backend && npm run dev

# Terminal 2  
cd frontend && npm run dev

# 2. Code in browser (http://localhost:5173)
# - Make changes to Vue components
# - Test journal, chat, etc.
# - Hot reload works instantly

# 3. Test on Android only when needed
cd frontend
npm run build && npx cap run android
```

### **When to Test on Android**

```bash
# Test weekly or when you:
# - Add new features that might behave differently on mobile
# - Change API endpoints
# - Update database schema
# - Want to test on real device
# - Prepare for release
```

---

## 🎯 The APK is Separate from Development

Think of it this way:

```
┌────────────────────────────────────────────┐
│     Development (Web) - npm run dev       │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   Backend    │      │   Frontend   │   │
│  │  Port 3000   │◄────►│  Port 5173   │   │
│  │              │      │              │   │
│  │ better-sqlite3│      │  Browser    │   │
│  └──────────────┘      └──────────────┘   │
│                                            │
│  ✅ Fast iteration                         │
│  ✅ Hot reload                             │
│  ✅ DevTools                               │
└────────────────────────────────────────────┘

                    ↓ Build APK when ready

┌────────────────────────────────────────────┐
│     Production (APK) - Android Device      │
│  ┌──────────────────────────────────────┐  │
│  │   Node.js Mobile + sql.js            │  │
│  │   (Embedded backend)                 │  │
│  │                                      │  │
│  │   Vue App                            │  │
│  │   (Static files)                    │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ✅ Self-contained                         │
│  ✅ Offline                                │
│  ✅ Private                                │
└────────────────────────────────────────────┘
```

---

## 💡 Best Practice: Conditional Backend Logic

You can even make your backend work in **both modes**:

```typescript
// backend/db/db.ts
const isDevelopment = process.env.NODE_ENV !== 'production';
const isMobile = process.platform === 'android';

let db: any;

if (isMobile) {
  // Mobile: Use sql.js
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  db = new SQL.Database(buffer);
} else {
  // Desktop: Use better-sqlite3
  const Database = require('better-sqlite3');
  db = new Database(dbPath);
}

export default db;
```

This way:
- **Development**: Uses `better-sqlite3` (faster, no manual saves)
- **Android**: Uses `sql.js` (cross-platform, works on mobile)

---

## 🔧 Even Better: Use Environment Detection

```typescript
// backend/server.ts vs backend/server-mobile.js

// server.ts (development - what you use now)
import Database from 'better-sqlite3';
const db = new Database('backend/db/kalito.db');
// ... existing Express setup

// server-mobile.js (Android only)
import initSqlJs from 'sql.js';
const SQL = await initSqlJs();
const db = new SQL.Database(buffer);
// ... same Express setup, different DB
```

**You only need to maintain TWO small differences:**
1. Database initialization
2. File paths (Android uses `process.env.HOME`)

**Everything else stays identical!**

---

## 📊 Development Time Breakdown

```
Week 1-4: Pure web development (npm run dev)
├─ Code features
├─ Test in browser
├─ Iterate quickly
└─ NEVER touch Android

Week 5: Android testing
├─ Build APK once
├─ Test on device
├─ Fix any mobile-specific issues
└─ Back to web development

Release Day:
└─ Build final APK with: npm run build && npx cap build android
```

---

## 🚀 Example Development Session

```bash
# Monday - Friday (web development)
$ cd backend && npm run dev  # Leave running
$ cd frontend && npm run dev  # Leave running

# Code in VSCode → Save → Browser auto-refreshes
# Add features, fix bugs, iterate

# Friday afternoon (test on Android)
$ cd frontend
$ npm run build
$ npx cap run android
# Test on device for 30 minutes
# Find any issues? Fix in web mode next week!
```

---

## ✅ Key Points

1. **APK ≠ Development Environment**
   - APK is for deployment/testing only
   - Development stays web-based (`npm run dev`)

2. **Separate Codebases**
   - server.ts = Development
   - `backend/server-mobile.js` = Android
   - Share 95% of code between them

3. **Test Frequency**
   - Web: Constantly (every change)
   - Android: Weekly or before release

4. **Database**
   - Development: kalito.db (better-sqlite3)
   - Android: `/data/data/.../kalito.db` (sql.js)
   - Can export/import between them for testing

5. **No Disruption**
   - Creating APK doesn't change your dev workflow
   - You'll code exactly as you do now
   - Android is just an additional deployment target

---

## 💡 Bottom Line

**Creating an APK doesn't change anything about how you develop!**

- ✅ Keep using `npm run dev` for backend and frontend
- ✅ Code in browser with hot reload
- ✅ Test on Android only when needed (weekly or before release)
- ✅ APK is just a packaged version of your app, not a development environment

Think of the APK like compiling a desktop app - you still develop in your code editor and test locally. The compiled version is only for distribution!