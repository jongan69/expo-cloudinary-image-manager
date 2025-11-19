import { CloudinaryCredentials } from '../utils/storage';
import { Photo } from '../types';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

/**
 * Fetch photos from Cloudinary using the Admin API via Expo Router API route
 * Credentials are sent in POST body to the API route (similar to Netlify function)
 */
export async function fetchPhotos(
  credentials: CloudinaryCredentials,
  apiKey?: string,
  apiSecret?: string
): Promise<Photo[]> {
  logger.debug('[fetchPhotos] Starting fetch with credentials:', {
    hasCloudName: !!credentials.cloudName,
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
    folder: credentials.folder || 'Modeling',
  });
  
  if (!apiKey || !apiSecret) {
    logger.error('[fetchPhotos] Missing API credentials');
    throw new Error('API credentials required to fetch photos');
  }

  // Use API route for fetching photos (requires admin access)
  // In Expo Router, API routes are available at the /api path
  // For native, we need to construct the full URL
  let apiUrl = '/api/fetch-photos';
  
  // Detect if we're running in native (not web)
  const isNative = Platform.OS !== 'web';
  const executionEnvironment = Constants.executionEnvironment;
  
  logger.debug('[fetchPhotos] Platform detection:', {
    PlatformOS: Platform.OS,
    executionEnvironment,
    isNative,
    hostUri: Constants.expoConfig?.hostUri,
  });
  
  if (isNative || executionEnvironment === 'standalone' || executionEnvironment === 'storeClient') {
    // Native environment - use localhost or your server URL
    const manifest = Constants.expoConfig;
    const hostUri = manifest?.hostUri;
    
    if (hostUri) {
      // Extract host and port from hostUri (format: "192.168.12.192:8081")
      const [host, port] = hostUri.split(':');
      apiUrl = `http://${host}:${port || '8081'}/api/fetch-photos`;
    } else {
      // Fallback to localhost:8081 (default Expo dev server)
      apiUrl = 'http://localhost:8081/api/fetch-photos';
    }
  }
  
  logger.debug('[fetchPhotos] API URL:', apiUrl);
  
  const requestBody = {
    cloudName: credentials.cloudName,
    apiKey,
    apiSecret,
    folder: credentials.folder || 'Modeling',
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    logger.debug('[fetchPhotos] Response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      logger.error('[fetchPhotos] Response not OK. Status:', response.status);
      logger.error('[fetchPhotos] Response text:', responseText.substring(0, 200));
      throw new Error(`Failed to fetch photos: ${response.status} ${response.statusText}`);
    }

    // Parse JSON response
    const data = await response.json();
    logger.debug('[fetchPhotos] Parsed JSON successfully. Photos count:', data.photos?.length || 0);

    return data.photos || [];
  } catch (error) {
    logger.error('[fetchPhotos] Fetch error:', error);
    if (error instanceof Error) {
      logger.error('[fetchPhotos] Error message:', error.message);
    }
    throw error;
  }
}

/**
 * Update image metadata via API route
 */
export async function updateImageMetadata(
  publicId: string,
  description: string | undefined,
  tags: string[] | undefined,
  credentials: CloudinaryCredentials,
  apiKey: string,
  apiSecret: string
): Promise<void> {
  // Use API route for metadata updates
  let apiUrl = '/api/update-metadata';
  
  // Detect if we're running in native (not web)
  const isNative = Platform.OS !== 'web';
  const executionEnvironment = Constants.executionEnvironment;
  
  if (isNative || executionEnvironment === 'standalone' || executionEnvironment === 'storeClient') {
    // Native environment - use localhost or your server URL
    const manifest = Constants.expoConfig;
    const hostUri = manifest?.hostUri;
    
    if (hostUri) {
      // Extract host and port from hostUri (format: "localhost:8081")
      const [host, port] = hostUri.split(':');
      apiUrl = `http://${host}:${port || '8081'}/api/update-metadata`;
    } else {
      // Fallback to localhost:8081 (default Expo dev server)
      apiUrl = 'http://localhost:8081/api/update-metadata';
    }
  }
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      publicId,
      description,
      tags,
      cloudName: credentials.cloudName,
      apiKey,
      apiSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update metadata');
  }
}
