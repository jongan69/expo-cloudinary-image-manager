import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const CLOUDINARY_CREDENTIALS_KEY = '@cloudinary_credentials';
// SecureStore keys must not contain "@" - only alphanumeric, ".", "-", and "_"
const API_KEY_KEY = 'cloudinary_api_key';
const API_SECRET_KEY = 'cloudinary_api_secret';
const FALLBACK_API_KEY_KEY = '@cloudinary_api_key';
const FALLBACK_API_SECRET_KEY = '@cloudinary_api_secret';

let secureStoreAvailable: boolean | null = null;

async function isSecureStoreAvailable() {
  if (secureStoreAvailable === null) {
    try {
      secureStoreAvailable = await SecureStore.isAvailableAsync();
    } catch (error) {
      console.warn('SecureStore availability check failed, falling back to AsyncStorage', error);
      secureStoreAvailable = false;
    }
  }
  return secureStoreAvailable;
}

export interface CloudinaryCredentials {
  cloudName: string;
  uploadPreset: string;
  folder?: string;
}

export interface CloudinaryApiCredentials {
  apiKey: string;
  apiSecret: string;
}

export async function getCloudinaryCredentials(): Promise<CloudinaryCredentials | null> {
  try {
    const data = await AsyncStorage.getItem(CLOUDINARY_CREDENTIALS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error getting Cloudinary credentials:', error);
    return null;
  }
}

export async function getCloudinaryApiCredentials(): Promise<CloudinaryApiCredentials | null> {
  try {
    const useSecureStore = await isSecureStoreAvailable();

    if (useSecureStore) {
      const apiKey = await SecureStore.getItemAsync(API_KEY_KEY);
      const apiSecret = await SecureStore.getItemAsync(API_SECRET_KEY);
      if (apiKey && apiSecret) {
        return { apiKey, apiSecret };
      }
    } else {
      const [[, storedKey], [, storedSecret]] = await AsyncStorage.multiGet([
        FALLBACK_API_KEY_KEY,
        FALLBACK_API_SECRET_KEY,
      ]);
      if (storedKey && storedSecret) {
        return { apiKey: storedKey, apiSecret: storedSecret };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting API credentials:', error);
    return null;
  }
}

export async function saveCloudinaryCredentials(
  credentials: CloudinaryCredentials
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CLOUDINARY_CREDENTIALS_KEY,
      JSON.stringify(credentials)
    );
  } catch (error) {
    console.error('Error saving Cloudinary credentials:', error);
    throw new Error('Failed to save credentials');
  }
}

export async function saveCloudinaryApiCredentials(
  apiKey: string,
  apiSecret: string
): Promise<void> {
  try {
    const useSecureStore = await isSecureStoreAvailable();

    if (useSecureStore) {
      await SecureStore.setItemAsync(API_KEY_KEY, apiKey);
      await SecureStore.setItemAsync(API_SECRET_KEY, apiSecret);
    } else {
      await AsyncStorage.multiSet([
        [FALLBACK_API_KEY_KEY, apiKey],
        [FALLBACK_API_SECRET_KEY, apiSecret],
      ]);
    }
  } catch (error) {
    console.error('Error saving API credentials:', error);
    throw new Error('Failed to save API credentials');
  }
}

export async function clearCloudinaryCredentials(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CLOUDINARY_CREDENTIALS_KEY);
    const useSecureStore = await isSecureStoreAvailable();

    if (useSecureStore) {
      await SecureStore.deleteItemAsync(API_KEY_KEY);
      await SecureStore.deleteItemAsync(API_SECRET_KEY);
    } else {
      await AsyncStorage.multiRemove([FALLBACK_API_KEY_KEY, FALLBACK_API_SECRET_KEY]);
    }
  } catch (error) {
    console.error('Error clearing Cloudinary credentials:', error);
  }
}
