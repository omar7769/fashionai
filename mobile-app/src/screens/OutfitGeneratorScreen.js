import React, { useState } from 'react';
import {
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import SelectField from '../components/SelectField';
import { api, DEMO_USER_ID } from '../api/client';

const OCCASIONS = ['casual', 'work', 'date-night', 'formal'];

function WeatherBanner({ weather }) {
  if (!weather) return null;
  return (
    <View style={styles.weatherBanner}>
      <Text style={styles.weatherCity}>{weather.city}</Text>
      <Text style={styles.weatherTemp}>{weather.temp_f}°F</Text>
      <Text style={styles.weatherDesc}>{weather.description}</Text>
    </View>
  );
}

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

function OutfitCard({ outfit, index, onSave }) {
  const hasItems = outfit.top || outfit.bottom || outfit.outerwear || outfit.shoes;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Outfit {index + 1}</Text>
        <View style={styles.cardHeaderRight}>
          <Text style={styles.cardScore}>Score: {outfit.score}</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(outfit)}>
            <Text style={styles.saveBtnText}>Save</Text>
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

export default function OutfitGeneratorScreen() {
  const [occasion, setOccasion] = useState('casual');
  const [suggestions, setSuggestions] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useWeather, setUseWeather] = useState(false);
  const [city, setCity] = useState('');

  const saveOutfit = async (outfit) => {
    try {
      await api.post('/saved-outfits', {
        user_id: DEMO_USER_ID,
        outfit,
      });
      Alert.alert('Saved', 'Outfit saved to your collection.');
    } catch (error) {
      Alert.alert('Error', 'Could not save outfit.');
    }
  };

  const generateOutfit = async () => {
    if (useWeather && !city.trim()) {
      Alert.alert('Missing city', 'Enter a city name for weather-aware suggestions.');
      return;
    }

    setLoading(true);
    setWeatherData(null);
    try {
      const formData = new FormData();
      formData.append('user_id', DEMO_USER_ID);
      formData.append('occasion', occasion);
      if (useWeather && city.trim()) {
        formData.append('city', city.trim());
      }

      const response = await api.post('/generate-outfit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuggestions(response.data.suggestions || []);
      if (response.data.weather) {
        setWeatherData(response.data.weather);
      }
    } catch (error) {
      Alert.alert('Failed', 'Could not generate outfits. Add items first and check backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SelectField
        label="Occasion"
        value={occasion}
        options={OCCASIONS}
        onChange={(v) => { setOccasion(v); setSuggestions(null); setWeatherData(null); }}
      />

      <View style={styles.weatherToggleRow}>
        <Text style={styles.weatherToggleLabel}>Weather-aware</Text>
        <Switch
          value={useWeather}
          onValueChange={(v) => { setUseWeather(v); setSuggestions(null); setWeatherData(null); }}
        />
      </View>

      {useWeather && (
        <TextInput
          style={styles.cityInput}
          value={city}
          onChangeText={setCity}
          placeholder="Enter city (e.g. New York)"
          placeholderTextColor="#aaa"
        />
      )}

      <Button
        title={loading ? 'Generating...' : 'Generate Outfits'}
        onPress={generateOutfit}
        disabled={loading}
      />

      <WeatherBanner weather={weatherData} />

      {suggestions === null ? (
        <Text style={styles.hint}>Select an occasion and tap generate.</Text>
      ) : suggestions.length === 0 ? (
        <Text style={styles.hint}>No outfits could be generated. Add more items to your closet.</Text>
      ) : (
        <View style={styles.results}>
          {suggestions.map((outfit, i) => (
            <OutfitCard key={i} outfit={outfit} index={i} onSave={saveOutfit} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
  },
  hint: {
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  weatherToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
  },
  weatherToggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  cityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  weatherBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff7ed',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  weatherCity: {
    fontWeight: '700',
    fontSize: 14,
    color: '#9a3412',
  },
  weatherTemp: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ea580c',
  },
  weatherDesc: {
    fontSize: 13,
    color: '#9a3412',
    flex: 1,
  },
  results: {
    gap: 16,
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
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
