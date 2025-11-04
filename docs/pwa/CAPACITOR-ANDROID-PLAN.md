# Capacitor Android App - Implementation Plan

**Date:** November 4, 2025  
**Status:** Planning Phase  
**Branch:** `fix`  
**Related:** See `PWA-SETUP.md` for current PWA implementation

---

## Context: What We've Already Done

### ✅ PWA Setup Complete (November 4, 2025)

We successfully implemented a Progressive Web App (PWA) foundation for Kalito Space:

#### Completed Infrastructure:
1. **VitePWA Plugin** - Configured with auto-update service worker
2. **HTTPS Development** - Using mkcert for locally-trusted certificates
3. **Network Access** - Server exposed on `0.0.0.0` for mobile testing
4. **SSL Certificates** - Generated with network IP (192.168.1.96) in SAN
5. **Service Worker** - Workbox caching for offline functionality
6. **Manifest** - Complete with app metadata and PNG icons (removed problematic SVG)

#### Current Status:
- ✅ **Works perfectly on localhost** - PWA installs with no issues
- ✅ **HTTPS on host machine** - No browser warnings, trusted certificate
- ✅ **Service worker active** - Caching static assets and API calls
- ⚠️ **Mobile/VM install pending** - Certificate trust issue on external devices

#### What We Learned:
- PWA installation requires HTTPS (except localhost)
- Self-signed certificates need CA installation on each device
- Service worker requires secure origin for registration
- PWA works great for web but has mobile distribution challenges

---

## Why Move to Capacitor Android?

### Problems with PWA-Only Approach:
1. **Certificate Trust Issues** - Each device needs CA certificate installed manually
2. **Install Prompt Unreliable** - Browser-dependent, inconsistent UX
3. **Limited Native Features** - Can't access full device capabilities
4. **Distribution Complexity** - Users must navigate to URL and install via browser
5. **No App Store Presence** - Can't easily distribute to family members

### Benefits of Capacitor Android App:
1. ✅ **Single APK Distribution** - Install once, works everywhere
2. ✅ **No Certificate Issues** - App bundles everything it needs
3. ✅ **Better Native Integration** - Access to camera, notifications, storage
4. ✅ **Consistent Experience** - Same UX across all Android devices
5. ✅ **Easier Updates** - Download new APK, install over old one
6. ✅ **Keep Backend on Laptop** - App connects to home server via WiFi

---

## Architecture Plan

### Target Architecture:

```
┌─────────────────────────────────────────────────────┐
│                 HOME NETWORK (WiFi)                  │
│                                                      │
│  ┌─────────────────┐         ┌──────────────────┐  │
│  │  Android Phone  │ ◄─────► │  Laptop Server   │  │
│  │                 │  HTTPS  │                  │  │
│  │  Capacitor App  │  :3000  │  Express Backend │  │
│  │  - Vue UI       │         │  - SQLite DB     │  │
│  │  - Local Cache  │         │  - AI Models     │  │
│  │  - APK Install  │         │  - API Server    │  │
│  └─────────────────┘         └──────────────────┘  │
│                                                      │
│  Connection: http://192.168.1.96:3000/api           │
└─────────────────────────────────────────────────────┘
```

### Key Design Decisions:

#### 1. Backend Stays on Laptop
**Why:** 
- Laptop has better CPU/RAM for AI processing
- Single source of truth for database
- Easier development (no mobile backend sync)
- Family members share same data

**Requirements:**
- Laptop must be on when app is used
- Backend binds to `0.0.0.0` (not just localhost)
- Static IP or mDNS hostname
- Port 3000 accessible on home network

#### 2. Frontend as Android App
**Why:**
- Better distribution (single APK file)
- Native Android features available
- No browser quirks or certificate issues
- Professional app experience

**Implementation:**
- Capacitor wraps Vue app
- API calls to laptop backend
- Service worker still works (offline caching)
- APK sideloading (no Google Play needed)

#### 3. Hybrid Storage Strategy
**Option A (Simple):**
- App has no local database
- All data fetched from laptop server
- Service worker caches API responses
- Works only when connected to home WiFi

**Option B (Advanced):**
- App has local SQLite database
- Syncs with laptop server when connected
- Fully functional offline
- More complex implementation

**Decision:** Start with Option A, upgrade to B if needed

---

## Implementation Plan

### Phase 1: Environment Setup (CLI-Only) ⏱️ 30 minutes

**Goals:**
- Install Java JDK
- Install Android SDK command-line tools
- Configure environment variables
- Verify Gradle works

**Steps:**
1. Install OpenJDK 17
2. Download Android command-line tools
3. Install SDK platform-tools and build-tools
4. Accept Android SDK licenses
5. Test with `sdkmanager --list`

**Success Criteria:**
- `java -version` shows Java 17
- `sdkmanager --list` shows installed packages
- Environment variables set correctly

---

### Phase 2: Capacitor Integration ⏱️ 20 minutes

**Goals:**
- Add Capacitor to frontend project
- Initialize Android platform
- Configure API endpoint

**Steps:**
1. Install Capacitor packages:
   ```bash
   pnpm add @capacitor/core @capacitor/cli @capacitor/android
   ```

2. Initialize Capacitor:
   ```bash
   npx cap init "Kalito Space" "com.kalito.space" --web-dir=dist
   ```

3. Add Android platform:
   ```bash
   npx cap add android
   ```

4. Create `capacitor.config.ts`:
   - Set app metadata
   - Configure server allowlist
   - Enable cleartext traffic for local network

5. Create environment-aware API client:
   - Detect if running in Capacitor
   - Use laptop IP when in Android app
   - Use `/api` proxy when in web browser

**Success Criteria:**
- `frontend/android/` directory created
- `capacitor.config.ts` exists
- API client switches based on platform

---

### Phase 3: Backend Network Configuration ⏱️ 10 minutes

**Goals:**
- Ensure backend accepts network connections
- Configure CORS for Android app
- Test connectivity from phone

**Steps:**
1. Update `backend/server.ts`:
   - Bind to `0.0.0.0` not just `localhost`
   - Add CORS headers for mobile app
   - Log network IP on startup

2. Configure firewall (if needed):
   - Allow port 3000 inbound
   - Check `ufw` or `iptables` rules

3. Test from phone:
   - Connect to same WiFi
   - Open browser: `http://192.168.1.96:3000/api/health`
   - Should see backend response

**Success Criteria:**
- Backend shows network IP on startup
- Phone browser can access API endpoints
- CORS headers present in responses

---

### Phase 4: First APK Build ⏱️ 15 minutes

**Goals:**
- Build Vue production bundle
- Sync to Android project
- Generate debug APK
- Install on phone

**Steps:**
1. Build frontend:
   ```bash
   cd frontend
   pnpm build
   ```

2. Sync to Android:
   ```bash
   npx cap sync android
   ```

3. Build APK:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

4. Locate APK:
   ```bash
   ls android/app/build/outputs/apk/debug/app-debug.apk
   ```

5. Install on phone:
   - Option A: `adb install app-debug.apk`
   - Option B: Copy to phone and install manually
   - Option C: Share via USB/Bluetooth

**Success Criteria:**
- APK builds without errors
- App installs on phone
- App opens and shows Kalito Space UI
- Can navigate to different pages

---

### Phase 5: API Integration Testing ⏱️ 20 minutes

**Goals:**
- Verify app connects to laptop backend
- Test all API endpoints
- Ensure data flows correctly

**Test Scenarios:**
1. **Chat Functionality:**
   - Create new session
   - Send message to AI
   - Receive response
   - Verify in backend logs

2. **Eldercare Dashboard:**
   - Load patients list
   - Add new patient
   - View patient details
   - Add medication

3. **Persona Management:**
   - List personas
   - Switch between personas
   - Create custom persona

4. **Offline Behavior:**
   - Disconnect WiFi
   - Try to use app
   - Verify cached content still visible
   - Show appropriate error messages

**Success Criteria:**
- All features work same as web version
- API calls reach backend successfully
- Responses render correctly in app
- Graceful handling of network errors

---

### Phase 6: Polish & Optimization ⏱️ 30 minutes

**Goals:**
- Add splash screen
- Configure app icons
- Optimize bundle size
- Add loading indicators

**Tasks:**
1. **Splash Screen:**
   - Create 2732x2732 PNG
   - Configure in `capacitor.config.ts`
   - Test on app launch

2. **App Icons:**
   - Use existing PWA icons
   - Configure adaptive icons
   - Test on different Android versions

3. **Performance:**
   - Enable production build minification
   - Lazy load routes
   - Optimize images

4. **UX Improvements:**
   - Add network status indicator
   - Show "Connecting to server..." message
   - Better error handling

**Success Criteria:**
- Professional splash screen on launch
- Proper app icon in launcher
- Fast load times (<3 seconds)
- Clear user feedback for all actions

---

### Phase 7: Distribution & Documentation ⏱️ 20 minutes

**Goals:**
- Create release APK
- Document installation process
- Create update procedure

**Deliverables:**
1. **Signed Release APK:**
   - Generate keystore
   - Sign APK
   - Test installation

2. **User Guide:**
   - How to install APK
   - How to connect to home network
   - Troubleshooting common issues

3. **Update Process:**
   - Build new APK
   - Install over existing app
   - Data migration considerations

4. **Build Script:**
   - Automated build command
   - Version numbering
   - Changelog generation

**Success Criteria:**
- Release APK builds and installs
- Documentation is clear and complete
- Family members can install independently

---

## Technical Implementation Details

### File Structure After Capacitor:

```
kalito-repo/
├── frontend/
│   ├── android/                    # NEW: Capacitor Android project
│   │   ├── app/
│   │   │   ├── src/main/
│   │   │   │   ├── AndroidManifest.xml
│   │   │   │   ├── assets/
│   │   │   │   └── res/           # Icons, splash screens
│   │   │   └── build.gradle
│   │   ├── build.gradle
│   │   └── gradlew                # Gradle wrapper
│   ├── capacitor.config.ts        # NEW: Capacitor configuration
│   ├── src/
│   │   ├── config/                # NEW: Platform-aware config
│   │   │   └── api.ts            # API endpoint logic
│   │   └── ...
│   ├── dist/                      # Built Vue app (synced to Android)
│   └── ...
├── backend/
│   └── server.ts                  # UPDATED: Network binding
└── docs/
    ├── pwa/
    │   ├── PWA-SETUP.md
    │   └── CAPACITOR-ANDROID-PLAN.md  # This file
    └── android/                    # NEW: Android-specific docs
        ├── BUILD-GUIDE.md
        └── INSTALLATION-GUIDE.md
```

### Code Changes Required:

#### 1. API Client (`frontend/src/config/api.ts`) - NEW FILE
```typescript
import { Capacitor } from '@capacitor/core'

// Determine API base URL based on platform
export const API_BASE_URL = Capacitor.isNativePlatform()
  ? 'http://192.168.1.96:3000/api'  // Android app → laptop server
  : '/api'                            // Web browser → Vite proxy

// Helper function for API calls
export async function apiCall(endpoint: string, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, options)
    return await response.json()
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}
```

#### 2. Backend Server (`backend/server.ts`) - UPDATED
```typescript
// Before: app.listen(3000)
// After:
const PORT = 3000
const HOST = '0.0.0.0'  // Accept connections from any network interface

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on:`)
  console.log(`   Local:   http://localhost:${PORT}`)
  console.log(`   Network: http://192.168.1.96:${PORT}`)  // Your actual IP
})
```

#### 3. CORS Configuration (`backend/middleware/security.ts`) - UPDATED
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',         // Vite dev server
    'https://localhost:5173',        // Vite with HTTPS
    'http://192.168.1.96:5173',      // Network access
    'capacitor://localhost',         // Capacitor Android app
    'http://localhost'               // Capacitor alternative
  ],
  credentials: true
}))
```

#### 4. Capacitor Config (`frontend/capacitor.config.ts`) - NEW FILE
```typescript
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.kalito.space',
  appName: 'Kalito Space',
  webDir: 'dist',
  server: {
    androidScheme: 'http',           // Use HTTP for local network
    cleartext: true,                 // Allow cleartext (HTTP) traffic
    allowNavigation: [
      '192.168.1.96',                // Your laptop IP
      'localhost',
      '127.0.0.1'
    ]
  },
  android: {
    allowMixedContent: true,         // Allow HTTP in HTTPS context
    backgroundColor: '#0f0f1e'       // Match app theme
  }
}

export default config
```

---

## Build Scripts to Add

### Add to `frontend/package.json`:

```json
{
  "scripts": {
    "android:setup": "npx cap add android",
    "android:sync": "npx cap sync android",
    "android:build": "pnpm build && npx cap sync android && cd android && ./gradlew assembleDebug && cd ..",
    "android:release": "pnpm build && npx cap sync android && cd android && ./gradlew assembleRelease && cd ..",
    "android:install": "cd android && adb install app/build/outputs/apk/debug/app-debug.apk",
    "android:run": "pnpm android:build && pnpm android:install",
    "android:logs": "adb logcat | grep -i capacitor"
  }
}
```

### Usage:
```bash
# One-time setup
pnpm android:setup

# Regular development
pnpm android:run          # Build + install on connected phone

# Just build APK
pnpm android:build        # Creates app-debug.apk

# View logs from phone
pnpm android:logs
```

---

## Testing Checklist

### Pre-Build Testing:
- [ ] Backend starts and binds to `0.0.0.0`
- [ ] Backend accessible from phone browser
- [ ] CORS headers present in responses
- [ ] All API endpoints return correct data

### Post-Install Testing:
- [ ] App installs without errors
- [ ] App launches and shows splash screen
- [ ] Main UI loads correctly
- [ ] Navigation between pages works
- [ ] Chat sends/receives messages
- [ ] Eldercare CRUD operations work
- [ ] Personas load and switch correctly
- [ ] Images and icons load
- [ ] Service worker caches content
- [ ] Offline mode shows cached data
- [ ] Network errors display helpful messages

### Network Testing:
- [ ] App works on same WiFi as laptop
- [ ] App fails gracefully when WiFi off
- [ ] App reconnects when WiFi restored
- [ ] Multiple devices can use app simultaneously

### Performance Testing:
- [ ] App launches in <3 seconds
- [ ] API calls respond in <1 second
- [ ] Smooth scrolling and animations
- [ ] No memory leaks (use for 10+ minutes)
- [ ] Battery usage acceptable

---

## Risks & Mitigations

### Risk 1: Network Discovery
**Problem:** Phone can't find laptop server  
**Mitigation:**
- Use static IP for laptop
- Or use mDNS: `kalito-server.local`
- Add network diagnostics in app
- Provide manual IP configuration option

### Risk 2: Firewall Blocking
**Problem:** Linux firewall blocks port 3000  
**Mitigation:**
- Check `ufw status`
- Add rule: `sudo ufw allow 3000`
- Test with `curl` from phone

### Risk 3: Certificate Issues (if using HTTPS)
**Problem:** Android doesn't trust self-signed cert  
**Mitigation:**
- Use HTTP for local network (cleartext)
- Or install CA certificate on each device
- Or use `android:usesCleartextTraffic="true"`

### Risk 4: APK Size Too Large
**Problem:** APK >50MB, slow to transfer  
**Mitigation:**
- Enable minification in production
- Remove unused dependencies
- Optimize images/assets
- Use lazy loading

### Risk 5: Android Version Compatibility
**Problem:** App doesn't work on older Android  
**Mitigation:**
- Target Android 8.0+ (API 26)
- Test on multiple devices
- Use Capacitor compatibility layer
- Graceful degradation for missing features

---

## Success Criteria

### Minimum Viable Product (MVP):
- ✅ APK installs on Android 8.0+
- ✅ App connects to laptop backend
- ✅ All main features functional
- ✅ No crashes or freezes
- ✅ Family members can install independently

### Nice to Have (Future):
- 🎯 Push notifications for reminders
- 🎯 Biometric authentication
- 🎯 Offline mode with local SQLite
- 🎯 Share text/images to app
- 🎯 Home screen widgets

---

## Timeline Estimate

### Optimistic (Everything works first try):
- **Day 1:** Environment setup + Capacitor integration (1 hour)
- **Day 1:** First APK build + testing (1 hour)
- **Day 1:** Polish + distribution (1 hour)
- **Total:** 3 hours

### Realistic (Some troubleshooting needed):
- **Day 1:** Environment setup + Capacitor integration (2 hours)
- **Day 1-2:** First APK build + debugging (2 hours)
- **Day 2:** Testing + fixes (2 hours)
- **Day 2:** Polish + distribution (1 hour)
- **Total:** 7 hours

### Conservative (Learning curve + issues):
- **Week 1:** Environment setup + learning (3 hours)
- **Week 1:** Capacitor integration + first build (4 hours)
- **Week 2:** Testing + debugging + fixes (4 hours)
- **Week 2:** Polish + documentation (2 hours)
- **Total:** 13 hours over 2 weeks

---

## Resources & References

### Documentation:
- [Capacitor Official Docs](https://capacitorjs.com/docs)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Android Command Line Tools](https://developer.android.com/studio/command-line)
- [Gradle Build Tool](https://docs.gradle.org/current/userguide/command_line_interface.html)

### Helpful Commands:
```bash
# Check connected devices
adb devices

# View device logs
adb logcat

# Install APK
adb install path/to/app.apk

# Uninstall app
adb uninstall com.kalito.space

# Check app info
adb shell dumpsys package com.kalito.space

# Take screenshot
adb exec-out screencap -p > screenshot.png
```

---

## Next Steps

### Before Starting Implementation:
1. ✅ Backup repository to external drive (in progress)
2. ✅ Create this planning document
3. ⏳ Review plan and get approval
4. ⏳ Ensure backend is ready for network access
5. ⏳ Have Android phone ready for testing

### Ready to Begin When:
- [ ] USB external backup complete
- [ ] Planning document reviewed
- [ ] All questions answered
- [ ] Time allocated for implementation
- [ ] Phone connected and ready

---

**Status:** Ready to proceed with Phase 1 when approved.  
**Estimated Completion:** 3-7 hours of focused work  
**Risk Level:** Low (Capacitor is mature and well-documented)  
**Rollback Plan:** Keep PWA working, Android is additive

---

**Last Updated:** November 4, 2025  
**Maintainer:** Kalito Labs  
**Branch:** fix
