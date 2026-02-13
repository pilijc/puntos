import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false, 
        tabBarStyle: { backgroundColor: '#FFFFFF' },
        tabBarActiveTintColor: '#FF6600',
        tabBarInactiveTintColor: '#8B8D98',
        tabBarLabelStyle: { fontSize: 12, fontFamily: 'Poppins-Medium' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <MaterialIcons size={22} name="explore" color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Store',
          tabBarIcon: ({ color }) => <MaterialIcons size={22} name="store" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <MaterialIcons size={22} name="history" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <MaterialIcons size={22} name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
