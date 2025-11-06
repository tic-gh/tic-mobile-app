import { ref, computed, readonly } from 'vue';
import { Camera, CameraResultType, CameraSource, CameraDirection, ImageOptions } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useI18n } from 'vue-i18n';

export interface CameraImage {
  webPath: string;
  path?: string;
}

export interface CameraError {
  message: string;
  code?: string;
}

export function useCamera() {
  const isAvailable = ref(false);
  const hasPermission = ref(false);
  const isLoading = ref(false);
  const lastImage = ref<CameraImage | null>(null);
  const error = ref<CameraError | null>(null);
  const { t } = useI18n({ useScope: 'global' });

  // Check if camera is available on the current platform
  const checkAvailability = async () => {
    try {
      isAvailable.value = Capacitor.isPluginAvailable('Camera');
      return isAvailable.value;
    } catch (err) {
      console.error('Error checking camera availability:', err);
      isAvailable.value = false;
      return false;
    }
  };

  // Check camera permissions
  const checkPermissions = async (): Promise<boolean> => {
    try {
      if (!isAvailable.value) {
        await checkAvailability();
      }

      if (!isAvailable.value) {
        hasPermission.value = false;
        return false;
      }

      const permission = await Camera.checkPermissions();
      hasPermission.value = permission.camera === 'granted';
      return hasPermission.value;
    } catch (err) {
      console.error('Error checking camera permissions:', err);
      hasPermission.value = false;
      return false;
    }
  };

  // Request camera permissions
  const requestPermissions = async (): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;

      if (!isAvailable.value) {
        await checkAvailability();
      }

      if (!isAvailable.value) {
        throw new Error('Camera is not available on this device');
      }

      const permission = await Camera.requestPermissions();
      hasPermission.value = permission.camera === 'granted';
      return hasPermission.value;
    } catch (err) {
      const cameraError: CameraError = {
        message: err instanceof Error ? err.message : 'Failed to request camera permissions',
        code: 'PERMISSION_DENIED',
      };
      error.value = cameraError;
      hasPermission.value = false;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Take a photo using the camera
  const takePhoto = async (
    portrait: boolean,
    options: Partial<ImageOptions> = {}
  ): Promise<CameraImage | null> => {
    try {
      isLoading.value = true;
      error.value = null;

      if (!isAvailable.value) {
        await checkAvailability();
      }

      if (!isAvailable.value) {
        throw new Error('Camera is not available on this device');
      }

      const defaultOptions: ImageOptions = {
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        direction: CameraDirection.Rear,
        correctOrientation: true,
        saveToGallery: true,
        ...options,
      };

      const image = await Camera.getPhoto(defaultOptions);

      // Check orientation using webPath and compare with 'portrait' param
      if (image.webPath) {
        await new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            const isPortrait = img.height > img.width;

            if (portrait && !isPortrait) {
              reject(new Error(t('error_portrait')));
            } else if (!portrait && isPortrait) {
              reject(new Error(t('error_landscape')));
            } else {
              resolve();
            }
          };
          img.onerror = () => {
            reject(new Error('Failed to load image for orientation check'));
          };
          if (image.webPath) {
            img.src = image.webPath;
          }
        });
      }

      if (!image.webPath) {
        throw new Error('No image path received from camera');
      }
      const webPath = image.webPath!;

      const cameraImage: CameraImage = {
        webPath,
        path: image.path,
      };

      lastImage.value = cameraImage;
      return cameraImage;
    } catch (err) {
      const cameraError: CameraError = {
        message: err instanceof Error ? err.message : 'Failed to take photo',
        code: 'CAMERA_ERROR',
      };
      error.value = cameraError;
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Pick an image from the gallery
  const pickFromGallery = async (
    options: Partial<ImageOptions> = {}
  ): Promise<CameraImage | null> => {
    try {
      isLoading.value = true;
      error.value = null;

      if (!isAvailable.value) {
        await checkAvailability();
      }

      if (!isAvailable.value) {
        throw new Error('Camera is not available on this device');
      }

      const defaultOptions: ImageOptions = {
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        correctOrientation: true,
        saveToGallery: true,
        ...options,
      };

      const image = await Camera.getPhoto(defaultOptions);

      if (!image.webPath) {
        throw new Error('No image path received from gallery');
      }
      const webPath = image.webPath!;

      const cameraImage: CameraImage = {
        webPath,
        path: image.path,
      };

      lastImage.value = cameraImage;
      return cameraImage;
    } catch (err) {
      const cameraError: CameraError = {
        message: err instanceof Error ? err.message : 'Failed to pick image from gallery',
        code: 'GALLERY_ERROR',
      };
      error.value = cameraError;
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Pick an image from either camera or gallery
  const pickImage = async (options: Partial<ImageOptions> = {}): Promise<CameraImage | null> => {
    try {
      isLoading.value = true;
      error.value = null;

      if (!isAvailable.value) {
        await checkAvailability();
      }

      if (!isAvailable.value) {
        throw new Error('Camera is not available on this device');
      }

      const defaultOptions: ImageOptions = {
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        width: 1920,
        height: 1080,
        correctOrientation: true,
        saveToGallery: true,
        ...options,
      };

      const image = await Camera.getPhoto(defaultOptions);

      if (!image.webPath) {
        throw new Error('No image path received from picker');
      }
      const webPath = image.webPath!;

      const cameraImage: CameraImage = {
        webPath,
        path: image.path,
      };

      lastImage.value = cameraImage;
      return cameraImage;
    } catch (err) {
      const cameraError: CameraError = {
        message: err instanceof Error ? err.message : 'Failed to pick image',
        code: 'PICK_ERROR',
      };
      error.value = cameraError;
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Clear the last captured image
  const clearLastImage = () => {
    lastImage.value = null;
    error.value = null;
  };

  // Clear any error state
  const clearError = () => {
    error.value = null;
  };

  // Computed properties
  const hasImage = computed(() => lastImage.value !== null);
  const imageUrl = computed(() => lastImage.value?.webPath || null);
  const hasError = computed(() => error.value !== null);

  return {
    // State
    isAvailable: readonly(isAvailable),
    hasPermission: readonly(hasPermission),
    isLoading: readonly(isLoading),
    lastImage: readonly(lastImage),
    error: readonly(error),

    // Computed
    hasImage,
    imageUrl,
    hasError,

    // Methods
    checkAvailability,
    checkPermissions,
    requestPermissions,
    takePhoto,
    pickFromGallery,
    pickImage,
    clearLastImage,
    clearError,
  };
}
