import { Platform } from 'react-native';
import { CloudinaryCredentials } from '../utils/storage';
import { logger } from '../utils/logger';

export interface UploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  [key: string]: any;
}

/**
 * Upload image using unsigned upload with upload preset
 * Uses Cloudinary's direct upload API with FormData
 */
export async function uploadImageToCloudinary(
  imageSource: string | File | Blob,
  credentials: CloudinaryCredentials,
  description?: string,
  tags?: string[]
): Promise<UploadResponse> {
  try {
    let filename = 'image.jpg';
    let fileType = 'jpg';
    let uri: string | null = null;

    if (typeof imageSource === 'string') {
      uri = imageSource;
      filename = uri.split('/').pop() || filename;
      fileType = (filename.split('.').pop() || fileType).toLowerCase();
    } else if (imageSource instanceof File) {
      filename = imageSource.name || filename;
      if (imageSource.type) {
        const [, ext] = imageSource.type.split('/');
        if (ext) {
          fileType = ext;
        }
      }
    } else if (imageSource instanceof Blob) {
      if (imageSource.type) {
        const [, ext] = imageSource.type.split('/');
        if (ext) {
          fileType = ext;
          filename = `image.${ext}`;
        }
      }
    } else {
      throw new Error('Unsupported image source provided');
    }
    
    logger.debug('[uploadImageToCloudinary] Preparing upload', {
      filename,
      fileType,
      isStringSource: typeof imageSource === 'string',
      isFileSource: imageSource instanceof File,
      isBlobSource: imageSource instanceof Blob,
      hasDescription: !!description,
      tagCount: tags?.length || 0,
      folder: credentials.folder,
      cloudName: credentials.cloudName,
    });

    // Create FormData for the upload
    const formData = new FormData();
    
    // Add upload preset (required for unsigned uploads)
    formData.append('upload_preset', credentials.uploadPreset);
    
    // Add folder
    if (credentials.folder) {
      formData.append('folder', credentials.folder);
    }
    
    // Add tags if provided (comma-separated)
    if (tags && tags.length > 0) {
      formData.append('tags', tags.join(','));
    }
    
    // Add the file - handle platform-specific requirements
    if (typeof imageSource === 'string') {
      if (Platform.OS === 'web') {
        const fileResponse = await fetch(uri as string);
        const blob = await fileResponse.blob();
        formData.append('file', blob, filename);
      } else {
        formData.append('file', {
          uri,
          type: `image/${fileType}`,
          name: filename,
        } as any);
      }
    } else if (imageSource instanceof File) {
      formData.append('file', imageSource);
    } else {
      formData.append('file', imageSource);
    }

    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`;
    
    logger.debug('[uploadImageToCloudinary] Uploading to Cloudinary', { uploadUrl });

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[uploadImageToCloudinary] Cloudinary upload failed', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      let errorMessage = `Upload failed with status ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // ignore parse errors
      }
      throw new Error(errorMessage);
    }

    const result: UploadResponse = await response.json();
    logger.debug('[uploadImageToCloudinary] Upload finished', {
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
    });
    return result;
  } catch (error) {
    logger.error('Upload error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to upload image');
  }
}

