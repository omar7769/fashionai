import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { api, DEMO_USER_ID } from '../api/client';

function SlotImage({ item, label }) {
  if (!item) return null;
  const uri = item.clean_image_url || item.image_url;
  return (
    <View style={styles.slot}>
      <Image source={{ uri }} style={styles.slotImage} />
      <Text style={styles.slotLabel}>{label}</Text>
      <Text style={styles.slotDetail}>{item.color} {item.category}</Text>
    </View>
  );
}

function SavedOutfitCard({ saved, onDelete }) {
  const outfit = saved.outfit;
  const date = new Date(saved.created_at).toLocaleDateString();
  const hasItems = outfit.top || outfit.bottom || outfit.outerwear || outfit.shoes;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>Saved Outfit</Text>
          <Text style={styles.cardDate}>{date}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={styles.cardScore}>Score: {outfit.score}</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(saved.id)}>
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {hasItems && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotsRow}>
          <SlotImage item={outfit.top} label="Top" />
          <SlotImage item={outfit.bottom} label="Bottom" />
          <SlotImage item={outfit.outerwear} label="Outerwear" />
          <SlotImage item={outfit.shoes} label="Shoes" />
        </ScrollView>
      )}

      {(outfit.accessories || []).length > 0 && (
        <View style={styles.accessoriesRow}>
          <Text style={styles.accessoriesLabel}>Accessories:</Text>
          <Text style={styles.accessoriesText}>
            {outfit.accessories.map((a) => `${a.color} ${a.category}`).join(', ')}
          </Text>
        </View>
      )}

      {!!outfit.explanation && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>{outfit.explanation}</Text>
        </View>
      )}
    </View>
  );
}

export default function SavedOutfitsScreen() {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOutfits = useCallback(async () => {
    const response = await api.get('/saved-outfits', { params: { user_id: DEMO_USER_ID } });
    setOutfits(response.data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          await fetchOutfits();
        } catch {
          if (mounted) setOutfits([]);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => { mounted = false; };
    }, [fetchOutfits])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchOutfits();
    } finally {
      setRefreshing(false);
    }
  }, [fetchOutfits]);

  const handleDelete = useCallback((id) => {
    Alert.alert('Delete outfit', 'Remove this saved outfit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/saved-outfits/${id}`);
            setOutfits((prev) => prev.filter((o) => o.id !== id));
          } catch {
            Alert.alert('Error', 'Could not delete outfit.');
          }
        },
      },
    ]);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!outfits.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No saved outfits yet.</Text>
        <Text style={styles.emptyHint}>Generate outfits and tap Save to keep them here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={outfits}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <SavedOutfitCard saved={item} onDelete={handleDelete} />
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  emptyHint: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  list: {
    padding: 12,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: '#222',
  },
  cardDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardScore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: '#e53e3e',
    fontSize: 12,
    fontWeight: '600',
  },
  slotsRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  slot: {
    alignItems: 'center',
    width: 90,
  },
  slotImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    marginTop: 4,
  },
  slotDetail: {
    fontSize: 10,
    color: '#888',
  },
  accessoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 4,
  },
  accessoriesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  accessoriesText: {
    fontSize: 12,
    color: '#777',
    flex: 1,
  },
  explanationBox: {
    backgroundColor: '#f0f4ff',
    padding: 10,
  },
  explanationText: {
    fontSize: 12,
    color: '#445',
    lineHeight: 17,
  },
});
