import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import ClosetScreen from './src/screens/ClosetScreen';
import AddItemScreen from './src/screens/AddItemScreen';
import OutfitGeneratorScreen from './src/screens/OutfitGeneratorScreen';
import SavedOutfitsScreen from './src/screens/SavedOutfitsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          headerTitleAlign: 'center'
        }}
      >
        <Tab.Screen name="Closet" component={ClosetScreen} />
        <Tab.Screen name="Add Item" component={AddItemScreen} />
        <Tab.Screen name="Outfits" component={OutfitGeneratorScreen} />
        <Tab.Screen name="Saved" component={SavedOutfitsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
