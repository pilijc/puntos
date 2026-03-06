import { supabase } from '@/supabase/supabase';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuthStore } from '@/store/auth-store';

export const useAuthActions = () => {
    const handleLogout = async () => {
        try {
            // Commented out for now
            // useAuthStore.getState().reset();
            // await AsyncStorage.removeItem('sessionToken');

            try {
                await GoogleSignin.signOut();
            } catch (googleError) {
                console.log("Not signed in with Google or error signing out:", googleError);
            }

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
