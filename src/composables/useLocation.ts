import { ref, computed } from 'vue';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { startGeoReporting, stopGeoReporting, GeoLocationData } from '@/api/report';
import { useStorage } from '@/composables/useStorage';

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface LocationError {
  code: number;
  message: string;
}

export function useLocation() {
  const { storageGetJson, storageSetJson, storageRemove } = useStorage();

  const currentPosition = ref<Position | null>(null);
  const lastKnownPosition = ref<Position | null>(null);
  const isTracking = ref(false);
  const error = ref<LocationError | null>(null);
  const isPermissionGranted = ref<boolean | null>(null);

  // Computed properties
  const hasLocation = computed(() => currentPosition.value !== null);
  const hasLastKnownLocation = computed(() => lastKnownPosition.value !== null);
  const latitude = computed(() => currentPosition.value?.coords.latitude || null);
  const longitude = computed(() => currentPosition.value?.coords.longitude || null);
  const accuracy = computed(() => currentPosition.value?.coords.accuracy || null);

  // Check if geolocation is available
  const isAvailable = async (): Promise<boolean> => {
    try {
      const permission = await Geolocation.checkPermissions();
      return permission.location !== 'denied';
    } catch (err) {
      console.error('Error checking geolocation availability:', err);
      return false;
    }
  };

  // Request permissions
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const permission: PermissionStatus = await Geolocation.requestPermissions();
      isPermissionGranted.value = permission.location === 'granted';
      return isPermissionGranted.value;
    } catch (err) {
      console.error('Error requesting geolocation permissions:', err);
      isPermissionGranted.value = false;
      return false;
    }
  };

  // Get current position once
  const getCurrentPosition = async (options: LocationOptions = {}): Promise<Position | null> => {
    try {
      error.value = null;

      // Check permissions first
      if (!(await isAvailable())) {
        const granted = await requestPermissions();
        if (!granted) {
          error.value = {
            code: 1,
            message: 'Location permission denied',
          };
          return null;
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 300000, // 5 minutes
      });

      currentPosition.value = position;
      lastKnownPosition.value = position;

      return position;
    } catch (err: any) {
      console.error('Error getting current position:', err);

      // Handle different error types
      let errorMessage = 'Unknown location error';
      let errorCode = 0;

      if (err.code) {
        switch (err.code) {
          case 1:
            errorMessage = 'Location permission denied';
            break;
          case 2:
            errorMessage = 'Location unavailable';
            break;
          case 3:
            errorMessage = 'Location request timeout';
            break;
          default:
            errorMessage = err.message || 'Location error occurred';
        }
        errorCode = err.code;
      } else {
        errorMessage = err.message || 'Location error occurred';
      }

      error.value = {
        code: errorCode,
        message: errorMessage,
      };

      return null;
    }
  };

  // Start watching position
  const startWatching = async (options: LocationOptions = {}): Promise<string | null> => {
    try {
      error.value = null;

      // Check permissions first
      if (!(await isAvailable())) {
        const granted = await requestPermissions();
        if (!granted) {
          error.value = {
            code: 1,
            message: 'Location permission denied',
          };
          return null;
        }
      }

      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: options.enableHighAccuracy ?? true,
          timeout: options.timeout ?? 10000,
          maximumAge: options.maximumAge ?? 300000, // 5 minutes
        },
        (position) => {
          currentPosition.value = position;
          lastKnownPosition.value = position;
          error.value = null;
        }
      );

      isTracking.value = true;
      return watchId;
    } catch (err: any) {
      console.error('Error starting location watch:', err);

      let errorMessage = 'Unknown location error';
      let errorCode = 0;

      if (err.code) {
        switch (err.code) {
          case 1:
            errorMessage = 'Location permission denied';
            break;
          case 2:
            errorMessage = 'Location unavailable';
            break;
          case 3:
            errorMessage = 'Location request timeout';
            break;
          default:
            errorMessage = err.message || 'Location error occurred';
        }
        errorCode = err.code;
      } else {
        errorMessage = err.message || 'Location error occurred';
      }

      error.value = {
        code: errorCode,
        message: errorMessage,
      };

      return null;
    }
  };

  // Stop watching position
  const stopWatching = async (watchId?: string): Promise<void> => {
    try {
      if (watchId) {
        await Geolocation.clearWatch({ id: watchId });
      } else {
        // Clear all watches
        await Geolocation.clearWatch({ id: 'all' });
      }
      isTracking.value = false;
    } catch (err) {
      console.error('Error stopping location watch:', err);
    }
  };

  // Send geo-reporting data to server
  const sendGeoReporting = async (position:any, isStart: boolean = true): Promise<any> => {
    try {
      const download = await storageGetJson('download');
      if (!download) {
        throw new Error('No download data found');
      }

      const reportId = download.inspection.id;
      
      if (!position) {
        throw new Error('Failed to get current position');
      }

      const geoData: GeoLocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp,
      };

      if (isStart) {
        return await startGeoReporting(reportId, [geoData]);
      } else {
        return await stopGeoReporting(reportId, [geoData]);
      }
    } catch (err: any) {
      console.error('Error sending geo-reporting:', err);
      throw new Error(err.message || 'Error connecting to the server!');
    }
  };

  // Start geo-reporting (compatible with old API)
  const startGeoLocation = async (position: any): Promise<any> => {
    return await sendGeoReporting(position, true);
  };

  // Stop geo-reporting (compatible with old API)
  const stopGeoLocation = async (position: any): Promise<any> => {
    return await sendGeoReporting(position, false);
  };

  // Native geolocation methods (legacy compatibility)
  const getGeoLocation = async (position: any): Promise<any> => {
    try {
      const download = await storageGetJson('download');
      if (!download) {
        throw new Error('No download data found');
      }

      const reportId = download.inspection.id;

      // Get existing geo data from storage
      let geo: GeoLocationData[] = [];
      const existingGeo = await storageGetJson('geolocation');
      if (existingGeo) {
        geo = existingGeo;
      }

      // Add current position to geo array
      geo.push({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp,
      });

      // Send to server using API
      try {
        const data = await startGeoReporting(reportId, geo);

        // Clear stored geo data on success
        await storageRemove('geolocation');

        return data;
      } catch (error) {
        console.log('SERVICE', error);
        // Store geo data for later retry
        await storageSetJson('geolocation', geo);
        return 'Stored geo in storage';
      }
    } catch (err: any) {
      console.error('Error in nativeGetGeoLocation:', err);
      throw new Error(
        err.message || 'Error getting current position please allow location permission!'
      );
    }
  };

  const sendGeoLocation = async (): Promise<any> => {
    try {
      const download = await storageGetJson('download');
      if (!download) {
        throw new Error('No download data found');
      }

      const reportId = download.inspection.id;
      const geo = await storageGetJson('geolocation');

      if (!geo) {
        return 'No geo data stored';
      }

      // Send stored geo data to server using API
      const data = await startGeoReporting(reportId, geo);
      await storageRemove('geolocation');
      return data;
    } catch (err: any) {
      console.error('Error in nativeSendGeoLocation:', err);
      throw new Error(err.message || 'Error connecting to the server!');
    }
  };

  // Clear error
  const clearError = (): void => {
    error.value = null;
  };

  // Reset all state
  const reset = (): void => {
    currentPosition.value = null;
    lastKnownPosition.value = null;
    isTracking.value = false;
    error.value = null;
    isPermissionGranted.value = null;
  };

  return {
    // State
    currentPosition,
    lastKnownPosition,
    isTracking,
    error,
    isPermissionGranted,

    // Computed
    hasLocation,
    hasLastKnownLocation,
    latitude,
    longitude,
    accuracy,

    // Methods
    isAvailable,
    requestPermissions,
    getCurrentPosition,
    startWatching,
    stopWatching,
    sendGeoReporting,
    startGeoLocation,
    stopGeoLocation,
    getGeoLocation,
    sendGeoLocation,
    clearError,
    reset,
  };
}
