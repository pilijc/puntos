// import React, { useEffect, useState } from "react";
// import { View, Text, StyleSheet, Button, Alert } from "react-native";
// //import { scanQRCode } from "@/services/operator-service";

// export default function OperatorScanScreen() {
//   const [hasPermission, setHasPermission] = useState<boolean | null>(null);
//   const [scanned, setScanned] = useState(false);

//   useEffect(() => {
//     (async () => {
//    //   const { status } = await BarCodeScanner.requestPermissionsAsync();
//       setHasPermission(status === "granted");
//     })();
//   }, []);

//   const handleBarCodeScanned = async ({ data }: { data: string }) => {
//     if (scanned) return; // prevent multiple scans
//     setScanned(true);

//     const operatorId = "operator-uuid"; // current operator
//     const storeId = "store-uuid"; // current store
//     const points = 10; // points for this scan

//     try {
//       const result = await scanQRCode(data, operatorId, storeId, points);
//       Alert.alert(result.success ? "Success" : "Error", result.message);
//     } catch (error) {
//       Alert.alert("Error", "Failed to scan QR code.");
//     } finally {
//       // reset after a short delay so operator can scan next QR
//       setTimeout(() => setScanned(false), 2000);
//     }
//   };

//   if (hasPermission === null) {
//     return <Text>Requesting camera permission...</Text>;
//   }
//   if (hasPermission === false) {
//     return <Text>No access to camera</Text>;
//   }

//   return (
//     <View style={styles.container}>
//       {/* <BarCodeScanner
//         onBarCodeScanned={handleBarCodeScanned}
//         style={StyleSheet.absoluteFillObject}
//       /> */}
//       <View style={styles.overlay}>
//         <Text style={styles.instructions}>
//           Align the QR code to earn points
//         </Text>
//         <Text style={styles.subtext}>
//           Scanning for Puntos partner stores...
//         </Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   overlay: {
//     position: "absolute",
//     top: 60,
//     width: "100%",
//     alignItems: "center",
//   },
//   instructions: { fontSize: 18, color: "#fff", fontWeight: "bold" },
//   subtext: { fontSize: 14, color: "#fff", marginTop: 4 },
// });