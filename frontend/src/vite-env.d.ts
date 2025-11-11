/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KALITOSPACE_DEV_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    __KALITOSPACE_ENV__?: {
      isDev: boolean
      isNative: boolean
    }
  }
}
