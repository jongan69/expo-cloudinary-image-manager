import { CloudinaryCredentials } from '../utils/storage';
import { Photo } from '../types';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Fetch photos from Cloudinary using the Admin API via Expo Router API route
 * Credentials are sent in POST body to the API route (similar to Netlify function)
 */
export async function fetchPhotos(
  credentials: CloudinaryCredentials,
  apiKey?: string,
  apiSecret?: string
): Promise<Photo[]> {
  console.log('[fetchPhotos] Starting fetch with credentials:', {
    hasCloudName: !!credentials.cloudName,
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
    folder: credentials.folder || 'Modeling',
  });
  
  if (!apiKey || !apiSecret) {
    console.error('[fetchPhotos] Missing API credentials');
    throw new Error('API credentials required to fetch photos');
  }

  // Use API route for fetching photos (requires admin access)
  // In Expo Router, API routes are available at the /api path
  // For native, we need to construct the full URL
  let apiUrl = '/api/fetch-photos';
  
  // Detect if we're running in native (not web)
  const isNative = Platform.OS !== 'web';
  const executionEnvironment = Constants.executionEnvironment;
  
  console.log('[fetchPhotos] Platform detection:', {
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
  
  console.log('[fetchPhotos] API URL:', apiUrl);
  console.log('[fetchPhotos] Request body:', {
    cloudName: credentials.cloudName,
    folder: credentials.folder || 'Modeling',
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
  });
  
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

    console.log('[fetchPhotos] Response status:', response.status);
    console.log('[fetchPhotos] Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('[fetchPhotos] Response ok:', response.ok);

    // Get response text first to see what we're actually receiving
    const responseText = await response.text();
    console.log('[fetchPhotos] Response text (first 500 chars):', responseText.substring(0, 500));
    console.log('[fetchPhotos] Response text length:', responseText.length);

    if (!response.ok) {
      console.error('[fetchPhotos] Response not OK. Status:', response.status);
      console.error('[fetchPhotos] Response text:', responseText);
      throw new Error(`Failed to fetch photos: ${response.status} ${response.statusText}`);
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('[fetchPhotos] Parsed JSON successfully. Photos count:', data.photos?.length || 0);
    } catch (parseError) {
      console.error('[fetchPhotos] JSON parse error:', parseError);
      console.error('[fetchPhotos] Response text that failed to parse:', responseText);
      throw new Error(`Invalid JSON response from server. Response: ${responseText.substring(0, 200)}`);
    }

    return data.photos || [];
  } catch (error) {
    console.error('[fetchPhotos] Fetch error:', error);
    if (error instanceof Error) {
      console.error('[fetchPhotos] Error message:', error.message);
      console.error('[fetchPhotos] Error stack:', error.stack);
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
