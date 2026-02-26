import React, { useEffect, useState } from 'react';
import {  ActivityIndicator } from 'react-native';
import { SafeAreaView, View, Text, TouchableOpacity } from '@/tw';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '@/supabase/supabase';
import { generateQRCode } from '@/services/qr-service';
import { QRCodeState } from '@/type/qr';

export default function Redeem() {
  const router = useRouter();
  const [qrData, setQrData] = useState<QRCodeState | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch and generate QR code
  const fetchQRCode = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('No logged-in user found', userError?.message);
        setLoading(false);
        return;
      }

      const qr = await generateQRCode(user.id);
      console.log('Generated QR data:', qr);
      setQrData(qr);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setQrData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRCode();
  }, []);

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
          This code is unique and one-time use
        </Text>

        {/* QR Code */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : qrData ? (
            <>
              <Text style={{ marginBottom: 20 }}>Your QR Code</Text>
              <QRCode value={qrData.id} size={200} />
              <Text style={{ marginTop: 10, color: 'gray' }}>
                Expires at: {new Date(qrData.expires_at).toLocaleString()}
              </Text>
            </>
          ) : (
            <Text>Failed to load QR code. Try again.</Text>
          )}
        </View>

        {/* Regenerate Button */}
        <View className="flex-row items-center justify-center mt-6">
          <TouchableOpacity
            className="bg-orange-600 px-7 py-3 rounded-full"
            onPress={fetchQRCode}
          >
            <Text className="text-base font-semibold text-white">Generate New Code</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text className="text-xs text-gray-400 text-center mt-6">ONE-TIME QR CODE</Text>
      </View>
    </SafeAreaView>
  );
}