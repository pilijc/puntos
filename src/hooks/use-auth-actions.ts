import { supabase } from '@/supabase/supabase';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { forceDeactivateAllDeviceSessions } from '@/services/shared/device-session-route-service';
import { markIntentionalSignOut } from '@/lib/intentional-signout';
import { logger } from "@/utils/logger";

export const useAuthActions = () => {
    const handleLogout = async () => {
        try {


            try {
                await GoogleSignin.signOut();
            } catch (googleError) {
                logger.debug("Not signed in with Google or error signing out:", googleError);
            }

            markIntentionalSignOut();
            const { error } = await supabase.auth.signOut();
            if (error) {
                logger.error("Supabase signOut error (ignoring to allow local logout):", error.message);
            }

            router.replace("/(onboarding)/welcome");
        } catch (error: any) {
            logger.error("Logout process error:", error);
            Alert.alert("Logout error", "An unexpected error occurred during logout. Please try again.");
            router.replace("/(onboarding)/welcome");
        }
    };

    return { handleLogout };
};
