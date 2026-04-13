import { useRouter, useFocusEffect } from "expo-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useColorScheme } from "react-native";
import { ScrollView, View, Text } from "@/tw";
import { Animated} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCameraPermissions } from "expo-camera";
import { processFrontDeskScan, getCurrentUserStore } from "@/services/frontdesk/scan-service";
import { getCurrentStaffId } from "@/services/frontdesk/voucher-service";
import { supabase } from "@/supabase/supabase";
import { Modal, type ModalButton } from "@/components/modal";
import { useRecentTransactions } from "@/hooks/use-recent-transactions";
import { useTranslation } from "react-i18next";
import CompactAmountInput from "@/components/compact-amount-input";
import { checkPasswordSetupRequired } from "@/services/frontdesk/password-service";
import { checkQRAccessForCurrentStaff } from "@/services/frontdesk/qr-access-service";
import FrontDeskHeader from "@/components/front-desk/FrontDeskHeader";
import FrontDeskScanner from "@/components/front-desk/FrontDeskScanner";
import RecentTransactions from "@/components/front-desk/RecentTransactions";
import SuccessModal from "@/components/front-desk/modal/SuccessModal";
import ErrorModal from "@/components/front-desk/modal/ErrorModal";

export default function FrontDeskScan() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [showAmountInput, setShowAmountInput] = useState(false);
  const { recentScans, fetchTransactions, addScan } = useRecentTransactions();
  const [storeInfo, setStoreInfo] = useState<{ name: string; id: number } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTransactionId, setSuccessTransactionId] = useState<string>("");
  const [successPoints, setSuccessPoints] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isPasswordSetupComplete, setIsPasswordSetupComplete] = useState<boolean | null>(null);
  const [passwordSetupModal, setPasswordSetupModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);
  const { t: translate } = useTranslation();
  const ColorScheme = useColorScheme();
  const isDark = ColorScheme === "dark";
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [currentStaffId, setCurrentStaffId] = useState<string>("");
  const [qrAccessEnabled, setQrAccessEnabled] = useState<boolean | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const loadStoreInfo = useCallback(async () => {
    try {
      const staffId = await getCurrentStaffId();
      if (!staffId) return;
      setCurrentStaffId(staffId);
      const info = await getCurrentUserStore();
      setStoreInfo(info);
      if (info) fetchTransactions(info.id);
    } catch (err) {
      
    }
  }, [fetchTransactions]);

  useEffect(() => {
    loadStoreInfo();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        loadStoreInfo();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check QR access status
  useEffect(() => {
    const checkQRAccess = async () => {
      try {
        const hasAccess = await checkQRAccessForCurrentStaff();
        setQrAccessEnabled(hasAccess);
      } catch (error) {
        console.error("Error checking QR access:", error);
        setQrAccessEnabled(false);
      }
    };

    checkQRAccess();
  }, []);

  // Check password setup status
  useFocusEffect(
    useCallback(() => {
      const checkPasswordSetup = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const requiresPasswordSetup = await checkPasswordSetupRequired(user.id);
            const isComplete = !requiresPasswordSetup;
            setIsPasswordSetupComplete(isComplete);
            
            if (requiresPasswordSetup) {
              setPasswordSetupModal({
                title: "Password Setup Required",
                message: "Complete your password setup to access all dashboard features and ensure proper account security.",
                buttons: [{
                  label: "Set Password",
                  variant: "primary",
                  onPress: () => {
                    setPasswordSetupModal(null);
                    router.replace("/(front_desk)/setup-password");
                  }
                }]
              });
            }
          }
        } catch (error) {
           setIsPasswordSetupComplete(false);
        }
      };
      
      checkPasswordSetup();
    }, [router])
  );

  const handleBarCodeScanned = async (data: string) => {
    if (scanned || isProcessing) return;
    setScanned(true);
    setIsProcessing(true);
    try {
      const amount = parseFloat(purchaseAmount);
      const result = await processFrontDeskScan(data, amount);
      if (result.success) {
        const pointsAwarded = result.pointsEarned || Math.ceil(amount * 0.1);
        setSuccessTransactionId(result.transactionId || "");
        setSuccessPoints(pointsAwarded);
        setShowSuccessModal(true);
      } else {
        setModal({
          title: translate("frontdesk.transaction.error.qr.title"),
          message: result.message || translate("frontdesk.transaction.error.qr.description"),
          buttons: [{ label: translate("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
        });
      }
    } catch (error) {
      setModal({
        title: translate("frontdesk.transaction.error.qr.title"),
        message: translate("label.somethingWentWrong"),
        buttons: [{ label: translate("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
      });
    }
  };


  const handleModalClose = () => {
    setScanned(false);
    setIsProcessing(false);
    setShowCamera(false);
    setPurchaseAmount("");
    setVoucherCode("");
    setShowSuccessModal(false);
  };

  const handleErrorModalClose = () => {
    setScanned(false);
    setIsProcessing(false);
    setShowErrorModal(false);
    setErrorMessage("");
  };

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-darkBackground">
      {/* Password Setup Modal */}
      <Modal
        visible={!!passwordSetupModal}
        onClose={() => {}}
        title={passwordSetupModal?.title ?? ""}
        message={passwordSetupModal?.message}
        buttons={passwordSetupModal?.buttons}
        showCloseButton={false}
        dismissOnBackdrop={false}
      />

      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {qrAccessEnabled === null ? (
          // Loading state
          <View className="mx-4 mt-4 bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden shadow-sm p-8 items-center justify-center">
            <View className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-3">
              <MaterialIcons name="hourglass-empty" size={24} color="#9CA3AF" />
            </View>
            <Text className="text-sm font-poppins-medium text-gray-500 dark:text-gray-400">
              Checking QR access...
            </Text>
          </View>
        ) : !qrAccessEnabled ? (
          // QR Disabled state - clean message only
          <View className="mx-4 mt-4 bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden shadow-sm p-8">
            <View className="items-center">
              <View className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full items-center justify-center mb-4">
                <MaterialIcons name="lock" size={32} color="#F59E0B" />
              </View>
              <Text className="text-lg font-poppins-bold text-gray-900 dark:text-gray-100 mb-2">
                QR Access Disabled
              </Text>
              <Text className="text-sm font-poppins text-gray-500 dark:text-gray-400 text-center mb-4">
                Only the store manager can enable QR scanning.
              </Text>
              <Text className="text-xs font-poppins text-gray-400 dark:text-gray-500 text-center">
                Please wait for the store manager to enable this feature.
              </Text>
            </View>
          </View>
        ) : (
          // QR Enabled - show all content
          <>
            {/* ── Header ── */}
            <FrontDeskHeader storeInfo={storeInfo} />

            {/* ── Scanner Card ── */}
            <FrontDeskScanner
              purchaseAmount={purchaseAmount}
              setPurchaseAmount={setPurchaseAmount}
              showCamera={showCamera}
              setShowCamera={setShowCamera}
              scanned={scanned}
              isProcessing={isProcessing}
              onBarcodeScanned={handleBarCodeScanned}
              modal={modal}
              setModal={setModal}
              voucherCode={voucherCode}
              setVoucherCode={setVoucherCode}
              currentStaffId={currentStaffId}
              onSuccess={(points) => {
                setSuccessPoints(points);
                setShowSuccessModal(true);
                addScan({ points, timestamp: new Date(), amount: parseFloat(purchaseAmount) });
                setVoucherCode("");
                setPurchaseAmount("");
              }}
              onError={(message) => {
                setModal({
                  title: "Error",
                  message,
                  buttons: [{ label: translate("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
                });
              }}
              scrollY={scrollY}
            />

            {/* ── Recent Transactions ── */}
            <RecentTransactions recentScans={recentScans} />
          </>
        )}
      </ScrollView>

      {/* Amount input field - only show when QR enabled */}
      {qrAccessEnabled === true && (
        <CompactAmountInput
          value={purchaseAmount}
          onChangeText={setPurchaseAmount}
          placeholder="0.00"
          autoFocus={false}
          isVisible={true}
          isFloating={true}
          scrollY={scrollY}
        />
      )}

      {/* ── Success Modal ── */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleModalClose}
        successPoints={successPoints}
      />

      {/* ── Error Modal ── */}
      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorModalClose}
        errorMessage={errorMessage}
      />
    </View>
  );
}
