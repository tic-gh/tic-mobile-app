import { registerPlugin } from '@capacitor/core';

export interface LocationTokenPlugin {
  getLocationToken(): Promise<{ token: string }>;
  setLocationToken(options: { token: string }): Promise<void>;
  addListener(
    eventName: 'tokenReceived',
    listenerFunc: (data: { token: string }) => void
  ): Promise<void>;
  removeAllListeners(): Promise<void>;
}

const LocationToken = registerPlugin<LocationTokenPlugin>('LocationToken');

export default LocationToken; 