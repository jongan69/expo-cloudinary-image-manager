import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  getCloudinaryCredentials,
  saveCloudinaryCredentials,
  clearCloudinaryCredentials,
  getCloudinaryApiCredentials,
  saveCloudinaryApiCredentials,
  CloudinaryCredentials,
} from '../../utils/storage';
import { SignOutButton } from '../../components/SignOutButton';
import { SecureTextInput } from '../../components/SecureTextInput';
import { showErrorToast, showSuccessToast, showWarningToast } from '../../utils/toast';

export default function SettingsScreen() {
  const [cloudName, setCloudName] = useState('');
  const [uploadPreset, setUploadPreset] = useState('');
  const [folder, setFolder] = useState('Modeling');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const creds = await getCloudinaryCredentials();
      if (creds) {
        setCloudName(creds.cloudName);
        setUploadPreset(creds.uploadPreset);
        setFolder(creds.folder || 'Modeling');
        setHasCredentials(true);
      }
      
      // Load API credentials (we won't display them, just check if they exist)
      const apiCreds = await getCloudinaryApiCredentials();
      if (apiCreds) {
        // Don't populate the fields for security, but user can update them
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const handleSave = async () => {
    if (!cloudName || !uploadPreset) {
      showWarningToast('Cloud Name and Upload Preset are required');
      return;
    }

    setLoading(true);
    try {
      const credentials: CloudinaryCredentials = {
        cloudName,
        uploadPreset,
        folder: folder || 'Modeling',
      };

      await saveCloudinaryCredentials(credentials);
      
      // Also save API credentials if provided (for metadata updates)
      if (apiKey && apiSecret) {
        await saveCloudinaryApiCredentials(apiKey, apiSecret);
      }

      setHasCredentials(true);
      showSuccessToast('Cloudinary credentials saved successfully!');
    } catch (error) {
      console.error('Error saving Cloudinary credentials:', error);
      showErrorToast('Failed to save credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    Alert.alert(
      'Clear Credentials',
      'Are you sure you want to clear your Cloudinary credentials?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearCloudinaryCredentials();
            setCloudName('');
            setUploadPreset('');
            setFolder('Modeling');
            setApiKey('');
            setApiSecret('');
            setHasCredentials(false);
            showSuccessToast('Credentials cleared');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Cloudinary Settings</Text>
        <Text style={styles.subtitle}>
          Configure your Cloudinary credentials to upload and manage images
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Cloud Name *</Text>
          <TextInput
            style={styles.input}
            value={cloudName}
            onChangeText={setCloudName}
            placeholder="your-cloud-name"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Upload Preset *</Text>
          <TextInput
            style={styles.input}
            value={uploadPreset}
            onChangeText={setUploadPreset}
            placeholder="your-upload-preset"
            autoCapitalize="none"
          />
          <Text style={styles.hint}>
            Create an unsigned upload preset in your Cloudinary dashboard
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Folder Name</Text>
          <TextInput
            style={styles.input}
            value={folder}
            onChangeText={setFolder}
            placeholder="Modeling"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Optional: API Credentials</Text>
        <Text style={styles.hint}>
          Required for editing descriptions and tags. Keep these secure!
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>API Key</Text>
          <SecureTextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Optional - for metadata updates"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>API Secret</Text>
          <SecureTextInput
            style={styles.input}
            value={apiSecret}
            onChangeText={setApiSecret}
            placeholder="Optional - for metadata updates"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Credentials</Text>
          )}
        </TouchableOpacity>

        {hasCredentials && (
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
          >
            <Text style={[styles.buttonText, styles.clearButtonText]}>
              Clear Credentials
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Account</Text>
        <SignOutButton />
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 24,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButtonText: {
    color: '#FF3B30',
  },
});

