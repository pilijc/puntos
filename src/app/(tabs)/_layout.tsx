import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TouchableOpacity } from '@/tw';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false, 
        tabBarStyle: { backgroundColor: '#FFFFFF', height: 70, paddingBottom: 8 },
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
          title: 'Rewards',
          tabBarIcon: ({ color }) => <MaterialIcons size={22} name="store" color={color} />,
        }}
      />
      <Tabs.Screen
        name="redeem"
        options={{
          title: 'Redeem',
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
