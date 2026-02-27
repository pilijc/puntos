import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { TouchableOpacity } from '@/tw';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#171717' : '#FFFFFF',
          borderTopColor: isDark ? '#404040' : '#e5e5e5',
          height: 70,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#FF6600',
        tabBarInactiveTintColor: isDark ? '#737373' : '#8B8D98',
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
        name="qr"
        options={{
          title: 'Qr',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={22} name="qrcode-scan" color={color} />,
          tabBarButton: (props: any) => (
            <CustomTabBarButton onPress={props.onPress} />
          ),
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

function CustomTabBarButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="items-center justify-center"
      style={styles.fabContainer}
    >
      <View style={styles.fab}>
        <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    top: -28,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6600',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
