import { useRouter, useFocusEffect } from "expo-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useColorScheme } from "react-native";
import { ScrollView, View, Text, TouchableOpacity } from "@/tw";
import { Animated} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Lock } from "lucide-react-native";
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
import RewardRedemptionScanner from "@/components/front-desk/RewardRedemptionScanner";
import RewardRedemptionModal from "@/components/front-desk/modal/RewardRedemptionModal";
import RecentTransactions from "@/components/front-desk/RecentTransactions";
import SuccessModal from "@/components/front-desk/modal/SuccessModal";
import ErrorModal from "@/components/front-desk/modal/ErrorModal";
import { RedemptionVerificationResult } from "@/type/frontdesk/reward-redemption";

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
  const [mode, setMode] = useState<"earn" | "redeem">("earn");
  const [redemptionVerification, setRedemptionVerification] = useState<RedemptionVerificationResult | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
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
                title: translate("frontdesk.transaction.passwordSetup.title"),
                message: translate("frontdesk.transaction.passwordSetup.message"),
                buttons: [{
                  label: translate("frontdesk.transaction.passwordSetup.button"),
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
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {qrAccessEnabled === null ? (
          // Loading state
          <View className="flex-1 items-center justify-center px-4">
            <View className="bg-white dark:bg-darkBackgroundCard rounded-xl border border-neutral-100 dark:border-darkBorder shadow-sm p-8 items-center">
              <View className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-3">
                <MaterialIcons name="hourglass-empty" size={24} color="#9CA3AF" />
              </View>
              <Text className="text-sm font-poppins-medium text-gray-500 dark:text-gray-400">
                {translate("frontdesk.transaction.access.checking")}
              </Text>
            </View>
          </View>
        ) : !qrAccessEnabled ? (
          // QR Disabled state - clean message only, centered
          <View className="flex-1 items-center justify-center px-4">
            <View className="bg-white dark:bg-darkBackgroundCard rounded-xl border border-neutral-100 dark:border-darkBorder shadow-sm p-8">
              <View className="items-center">
                <View className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full items-center justify-center mb-4">
                  <Lock size={32} color="#F59E0B" />
                </View>
                <Text className="text-lg font-poppins-bold text-gray-900 dark:text-gray-100 mb-2">
                  {translate("frontdesk.transaction.access.disabled")}
                </Text>
                <Text className="text-sm font-poppins text-gray-500 dark:text-gray-400 text-center mb-4">
                  {translate("frontdesk.transaction.access.disabledDetail")}
                </Text>
                <Text className="text-xs font-poppins text-gray-400 dark:text-gray-500 text-center">
                  {translate("frontdesk.transaction.access.wait")}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          // QR Enabled - show all content
          <>
            {/* ── Header ── */}
            <FrontDeskHeader storeInfo={storeInfo} />

            {/* ── Mode Toggle ── */}
            <View className="mx-4 mt-4">
              <View className="flex-row bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
                <TouchableOpacity
                  onPress={() => setMode("earn")}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    mode === "earn" ? "bg-white dark:bg-neutral-700" : ""
                  }`}
                >
                  <Text className={`text-sm font-poppins-semibold ${
                    mode === "earn" ? "text-orange-600 dark:text-orange-400" : "text-neutral-500"
                  }`}>
                    Earn Points
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMode("redeem")}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    mode === "redeem" ? "bg-white dark:bg-neutral-700" : ""
                  }`}
                >
                  <Text className={`text-sm font-poppins-semibold ${
                    mode === "redeem" ? "text-orange-600 dark:text-orange-400" : "text-neutral-500"
                  }`}>
                    Redeem Reward
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Scanner Card ── */}
            {mode === "earn" ? (
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
            ) : (
              <RewardRedemptionScanner
                currentStaffId={currentStaffId}
                onSuccess={(result) => {
                  setRedemptionVerification(result);
                  setShowRedemptionModal(true);
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
            )}

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

      {/* ── Reward Redemption Modal ── */}
      <RewardRedemptionModal
        visible={showRedemptionModal}
        verification={redemptionVerification}
        staffId={currentStaffId}
        onClose={() => {
          setShowRedemptionModal(false);
          setRedemptionVerification(null);
        }}
        onSuccess={() => {
          // Refresh transactions
          if (storeInfo) fetchTransactions(storeInfo.id);
        }}
        onError={(message) => {
          setModal({
            title: "Redemption Error",
            message,
            buttons: [{ label: translate("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
          });
        }}
      />
    </View>
  );
}
