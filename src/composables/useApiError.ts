import { useI18n } from 'vue-i18n';
import {
  apiErrorHandler,
  handleApiError,
  handleApiErrorAsync,
  handleNetworkError,
  handleServerError,
  handleAuthError,
  handleValidationError,
  type ErrorHandlerOptions,
  type ApiError,
} from '@/util/errorHandler';

export function useApiError() {
  const { t } = useI18n({ useScope: 'global' });

  // Set i18n instance for the error handler
  apiErrorHandler.setI18n({ t });

  const handleError = (error: any, options?: ErrorHandlerOptions): ApiError => {
    return handleApiError(error, options);
  };

  const handleErrorAsync = async (error: any, options?: ErrorHandlerOptions): Promise<ApiError> => {
    return handleApiErrorAsync(error, options);
  };

  const handleNetworkErrorAsync = async (
    error: any,
    options?: ErrorHandlerOptions
  ): Promise<ApiError> => {
    return handleNetworkError(error, options);
  };

  const handleServerErrorAsync = async (
    error: any,
    options?: ErrorHandlerOptions
  ): Promise<ApiError> => {
    return handleServerError(error, options);
  };

  const handleAuthErrorAsync = async (
    error: any,
    options?: ErrorHandlerOptions
  ): Promise<ApiError> => {
    return handleAuthError(error, options);
  };

  const handleValidationErrorAsync = async (
    error: any,
    options?: ErrorHandlerOptions
  ): Promise<ApiError> => {
    return handleValidationError(error, options);
  };

  // Convenience method for API calls with automatic error handling
  const withErrorHandling = async <T>(
    apiCall: () => Promise<T>,
    options?: ErrorHandlerOptions
  ): Promise<T | null> => {
    try {
      return await apiCall();
    } catch (error) {
      await handleErrorAsync(error, options);
      return null;
    }
  };

  // Convenience method for API calls with custom error handling
  const withCustomErrorHandling = async <T>(
    apiCall: () => Promise<T>,
    errorHandler: (error: any) => void | Promise<void>,
    options?: ErrorHandlerOptions
  ): Promise<T | null> => {
    try {
      return await apiCall();
    } catch (error) {
      await errorHandler(error);
      await handleErrorAsync(error, { ...options, showToast: false }); // Don't show toast if custom handler is provided
      return null;
    }
  };

  return {
    handleError,
    handleErrorAsync,
    handleNetworkErrorAsync,
    handleServerErrorAsync,
    handleAuthErrorAsync,
    handleValidationErrorAsync,
    withErrorHandling,
    withCustomErrorHandling,
    apiErrorHandler,
  };
}
