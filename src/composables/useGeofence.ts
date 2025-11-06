import { ref, computed } from 'vue';
import { BackgroundRunner } from '@capacitor/background-runner';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  enterMessage?: string;
  exitMessage?: string;
  isActive: boolean;
}

export function useGeofence() {
  const geofences = ref<Geofence[]>([]);
  const activeGeofences = computed(() => geofences.value.filter(g => g.isActive));

  // Helper: Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get push location key
  const getPushLocationKey = async (): Promise<string> => {
    const { token } = await BackgroundRunner.dispatchEvent<{ token: string }>({
      label: 'asia.tic.Mobile.runner',
      event: 'getPushLocationKey',
      details: {}
    });
    return token;
  };

  // Loads geofences from storage
  const loadGeofences = async (): Promise<void> => {
    try {
      const { geofences: loadedGeofences } = await BackgroundRunner.dispatchEvent<{ geofences: Geofence[] }>({
        label: 'asia.tic.Mobile.runner',
        event: 'loadGeofences',
        details: {}
      });
      geofences.value = loadedGeofences;
    } catch (error) {
      console.error('Error loading geofences:', error);
      // Fallback to empty array if loading fails
      geofences.value = [];
    }
  };

  // Saves geofences to storage via background runner
  const saveGeofences = async (): Promise<void> => {
    try {
      // Send each geofence to the background runner for saving
      for (const geofence of geofences.value) {
        await BackgroundRunner.dispatchEvent({
          label: 'asia.tic.Mobile.runner',
          event: 'saveGeofence',
          details: { geofence }
        });
      }
      console.log('Geofences sent to background runner successfully:', geofences.value.length, 'items');
    } catch (error) {
      console.error('Error saving geofences via background runner:', error);
      throw new Error(`Failed to save geofences via background runner: ${error}`);
    }
  };

  // Add a new geofence
  const addGeofence = async (geofence: Omit<Geofence, 'id'>): Promise<string> => {
    const id = `${Date.now()}`;
    const newGeofence: Geofence = { ...geofence, id };
    geofences.value.push(newGeofence);
    
    // Send to background runner
    await BackgroundRunner.dispatchEvent({
      label: 'asia.tic.Mobile.runner',
      event: 'saveGeofence',
      details: { geofence: newGeofence }
    });
    
    return id;
  };

  // Update an existing geofence
  const updateGeofence = async (id: string, updates: Partial<Geofence>): Promise<boolean> => {
    const index = geofences.value.findIndex(g => g.id === id);
    if (index === -1) return false;
    geofences.value[index] = { ...geofences.value[index], ...updates };
    
    // Send updated geofence to background runner
    await BackgroundRunner.dispatchEvent({
      label: 'asia.tic.Mobile.runner',
      event: 'saveGeofence',
      details: { geofence: geofences.value[index] }
    });
    
    return true;
  };

  // Remove a geofence
  const removeGeofence = async (id: string): Promise<boolean> => {
    const index = geofences.value.findIndex(g => g.id === id);
    if (index === -1) return false;
    geofences.value.splice(index, 1);
    
    // Save updated geofences list to background runner
    await saveGeofences();
    
    return true;
  };

  const removeAllGeofence = async (): Promise<boolean> => {
    geofences.value = [];
    
    // Send remove all event to background runner
    await BackgroundRunner.dispatchEvent({
      label: 'asia.tic.Mobile.runner',
      event: 'removeAllGeofences',
      details: {}
    });
    
    return true;
  }

  // Toggle geofence active status
  const toggleGeofence = async (id: string): Promise<boolean> => {
    const geofence = geofences.value.find(g => g.id === id);
    if (!geofence) return false;
    return await updateGeofence(id, { isActive: !geofence.isActive });
  };

  // Manually trigger the background runner event (for foreground testing)
  const triggerBackgroundRunner = async () => {
    await BackgroundRunner.dispatchEvent({
      label: 'asia.tic.Mobile.runner',
      event: 'geoFence',
      details: {}
    });
  };

  // Test function to debug geofence saving
  const testGeofenceStorage = async (): Promise<{ success: boolean; message: string }> => {
    try {
      // Test saving
      const testGeofence = {
        id: 'test-' + Date.now(),
        name: 'Test Geofence',
        latitude: 0,
        longitude: 0,
        radius: 100,
        enterMessage: 'Test enter',
        exitMessage: 'Test exit',
        isActive: true
      };
      
      geofences.value = [testGeofence];
      await saveGeofences();
      
      // Test loading
      await loadGeofences();
      
      if (geofences.value.length > 0 && geofences.value[0].id === testGeofence.id) {
        return { success: true, message: 'Geofence storage test passed' };
      } else {
        return { success: false, message: 'Geofence storage test failed - data mismatch' };
      }
    } catch (error) {
      return { success: false, message: `Geofence storage test failed: ${error}` };
    }
  };

  /**
   * Checks geofence status for the current position and sends notifications for entered/exited geofences.
   * This matches the logic in runners/geofence-background.js.
   * @param position { latitude, longitude }
   */
  const checkGeofencesNow = async (position: { latitude: number; longitude: number }) => {
    await loadGeofences();
    const geos = activeGeofences.value;
    if (!Array.isArray(geos) || geos.length === 0) return;
    let entered: Geofence[] = [];
    let exited: Geofence[] = [];
    for (const geofence of geos) {
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        geofence.latitude,
        geofence.longitude
      );
      if (distance <= geofence.radius) {
        entered.push(geofence);
      } else {
        exited.push(geofence);
      }
    }
    // Send notifications for entered geofences
    if (Capacitor.isNativePlatform()) {
      for (const g of entered) {
        if (g.enterMessage) {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: Date.now(),
                title: g.name,
                body: g.enterMessage,
                sound: 'default',
                schedule: { at: new Date() },
              },
            ],
          });
        }
      }
      for (const g of exited) {
        if (g.exitMessage) {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: Date.now(),
                title: g.name,
                body: g.exitMessage,
                sound: 'default',
                schedule: { at: new Date() },
              },
            ],
          });
        }
      }
    }
  };

  return {
    geofences,
    activeGeofences,
    getPushLocationKey,
    loadGeofences,
    saveGeofences,
    addGeofence,
    updateGeofence,
    removeGeofence,
    removeAllGeofence,
    toggleGeofence,
    checkGeofencesNow, // Call this with a position to check geofences and send notifications
    triggerBackgroundRunner, // Call this to manually trigger the background runner event
    testGeofenceStorage, // Test function to debug geofence storage
  };
} 