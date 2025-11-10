# **Project Refactor Plan: Migrating to a Self-Contained Capacitor + Native SQLite Architecture**

## **1. Overview**

This project currently runs as:

- **Frontend:** Vue 3 + Vite
- **Backend:** Express (TypeScript) with SQLite + Winston
- **Purpose:** Eldercare platform for managing medications, appointments, doctors, and vitals
- **Goal:** Convert the system into a **self-contained mobile app** that runs entirely offline and requires no external hosting.

We are **deprecating the Express + Node.js backend** and migrating to **Capacitor + Native SQLite** to simplify architecture, improve reliability, and ensure full offline persistence.

---
## **2. Architectural Justification**

### **Problem with Current Setup**

- The app depends on a Node.js backend process that must be hosted or embedded.
- Node.js Mobile is outdated and fragile for production Android builds.
- Express introduces unnecessary HTTP overhead between frontend and backend.
- SQLite database lives outside the mobile environment.

### **Target Outcomes**

- One unified codebase: Vue 3 + TypeScript only.
- Local database persistence using native SQLite APIs.
- Full offline functionality for CRUD operations.
- Optional online sync or OpenAI integration when a network is available.

### **Chosen Solution: Capacitor + Native SQLite**

Capacitor provides:

- Native Android/iOS builds with access to system APIs (filesystem, storage, etc.).
- Native SQLite via [Capacitor Community SQLite plugin](https://github.com/capacitor-community/sqlite).
- Secure data persistence with encryption support.
- Simple JS/TS bridge for database access — no Express or Node needed.

---

## **3. Core Principles**

|Principle|Description|
|---|---|
|**Local-first**|All critical data (meds, doctors, vitals) is stored and accessed locally through SQLite.|
|**Offline-resilient**|No dependency on an internet connection for basic features.|
|**Modular**|Each domain (medications, doctors, vitals) gets its own service class for data access and logic.|
|**Simple API boundary**|Service layer replaces REST endpoints — same shape, but implemented as local TypeScript methods.|
|**Optional network**|Online sync or AI chatbot runs only when `navigator.onLine === true`.|

---

## **4. New Architecture Diagram**

```
┌──────────────────────────┐
│        Vue 3 UI          │
│  (Medication, Appointments│
│   Doctors, Vitals Pages) │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Local Service Layer     │
│  (TypeScript classes)    │
│  - db.service.ts         │
│  - medication.service.ts │
│  - vitals.service.ts     │
│  - doctors.service.ts    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Capacitor SQLite Plugin  │
│ Native SQLite DB (eldr.db)│
└──────────────────────────┘
```
---
## **5. Migration Steps**

### **Step 1: Remove Express**

- Delete backend `/server` directory (Express app, routes, middleware).
- Identify each API route and map it to a TypeScript service method.
    

Example:

```ts
// Old route: GET /medications
// => medication.service.ts
export async function getMedications(): Promise<Medication[]> {
  const db = await dbService.getConnection();
  const res = await db.query('SELECT * FROM medications');
  return res.values as Medication[];
}
```
---
### **Step 2: Integrate Capacitor**

Install Capacitor and initialize it:
```bash
pnpm add @capacitor/core @capacitor/cli
npx cap init "EldercareApp" "com.eldercare.app"
```
Add the Android platform:
```bash
npx cap add android
```
---
### **Step 3: Add Native SQLite Plugin**

```bash
pnpm add @capacitor-community/sqlite
npx cap sync
```

Create `/src/services/db.service.ts`:

```ts
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';

class DBService {
  private db?: SQLiteDBConnection;

  async init() {
    const sqlite = CapacitorSQLite;
    const ret = await sqlite.createConnection('eldr.db', false, 'no-encryption', 1);
    this.db = ret;
    await this.db.open();
  }

  getConnection(): SQLiteDBConnection {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }
}

export const dbService = new DBService();
```

Initialize in your main app entry (e.g., `App.vue` or `main.ts`):

```ts
import { dbService } from './services/db.service';
dbService.init();
```

---
### **Step 4: Create Service Layer**

Each domain entity gets a service file.

Example: `/src/services/medication.service.ts`

```ts
import { dbService } from './db.service';

export async function addMedication(name: string, dosage: string, frequency: string) {
  const db = dbService.getConnection();
  await db.run(
    'INSERT INTO medications (name, dosage, frequency) VALUES (?, ?, ?)',
    [name, dosage, frequency]
  );
}

export async function getAllMedications() {
  const db = dbService.getConnection();
  const res = await db.query('SELECT * FROM medications');
  return res.values;
}
```

The frontend now calls these methods directly — no network, no API calls.

---
### **Step 5: Optional – AI Chatbot Integration**

If you keep the chatbot:

- Move OpenAI API calls into `/src/services/ai.service.ts`.
- Only enable when online:
    ```ts
    if (navigator.onLine) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {...});
    }
    ```
---
## **7. Benefits of This Architecture**

|Category|Benefit|
|---|---|
|**Performance**|Native database operations; no HTTP latency.|
|**Reliability**|Data persists offline indefinitely.|
|**Maintainability**|Simpler code — single language, no backend server.|
|**Security**|Data stays on-device; optional encryption supported.|
|**Scalability**|Can later sync to cloud if needed.|
|**Portability**|One codebase for Android, iOS, desktop (Electron).|

---

## **9. Summary**

This migration moves from a **server-based web stack** to a **native local-first app architecture** using Capacitor and SQLite. It removes external dependencies, increases reliability, and ensures long-term maintainability — especially important for eldercare data where uptime and data integrity are non-negotiable.

---
