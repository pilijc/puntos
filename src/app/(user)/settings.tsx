import { supabase } from "@/supabase/supabase";
import { View, Text, SafeAreaView, TouchableOpacity, Image } from "@/tw";
import { router, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import { Alert, Switch } from "react-native";
import EditProfileModal from "@/components/settings/EditProfileModal";
import SecurityModal from "@/components/settings/SecurityModal";
import StoreOwnerModal from "@/components/settings/StoreOwnerModal";
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from "@/hooks/use-location";
import { getCurrentLocation } from "@/services/location-service";

export default function Settings() {

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [storeModalVisible, setStoreModalVisible] = useState(false);

  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  const {
    location,
    permissionStatus,
    loading: locationLoading,
    requestPermission: requestLocationPermission,
    refreshLocation,
  } = useLocation();

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const { data: { user: currentUser }, error: userErr } = await supabase.auth.getUser();

      if (userErr) {
        throw userErr;
      }

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(currentUser);

      let profileData = null;
      let profileErr = null;

      try {
        const res = await supabase
          .from("users")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();
        profileData = res.data;
        profileErr = res.error;
      } catch (e) {
        profileData = null;
        profileErr = e as any;
      }

      if (profileErr) {
      }

      if (profileData) {
        if (profileData.id === currentUser.id) {
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      try {
        const settingsRes = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (settingsRes.data) {
          setPreferences({
            near_store_notifications: settingsRes.data.near_store_notifications ?? false,
            location_enabled: settingsRes.data.location_enabled ?? false,
            promo_emails: preferences.promo_emails, // default
          });
        }
      } catch (settingsErr) {
        console.error("Error fetching settings:", settingsErr);
      }

    } catch (error) {
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

  const handleProfilePress = () => {
    setEditUsername(profile?.name || user.email?.split("@")[0] || "");
    setEditEmail(user?.email || "");
    setModalVisible(true);
  };

  const [preferences, setPreferences] = useState({
    near_store_notifications: false,
    location_enabled: false,
    promo_emails: false,
  });

  const togglePreference = async (key: string) => {
    const newValue = !(preferences as any)[key];
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.id) {
        await supabase.from("user_settings").update({ [key]: newValue }).eq("id", data.id);
      } else {
        await supabase.from("user_settings").insert({ user_id: user.id, [key]: newValue });
      }
    } catch (e) {
      console.error("Failed to save preference", e);
    }
  };

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const syncLocationToDB = async () => {
      if (!user?.id) return;
      try {
        const loc = await getCurrentLocation();
        if (loc) {
          await supabase
            .from("user_settings")
            .update({
              latitude: loc.latitude,
              longitude: loc.longitude,
            })
            .eq("user_id", user.id);
        }
      } catch (e) {
        console.error("Failed to sync location to DB:", e);
      }
    };

    if (preferences.location_enabled) {
      syncLocationToDB();

      intervalId = setInterval(() => {
        syncLocationToDB();
      }, 60000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [preferences.location_enabled, user?.id]);

  const handleSaveProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.id) throw new Error("No authenticated user");

      const payload: Record<string, unknown> = { id: currentUser.id, name: editUsername };

      const { error } = await supabase.from("users").upsert(payload);
      if (error) throw error;

      setProfile(prev => ({ ...(prev || {}), name: editUsername }));
      setModalVisible(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save profile");
    }
  };

  const handleCancelEdit = () => {
    setModalVisible(false);
  };

  const displayName = user
    ? (profile?.name || user.email?.split("@")[0] || "User")
    : "Settings";

  return (
    <SafeAreaView className="flex-1 bg-background p-4">
      <View>
        <Text className="text-2xl font-poppins-bold text-neutral-900 mb-6">
          {user ? `Hi, ${displayName}` : "Settings"}
        </Text>
      </View>

      {user && (!profile || profile?.id === user.id) && (
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
                {profile?.name || user.email?.split("@")[0]}
              </Text>
              <Text className="text-sm font-poppins-regular text-neutral-500">
                {user.email}
              </Text>
            </View>
            <Text className="text-neutral-400">→</Text>
          </View>
        </TouchableOpacity>
      )}

      <View>
        <Text className="text-sm font-poppins-semibold text-neutral-600 mb-2">
          ACCOUNT SETTINGS
        </Text>
      </View>

      <View className="mx-4 mb-6 overflow-hidden bg-background rounded-2xl border border-neutral-200">
        <TouchableOpacity
          onPress={() => setSecurityModalVisible(true)}
          className="flex-row items-center p-4 bg-white active:bg-neutral-50 will-change-pressable">
          <View className="h-5 w-5 items-center justify-center rounded-lg bg-emerald-50">
            <Ionicons name="settings-outline" size={15} color="#3b82f6" />
          </View>
          <Text className="text-base flex-1 ml-3 font-poppins-semibold text-neutral-900">
            Security
          </Text>
          <Ionicons name="chevron-forward-outline" size={15} color="#d4d4d4" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStoreModalVisible(true)}
          className="flex-row items-center p-4 bg-white active:bg-neutral-50 will-change-pressable"
        >
          <View className="h-5 w-5 items-center justify-center rounded-lg bg-emerald-50">
            <Ionicons name="help-outline" size={15} color="#10b981" />
          </View>
          <Text className="text-base flex-1 ml-3 font-poppins-semibold text-neutral-900">
            Role
          </Text>
          <Ionicons name="chevron-forward-outline" size={15} color="#d4d4d4" />
        </TouchableOpacity>
      </View>

      <View>
        <Text className="text-sm font-poppins-semibold text-neutral-600 mb-2">
          NOTIFICATIONS & PRIVACY
        </Text>
      </View>

      <View className="mx-4 mb-6 overflow-hidden bg-background rounded-2xl border border-neutral-200 ">
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
            value={preferences.near_store_notifications}
            onValueChange={() => togglePreference('near_store_notifications')}
          />
        </View>

        <View className="flex-row p-4 bg-white active:bg-neutral-50 items-center">
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-yellow-50">
            <Ionicons name="location-outline" size={18} color="#d8d336" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-poppins-semibold text-neutral-800">
              Location Access
            </Text>
            <Text className="text-xs font-poppins-regular text-neutral-400">
              {locationLoading
                ? "Checking..."
                : permissionStatus.granted
                  ? location
                    ? `Device Access Granted • ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                    : "Device Access Granted"
                  : "Device Access Not Allowed"}
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#d4d4d4', true: '#FF6600' }}
            thumbColor="#FFFFFF"
            value={preferences.location_enabled}
            onValueChange={async () => {
              if (!permissionStatus.granted) {
                await requestLocationPermission();
              }
              togglePreference('location_enabled');
            }}
          />
        </View>

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

      <StoreOwnerModal
        visible={storeModalVisible}
        onClose={() => setStoreModalVisible(false)}
        role={profile?.role}
        onToggleRole={async () => {
          try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser?.id) throw new Error("No authenticated user");
            const newRole = profile?.role === "store_owner" ? "user" : "store_owner";
            const { error } = await supabase.from("users").upsert({ id: currentUser.id, role: newRole });

            if (error) throw error;
            setProfile(prev => ({ ...(prev || {}), role: newRole }));

            setStoreModalVisible(false);
            Alert.alert("Success", `Role updated to ${newRole}`);
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to change role");
          }
        }}
      />

    </SafeAreaView>
  );
}
