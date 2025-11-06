import { ref } from 'vue';
import { loadingController } from '@ionic/vue';

type SpinnerType =
  | 'bubbles'
  | 'circles'
  | 'circular'
  | 'crescent'
  | 'dots'
  | 'lines'
  | 'lines-small'
  | 'lines-sharp'
  | 'lines-sharp-small'
  | null;

export interface LoadingOptions {
  message?: string;
  spinner?: SpinnerType;
  cssClass?: string;
  duration?: number;
  backdropDismiss?: boolean;
  translucent?: boolean;
  animated?: boolean;
}

export function useLoading() {
  const isLoading = ref(false);
  const currentLoading = ref<any>(null);

  const loadingShow = async (options: LoadingOptions = {}) => {
    try {
      // Hide any existing loading first
      await loadingHide();

      const loading = await loadingController.create({
        spinner: options.spinner || null,
        cssClass: options.cssClass || 'tic-loading',
        message: options.message || 'Please wait...',
        duration: options.duration,
        backdropDismiss: options.backdropDismiss || false,
        translucent: options.translucent || false,
        animated: options.animated !== false,
      });

      currentLoading.value = loading;
      isLoading.value = true;
      await loading.present();

      return loading;
    } catch (error) {
      console.error('Error showing loading:', error);
      isLoading.value = false;
      throw error;
    }
  };

  const loadingHide = async () => {
    try {
      if (currentLoading.value) {
        await currentLoading.value.dismiss();
        currentLoading.value = null;
      }
      isLoading.value = false;
    } catch (error) {
      console.error('Error hiding loading:', error);
      // Reset state even if there's an error
      currentLoading.value = null;
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    currentLoading,
    loadingShow,
    loadingHide,
  };
}
