import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { View, StyleSheet, useColorScheme, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t: translate } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#171717' : '#FFFFFF',
          borderTopColor: isDark ? '#404040' : '#e5e5e5',
          height: Platform.OS === 'ios' ? 88 : 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
        tabBarActiveTintColor: '#FF6600',
        tabBarInactiveTintColor: isDark ? '#737373' : '#8B8D98',
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Poppins-Medium',
          marginBottom: insets.bottom > 0 ? 0 : 4
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: translate("layout.discover"),
          tabBarIcon: ({ color }) => <MaterialIcons size={22} name="explore" color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: translate("layout.store"),
          tabBarIcon: ({ color }) => <MaterialIcons size={22} name="store" color={color} />,
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: 'Qr',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={22} name="qrcode-scan" color={color} />,
          tabBarButton: (props: any) => (
            <CustomTabBarButton onPress={props.onPress} bottomInset={insets.bottom} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: translate("layout.history"),
          tabBarIcon: ({ color }) => <MaterialIcons size={22} name="history" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: translate("layout.settings"),
          tabBarIcon: ({ color }) => <MaterialIcons size={22} name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}

function CustomTabBarButton({ onPress, bottomInset }: { onPress?: () => void, bottomInset: number }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.fabContainer,
        { top: Platform.OS === 'ios' ? -30 : -28 - (bottomInset / 4) }
      ]}
    >
      <View style={styles.fab}>
        <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
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