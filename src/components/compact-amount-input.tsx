import React, { useState, useEffect, useRef } from 'react';
import { Animated, Dimensions, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { TextInput, View, Text, TouchableOpacity } from '@/tw';
import { TextField } from '@/components/text-field';
import {CompactAmountInputProps} from '@/type/frontdesk/compact-input';

const { height: screenHeight } = Dimensions.get('window');

export default function CompactAmountInput({
  value,
  onChangeText,
  placeholder = "0.00",
  maxLength = 7,
  autoFocus = true,
  isVisible = false,
  showCamera = false,
  isFloating = false,
  scrollY
}: CompactAmountInputProps) {
  const { t: translate } = useTranslation();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFloating && scrollY) {
      const listener = scrollY.addListener(({ value }) => {
        const shouldFloat = value > 200;
        Animated.spring(floatAnim, {
          toValue: shouldFloat ? 1 : 0,
          useNativeDriver: false,
          tension: 100,
          friction: 12,
        }).start();
      });

      return () => {
        scrollY.removeListener(listener);
      };
    }
  }, [isFloating, scrollY, floatAnim]);

  const handleTextChange = (text: string) => {
    const numericText = text.replace(/[^0-9.]/g, "");
    const parts = numericText.split(".");
    const filteredText = parts.length > 2
      ? parts[0] + "." + parts.slice(1).join("")
      : numericText;
    onChangeText(filteredText);
  };

  if (!isVisible) return null;

  return (
    <>
      {!isFloating && (
        <View className="mb-3">
          <Text className="text-[10px] font-poppins-semibold text-neutral-400 dark:text-darkTextSoft uppercase tracking-widest mb-1.5">
            {translate("frontdesk.transaction.transactionModal.title")}
          </Text>
          <View className="relative pt-1.5">
            <TextField
              label=""
              value={value}
              onChangeText={handleTextChange}
              placeholder={placeholder}
              keyboardType="numeric"
              rightAccessory={
                <View className="flex-row items-center pr-3">
                  {value.length > 0 && (
                    <TouchableOpacity onPress={() => onChangeText("")}>
                      <MaterialIcons name="close" size={16} color="#FF6600" />
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          </View>
        </View>
      )}

      {/* Floating Input*/}
      {isFloating && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 60,
            left: 16,
            right: 16,
            opacity: floatAnim,
            transform: [{
              translateY: floatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              })
            }],
            zIndex: 50,
          }}
        >
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
            <Text className="text-xs font-poppins-semibold text-neutral-400 dark:text-darkTextSoft uppercase tracking-widest mb-2">
              {translate("frontdesk.transaction.transactionModal.title")}
            </Text>
            <View className="relative pt-1.5">
              <TextField
                label=""
                value={value}
                onChangeText={handleTextChange}
                placeholder={placeholder}
                keyboardType="numeric"
                rightAccessory={
                  <View className="flex-row items-center -mt-2 pr-3">
                     {value.length > 0 && (
                      <TouchableOpacity onPress={() => onChangeText("")}>
                        <MaterialIcons name="close" size={16} color="#FF6600" />
                      </TouchableOpacity>
                    )}
                  </View>
                }
              />
            </View>
          </View>
        </Animated.View>
      )}
    </>
  );
}
