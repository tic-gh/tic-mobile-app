import axios, { AxiosError } from 'axios';
import { toastController } from '@ionic/vue';

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  toastDuration?: number;
  toastColor?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'light'
    | 'medium'
    | 'dark';
  logError?: boolean;
  customMessage?: string;
}

export class ApiErrorHandler {
  private static instance: ApiErrorHandler;
  private i18n: any = null;

  private constructor() {}

  public static getInstance(): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler();
    }
    return ApiErrorHandler.instance;
  }

  public setI18n(i18n: any): void {
    this.i18n = i18n;
  }

  private getTranslatedMessage(key: string, fallback: string): string {
    if (this.i18n && this.i18n.t) {
      return this.i18n.t(key) || fallback;
    }
    return fallback;
  }

  private async showToast(message: string, options: ErrorHandlerOptions = {}): Promise<void> {
    if (!options.showToast) return;

    try {
      const toast = await toastController.create({
        message,
        duration: options.toastDuration || 3000,
        color: options.toastColor || 'danger'
      });
      await toast.present();
    } catch (error) {
      console.error('Failed to show toast:', error);
    }
  }

  private logError(error: any, options: ErrorHandlerOptions = {}): void {
    if (options.logError !== false) {
      console.error('API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
      });
    }
  }

  public handleError(error: any, options: ErrorHandlerOptions = {}): ApiError {
    this.logError(error, options);

    let status = 0;
    let message = options.customMessage || 'An unexpected error occurred';

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      status = axiosError.response?.status || 0;

      // Handle specific HTTP status codes
      switch (status) {
        case 400:
          message = this.getTranslatedMessage('error_details', 'Invalid request data');
          break;
        case 401:
          message = this.getTranslatedMessage('error_credential', 'Authentication failed');
          break;
        case 403:
          message = this.getTranslatedMessage('error_credential', 'Access denied');
          break;
        case 404:
          message = this.getTranslatedMessage('error_not_found', 'Resource not found');
          break;
        case 405:
          message = this.getTranslatedMessage(
            'app_outdated',
            'Please update to the latest app version'
          );
          break;
        case 422:
          message = this.getTranslatedMessage('error_details', 'Validation failed');
          break;
        case 429:
          message = this.getTranslatedMessage(
            'error_connection',
            'Too many requests. Please try again later'
          );
          break;
        case 500:
          message = this.getTranslatedMessage(
            'error_server',
            'Server encountered an error. Please try again later'
          );
          break;
        case 502:
        case 503:
        case 504:
          message = this.getTranslatedMessage(
            'error_connection',
            'Service temporarily unavailable. Please try again later'
          );
          break;
        default:
          if (
            axiosError.response?.data &&
            typeof axiosError.response.data === 'object' &&
            'message' in axiosError.response.data
          ) {
            message = (axiosError.response.data as { message: string }).message;
          } else if (axiosError.message) {
            message = axiosError.message;
          }
          break;
      }

      // Handle network errors
      if (!axiosError.response && axiosError.request) {
        message = this.getTranslatedMessage('error_connection', 'Connection not available');
        status = 0;
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    // Show toast notification
    this.showToast(message, options);

    return {
      status,
      message,
      details: error.response?.data || error,
    };
  }

  public async handleErrorAsync(error: any, options: ErrorHandlerOptions = {}): Promise<ApiError> {
    const apiError = this.handleError(error, options);
    return apiError;
  }

  // Convenience methods for common error scenarios
  public async handleNetworkError(
    error: any,
    options: ErrorHandlerOptions = {}
  ): Promise<ApiError> {
    return this.handleErrorAsync(error, {
      ...options,
      customMessage: this.getTranslatedMessage('error_connection', 'Connection not available'),
      toastColor: 'warning',
    });
  }

  public async handleServerError(error: any, options: ErrorHandlerOptions = {}): Promise<ApiError> {
    return this.handleErrorAsync(error, {
      ...options,
      customMessage: this.getTranslatedMessage(
        'error_server',
        'Server encountered an error. Please try again later'
      ),
      toastColor: 'danger',
    });
  }

  public async handleAuthError(error: any, options: ErrorHandlerOptions = {}): Promise<ApiError> {
    return this.handleErrorAsync(error, {
      ...options,
      customMessage: this.getTranslatedMessage('error_credential', 'Authentication failed'),
      toastColor: 'danger',
    });
  }

  public async handleValidationError(
    error: any,
    options: ErrorHandlerOptions = {}
  ): Promise<ApiError> {
    return this.handleErrorAsync(error, {
      ...options,
      customMessage: this.getTranslatedMessage('error_details', 'Invalid details provided'),
      toastColor: 'warning',
    });
  }
}

// Export singleton instance
export const apiErrorHandler = ApiErrorHandler.getInstance();

// Export convenience functions
export const handleApiError = (error: any, options?: ErrorHandlerOptions): ApiError => {
  return apiErrorHandler.handleError(error, options);
};

export const handleApiErrorAsync = async (
  error: any,
  options?: ErrorHandlerOptions
): Promise<ApiError> => {
  return apiErrorHandler.handleErrorAsync(error, options);
};

// Export specific error handlers
export const handleNetworkError = async (
  error: any,
  options?: ErrorHandlerOptions
): Promise<ApiError> => {
  return apiErrorHandler.handleNetworkError(error, options);
};

export const handleServerError = async (
  error: any,
  options?: ErrorHandlerOptions
): Promise<ApiError> => {
  return apiErrorHandler.handleServerError(error, options);
};

export const handleAuthError = async (
  error: any,
  options?: ErrorHandlerOptions
): Promise<ApiError> => {
  return apiErrorHandler.handleAuthError(error, options);
};

export const handleValidationError = async (
  error: any,
  options?: ErrorHandlerOptions
): Promise<ApiError> => {
  return apiErrorHandler.handleValidationError(error, options);
};
