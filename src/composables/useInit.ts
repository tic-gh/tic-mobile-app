import { onMounted, ref } from 'vue';
import { onIonViewWillEnter } from '@ionic/vue';

/**
 * Composable that calls an init method on both onMounted and onIonViewWillEnter
 * Ensures init method only runs once per component lifecycle
 * @param initMethod - The method to call for initialization
 */
export function useInit(initMethod: () => void | Promise<void>) {
  const isCalled = ref(false);

  onMounted(() => {
    if (!isCalled.value) {
      initMethod();
    }
  });

  onIonViewWillEnter(() => {
    initMethod();
    isCalled.value = true;
  });
}
