import React from "react";
import { Modal as RNModal, Linking, Alert } from "react-native";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo } from "react";
import { router } from "expo-router";
import SortPill from "@/components/rewards/SortPill";
import StoreCard from "@/components/rewards/StoreCard";
import { StoreItem } from "@/data/rewards";
import { useRewardsUiStore } from "@/store/rewards-ui-store";
import { useStoreStore } from "@/store/store-store";
import { useStamps } from "@/hooks/use-stamps";
import { useLocation } from "@/hooks/use-location";
import { enrichStoresWithLocation } from "@/utils/store-location";

export interface ResubsaleModalProps {
  visible: boolean;
  setShowModal: (show: boolean) => void;
  userId?: string | number;
  amount?: number;
  type?: "payment" | "resubscription" | "sale" | "global"; // support multiple use-cases
  title?: string;
  description?: string;
  onSuccess?: () => void;
  onSubmit?: () => Promise<void> | void;
  submitLabel?: string;
  cancelLabel?: string;
  icon?: React.ReactNode | string;
}

/**
 * Global, reusable modal for payments, resubscriptions, or any sale action.
 * Everything is customizable!
 *
 * Props:
 * - visible: Show the modal (required)
 * - setShowModal: Fn to control visibility (required)
 * - userId: Associated user, optional for certain flows
 * - amount: Optional amount for payment context
 * - type: payment | resubscription | sale | global (hint for styling)
 * - title, description: Any modal title/text
 * - onSuccess: Called after action completes (optional)
 * - onSubmit: Optional custom handler (if not set, defaults to pay action)
 * - submitLabel, cancelLabel: Custom button texts
 * - icon: JSX or emoji to show
 */
export default function ResubsaleModal({
  visible,
  setShowModal,
  userId,
  amount = 199,
  type = "global",
  title,
  description,
  onSuccess,
  onSubmit,
  submitLabel,
  cancelLabel,
  icon,
}: ResubsaleModalProps) {
  // Default handler for payments
  const handleDefault = async () => {
    try {
      // Only default "payment" flow
      if (type === "payment" && userId) {
        // You must implement/createPayMongoPayment elsewhere!
        // @ts-ignore
        const checkoutUrl = await createPayMongoPayment({
          user_id: userId,
          amount,
        });

        if (checkoutUrl) {
          Linking.openURL(checkoutUrl);
          if (onSuccess) onSuccess();
        } else {
          Alert.alert("Payment Error", "Unable to create payment. Please try again.");
        }
      } else if (onSuccess) {
        onSuccess();
      }
      setShowModal(false);
    } catch (err) {
      console.error("Error performing action:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const handleSubmit = onSubmit ? onSubmit : handleDefault;

  // Icon conditional
  let iconDisplay;
  if (icon) {
    iconDisplay = typeof icon === "string"
      ? <Text className="text-2xl">{icon}</Text>
      : icon;
  } else if (type === "payment") {
    iconDisplay = <Text className="text-2xl">💳</Text>;
  } else if (type === "resubscription") {
    iconDisplay = <Text className="text-2xl">🔄</Text>;
  } else if (type === "sale") {
    iconDisplay = <Text className="text-2xl">🛒</Text>;
  } else {
    iconDisplay = <Text className="text-2xl">🌐</Text>;
  }

  // Title/description fallbacks
  const MAIN_TITLE =
    title ||
    (type === "payment"
      ? "Store Registration"
      : type === "resubscription"
      ? "Renew Subscription"
      : type === "sale"
      ? "Complete Sale"
      : "Action Required");
  const DESC =
    description ||
    (type === "payment"
      ? "Pay the registration fee to activate your store."
      : type === "resubscription"
      ? "Renew your plan to keep accessing premium features."
      : type === "sale"
      ? "Confirm this sale to proceed."
      : "Continue to complete this action.");

  const SUBMIT_LABEL =
    submitLabel ||
    (type === "payment"
      ? "Pay with CASH G!!"
      : type === "resubscription"
      ? "Renew Now"
      : type === "sale"
      ? "Complete Sale"
      : "Continue");
  const CANCEL_LABEL = cancelLabel || "Cancel";
  const { stores: realStores } = useStoreStore();
  const { stamps } = useStamps();
  const { location } = useLocation();

  const allStores: StoreItem[] = useMemo(() => {
    const stampedIds = new Set(stamps.map((s) => s.store_id.toString()));
    const myStores = realStores.filter((s) => stampedIds.has(s.id.toString()));
    const enrichedStores = enrichStoresWithLocation(myStores, location);

    return enrichedStores.map((s) => {
      const stampProgress = stamps.find(
        (p) => p.store_id.toString() === s.id.toString()
      );
      return {
        id: s.id.toString(),
        name: s.name,
        location: s.address || "Unknown location",
        distanceMeters: s.distanceMeters,
        points: 0, // Points are a separate feature
        isNearby: s.isNearby,
        logo: s.logo,
      };
    });
  }, [realStores, stamps, location]);

  const sortedStores = useMemo(() => {
    const list = [...allStores];
    if (storeSort === "points") {
      list.sort((a, b) =>
        storePointsOrder === "desc" ? b.points - a.points : a.points - b.points
      );
    } else if (storeSort === "az") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => a.distanceMeters - b.distanceMeters);
    }
    return list;
  }, [allStores, storeSort, storePointsOrder]);

  const totalPoints = allStores.reduce((sum, store) => sum + store.points, 0);

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: 20,
        }}
      >
        <View className="w-full max-w-sm bg-white rounded-3xl p-6 items-center shadow-lg">
          {/* Icon */}
          <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-4">
            {iconDisplay}
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-800 mb-1">
            {MAIN_TITLE}
          </Text>
          <Text className="text-gray-500 text-center mb-5">{DESC}</Text>

          {/* Optional Amount Card */}
          {(type === "payment" || amount) && (
            <View className="w-full bg-orange-50 border border-orange-200 rounded-xl p-4 items-center mb-6">
              <Text className="text-gray-500 text-sm mb-1">Amount to Pay</Text>
              <Text className="text-3xl font-bold text-orange-500">₱{amount}</Text>
            </View>
          )}
        <Text className="text-xs text-neutral-500 font-poppins">
          {allStores.length} stores • {totalPoints.toLocaleString()} pts total
        </Text>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="w-full bg-orange-500 py-3 rounded-xl items-center mb-3 active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">
              {SUBMIT_LABEL}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => setShowModal(false)}
            className="w-full border border-orange-500 py-3 rounded-xl items-center"
          >
            <Text className="text-orange-500 font-semibold">{CANCEL_LABEL}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </RNModal>
  );
}
