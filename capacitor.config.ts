import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wallnux.messenger',
  appName: 'WallNux Messenger',
  webDir: 'www',
  server: {
    url: 'http://localhost:3000',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
