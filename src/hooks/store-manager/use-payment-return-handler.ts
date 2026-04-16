import { useEffect } from "react";
import * as Linking from "expo-linking";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

export function usePaymentReturnHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      const parsed = Linking.parse(url);

      if (parsed.path === "payment/success") {
        Alert.alert("Payment", "Payment completed. Verifying...");
        router.replace("/subscription/success");
      }

      if (parsed.path === "payment/cancel") {
        Alert.alert("Payment", "Payment cancelled.");
        router.replace("/subscription/cancel");
      }
    };

    const sub = Linking.addEventListener("url", handleUrl);

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => sub.remove();
  }, [router]);
}

