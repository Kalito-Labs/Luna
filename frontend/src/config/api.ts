import { Capacitor } from '@capacitor/core'

/**
 * Determine the API base URL based on the platform
 * - Android app: Direct connection to laptop server
 * - Web browser: Use Vite proxy (/api → http://localhost:3000)
 */
export const API_BASE_URL = Capacitor.isNativePlatform()
  ? 'http://192.168.1.96:3000' // Android app → laptop server (no /api suffix)
  : '' // Web browser → Vite dev server proxy (no prefix needed)

/**
 * Check if running in native app (Android)
 */
export const isNativeApp = () => Capacitor.isNativePlatform()

/**
 * Check if running in web browser
 */
export const isWeb = () => !Capacitor.isNativePlatform()

/**
 * Get platform name
 */
export const getPlatform = () => Capacitor.getPlatform()

/**
 * Build full API URL from endpoint path
 * @param endpoint - API endpoint (e.g., '/patients', 'sessions/123')
 * @returns Full URL with correct base
 */
export const apiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${API_BASE_URL}/${cleanEndpoint}`
}

// Log platform information
// eslint-disable-next-line no-console
console.info(`[Kalito Space] Running on: ${getPlatform()}`)
// eslint-disable-next-line no-console
console.info(`[Kalito Space] API Base URL: ${API_BASE_URL}`)
