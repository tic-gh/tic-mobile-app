import { ref, Ref } from 'vue';

/**
 * A composable that provides debounce functionality
 * @param delay - The delay in milliseconds
 * @returns An object with debounced function and cancel method
 */
export function useDebounce<T extends (...args: any[]) => any>(delay: number = 300) {
  const timeoutId = ref<NodeJS.Timeout | null>(null);
  const isDebouncing = ref(false);

  /**
   * Creates a debounced version of the provided function
   * @param fn - The function to debounce
   * @returns The debounced function
   */
  const debounce = (fn: T): T => {
    return ((...args: Parameters<T>) => {
      if (timeoutId.value) {
        clearTimeout(timeoutId.value);
      }

      isDebouncing.value = true;

      timeoutId.value = setTimeout(() => {
        fn(...args);
        isDebouncing.value = false;
        timeoutId.value = null;
      }, delay);
    }) as T;
  };

  /**
   * Cancels the current debounce operation
   */
  const cancel = () => {
    if (timeoutId.value) {
      clearTimeout(timeoutId.value);
      timeoutId.value = null;
      isDebouncing.value = false;
    }
  };

  /**
   * Immediately executes the function and cancels any pending debounce
   * @param fn - The function to execute immediately
   */
  const flush = (fn: T) => {
    cancel();
    return fn;
  };

  return {
    debounce,
    cancel,
    flush,
    isDebouncing: isDebouncing as Ref<boolean>,
  };
}

/**
 * A simpler debounce function that doesn't require the composable pattern
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced function
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number = 300): T {
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T;
}
