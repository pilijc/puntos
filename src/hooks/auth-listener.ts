import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/supabase/supabase';
import { getHomeRouteForUserId } from '@/services/access-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAuthListener() {
  const router = useRouter();
  
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {        
        if (event === 'SIGNED_IN' && session) {
          console.log("User logged in:", session.user.email);
          void (async () => {
            const sessionToken = await AsyncStorage.getItem('sessionToken');
            if (!sessionToken && session.access_token) {
              await AsyncStorage.setItem('sessionToken', session.access_token);
            }

            const tokenToUse = sessionToken ?? session.access_token ?? null;
            if (!tokenToUse) {
              console.log('No session token found in AsyncStorage or session; staying on auth screens.');
              return;
            }

            const nextRoute = await getHomeRouteForUserId(session.user.id);
            router.replace(nextRoute);
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
