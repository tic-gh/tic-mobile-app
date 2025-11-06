import { apiClient } from './base';
import { handleApiErrorAsync } from '../util/errorHandler';
import { Filesystem } from '@capacitor/filesystem';
import JSZip from 'jszip';

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export const sendInspectionStatus = async (report_no: string, section: string) => {
  try {
    await apiClient.post('/report-status', { report_id: report_no, section: section });
  } catch (error) {
    return handleApiErrorAsync(error);
  }
};

export const startSending = async (report_no: string): Promise<any> => {
  try {
    const response = await apiClient.post('/report-sending', { report_no });
    return response.data;
  } catch (error) {
    return handleApiErrorAsync(error);
  }
};

export const sendEmail = async (report_no: string, inspector_id: string): Promise<any> => {
  try {
    const response = await apiClient.post('/emailreport', {
      report_no,
      inspector_id,
    });
    return response.data;
  } catch (error) {
    return handleApiErrorAsync(error);
  }
};

export const sendAnswers = async (
  report_id: string,
  data: Array<any>,
  download_date: string
): Promise<any> => {
  try {
    const response = await apiClient.post('/report-answers', {
      report_id,
      data,
      download_date,
    });
    return response.data;
  } catch (error) {
    return handleApiErrorAsync(error);
  }
};

export interface UploadUri {
  image: string;
  section: string;
  label: string;
}

export const checkFilesAlreadyUploaded = async (report: string): Promise<any> => {
  try {
    const response = await apiClient.get('/get-list-photos', {
      params: { report },
    });

    return response.data;
  } catch (error) {
    console.error('Error checking uploaded files:', error);
    return false;
  }
};

// Helper to convert Android/iOS file path or capacitor:// URL to Blob using Capacitor Filesystem or fetch
async function getBlobFromPath(path: string, mimeType = 'image/jpeg'): Promise<Blob> {
  if (path.startsWith('capacitor://localhost/')) {
    // Use fetch for web URLs (iOS/Capacitor)
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error('Failed to fetch image from capacitor:// URL');
    }
    return await response.blob();
  } else {
    // Use Filesystem for native file paths (Android)
    const fileData = await Filesystem.readFile({ path });
    if (typeof fileData.data !== 'string') {
      throw new Error('Filesystem.readFile did not return a base64 string');
    }
    const byteCharacters = atob(fileData.data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}

export const uploadImage = async (report_id: string, uri: UploadUri): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('report_id', report_id);
    formData.append('section', uri.section);
    formData.append('label', uri.label);

    let fileBlob: Blob;
    const fileName = uri.image.replace(/^.*[\\/]/, '');
    if (typeof uri.image === 'string') {
      fileBlob = await getBlobFromPath(uri.image);
    } else {
      throw new Error('Invalid image type for upload');
    }
    formData.append('file', fileBlob, fileName);
    const response = await apiClient.post('/report-photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Helper functions to match Laravel's clean_section and clean_label functions
function cleanSection(section: string): string {
  let cleaned = section.trim();
  cleaned = cleaned.replace(/ \/ /g, '_or_');
  cleaned = cleaned.replace(/\//g, '_or_');
  cleaned = cleaned.replace(/ & /g, '_and_');
  cleaned = cleaned.replace(/&/g, '_and_');
  cleaned = cleaned.replace(/ /g, '_');
  cleaned = cleaned.replace(/&amp;/g, '');
  return cleaned;
}

function cleanLabel(label: string): string {
  let cleaned = label;
  cleaned = cleaned.replace(/&amp;/g, '-');
  cleaned = cleaned.replace(/ & /g, '-');
  cleaned = cleaned.replace(/&/g, '-');
  cleaned = cleaned.replace(/ \/ /g, '-');
  cleaned = cleaned.replace(/\//g, '-');
  cleaned = cleaned.replace(/[’']/g, '');
  
  // Convert to slug-like format (similar to Laravel's str_slug)
  cleaned = cleaned.toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return cleaned.trim();
}

export const uploadImagesAsZip = async (report_id: string, images: UploadUri[]): Promise<any> => {
  try {
    const zip = new JSZip();

    for (const uri of images) {
      try {
        const fileBlob = await getBlobFromPath(uri.image);
        const fileName = uri.image.replace(/^.*[\\/]/, '');

        const cleanedSection = cleanSection(uri.section);
        const cleanedLabel = cleanLabel(uri.label);
        const zipPath = `${cleanedSection}/${cleanedLabel}-${fileName}`;
        
        zip.file(zipPath, fileBlob);
      } catch (error) {
        console.warn(`Failed to add image ${uri.image} to zip:`, error);
      }
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    const formData = new FormData();
    formData.append('report_id', report_id);
    formData.append('zip_file', zipBlob, `${report_id}_images.zip`);

    const response = await apiClient.post('/report-photos-zip', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading images as zip:', error);
    throw error;
  }
};

export const sendGeoReporting = async (
  report_id: string,
  geoData: GeoLocationData[],
  isStart: boolean = true
): Promise<any> => {
  try {
    const endpoint = isStart ? '/geo-reporting' : '/geo-out-reporting';
    const response = await apiClient.post(endpoint, {
      report_id,
      geolocation: JSON.stringify(geoData),
    });
    return response.data;
  } catch (error) {
    return handleApiErrorAsync(error);
  }
};

export const startGeoReporting = async (
  report_id: string,
  geoData: GeoLocationData[]
): Promise<any> => {
  return await sendGeoReporting(report_id, geoData, true);
};

export const stopGeoReporting = async (
  report_id: string,
  geoData: GeoLocationData[]
): Promise<any> => {
  return await sendGeoReporting(report_id, geoData, false);
};
