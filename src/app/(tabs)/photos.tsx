import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Photo } from '../../types';
import { fetchPhotos } from '../../services/cloudinaryService';
import { getCloudinaryCredentials, getCloudinaryApiCredentials } from '../../utils/storage';
import { getThumbnailUrl } from '../../utils/imageOptimization';
import { getCachedPhotos, cachePhotos, clearPhotoCache } from '../../utils/photoCache';
import { showErrorToast } from '../../utils/toast';

const { width } = Dimensions.get('window');
const imageSize = (width - 40) / 3; // 3 columns with padding

export default function PhotosScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const loadPhotos = useCallback(async (useCache = true) => {
    try {
      const credentials = await getCloudinaryCredentials();
      const apiCredentials = await getCloudinaryApiCredentials();

      if (!credentials) {
        setLoading(false);
        return;
      }

      if (!apiCredentials) {
        Alert.alert(
          'API Credentials Required',
          'To view photos, please add your Cloudinary API Key and Secret in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Settings', onPress: () => router.push('/(tabs)/settings') },
          ]
        );
        setLoading(false);
        return;
      }

      const folder = credentials.folder || 'Modeling';
      
      // Try to load from cache first
      if (useCache) {
        const cachedPhotos = await getCachedPhotos(folder);
        if (cachedPhotos && cachedPhotos.length > 0) {
          setPhotos(cachedPhotos);
          setLoading(false);
          setRefreshing(false);
          // Still fetch in background to update cache
          fetchPhotos(credentials, apiCredentials.apiKey, apiCredentials.apiSecret)
            .then((fetchedPhotos) => {
              setPhotos(fetchedPhotos);
              cachePhotos(fetchedPhotos, folder);
            })
            .catch(() => {
              // Silently fail background refresh
            });
          return;
        }
      }

      // Fetch from API
      const fetchedPhotos = await fetchPhotos(
        credentials,
        apiCredentials.apiKey,
        apiCredentials.apiSecret
      );
      setPhotos(fetchedPhotos);
      // Cache the results
      await cachePhotos(fetchedPhotos, folder);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to load photos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadPhotos(true);
  }, [loadPhotos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    clearPhotoCache(); // Clear cache on manual refresh
    loadPhotos(false);
  }, [loadPhotos]);

  const handlePhotoPress = useCallback((photo: Photo) => {
    router.push({
      pathname: '/photo/[id]',
      params: {
        id: photo.public_id || photo.url,
        photo: JSON.stringify(photo),
      },
    });
  }, [router]);

  // Memoize render item to prevent unnecessary re-renders
  const renderItem = useCallback(({ item }: { item: Photo }) => {
    const thumbnailUrl = getThumbnailUrl(item.url, imageSize);
    return (
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => handlePhotoPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
        />
      </TouchableOpacity>
    );
  }, [handlePhotoPress]);

  // Memoize key extractor
  const keyExtractor = useCallback((item: Photo) => item.public_id || item.url, []);

  // Memoize list footer
  const listFooterComponent = useMemo(() => {
    if (photos.length === 0) return null;
    return <View style={{ height: 20 }} />;
  }, [photos.length]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No photos found in folder</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use FlashList on native, FlatList on web (FlashList doesn't support web)
  const ListComponent = Platform.OS === 'web' ? FlatList : FlashList;
  const listProps = Platform.OS === 'web' 
    ? {
        // FlatList props for web
        removeClippedSubviews: false,
        maxToRenderPerBatch: 10,
        updateCellsBatchingPeriod: 50,
        initialNumToRender: 12,
        windowSize: 10,
        getItemLayout: (_data: any, index: number) => ({
          length: imageSize + 10,
          offset: (imageSize + 10) * Math.floor(index / 3),
          index,
        }),
      }
    : {
        // FlashList props for native
        drawDistance: 500,
      };

  return (
    <View style={styles.container}>
      <ListComponent
        data={photos}
        numColumns={3}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={listFooterComponent}
        {...listProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 10,
  },
  imageContainer: {
    width: imageSize,
    height: imageSize,
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

