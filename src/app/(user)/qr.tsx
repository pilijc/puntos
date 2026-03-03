import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, View, Text, TouchableOpacity } from '@/tw';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
//import { supabase } from '@/supabase/supabase';
import { getCurrentUser, getStaticQRCode, addAutoUser, listenToQRTransaction } from '@/services/qr-service';
import { supabase } from 'supabase/supabase';

export default function Qr() {
  const router = useRouter();
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
      setQrValue(currentUser.id); 
      setLoading(false);

      // Listen for new transactions (INSERT) for this user
      const channel = listenToQRTransaction(currentUser.id, (transaction) => {
        Alert.alert('QR Transaction', `You received ${transaction.points_earned} points!`);
      });

      return channel;
    };

    let channelRef: any;
    setupQR().then((channel) => {
      channelRef = channel;
    });

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, []);
  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />;
  }
 

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="px-2 py-2">
            <MaterialIcons name="close" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View className="w-5" />
        </View>

        {/* Instructions */}
        <Text className="text-base font-semibold text-black text-center mt-4">
          Get your Points Now
        </Text>
        <Text className="text-sm mt-4 text-gray-500 text-center">
          Let the operator scan your QR code
        </Text>
        <Text className="text-xs mt-1 text-gray-400 text-center">
          This is your unique customer QR code
        </Text>

        {/* QR Code */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : qrValue ? (
            <>
              <Text style={{ marginBottom: 20 }}>Your QR Code</Text>
              <QRCode value={qrValue} size={200} />
              <Text style={{ marginTop: 10, color: 'gray' }}>
                Show this to the front desk to earn points
              </Text>
            </>
          ) : (
            <Text>Failed to load QR code. Try again.</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}