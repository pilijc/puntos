import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { Alert, StyleSheet } from "react-native";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "@/tw";
import { TextInput } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { parseQRCode, createQRTransaction } from "@/services/qr-service";
import { supabase } from "@/supabase/supabase";

export default function FrontDeskScan() {
    const router = useRouter();
    const [scanned, setScanned] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);

    // Request camera permission on mount
    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || isProcessing) return;
        
        setIsProcessing(true);
        setScanned(true);

        try {
            // Parse the QR code
            const parsed = parseQRCode(data);
            
            if (!parsed) {
                Alert.alert('Invalid QR Code', 'This QR code is not recognized.');
                setScanned(false);
                setIsProcessing(false);
                return;
            }

            // Get current staff user
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                Alert.alert('Error', 'Staff not authenticated.');
                setScanned(false);
                setIsProcessing(false);
                return;
            }

            // Create QR transaction
            const transaction = await createQRTransaction(
                parsed.userId,
                user.id,
                10 // Default points - adjust as needed
            );

            Alert.alert(
                'Success!',
                `Customer QR scanned successfully. Transaction ID: ${transaction.id}`,
                [{ text: 'Scan Another', onPress: () => {
                    setScanned(false);
                    setIsProcessing(false);
                }}]
            );

        } catch (error) {
            console.error('Scan error:', error);
            Alert.alert('Error', 'Failed to process QR code. Please try again.');
            setScanned(false);
            setIsProcessing(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F1F5F9]">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Background & Header */}
                <View className="bg-primary rounded-b-[40px] px-6 pt-2 pb-24 overflow-hidden relative">
                    {/* Decorative Circles */}
                    <View className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/10" />
                    <View className="absolute -bottom-16 -left-12 w-32 h-32 rounded-full bg-white/10" />

                    {/* Header Top Bar */}
                    <View className="flex-row items-center justify-between mt-2">
                        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <Text className="text-white text-2xl font-poppins-bold">Award Points</Text>

                        <TouchableOpacity className="w-10 h-10 items-center justify-center">
                            <View className="w-6 h-6 rounded-full bg-white items-center justify-center">
                                <Text className="text-primary font-poppins-bold text-sm">?</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Location Box */}
                    <View className="mt-8 px-4 py-4 rounded-xl border border-white/20 bg-white/10 flex-row items-center">
                    {/* Location Box */}
                    <View className="mt-8 px-4 py-4 rounded-xl border border-white/20 bg-white/10 flex-row items-center">
                        <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center">
                            <MaterialIcons name="storefront" size={24} color="#FFFFFF" />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-[10px] tracking-[1px] font-poppins-bold text-white/70 uppercase">CURRENT LOCATION</Text>
                            <Text className="text-white text-sm font-poppins-bold mt-0.5">The Coffee Foundry • Brooklyn</Text>
                        </View>
                    </View>
                </View>

                {/* Scanner Card with Camera */}
                <View className="px-6 -mt-16 mb-12">
                    <View className="bg-white rounded-3xl p-3 shadow-lg">
                        {/* Camera Viewfinder */}
                        <View className="bg-[#111111] rounded-[20px] w-full aspect-square relative overflow-hidden">
                            {permission?.granted ? (
                                <CameraView
                                    className="flex-1"
                                    facing="back"
                                    barcodeScannerSettings={{
                                        barcodeTypes: ['qr'],
                                    }}
                                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                                >
                                    {/* Corner Markers */}
                                    <View className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-xl" />
                                    <View className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-xl" />
                                    <View className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-xl" />
                                    <View className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-xl" />

                                    {/* Red Laser Line */}
                                    <View style={styles.laserLine} />
                                </CameraView>
                            ) : (
                                <View className="flex-1 justify-center items-center">
                                    <Text className="text-white text-center">
                                        Camera permission required
                                    </Text>
                                    <TouchableOpacity
                                        onPress={requestPermission}
                                        className="mt-2.5 bg-blue-500 px-4 py-2.5 rounded-lg"
                                    >
                                        <Text className="text-white">Grant Permission</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Instructions text */}
                            <Text className="absolute bottom-10 left-0 right-0 text-white font-poppins-medium text-xs text-center px-5">
                                Align customer QR code within the frame
                            </Text>
                        </View>
                    </View>
                </View>

            </ScrollView >
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    laserLine: {
        position: "absolute",
        width: "85%",
        height: 3,
        backgroundColor: "#EF4444",
        top: "50%",
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
});
