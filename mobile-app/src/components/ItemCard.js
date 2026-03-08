import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ItemCard({ item, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.clean_image_url || item.image_url }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.color}>{item.color}</Text>
        <View style={styles.tags}>
          <Text style={styles.tag}>{item.season}</Text>
          <Text style={styles.tag}>{item.formality}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#ddd',
  },
  info: {
    padding: 8,
    gap: 2,
  },
  category: {
    fontWeight: '600',
    fontSize: 13,
  },
  color: {
    color: '#555',
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    fontSize: 10,
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  editBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#e0e0e0',
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  editText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  deleteText: {
    fontSize: 12,
    color: '#e53e3e',
    fontWeight: '500',
  },
});
