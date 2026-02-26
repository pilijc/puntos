import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/supabase/supabase';
import { getHomeRouteForUserId } from '@/services/access-service';

export function useAuthListener() {
  const router = useRouter();
  
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {        
        if (event === 'SIGNED_IN' && session) {
          console.log("User logged in:", session.user.email);
          void (async () => {
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
