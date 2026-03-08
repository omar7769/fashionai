import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ItemCard from '../components/ItemCard';
import EditItemModal from '../components/EditItemModal';
import { api } from '../api/client';
import { getUserId } from '../api/userId';

export default function ClosetScreen() {
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  const fetchItems = useCallback(async () => {
    if (!userId) return;
    const response = await api.get('/items', { params: { user_id: userId } });
    setItems(response.data);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let mounted = true;
      (async () => {
        try {
          await fetchItems();
        } catch (error) {
          if (mounted) setItems([]);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => { mounted = false; };
    }, [fetchItems, userId])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchItems();
    } finally {
      setRefreshing(false);
    }
  }, [fetchItems]);

  const handleDelete = useCallback((item) => {
    Alert.alert(
      'Delete item',
      `Remove this ${item.category} (${item.color}) from your closet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/items/${item.id}`);
              setItems((prev) => prev.filter((i) => i.id !== item.id));
            } catch {
              Alert.alert('Error', 'Could not delete item.');
            }
          },
        },
      ]
    );
  }, []);

  const handleEdit = useCallback((item) => {
    setEditingItem(item);
  }, []);

  const handleSaved = useCallback(async () => {
    setEditingItem(null);
    await fetchItems();
  }, [fetchItems]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={styles.centered}>
        <Text>No items yet. Add your first clothing item.</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
      <EditItemModal
        item={editingItem}
        visible={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSaved={handleSaved}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
