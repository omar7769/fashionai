import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import SelectField from './SelectField';
import { api } from '../api/client';

const CATEGORIES = ['top', 'bottom', 'outerwear', 'shoes', 'accessory'];
const SEASONS = ['spring', 'summer', 'fall', 'winter', 'all-season'];
const FORMALITIES = ['casual', 'smart-casual', 'business', 'formal'];

export default function EditItemModal({ item, visible, onClose, onSaved }) {
  const [category, setCategory] = useState('top');
  const [color, setColor] = useState('');
  const [season, setSeason] = useState('all-season');
  const [formality, setFormality] = useState('casual');
  const [colorError, setColorError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setCategory(item.category);
      setColor(item.color);
      setSeason(item.season);
      setFormality(item.formality);
      setColorError('');
    }
  }, [item]);

  const save = async () => {
    if (!color.trim()) {
      setColorError('Color is required.');
      return;
    }
    setColorError('');
    setSaving(true);
    try {
      await api.patch(`/items/${item.id}`, {
        category,
        color: color.trim(),
        season,
        formality,
      });
      onSaved();
    } catch (error) {
      const detail = error.response?.data?.detail;
      Alert.alert('Save failed', detail || 'Could not update item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Item</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            <Text style={[styles.save, saving && styles.saveDisabled]}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
  },
  cancel: {
    fontSize: 16,
    color: '#555',
  },
  save: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  saveDisabled: {
    opacity: 0.4,
  },
  body: {
    padding: 16,
    gap: 10,
  },
  label: {
    marginTop: 4,
    fontWeight: '600',
    marginBottom: 4,
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
});
