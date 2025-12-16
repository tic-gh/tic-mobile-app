import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'asia.tic.Mobile',
  appName: 'TIC Inspection App',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
    Camera: {
      permissions: ['camera', 'photos']
    },
    BackgroundRunner: {
      label: 'asia.tic.Mobile.runner',
      src: 'runners/geofence-background.js',
      event: 'geoFence',
      repeat: true,
      interval: 15,
      autoStart: true,
    }
  },
  CapacitorHttp: {
    enabled: true,
  },
};

export default config;
