import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../../services/uploadService';
import { getCloudinaryCredentials, getCloudinaryApiCredentials } from '../../utils/storage';
import { updateImageMetadata } from '../../services/cloudinaryService';
import { useRouter } from 'expo-router';
import { logger } from '../../utils/logger';
import { showErrorToast, showSuccessToast, showWarningToast } from '../../utils/toast';

export default function UploadScreen() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    previewUri: string;
    uploadSource: string | File | Blob;
  } | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    checkCredentials();
  }, []);

  const checkCredentials = async () => {
    const creds = await getCloudinaryCredentials();
    logger.debug('[UploadScreen] Loaded Cloudinary credentials', {
      hasCreds: !!creds,
      folder: creds?.folder,
    });
    setHasCredentials(!!creds);
  };

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showErrorToast('Please grant camera roll permissions to upload images.');
      logger.warn('[UploadScreen] Image picker permission denied');
      return;
    }

    // Launch image picker
    const mediaTypes = (() => {
      const mediaTypeEnum = (ImagePicker as any).MediaType;
      if (mediaTypeEnum?.Images) {
        // New API expects an array of ImagePicker.MediaType values
        return [mediaTypeEnum.Images];
      }
      // Fallback for older API
      return ImagePicker.MediaTypeOptions.Images;
    })();

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaTypes as any,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      logger.debug('[UploadScreen] Image selected', {
        hasFile: !!asset.file,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
      const previewUri =
        asset.uri ||
        (asset as { localUri?: string }).localUri ||
        (asset as { webPath?: string }).webPath ||
        (asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null);

      if (!previewUri) {
        showErrorToast('Unable to read the selected image.');
        return;
      }

      const uploadSource =
        Platform.OS === 'web' && asset.file ? asset.file : previewUri;

      setSelectedImage({ previewUri, uploadSource });
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      showWarningToast('Please select an image first.');
      return;
    }

    const credentials = await getCloudinaryCredentials();
    if (!credentials) {
      logger.warn('[UploadScreen] No Cloudinary credentials configured');
      Alert.alert(
        'No credentials',
        'Please configure your Cloudinary credentials in Settings first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => router.push('/(tabs)/settings') },
        ]
      );
      return;
    }

    setUploading(true);
    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Upload image using unsigned upload
      const uploadResult = await uploadImageToCloudinary(
        selectedImage.uploadSource,
        credentials,
        description || undefined,
        tagsArray.length > 0 ? tagsArray : undefined
      );
      logger.debug('[UploadScreen] Upload successful', {
        publicId: uploadResult.public_id,
        bytes: uploadResult.bytes,
      });

      // If description or tags were provided and we have API credentials,
      // update metadata via API (since unsigned uploads have limited options)
      if ((description || tagsArray.length > 0) && uploadResult.public_id) {
        const apiCreds = await getCloudinaryApiCredentials();
        if (apiCreds) {
          logger.debug('[UploadScreen] Updating metadata via API route', {
            publicId: uploadResult.public_id,
          });
          try {
            await updateImageMetadata(
              uploadResult.public_id,
              description || undefined,
              tagsArray.length > 0 ? tagsArray : undefined,
              credentials,
              apiCreds.apiKey,
              apiCreds.apiSecret
            );
          } catch (metaError) {
            logger.warn('Failed to update metadata, but upload succeeded:', metaError);
            // Don't fail the upload if metadata update fails
          }
        }
      }

      showSuccessToast('Image uploaded successfully!');
      setSelectedImage(null);
      setDescription('');
      setTags('');
      setHasCredentials(true);
      router.push('/(tabs)/photos');
    } catch (error) {
      logger.error('[UploadScreen] Upload failed', error);
      showErrorToast(error instanceof Error ? error.message : 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  if (!hasCredentials) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Upload Image</Text>
        <Text style={styles.message}>
          Please configure your Cloudinary credentials in Settings first.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.buttonText}>Go to Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Upload Image</Text>

        <TouchableOpacity style={styles.button} onPress={pickImage} disabled={uploading}>
          <Text style={styles.buttonText}>
            {selectedImage ? 'Change Image' : 'Select Image'}
          </Text>
        </TouchableOpacity>

        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image
              source={{ uri: selectedImage.previewUri }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}

        {selectedImage && (
          <View style={styles.form}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter image description"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Tags (optional, comma-separated)</Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="e.g., commercial, fashion, lifestyle"
            />

            <TouchableOpacity
              style={[styles.button, styles.uploadButton, uploading && styles.buttonDisabled]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Upload to Modeling Folder</Text>
              )}
            </TouchableOpacity>
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#34C759',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreview: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    minHeight: 200,
  },
  image: {
    width: '100%',
    height: 300,
  },
  form: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});

