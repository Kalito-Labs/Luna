# PWA Development Setup Documentation

**Date:** November 4, 2025  
**Status:** Development Environment Configured  
**Branch:** `fix`

## Overview

This document details the Progressive Web App (PWA) development environment setup for Kalito Space, including HTTPS configuration, service worker integration, and network testing capabilities.

---

## What Was Accomplished

### ✅ Core PWA Infrastructure

#### 1. VitePWA Plugin Configuration
- **Plugin:** `vite-plugin-pwa@1.1.0`
- **Features:**
  - Auto-update service worker (`registerType: 'autoUpdate'`)
  - Development mode enabled for testing
  - Workbox integration for caching strategies
  - Manifest generation with proper metadata

#### 2. Service Worker Setup
- **Registration:** `virtual:pwa-register` in `main.ts`
- **Events Handled:**
  - `onNeedRefresh()` - Logs when new content is available
  - `onOfflineReady()` - Logs when app is ready for offline use
- **Cache Strategy:**
  - Static assets: Precached (CSS, JS, HTML, images)
  - API calls: NetworkFirst with 24-hour cache fallback

#### 3. PWA Manifest
```json
{
  "name": "Kalito Space",
  "short_name": "Kalito",
  "description": "Your family's AI command center - self-hosted AI chat with comprehensive life management tools",
  "theme_color": "#1a1a2e",
  "background_color": "#0f0f1e",
  "display": "standalone",
  "start_url": "/",
  "scope": "/",
  "icons": [
    {
      "src": "/favicon_io/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/favicon_io/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/favicon_io/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

---

### ✅ HTTPS Development Setup

#### 1. mkcert Installation
- **Tool:** `mkcert v1.4.4`
- **Purpose:** Generate locally-trusted development certificates
- **Installation:**
  ```bash
  # Download and install mkcert
  cd /tmp
  curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
  chmod +x mkcert-v*-linux-amd64
  sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
  
  # Install libnss3-tools for Chrome/Chromium support
  sudo apt install -y libnss3-tools
  
  # Install local CA
  mkcert -install
  ```

#### 2. Certificate Generation
- **Location:** `frontend/.certs/`
- **Files Generated:**
  - `key.pem` - Private key
  - `cert.pem` - Certificate
  - `cert.conf` - OpenSSL config (legacy, replaced by mkcert)

- **Certificate Includes:**
  - `localhost` (DNS)
  - `127.0.0.1` (IPv4 localhost)
  - `::1` (IPv6 localhost)
  - `192.168.1.96` (Network IP)

- **Generation Command:**
  ```bash
  cd frontend/.certs
  mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1 192.168.1.96
  ```

- **Validity:** 3 years (expires February 4, 2028)

#### 3. Vite Configuration
```typescript
// vite.config.ts
server: {
  host: '0.0.0.0', // Allow network access
  https: {
    key: fs.readFileSync(path.resolve(__dirname, '.certs/key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, '.certs/cert.pem')),
  },
  proxy: {
    '/api': 'http://localhost:3000',
  }
}
```

---

### ✅ Network Access Configuration

#### Vite Server Settings
- **Host:** `0.0.0.0` (accepts connections from any network interface)
- **Port:** `5173` (default Vite port)
- **Protocol:** HTTPS

#### Access Points
- **Local (Trusted):** `https://localhost:5173/`
- **Network IP:** `https://192.168.1.96:5173/`
- **Alternative:** `https://localhost.localdomain:5173/`

---

### ✅ Icon Optimization

#### Issue Fixed
- **Problem:** `favicon.svg` (395KB) failed to load over network
- **Solution:** Removed SVG from manifest, using PNG icons only
- **Result:** All icons load successfully

#### Current Icons
- 192×192 PNG (any purpose)
- 512×512 PNG (any purpose)
- 512×512 PNG (maskable purpose)

---

### ✅ Security & Best Practices

#### Git Configuration
```gitignore
# SSL certificates (dev only)
*.pem
.certs/
frontend/.certs/
```

#### Certificate Security
- Certificates excluded from version control
- Each developer generates their own certificates
- Network IP included in SAN (Subject Alternative Names)
- Valid for 3 years, can be regenerated anytime

---

## Current Status

### ✅ Working Features

#### On Host Machine (192.168.1.96)
- ✅ HTTPS with trusted certificate (no browser warnings)
- ✅ Service worker registers successfully
- ✅ PWA manifest loads correctly
- ✅ App accessible on network
- ✅ API proxy working (`/api` → `http://localhost:3000`)
- ✅ Offline caching configured

#### On Localhost (127.0.0.1)
- ✅ Full PWA functionality
- ✅ Install prompt appears
- ✅ Can be installed as PWA
- ✅ Works offline after installation
- ✅ Updates automatically

---

## Known Limitations

### ⚠️ External Device Access (Phone, VM)

#### Issue
The mkcert CA (Certificate Authority) is only installed on the host machine. External devices (phones, VMs) don't trust the certificate by default.

#### Impact
- Browser shows "Not secure" warning
- PWA install prompt may not appear
- Must manually accept certificate warning

#### Solutions

**Option 1: Export and Install CA (Secure, Permanent)**
```bash
# Find CA location
mkcert -CAROOT

# Copy rootCA.pem to device
# Android: Settings → Security → Install from storage → CA certificate
# Linux VM: Import to browser's certificate store
```

**Option 2: Use Tunneling Service (Easy, Temporary)**
```bash
# Using localtunnel
npx localtunnel --port 5173

# Using ngrok
ngrok http 5173
```

**Option 3: Accept Certificate Warning (Quick Test)**
- Navigate to `https://192.168.1.96:5173/`
- Click "Advanced" → "Proceed anyway"
- Only valid for current session

### ⚠️ Missing PWA Screenshots

#### Issue
Chrome DevTools shows warnings:
- "Richer PWA Install UI won't be available on desktop. Please add at least one screenshot with the form_factor set to wide."
- "Richer PWA Install UI won't be available on mobile. Please add at least one screenshot for which form_factor is not set or set to a value other than wide."

#### Impact
- Cosmetic only - doesn't block PWA installation
- Install UI less rich/attractive
- Missing promotional screenshots in app stores

#### Solution (Future Work)
Add to `vite.config.ts` manifest:
```typescript
screenshots: [
  {
    src: '/screenshots/mobile-1.png',
    sizes: '640x1280',
    type: 'image/png'
  },
  {
    src: '/screenshots/desktop-1.png',
    sizes: '1920x1080',
    type: 'image/png',
    form_factor: 'wide'
  }
]
```

---

## Development Workflow

### Starting the Application

```bash
# Terminal 1: Backend
cd /home/kalito/kalito-labs/kalito-repo
pnpm dev:backend

# Terminal 2: Frontend (with HTTPS)
cd /home/kalito/kalito-labs/kalito-repo
pnpm dev:frontend
```

### Testing PWA Features

#### On Localhost (Easiest)
1. Open `https://localhost:5173/`
2. Open Chrome DevTools → Application tab
3. Check "Manifest" section (should show no errors except screenshots)
4. Check "Service Workers" (should show registered worker)
5. Try installing: Chrome menu (⋮) → "Install Kalito Space"

#### On Network IP (Host Machine)
1. Open `https://192.168.1.96:5173/`
2. Should load with no security warnings
3. Service worker should register
4. PWA installation available

#### On Mobile/VM
1. Navigate to `https://192.168.1.96:5173/`
2. Accept certificate warning (click "Advanced" → "Proceed")
3. Check if PWA install prompt appears
4. If not, may need to install CA certificate (see limitations above)

### Verifying HTTPS Configuration

```bash
# Check certificate validity
openssl x509 -in frontend/.certs/cert.pem -noout -text | grep -A 3 "Subject Alternative Name"

# Expected output:
# DNS:localhost, IP Address:127.0.0.1, IP Address:0:0:0:0:0:0:0:1, IP Address:192.168.1.96

# View CA location
mkcert -CAROOT

# Check if CA is installed
mkcert -install
```

---

## Technical Architecture

### File Structure
```
kalito-repo/
├── frontend/
│   ├── .certs/                    # SSL certificates (gitignored)
│   │   ├── cert.pem              # mkcert certificate
│   │   ├── key.pem               # Private key
│   │   └── cert.conf             # Legacy OpenSSL config
│   ├── dev-dist/                  # Generated by VitePWA
│   │   ├── sw.js                 # Service worker
│   │   ├── registerSW.js         # SW registration
│   │   └── workbox-*.js          # Workbox runtime
│   ├── public/
│   │   ├── favicon_io/           # PWA icons
│   │   │   ├── android-chrome-192x192.png
│   │   │   ├── android-chrome-512x512.png
│   │   │   └── apple-touch-icon.png
│   │   └── favicon.svg           # (Not used in manifest)
│   ├── src/
│   │   └── main.ts               # SW registration code
│   ├── vite.config.ts            # HTTPS + PWA config
│   └── package.json
└── docs/
    └── pwa/
        └── PWA-SETUP.md          # This file
```

### Dependencies

```json
{
  "dependencies": {
    "workbox-window": "^7.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.3",
    "vite": "^6.3.5",
    "vite-plugin-pwa": "^1.0.2"
  }
}
```

### Service Worker Cache Strategy

```javascript
// API calls: Network-first with cache fallback
runtimeCaching: [
  {
    urlPattern: /^\/api\/.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 // 24 hours
      },
      cacheableResponse: {
        statuses: [0, 200]
      }
    }
  }
]

// Static assets: Precached at service worker install
globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
```

---

## Troubleshooting

### Issue: Certificate Not Trusted on Host Machine

**Symptoms:**
- Browser shows "Not secure"
- Certificate error even on localhost

**Solution:**
```bash
# Reinstall CA
mkcert -install

# Restart browser completely
```

### Issue: Service Worker Not Registering

**Symptoms:**
- No service worker in DevTools → Application → Service Workers
- Console error about registration

**Solution:**
```bash
# Clear browser cache and hard reload
# Chrome: Ctrl+Shift+R (Cmd+Shift+R on Mac)

# Check if dev server is running with HTTPS
# Should see: ➜ Local: https://localhost:5173/

# Verify service worker file exists
ls frontend/dev-dist/sw.js
```

### Issue: HTTPS Not Working After Configuration

**Symptoms:**
- Vite starts but uses HTTP instead of HTTPS
- Certificate files not being loaded

**Solution:**
```bash
# Verify certificate files exist
ls -la frontend/.certs/

# Should see:
# cert.pem
# key.pem

# Regenerate if missing
cd frontend/.certs
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1 192.168.1.96

# Restart dev server
pnpm dev:frontend
```

### Issue: PWA Not Installing on Mobile

**Symptoms:**
- No install prompt
- App loads but can't be installed

**Checklist:**
1. Is HTTPS enabled? (URL should start with `https://`)
2. Is certificate warning accepted?
3. Is manifest valid? (Check DevTools → Application → Manifest)
4. Is service worker registered? (Check DevTools → Application → Service Workers)
5. Are icons loading? (Check network tab for 404s)

**For Remote Devices:**
- Must install CA certificate on device, OR
- Use tunneling service (ngrok/localtunnel), OR
- Accept certificate warning manually

---

## Future Enhancements

### Priority 1: PWA Screenshots
- [ ] Create mobile screenshot (640×1280)
- [ ] Create desktop screenshot (1920×1080)
- [ ] Add screenshots to manifest
- [ ] Test "richer install UI" on Chrome

### Priority 2: Multi-Device Testing
- [ ] Document CA export process for Android
- [ ] Document CA export process for Windows/Linux VMs
- [ ] Create setup script for new developers
- [ ] Consider tunneling service for easier testing

### Priority 3: Production Build
- [ ] Test PWA in production build (`pnpm build`)
- [ ] Verify service worker updates in production
- [ ] Test offline functionality thoroughly
- [ ] Add update notification UI

### Priority 4: Enhanced PWA Features
- [ ] Add app shortcuts to manifest
- [ ] Implement push notifications
- [ ] Add share target capability
- [ ] Create standalone window controls

---

## References

### Documentation
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [mkcert GitHub](https://github.com/FiloSottile/mkcert)
- [Web App Manifest (MDN)](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)

### Tools
- **mkcert:** Local HTTPS certificate generation
- **VitePWA:** Vite plugin for PWA support
- **Workbox:** Service worker library for caching strategies
- **Chrome DevTools:** PWA testing and debugging

---

## Changelog

### 2025-11-04 - Initial Setup
- ✅ Configured VitePWA plugin with auto-update
- ✅ Implemented HTTPS using mkcert
- ✅ Generated certificates with network IP
- ✅ Enabled network access for mobile testing
- ✅ Fixed favicon.svg loading issue
- ✅ Configured service worker with caching strategies
- ✅ Updated .gitignore for certificate security
- ✅ Documented complete setup process

---

**Last Updated:** November 4, 2025  
**Maintainer:** Kalito Labs  
**Branch:** fix
