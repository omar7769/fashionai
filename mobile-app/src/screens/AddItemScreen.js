import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import SelectField from '../components/SelectField';
import { api, DEMO_USER_ID } from '../api/client';

const CATEGORIES = ['top', 'bottom', 'outerwear', 'shoes', 'accessory'];
const SEASONS = ['spring', 'summer', 'fall', 'winter', 'all-season'];
const FORMALITIES = ['casual', 'smart-casual', 'business', 'formal'];

export default function AddItemScreen() {
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState('top');
  const [color, setColor] = useState('');
  const [season, setSeason] = useState('all-season');
  const [formality, setFormality] = useState('casual');
  const [description, setDescription] = useState('');
  const [colorError, setColorError] = useState('');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo access to upload clothing images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      const picked = result.assets[0];
      setImage(picked);
      setDescription('');
      analyzeWithAI(picked);
    }
  };

  const analyzeWithAI = async (asset) => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        name: asset.fileName || 'item.jpg',
        type: asset.mimeType || 'image/jpeg',
      });

      const response = await api.post('/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;

      if (data.category && CATEGORIES.includes(data.category)) setCategory(data.category);
      if (data.color) { setColor(data.color); setColorError(''); }
      if (data.season && SEASONS.includes(data.season)) setSeason(data.season);
      if (data.formality && FORMALITIES.includes(data.formality)) setFormality(data.formality);
      if (data.description) setDescription(data.description);
    } catch (error) {
      const detail = error.response?.data?.detail;
      Alert.alert(
        'Analysis failed',
        detail || 'Could not analyze image. You can still fill in the fields manually.',
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async () => {
    let valid = true;

    if (!image) {
      Alert.alert('Missing image', 'Please choose an item image first.');
      valid = false;
    }

    if (!color.trim()) {
      setColorError('Color is required.');
      valid = false;
    } else {
      setColorError('');
    }

    if (!valid) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('user_id', DEMO_USER_ID);
      formData.append('category', category);
      formData.append('color', color.trim());
      formData.append('season', season);
      formData.append('formality', formality);
      formData.append('image', {
        uri: image.uri,
        name: image.fileName || 'item.jpg',
        type: image.mimeType || 'image/jpeg',
      });

      await api.post('/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Saved', 'Wardrobe item uploaded successfully.');
      setImage(null);
      setColor('');
      setDescription('');
    } catch (error) {
      const detail = error.response?.data?.detail;
      const message = detail
        ? (Array.isArray(detail) ? detail.map((e) => e.msg).join('\n') : detail)
        : 'Could not save item. Check API URL and backend status.';
      Alert.alert('Upload failed', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <View>
            <Image source={{ uri: image.uri }} style={styles.preview} />
            {analyzing && (
              <View style={styles.analyzeOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.analyzeOverlayText}>Analyzing...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>Tap to pick image</Text>
          </View>
        )}
      </TouchableOpacity>

      {!!description && (
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionLabel}>AI detected</Text>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>
      )}

      <SelectField label="Category" value={category} options={CATEGORIES} onChange={setCategory} />
      <SelectField label="Season" value={season} options={SEASONS} onChange={setSeason} />
      <SelectField label="Formality" value={formality} options={FORMALITIES} onChange={setFormality} />

      <Text style={styles.label}>Color</Text>
      <TextInput
        style={[styles.input, colorError ? styles.inputError : null]}
        value={color}
        onChangeText={(v) => { setColor(v); if (v.trim()) setColorError(''); }}
        placeholder="e.g. black, navy, white"
        placeholderTextColor="#aaa"
      />
      {colorError ? <Text style={styles.errorText}>{colorError}</Text> : null}

      <View style={styles.submitWrap}>
        <Button title={saving ? 'Saving...' : analyzing ? 'Analyzing...' : 'Upload Item'} onPress={submit} disabled={saving || analyzing} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 10,
  },
  imagePicker: {
    marginBottom: 4,
  },
  preview: {
    width: '100%',
    height: 240,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#888',
  },
  analyzeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeOverlayText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  descriptionBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  descriptionLabel: {
    fontWeight: '700',
    fontSize: 12,
    color: '#16a34a',
  },
  descriptionText: {
    fontSize: 13,
    color: '#334',
  },
  label: {
    marginTop: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 2,
  },
  submitWrap: {
    marginTop: 10,
  },
});
