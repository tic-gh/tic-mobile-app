import { apiClient } from './base';
import { handleApiErrorAsync } from '../util/errorHandler';
import { Filesystem, Directory } from '@capacitor/filesystem';
import JSZip from 'jszip';
import { Uploader } from '@capgo/capacitor-uploader';
import { Capacitor } from '@capacitor/core';

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

export type UploadProgressCallback = (percent: number) => void;

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

// Helper to convert file:// URI to a path or content:// URI that Android uploader can use
// The uploader supports / (absolute paths) and content:// URIs on Android
// On iOS, capacitor:// URLs need to be converted to file:// URLs
async function convertFileUriForUpload(uri: string): Promise<string> {
  // If it's already a content:// URI, return as-is
  if (uri.startsWith('content://')) {
    return uri;
  }

  // On iOS, convert capacitor://localhost/_capacitor_file_/... to file://...
  // The Swift uploader expects a file:// URL, not a capacitor:// URL
  if (uri.startsWith('capacitor://') && Capacitor.getPlatform() === 'ios') {
    // Extract the path after _capacitor_file_/
    let path = uri.replace(/^capacitor:\/\/localhost\/_capacitor_file_\//, '');
    // Ensure path starts with / for proper file:// URL (needs three slashes: file:///)
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    // Convert to file:// URL (file:///path/to/file)
    return `file://${path}`;
  }

  // If it's a file:// URI on Android, convert it to absolute path
  // The uploader supports / paths on Android according to the error message
  if (uri.startsWith('file://') && Capacitor.getPlatform() === 'android') {
    // Remove file:// prefix to get absolute path
    // file:///storage/emulated/0/... becomes /storage/emulated/0/...
    let filePath = uri.replace(/^file:\/\//, '');
    
    // Ensure it starts with / for absolute path
    if (!filePath.startsWith('/')) {
      filePath = '/' + filePath;
    }
    
    // Return absolute path (uploader supports / paths on Android)
    return filePath;
  }

  // For iOS file:// URIs, ensure they have the correct format (file:///path)
  if (uri.startsWith('file://') && Capacitor.getPlatform() === 'ios') {
    // Remove file:// prefix to get the path
    let path = uri.replace(/^file:\/\//, '');
    // Ensure path starts with / for proper file:// URL (needs three slashes: file:///)
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    // Return properly formatted file:// URL
    return `file://${path}`;
  }

  // For other platforms or non-file:// URIs, return as-is
  return uri;
}

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

export const uploadImage = async (
  report_id: string,
  uri: UploadUri,
  onProgress?: UploadProgressCallback
): Promise<any> => {
  try {
    // Get API base URL and construct full server URL
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const serverUrl = `${API_BASE_URL}/report-photos`;

    // Get authorization token
    const token = localStorage.getItem('access_token');
    const headers: { [key: string]: string } = {};
    if (token) {
      headers['Authorization'] = token;
    }

    // Set up event listener before starting upload to avoid race conditions
    return new Promise(async (resolve, reject) => {
      let uploadId: string | null = null;
      let listenerHandle: any = null;

      // Set up listener first
      listenerHandle = await Uploader.addListener('events', (event) => {
        // Only process events for this specific upload
        if (uploadId && event.id === uploadId) {
          switch (event.name) {
            case 'completed':
              if (listenerHandle) {
                listenerHandle.remove();
              }
              // Call progress callback with 100% when completed
              if (onProgress) {
                onProgress(100);
              }
              // The plugin doesn't return the response body directly,
              // so we'll resolve with a success object
              // If you need the actual response data, you may need to
              // make a separate API call or modify the server to return data in headers
              resolve({
                success: true,
                statusCode: event.payload.statusCode,
                id: uploadId,
              });
              break;
            case 'failed':
              if (listenerHandle) {
                listenerHandle.remove();
              }
              reject(new Error(event.payload.error || 'Upload failed'));
              break;
            case 'uploading':
              // Progress updates - call the callback if provided
              if (event.payload.percent !== undefined) {
                if (onProgress) {
                  onProgress(event.payload.percent);
                }
                console.log(`Upload progress: ${event.payload.percent}%`);
              }
              break;
          }
        }
      });

      try {
        // Convert file:// URI to a format that Android uploader can use
        const uploadPath = await convertFileUriForUpload(uri.image);
        
        // Start upload after listener is set up
        const result = await Uploader.startUpload({
          filePath: uploadPath,
          serverUrl: serverUrl,
          parameters: {
            report_id: report_id,
            section: uri.section,
            label: uri.label,
            filename: uri.image.split('/').pop() || '',
          },
          headers: headers
        });

        uploadId = result.id;
      } catch (error) {
        if (listenerHandle) {
          listenerHandle.remove();
        }
        reject(error);
      }
    });
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

// Helper function to convert Blob to base64 string
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix if present
        const base64 = reader.result.split(',')[1] || reader.result;
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper function to create and upload a single zip chunk
async function uploadZipChunk(
  report_id: string, 
  images: UploadUri[], 
  chunkIndex: number
): Promise<any> {
  const zip = new JSZip();
  const BATCH_SIZE = 3; // Process 3 images at a time to prevent memory overflow

  // Process images in small batches to avoid loading all into memory at once
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (uri) => {
      try {
        const fileBlob = await getBlobFromPath(uri.image);
        const fileName = uri.image.replace(/^.*[\\/]/, '');

        const cleanedSection = cleanSection(uri.section);
        const cleanedLabel = cleanLabel(uri.label);
        const zipPath = `${cleanedSection}/${cleanedLabel}-${fileName}`;
        
        zip.file(zipPath, fileBlob);
        return true;
      } catch (error) {
        console.warn(`Failed to add image ${uri.image} to zip:`, error);
        return false;
      }
    });

    // Wait for current batch to complete
    await Promise.all(batchPromises);
    
    // Small delay to allow garbage collection between batches
    if (i + BATCH_SIZE < images.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Generate zip with compression to reduce memory usage
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 } // Balanced compression (1-9, 6 is a good balance)
  });

  // Save zip file to Documents directory for easy access
  const zipFileName = `${report_id}_images_part${chunkIndex}.zip`;
  const zipBase64 = await blobToBase64(zipBlob);
  
  let savedFilePath: string | null = null;
  try {
    // Ensure the directory exists
    const directory = Directory.Documents;
    
    // Save the zip file
    await Filesystem.writeFile({
      path: zipFileName,
      data: zipBase64,
      directory: directory,
      recursive: true
    });

    // Get the full URI path for easy access
    const fileUri = await Filesystem.getUri({
      path: zipFileName,
      directory: directory
    });
    
    savedFilePath = fileUri.uri;
    console.log(`Zip file saved to: ${savedFilePath}`);
  } catch (saveError) {
    console.warn('Failed to save zip file to Documents directory:', saveError);
    // Continue with upload even if save fails
  }

  const formData = new FormData();
  formData.append('report_id', report_id);
  formData.append('zip_file', zipBlob, zipFileName);

  const response = await apiClient.post('/report-photos-zip', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return {
    ...response.data,
    savedFilePath: savedFilePath,
    fileName: zipFileName
  };
}

export const uploadImagesAsZip = async (report_id: string, images: UploadUri[]): Promise<any> => {
  try {
    // Split into chunks of max 20 images per zip to prevent memory overflow
    // This ensures we don't try to load too many large images into memory at once
    const MAX_IMAGES_PER_ZIP = 20;
    
    if (images.length <= MAX_IMAGES_PER_ZIP) {
      // Small enough to process in a single zip
      const result = await uploadZipChunk(report_id, images, 1);
      return {
        ...result,
        savedPaths: result.savedFilePath ? [result.savedFilePath] : [],
        savedPath: result.savedFilePath
      };
    }

    // Split into multiple chunks and upload separately
    const chunks: UploadUri[][] = [];
    for (let i = 0; i < images.length; i += MAX_IMAGES_PER_ZIP) {
      chunks.push(images.slice(i, i + MAX_IMAGES_PER_ZIP));
    }

    console.log(`Splitting ${images.length} images into ${chunks.length} zip files to prevent memory overflow`);

    // Upload chunks sequentially to avoid overwhelming memory
    const results = [];
    for (let i = 0; i < chunks.length; i++) {
      const result = await uploadZipChunk(report_id, chunks[i], i + 1);
      results.push(result);
      
      // Small delay between chunks to allow garbage collection
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Return success if all chunks uploaded successfully
    const allSuccessful = results.every(r => r && r.success !== false);
    const savedPaths = results.map(r => r.savedFilePath).filter(Boolean);
    
    return {
      success: allSuccessful,
      message: allSuccessful 
        ? `Successfully uploaded ${chunks.length} zip file(s)` 
        : 'Some zip files failed to upload',
      chunks: results,
      savedPaths: savedPaths, // Array of file paths where zip files are saved
      savedPath: savedPaths.length > 0 ? savedPaths[0] : null // First saved path for convenience
    };
  } catch (error) {
    console.error('Error uploading images as zip:', error);
    throw error;
  }
};

export const startGeoReporting = async (
  report_id: string,
  geoData: GeoLocationData[]
): Promise<any> => {
  try {
    const response = await apiClient.post('/geo-reporting', {
      report_id,
      geolocation: JSON.stringify(geoData),
    });
    return response.data;
  } catch (error) {
    return handleApiErrorAsync(error);
  }
};

export const stopGeoReporting = async (
  report_id: string,
  geoData: GeoLocationData[]
): Promise<any> => {
  try {
    const response = await apiClient.post('/geo-out-reporting', {
      report_id,
      geolocation: JSON.stringify(geoData),
    });
    return response.data;
  } catch (error) {
    return handleApiErrorAsync(error);
  }
};
