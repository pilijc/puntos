import { supabase } from '@/supabase/supabase';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { deactivateCurrentDeviceSessionService } from '@/services/store-manager/device-session-service';
import { markIntentionalSignOut } from '@/lib/intentional-signout';

export const useAuthActions = () => {
    const handleLogout = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await deactivateCurrentDeviceSessionService(user.id).catch(e => console.warn(e));
            }

            try {
                await GoogleSignin.signOut();
            } catch (googleError) {
                console.log("Not signed in with Google or error signing out:", googleError);
            }

            markIntentionalSignOut();
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Supabase signOut error (ignoring to allow local logout):", error.message);
            }

            router.replace("/(onboarding)/welcome");
        } catch (error: any) {
            console.error("Logout process error:", error);
            Alert.alert("Logout error", "An unexpected error occurred during logout. Please try again.");
            router.replace("/(onboarding)/welcome");
        }
    };

    return { handleLogout };
};
