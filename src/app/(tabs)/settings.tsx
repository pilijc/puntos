import { supabase } from "@/supabase/supabase";
import { View, Text, SafeAreaView, TouchableOpacity, Image } from "@/tw";
import { router, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import { Alert, LogBox, Switch } from "react-native";
import EditProfileModal from "@/components/settings/EditProfileModal";
import SecurityModal from "@/components/settings/SecurityModal";
import { Ionicons } from '@expo/vector-icons';

// Suppress hook-related warnings during development
LogBox.ignoreLogs(["Invalid hook call"]);

{/* LOGIC FOR GETTING USER PROFILE */}
export default function Settings() {

  /* Loading User Data */
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* Modals */
  const [modalVisible, setModalVisible] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);

  /* Switch Toggle */
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  // Default user profile for layout purposes
  const defaultProfile = {
    id: "default-user",
    username: "John Doe",
    avatar_url: null,
    email: "user@example.com"
  };

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // TODO: Uncomment the following code when ready to fetch real user data
      // const { data: { user } } = await supabase.auth.getUser();
      // if (user) {
      //   setUser(user);
      //   
      //   const { data: profileData, error } = await supabase
      //     .from("profiles")
      //     .select("*")
      //     .eq("id", user.id)
      //     .single();
      //   
      //   if (error && error.code !== "PGRST116") throw error;
      //   setProfile(profileData);
      // }
      
      // For now, use default profile for layout development
      setUser({ email: defaultProfile.email });
      setProfile(defaultProfile);
    } catch (error) {
      console.error("Error loading profile:", error);
      // Use default profile even if fetch fails
      setUser({ email: defaultProfile.email });
      setProfile(defaultProfile);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/(onboarding)/welcome");
    } catch (error) {
      Alert.alert("Logout error", error.message);
    }
  };

  {/* LOGIC TO HANDLE PRESSING THE PROFILE BUTTON */}
  const handleProfilePress = () => {
    setEditUsername(profile?.username || user.email?.split("@")[0] || "");
    setEditEmail(user?.email || "");
    setModalVisible(true);
  };

  {/* LOGIC TO HANDLE PRESSING THE PROFILE BUTTON */}
  const [preferences, setPreferences] = useState({
    nearby_alerts: false,
    promo_emails: false,
    dark_mode: false,
  });

  /**
 * A generic toggle function. 
 * 'key' will match the column names you'll eventually have in Supabase.
 */
const togglePreference = (key) => {
  setPreferences(prev => ({
    ...prev,
    [key]: !prev[key]
  }));
  
  // LATER: This is where you will add your Supabase sync:
  // await supabase.from('profiles').update({ [key]: !preferences[key] }).eq('id', user.id)
  };

  const handleSaveProfile = () => {
    // TODO: Update profile data in Supabase when backend is ready
    setProfile({
      ...profile,
      username: editUsername,
    });
    setUser({
      ...user,
      email: editEmail,
    });
    setModalVisible(false);
    Alert.alert("Success", "Profile updated successfully");
  };

  const handleCancelEdit = () => {
    setModalVisible(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-4">
      <View className="px-6 pt-6">
        <Text className="text-2xl font-poppins-bold text-neutral-900 mb-6">
          Settings
        </Text>
      </View>

      {/* PROFILE BUTTON */}
      {user && (
        <TouchableOpacity
          onPress={handleProfilePress}
          className="mx-4 mb-6 bg-white rounded-2xl p-4 border border-neutral-200 active:bg-neutral-50"
        >
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mr-4">
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="w-16 h-16 rounded-full"
                  contentFit="cover"
                />
              ) : (
                <Image
                  source={require("@/assets/images/puntos-icon.png")}
                  className="w-16 h-16 rounded-full"
                  contentFit="cover"
                />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-lg font-poppins-semibold text-neutral-900">
                {profile?.username || user.email?.split("@")[0]}
              </Text>
              <Text className="text-sm font-poppins-regular text-neutral-500">
                {user.email}
              </Text>
            </View>
            <Text className="text-neutral-400">→</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* 
      ------------------------------------------
      ------------------------------------------ACCOUNT SETTINGS------------------------------------------ 
      ------------------------------------------
      */}
      <View>
        <Text className="text-sm font-poppins-semibold text-neutral-600 mb-2">
          ACCOUNT SETTINGS
        </Text>
      </View>

      <View className="mx-4 mb-6 overflow-hidden bg-background rounded-2xl border border-neutral-200">
        {/* Top Button */}
        <TouchableOpacity 
        onPress={() => setSecurityModalVisible(true)}
        className="flex-row items-center p-4 bg-white active:bg-neutral-50 will-change-pressable">
          <View className="h-5 w-5 items-center justify-center rounded-lg bg-emerald-50">
            <Ionicons name="settings-outline" size={15} color="#3b82f6"/>
          </View>
          <Text className="text-base flex-1 ml-3 font-poppins-semibold text-neutral-900">
            Security
          </Text>
          <Ionicons name="chevron-forward-outline" size={15} color="#d4d4d4"/>
        </TouchableOpacity>

        {/* Bottom Button */}
        <TouchableOpacity 
          onPress={() => setNotificationsModalVisible(true)}
          className="flex-row items-center p-4 bg-white active:bg-neutral-50 will-change-pressable"
        >
          <View className="h-5 w-5 items-center justify-center rounded-lg bg-emerald-50">
            <Ionicons name="help-outline" size={15} color="#10b981" />
          </View>
          <Text className="text-base flex-1 ml-3 font-poppins-semibold text-neutral-900">
            PLACEHOLDER
          </Text>
          <Ionicons name="chevron-forward-outline" size={15} color="#d4d4d4"/>
        </TouchableOpacity>
      </View>

      {/* 
      ------------------------------------------
      ------------------------------------------NOTIFICATIONS AND PRIVACY------------------------------------------ 
      ------------------------------------------
      */}
      <View>
        <Text className="text-sm font-poppins-semibold text-neutral-600 mb-2">
          NOTIFICATIONS & PRIVACY
        </Text>
      </View>

      <View className="mx-4 mb-6 overflow-hidden bg-background rounded-2xl border border-neutral-200 ">
        {/* Ari ang toggles */}
        <View className="flex-row p-4 bg-background active:bg-neutral-50">
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
            <Ionicons name="notifications-outline" size={18} color="#FF6600" />
          </View>
          <View className="ml-3 flex-1">  
            <Text className="text-base font-poppins-semibold text-neutral-800">
              Nearby Alerts
            </Text>
            <Text className="text-xs font-poppins-regular text-neutral-400">
              Get notified when rewards are close
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#d4d4d4', true: '#FF6600' }}
            thumbColor="#FFFFFF"
            value={preferences.nearby_alerts}
            onValueChange={() => togglePreference('nearby_alerts')}
          />
        </View>

        <TouchableOpacity
          /* For now wala say sulod ang onPress={() => setLocationPermission(true)}n */
          className="flex-row items-center p-4 bg-white active:bg-neutral-50 will-change-pressable"
        >
            <View className="h-8 w-8 items-center justify-center rounded-lg bg-yellow-50">
              <Ionicons name="location-outline" size={18} color="#d8d336" />
            </View>
            <View className="ml-3 flex-1">  
              <Text className="text-base font-poppins-semibold text-neutral-800">
                Location Access
              </Text>
              <Text className="text-xs font-poppins-regular text-neutral-400">
                Always Allowed
              </Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={15} color="#d4d4d4"/>
        </TouchableOpacity>

        <View className="flex-row p-4 bg-background active:bg-neutral-50">
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-pink-50">
            <Ionicons name="megaphone-outline" size={18} color="#ad2291" />
          </View>
          <View className="ml-3 flex-1">  
            <Text className="text-base font-poppins-semibold text-neutral-800">
              Promotional Emails
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#d4d4d4', true: '#FF6600' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#d4d4d4"
            value={preferences.promo_emails}
            onValueChange={() => togglePreference('promo_emails')}
          />
        </View>

      </View>
      {/* 
      ------------------------------------------
      ------------------------------------------LOGOUT BUTTON------------------------------------------
      ------------------------------------------
      */}
      <TouchableOpacity
        onPress={handleLogout}
        className="mx-4 bg-primary py-4 rounded-xl items-center flex-row will-change-pressable justify-center"
      >
        <View className="h-5 w-5 items-center">
          <Ionicons name="log-out-outline" size={15} color="#FFFFFF" />
        </View>
        <Text className="text-white text-base font-poppins-semibold">
          Logout
        </Text>
      </TouchableOpacity>

      <View className="mx-8 mt-6 items-center">
        <Text className="text-sm text-center font-poppins-regular text-neutral-500">
          Copyright 2026
        </Text>
      </View>

      {/* Externalized modals */}
      <EditProfileModal
        visible={modalVisible}
        onClose={handleCancelEdit}
        username={editUsername}
        email={editEmail}
        setUsername={setEditUsername}
        setEmail={setEditEmail}
        onSave={handleSaveProfile}
      />

      <SecurityModal visible={securityModalVisible} onClose={() => setSecurityModalVisible(false)} />

    </SafeAreaView>
  );
}
