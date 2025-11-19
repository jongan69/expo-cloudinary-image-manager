import { CloudinaryCredentials } from '../utils/storage';

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
  imageUri: string,
  credentials: CloudinaryCredentials,
  description?: string,
  tags?: string[]
): Promise<UploadResponse> {
  try {
    // Read the file as a blob for upload
    // In React Native, we need to convert the local URI to a format that can be uploaded
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const fileType = filename.split('.').pop() || 'jpg';
    
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
    
    // Add the file
    // For React Native, we need to append the file with proper type
    formData.append('file', {
      uri: imageUri,
      type: `image/${fileType}`,
      name: filename,
    } as any);

    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
    }

    const result: UploadResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to upload image');
  }
}

