import React, { useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, Alert, Vibration } from 'react-native';
import { SafeAreaView, View, Text, TouchableOpacity } from '@/tw';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
//import { supabase } from '@/supabase/supabase';
import { getCurrentUser, getStaticQRCode, addAutoUser, listenToQRTransaction } from '@/services/qr-service';
import { supabase } from 'supabase/supabase';

export default function Qr() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Get static QR code based on userID
  const fetchQRCode = async () => {
    setLoading(true);
    try {

      const user = await getCurrentUser();

      if (!user) {
        console.error('No logged-in user found');
        setLoading(false);
        return;
      }

      const staticQR = getStaticQRCode(user.id);
      console.log('Static QR value:', staticQR);
      setQrValue(staticQR);

      const addUser = await addAutoUser();
      console.log('Add user:', addUser);

    } 
    catch (err) {
      console.error('Error getting QR code:', err);
      setQrValue(null);
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const setupQR = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    setUser(currentUser);
    const qr = `puntos:user:${currentUser.id}`;
    setQrValue(qr);
    setLoading(false);

    // Listen to transactions
    const channel = listenToQRTransaction(currentUser.id, (transaction) => {
      console.log('Customer side: QR transaction received!', transaction);
      // Add vibration for celebration
      Vibration.vibrate(500);
      Alert.alert('🎉 Congratulations!', `You just earned ${transaction.points_earned} points!`, [
        { text: 'Awesome!' }
      ]);
    });

    return channel;
  };

  let channelRef: any;
  setupQR().then((channel) => {
    channelRef = channel;
    return fetchQRCode();
  });

  return () => {
    if (channelRef) supabase.removeChannel(channelRef);
  };
}, []);
 

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-darkBackground">
      <View className="px-6 pt-4 flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="px-2 py-2">
            <MaterialIcons name="close" size={22} color={isDark ? '#FFFFFF' : '#0F172A'} />
          </TouchableOpacity>
          <View className="w-5" />
        </View>

        {/* Instructions */}
        <Text className="text-base font-semibold text-black dark:text-darkTextPrimary text-center mt-4">
          Get your Points Now
        </Text>
        <Text className="text-sm mt-4 text-gray-500 dark:text-darkTextSecondary text-center">
          Let the operator scan your QR code
        </Text>
        <Text className="text-xs mt-1 text-gray-400 dark:text-darkTextMuted text-center">
          This is your unique customer QR code
        </Text>

        {/* QR Code */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {loading ? (
            <ActivityIndicator size="large" color={isDark ? '#FF6600' : undefined} />
          ) : qrValue ? (
            <>
              <Text className="mb-5 text-sm font-poppins-semibold text-neutral-700 dark:text-darkTextSoft">
                Your QR Code
              </Text>
              {/* White wrapper so code stays scannable on dark backgrounds */}
              <View className="bg-white p-4 rounded-2xl">
                <QRCode value={qrValue} size={200} />
              </View>
              <Text className="mt-4 text-xs text-center text-gray-500 dark:text-darkTextSecondary font-poppins">
                Show this to the front desk to earn points
              </Text>
            </>
          ) : (
            <Text className="text-neutral-500 dark:text-darkTextSecondary font-poppins">
              Failed to load QR code. Try again.
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}