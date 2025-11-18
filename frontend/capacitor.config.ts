import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kalito.space',
  appName: 'Luna',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: [
      '192.168.1.96',
      'localhost',
      '127.0.0.1'
    ]
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0f0f1e'
  }
};

export default config;
