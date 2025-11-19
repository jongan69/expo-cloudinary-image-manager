import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Photo } from '../../types';
import { updateImageMetadata } from '../../services/cloudinaryService';
import { getCloudinaryCredentials, getCloudinaryApiCredentials } from '../../utils/storage';

const { width } = Dimensions.get('window');

export default function PhotoDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const lastPhotoStringRef = useRef<string | null>(null);

  useEffect(() => {
    // Only parse photo data if it's different from what we've already parsed
    const photoString = params.photo as string;
    if (photoString && photoString !== lastPhotoStringRef.current) {
      lastPhotoStringRef.current = photoString;
      try {
        const photoData = JSON.parse(photoString) as Photo;
        setPhoto(photoData);
        setDescription(photoData.description || '');
        setTags(photoData.tags?.join(', ') || '');
      } catch (error) {
        console.error('Error parsing photo data:', error);
        Alert.alert('Error', 'Failed to load photo details');
        router.back();
      }
    }
  }, [params.photo, router]);

  useEffect(() => {
    if (photo) {
      const descChanged = description !== (photo.description || '');
      const tagsChanged = tags !== (photo.tags?.join(', ') || '');
      setHasChanges(descChanged || tagsChanged);
    } else {
      setHasChanges(false);
    }
  }, [description, tags, photo?.description, photo?.tags]);

  const handleSave = async () => {
    if (!photo || !photo.public_id) {
      Alert.alert('Error', 'Photo information is missing');
      return;
    }

    const credentials = await getCloudinaryCredentials();
    const apiCredentials = await getCloudinaryApiCredentials();

    if (!credentials || !apiCredentials) {
      Alert.alert(
        'Credentials Required',
        'Please configure your Cloudinary API credentials in Settings to edit metadata.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => router.push('/(tabs)/settings') },
        ]
      );
      return;
    }

    setSaving(true);
    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await updateImageMetadata(
        photo.public_id,
        description || undefined,
        tagsArray.length > 0 ? tagsArray : undefined,
        credentials,
        apiCredentials.apiKey,
        apiCredentials.apiSecret
      );

      // Update local photo state
      setPhoto({
        ...photo,
        description: description || photo.description,
        tags: tagsArray.length > 0 ? tagsArray : photo.tags,
      });

      setHasChanges(false);
      Alert.alert('Success', 'Photo metadata updated successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update metadata');
    } finally {
      setSaving(false);
    }
  };

  if (!photo) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading photo...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: photo.url }} style={styles.image} resizeMode="contain" />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter image description"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Tags (comma-separated)</Text>
        <TextInput
          style={styles.input}
          value={tags}
          onChangeText={setTags}
          placeholder="e.g., commercial, fashion, lifestyle"
        />

        {hasChanges && (
          <TouchableOpacity
            style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Dimensions:</Text>
          <Text style={styles.infoText}>
            {photo.width} × {photo.height}
          </Text>
        </View>

        {photo.format && (
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Format:</Text>
            <Text style={styles.infoText}>{photo.format.toUpperCase()}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    flexDirection: 'row',
    marginTop: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
});

