# Android App Build Commands

Quick reference guide for building and deploying your Kalito Space Android app.

---

## Prerequisites

Ensure backend server is running on your laptop:
```bash
cd /home/kalito/kalito-labs/kalito-repo/backend
pnpm dev
```

The server will be accessible at `http://192.168.1.96:3000` on your local network.

---

## Development Workflow

### Option 1: Web Browser Testing (Recommended for UI changes)

Test your changes in the browser first - it's faster and easier to debug:

```bash
cd /home/kalito/kalito-labs/kalito-repo/frontend
pnpm dev
```

Then open `https://localhost:5173` in your browser.

**Note:** The web version uses Vite's proxy, so API calls work seamlessly without network configuration.

---

### Option 2: Build and Test on Android

When you're ready to test on your actual Android device:

#### Step 1: Build the Vue.js app
```bash
cd /home/kalito/kalito-labs/kalito-repo/frontend
pnpm build
```

**What this does:** Creates an optimized production build in `dist/` folder.

---

#### Step 2: Sync to Android project
```bash
cd /home/kalito/kalito-labs/kalito-repo/frontend
npx cap sync android
```

**What this does:** 
- Copies `dist/` folder to Android WebView assets
- Updates Capacitor plugins
- Syncs configuration changes

---

#### Step 3: Build the APK
```bash
cd /home/kalito/kalito-labs/kalito-repo/frontend/android
./gradlew assembleDebug
```

**What this does:** Compiles the Android app and generates a debug APK.

**Output location:**
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

**Build time:** 
- First build: ~1-2 minutes (downloads dependencies)
- Subsequent builds: ~5-15 seconds

---

## Complete Rebuild Script (All-in-One)

Save time by running all three steps together:

```bash
cd /home/kalito/kalito-labs/kalito-repo/frontend && \
pnpm build && \
npx cap sync android && \
cd android && \
./gradlew assembleDebug
```

After successful build, the APK will be at:
```
/home/kalito/kalito-labs/kalito-repo/frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Installing the APK on Your Phone

### Method 1: USB Connection (Fastest)
```bash
# Connect your phone via USB cable
# Enable USB Debugging in Developer Options

# Install directly
adb install /home/kalito/kalito-labs/kalito-repo/frontend/android/app/build/outputs/apk/debug/app-debug.apk

# Or update existing installation
adb install -r /home/kalito/kalito-labs/kalito-repo/frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### Method 2: File Transfer
1. Copy `app-debug.apk` to your phone via:
   - USB file transfer
   - Email attachment
   - Cloud storage (Google Drive, Dropbox, etc.)
   - Local network share
2. Open the APK file on your phone
3. Allow installation from unknown sources if prompted
4. Install

---

## Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start frontend dev server (port 5173) |
| `pnpm build` | Build production Vue.js bundle |
| `npx cap sync android` | Sync web assets to Android |
| `./gradlew assembleDebug` | Build debug APK |
| `./gradlew clean` | Clean Android build cache |
| `adb devices` | List connected Android devices |
| `adb install <apk>` | Install APK via USB |

---

## Development Tips

### 1. Faster Iteration
For UI changes, stick to browser development (`pnpm dev`) until you need to test:
- Native Android features
- Network connectivity from phone
- Device-specific behavior
- Final user experience

### 2. Only Rebuild When Necessary
You only need to rebuild the APK when:
- ✅ You want to test on your phone
- ✅ Changes affect native functionality
- ✅ Preparing to share with family

You don't need to rebuild for:
- ❌ Tweaking CSS/styling
- ❌ Testing API logic
- ❌ Debugging TypeScript code
- ❌ Quick UI iterations

### 3. Backend Server Must Be Running
The Android app connects to `http://192.168.1.96:3000/api`, so:
- ✅ Backend must be running: `pnpm dev:backend`
- ✅ Phone must be on same WiFi network (192.168.1.x)
- ✅ Laptop firewall must allow connections on port 3000

### 4. Version Control
Before rebuilding, commit your changes:
```bash
git add .
git commit -m "Your change description"
```

---

## Troubleshooting

### APK won't install
```bash
# Uninstall old version first
adb uninstall com.kalito.space

# Then install fresh
adb install app-debug.apk
```

### App shows empty data
1. Check backend is running: `curl http://192.168.1.96:3000/api/health`
2. Verify phone is on same WiFi network
3. Check phone can reach server: Open `http://192.168.1.96:3000/api/patients` in phone browser

### Build fails
```bash
# Clean and rebuild
cd /home/kalito/kalito-labs/kalito-repo/frontend/android
./gradlew clean
./gradlew assembleDebug
```

### Gradle errors
```bash
# Clear Gradle cache
rm -rf ~/.gradle/caches/
./gradlew assembleDebug
```

---

## Network Configuration

The app is currently configured to connect to:
- **Android app:** `http://192.168.1.96:3000/api`
- **Web browser:** `/api` (proxied by Vite to `http://localhost:3000`)

To change the IP address (if your laptop's IP changes):
1. Edit `frontend/src/config/api.ts`
2. Update the `API_BASE_URL` for native platform
3. Rebuild: `pnpm build && npx cap sync android && cd android && ./gradlew assembleDebug`

---

## What's Next?

### Distribution to Family
When ready to share with family members:
1. Build release APK (instructions coming soon)
2. Sign the APK
3. Share via file transfer or private link

### Production Deployment
For public release:
1. Configure release build with signing keys
2. Optimize bundle size
3. Test on multiple devices
4. Submit to Google Play Store (optional)

---

## Success Checklist

Before rebuilding, verify:
- [ ] Backend server is running
- [ ] Frontend changes tested in browser
- [ ] No TypeScript/lint errors: `pnpm build` succeeds
- [ ] Git changes committed
- [ ] Phone is on same WiFi network

After rebuilding:
- [ ] APK file generated successfully
- [ ] APK transferred to phone
- [ ] App installs without errors
- [ ] App loads and connects to backend
- [ ] All features work as expected

---

**Happy coding! 🚀**

You've built something amazing - a fully functional Android app that connects to your own backend server. Keep iterating and making it even better!
