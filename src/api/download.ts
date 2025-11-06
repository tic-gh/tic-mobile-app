import { apiClient } from './base';
import { handleApiErrorAsync } from '../util/errorHandler';
import { DownloadData } from '../types';

export const download = async (reportId: string, password: string): Promise<DownloadData> => {
  try {
    const response = await apiClient.post<DownloadData>('/download', {
      report_no: reportId,
      password: password,
    });
    return response.data;
  } catch (error) {
    // Use the reusable error handler
    const apiError = await handleApiErrorAsync(error, {
      showToast: true,
      toastDuration: 5000,
      logError: true,
    });
    throw apiError;
  }
};
