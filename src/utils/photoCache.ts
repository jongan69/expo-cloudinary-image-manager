import AsyncStorage from '@react-native-async-storage/async-storage';
import { Photo } from '../types';

const PHOTO_CACHE_KEY = 'photo_cache';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CachedPhotos {
  photos: Photo[];
  timestamp: number;
  folder: string;
}

/**
 * Cache photos list to reduce API calls
 */
export async function getCachedPhotos(folder: string): Promise<Photo[] | null> {
  try {
    const cached = await AsyncStorage.getItem(`${PHOTO_CACHE_KEY}_${folder}`);
    if (cached) {
      const data: CachedPhotos = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - data.timestamp < CACHE_EXPIRY_MS && data.folder === folder) {
        return data.photos;
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading photo cache:', error);
    return null;
  }
}

/**
 * Save photos to cache
 */
export async function cachePhotos(photos: Photo[], folder: string): Promise<void> {
  try {
    const data: CachedPhotos = {
      photos,
      timestamp: Date.now(),
      folder,
    };
    await AsyncStorage.setItem(`${PHOTO_CACHE_KEY}_${folder}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching photos:', error);
  }
}

/**
 * Clear photo cache
 */
export async function clearPhotoCache(folder?: string): Promise<void> {
  try {
    if (folder) {
      await AsyncStorage.removeItem(`${PHOTO_CACHE_KEY}_${folder}`);
    } else {
      // Clear all photo caches
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(PHOTO_CACHE_KEY));
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.error('Error clearing photo cache:', error);
  }
}

