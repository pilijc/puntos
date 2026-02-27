import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/supabase/supabase';
import { getHomeRouteForUserId } from '@/services/access-service';
import { checkIfAccountDeletedService } from '@/services/auth-service';
import { Alert } from 'react-native';

export function useAuthListener() {
  const router = useRouter();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log("User logged in:", session.user.email);
          void (async () => {
            try {
              await checkIfAccountDeletedService(session.user.id);

              const nextRoute = await getHomeRouteForUserId(session.user.id);
              router.replace(nextRoute);
            } catch (err: any) {
              if (err.message === "Invalid login credentials.") {
                Alert.alert("Login Failed", "Invalid login credentials.");
                router.replace("/(auth)/login");
              } else {
                console.error("Auth listener error", err);
              }
            }
          })();
        } else if (event === 'SIGNED_OUT') {
          console.log("User logged out");
          router.replace("/(onboarding)/welcome");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);
}
