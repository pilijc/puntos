import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActivityIndicator, useColorScheme, Vibration } from 'react-native';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, SafeAreaView } from '@/tw';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import QRCode from 'react-native-qrcode-svg';
import {
  initQrScreen,
  setupQRListeners,
  cleanupQRChannels,
} from '@/services/user/qr-service';
import { useStamps } from '@/hooks/use-stamps';
import { useStampRewards } from '@/hooks/use-stamp-rewards';
import { VoucherGenerator } from '@/components/users/voucher';
import { Modal } from '@/components/modal';

export default function Qr() {
  const { t } = useTranslation();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [qrValue, setQrValue] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);

  const { refetch: refetchStamps } = useStamps();
  const { refetch: refetchStampRewards } = useStampRewards();
  const sheetRef = useRef<BottomSheet>(null);

  const handleClose = useCallback(() => {
    if (from) {
      router.replace(from as any);
    } else {
      router.back();
    }
  }, [router, from]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => sheetRef.current?.expand(), 50);
      return () => clearTimeout(timer);
    }, [])
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.6} />
    ),
    []
  );

  useEffect(() => {
    let channels: { qrChannel: any; voucherChannel: any } | null = null;
    const setup = async () => {
      try {
        const result = await initQrScreen();
        setUserId(result.userId);
        setQrValue(result.qrValue);
        channels = setupQRListeners(
          result.userId,
          (tx) => { Vibration.vibrate(500); refetchStamps(); refetchStampRewards(); setEarnedPoints(tx.points_earned); setShowCongrats(true); },
          (tx) => { Vibration.vibrate(500); refetchStamps(); refetchStampRewards(); setEarnedPoints(tx.points_earned); setShowCongrats(true); }
        );
      } catch (err) {
        if (err instanceof Error && err.message.includes('Auth session missing')) router.replace('/(auth)/login');
      } finally {
        setLoading(false);
      }
    };
    setup();
    return () => cleanupQRChannels(channels);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={['78%']}
        enablePanDownToClose
        onClose={handleClose}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB' }} // Gray-300
   
        backgroundStyle={{ backgroundColor: isDark ? '#111111' : '#FAFAFA', borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
      >
        <BottomSheetView style={{ flex: 1, paddingBottom: insets.bottom + 32 }}>
          <View className="flex-1">
            <View className="items-center mt-4 mb-6">
              <Text className="text-xl font-poppins-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {t('user.qr.title')}
              </Text>
              <Text className="text-[13px] font-poppins text-slate-400 dark:text-zinc-500 text-center mt-1 px-4">
                {t('user.qr.instruction')}
              </Text>
            </View>

            <View className="self-stretch rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 overflow-hidden mx-16">
              {loading ? (
                <View className="items-center justify-center py-16">
                  <ActivityIndicator size="large" color="#FF6600" />
                </View>
              ) : qrValue ? (
                <>
                  <View className="items-center py-7 px-6">
                    <QRCode
                      value={qrValue}
                      size={220}
                      backgroundColor="transparent"
                      color={isDark ? '#F1F5F9' : '#0F172A'}
                    />
                  </View>

                  <View className="h-px bg-slate-100 dark:bg-zinc-800" />
                  <View className="flex-row items-center justify-center gap-x-2 py-3">
                    <View className="w-1 h-1 rounded-full bg-primary opacity-60" />
                    <Text className="text-xs font-poppins-medium text-slate-400 dark:text-zinc-500">
                      {t('user.qr.prompt')}
                    </Text>
                    <View className="w-1 h-1 rounded-full bg-primary opacity-60" />
                  </View>
                </>
              ) : (
                <View className="items-center py-16">
                  <Text className="text-sm font-poppins text-slate-400 dark:text-zinc-500">
                    {t('user.qr.error')}
                  </Text>
                </View>
              )}
            </View>

            {userId && (
              <View className="mt-4">
                <VoucherGenerator userId={userId} />
              </View>
            )}

          </View>
        </BottomSheetView>
      </BottomSheet>

      <Modal
        visible={showCongrats}
        onClose={() => setShowCongrats(false)}
        title={t('user.qr.success.title')}
        buttons={[{ label: t('user.qr.success.button'), onPress: () => setShowCongrats(false), variant: 'primary' }]}
      >
        <Text className="text-sm font-poppins text-slate-500 dark:text-zinc-400 text-center mb-4">
          {t('user.qr.success.message')}
        </Text>
        <View className="bg-orange-50 rounded-2xl py-5 px-8 items-center border border-orange-100">
          <Text className="text-4xl font-poppins-bold text-orange-600">+{earnedPoints}</Text>
          <Text className="text-xs font-poppins text-orange-400 mt-1">{t('user.qr.success.added')}</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
