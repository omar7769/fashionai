import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SelectField({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.select} onPress={() => setOpen(true)}>
        <Text style={styles.selectText}>{value}</Text>
        <Text style={styles.selectArrow}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.dropdown}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.option, opt === value && styles.optionSelected]}
                onPress={() => { onChange(opt); setOpen(false); }}
              >
                <Text style={[styles.optionText, opt === value && styles.optionTextSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: 4,
    fontWeight: '600',
    marginBottom: 4,
  },
  select: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectText: {
    fontSize: 15,
  },
  selectArrow: {
    fontSize: 14,
    color: '#666',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  optionSelected: {
    backgroundColor: '#f0f4ff',
  },
  optionText: {
    fontSize: 15,
  },
  optionTextSelected: {
    fontWeight: '700',
    color: '#2563eb',
  },
});
