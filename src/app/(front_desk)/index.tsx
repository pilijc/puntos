import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView, ScrollView } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { processFrontDeskScan } from "@/services/operator-service";

export default function FrontDeskScan() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);

  const handleStartScanning = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setShowCamera(true);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);

    try {
      const result = await processFrontDeskScan(data, 10);

      if (result.success) {
        Alert.alert(
          "✅ Success!",
          `Points awarded to customer!\nTransaction ID: ${result.transactionId}`,
          [
            {
              text: "Scan Another",
              onPress: () => {
                setScanned(false);
                setIsProcessing(false);
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", result.message, [
          {
            text: "OK",
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Scan error:", error);
      Alert.alert("Error", "Failed to process QR code. Please try again.", [
        {
          text: "OK",
          onPress: () => {
            setScanned(false);
            setIsProcessing(false);
          },
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              Scan QR Code
            </Text>
            <TouchableOpacity style={styles.headerButton}>
              <MaterialIcons name="help-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {/* Status indicator */}
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: showCamera ? '#10B981' : '#F59E0B' }]} />
            <Text style={styles.statusText}>
              {showCamera ? 'Camera Active' : 'Ready to Scan'}
            </Text>
          </View>
        </View>

        {/* Scanner Card */}
        <View style={styles.scannerCard}>
          {showCamera ? (
            <View style={styles.scannerFrame}>
              {permission?.granted ? (
                <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                >
                  {/* Scan Overlay */}
                  <View style={styles.scanOverlay} />
                  
                  {/* Corner Markers */}
                  <View style={[styles.corner, { top: 20, left: 20, borderTopWidth: 4, borderLeftWidth: 4 }]} />
                  <View style={[styles.corner, { top: 20, right: 20, borderTopWidth: 4, borderRightWidth: 4 }]} />
                  <View style={[styles.corner, { bottom: 20, left: 20, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
                  <View style={[styles.corner, { bottom: 20, right: 20, borderBottomWidth: 4, borderRightWidth: 4 }]} />
                  
                  {/* Scan Area Indicator */}
                  <View style={styles.scanArea}>
                    <View style={styles.scanAreaBorder} />
                  </View>
                </CameraView>
              ) : (
                <View style={styles.permissionContainer}>
                  <View style={styles.cameraIcon}>
                    <MaterialIcons name="camera-alt" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.permissionTitle}>
                    Camera Access Required
                  </Text>
                  <Text style={styles.permissionText}>
                    Allow camera access to scan QR codes and award points to customers
                  </Text>
                  <TouchableOpacity
                    onPress={() => requestPermission()}
                    style={styles.enableButton}
                  >
                    <Text style={styles.enableButtonText}>Enable Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.scannerPlaceholder}>
              <MaterialIcons name="qr-code-scanner" size={64} color="#9CA3AF" />
              <Text style={styles.placeholderText}>
                Tap "Start Scanning" to begin
              </Text>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructions}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={styles.statusDot} />
              <Text style={styles.instructionText}>
                Position QR code within the frame
              </Text>
            </View>
            <Text style={styles.subInstructionText}>
              The scanner will automatically detect and process the QR code
            </Text>
          </View>

          {/* Action Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleStartScanning} style={styles.scanButton}>
              <Text style={styles.scanButtonText}>Start Scanning</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={styles.recentTitle}>Recent Scans</Text>
          <View style={styles.recentCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.checkIcon}>
                  <MaterialIcons name="check" size={16} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.recentName}>Customer Awarded</Text>
                  <Text style={styles.recentTime}>2 minutes ago</Text>
                </View>
              </View>
              <Text style={styles.pointsText}>+1,000,000 pts</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}




















const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  header: {
    backgroundColor: "#FF6F00",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statusIndicator: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  statusText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  scannerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginTop: -40,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  scannerFrame: {
    backgroundColor: "#000000",
    borderRadius: 20,
    height: 300,
  },
  scanOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  corner: {
    position: "absolute",
    width: 25,
    height: 25,
    borderColor: "#FF6F00",
    borderWidth: 4,
    borderRadius: 5,
  },
  laserLine: {
    position: "absolute",
    width: "85%",
    height: 4,
    top: "50%",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 12,
  },
  scanArea: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -96,
    marginLeft: -96,
    width: 192,
    height: 192,
    justifyContent: "center",
    alignItems: "center",
  },
  scanAreaBorder: {
    width: 192,
    height: 192,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    padding: 20,
  },
  cameraIcon: {
    width: 64,
    height: 64,
    backgroundColor: "#FF6F00",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 20,
  },
  enableButton: {
    backgroundColor: "#FF6F00",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  enableButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  instructions: {
    marginTop: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: "#10B981",
    borderRadius: 4,
    marginRight: 10,
  },
  instructionText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  subInstructionText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 10,
  },
  buttonContainer: {
    marginTop: 20,
  },
  scannerPlaceholder: {
    flex: 1,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 15,
    textAlign: "center",
  },
  buttonRow: {
    marginTop: 20,
    flexDirection: "row",
  },
  manualButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
  },
  manualButtonText: {
    color: "#374151",
    fontWeight: "500",
    textAlign: "center",
  },
  scanButton: {
    flex: 1,
    backgroundColor: "#FF6F00",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    textAlign: "center",
  },
  recentActivity: {
    padding: 20,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 15,
  },
  recentCard: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  checkIcon: {
    width: 32,
    height: 32,
    backgroundColor: "#D1FAE5",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  recentName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  recentTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6F00",
  },
});