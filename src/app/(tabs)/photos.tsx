import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Photo } from '../../types';
import { fetchPhotos } from '../../services/cloudinaryService';
import { getCloudinaryCredentials, getCloudinaryApiCredentials } from '../../utils/storage';

const { width } = Dimensions.get('window');
const imageSize = (width - 40) / 3; // 3 columns with padding

export default function PhotosScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    console.log('[PhotosScreen] loadPhotos called');
    try {
      console.log('[PhotosScreen] Getting credentials...');
      const credentials = await getCloudinaryCredentials();
      const apiCredentials = await getCloudinaryApiCredentials();

      console.log('[PhotosScreen] Credentials check:', {
        hasCredentials: !!credentials,
        hasApiCredentials: !!apiCredentials,
        cloudName: credentials?.cloudName,
        folder: credentials?.folder,
      });

      if (!credentials) {
        console.log('[PhotosScreen] No credentials found');
        setLoading(false);
        return;
      }

      if (!apiCredentials) {
        console.log('[PhotosScreen] No API credentials found');
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

      console.log('[PhotosScreen] Calling fetchPhotos...');
      const fetchedPhotos = await fetchPhotos(
        credentials,
        apiCredentials.apiKey,
        apiCredentials.apiSecret
      );
      console.log('[PhotosScreen] Fetched photos count:', fetchedPhotos.length);
      setPhotos(fetchedPhotos);
    } catch (error) {
      console.error('[PhotosScreen] Error loading photos:', error);
      if (error instanceof Error) {
        console.error('[PhotosScreen] Error message:', error.message);
        console.error('[PhotosScreen] Error stack:', error.stack);
      }
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load photos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPhotos();
  };

  const handlePhotoPress = (photo: Photo) => {
    router.push({
      pathname: '/photo/[id]',
      params: {
        id: photo.public_id || photo.url,
        photo: JSON.stringify(photo),
      },
    });
  };

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
        <Text style={styles.emptyText}>No photos found in Modeling folder</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        numColumns={3}
        keyExtractor={(item) => item.public_id || item.url}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={() => handlePhotoPress(item)}
          >
            <Image
              source={{ uri: item.url }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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

