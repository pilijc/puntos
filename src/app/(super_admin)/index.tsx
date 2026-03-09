import React, { useState, useEffect, useMemo, useRef } from "react";
import { ScrollView, ActivityIndicator, RefreshControl, Modal, Image, Animated } from "react-native";
import { SafeAreaView, Text, TouchableOpacity, View } from "@/tw";
import { useRouter } from "expo-router";
import { useDashboardStore } from "@/store/useDashboardStore";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { UserRow } from "@/components/users/UserRow";
import { StoreCard } from "@/components/stores/StoreCard";
import { StatCard } from "@/components/ui/StatCard";

const SOFT_CARD_SHADOW = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 6,
  elevation: 2,
};

// 8 particles bursting in different directions
const PARTICLES = [
  { angle: 0,   color: "#FF6600" },
  { angle: 45,  color: "#3B82F6" },
  { angle: 90,  color: "#22C55E" },
  { angle: 135, color: "#F59E0B" },
  { angle: 180, color: "#EC4899" },
  { angle: 225, color: "#8B5CF6" },
  { angle: 270, color: "#14B8A6" },
  { angle: 315, color: "#FF6600" },
];

function AvatarWithBurst({ uri, onLongPress, onPressOut }: any) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const particleAnims = useRef(
    PARTICLES.map(() => ({
      position: new Animated.ValueXY({ x: 0, y: 0 }),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  const triggerBurst = () => {
    // Burst and Pulse the avatar
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true, speed: 50 }),
      Animated.spring(scaleAnim, { toValue: 1,   useNativeDriver: true, speed: 20 }),
    ]).start();

    const animations = particleAnims.map((p, i) => {
      const rad = (PARTICLES[i].angle * Math.PI) / 180;
      const dist = 28 + Math.random() * 14;
      p.position.setValue({ x: 0, y: 0 });
      p.opacity.setValue(1);
      p.scale.setValue(0);

      return Animated.parallel([
        Animated.timing(p.position, {
          toValue: { x: Math.cos(rad) * dist, y: Math.sin(rad) * dist },
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(p.scale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start();
    onLongPress?.();
  };

  return (
    <TouchableOpacity
      onLongPress={triggerBurst}
      onPressOut={onPressOut}
      delayLongPress={200}
      style={[SOFT_CARD_SHADOW, { position: "relative", width: 44, height: 44 }]}
      activeOpacity={0.85}
    >
      {particleAnims.map((p, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: PARTICLES[i].color,
            opacity: p.opacity,
            transform: [
              { translateX: p.position.x },
              { translateY: p.position.y },
              { scale: p.scale },
            ],
            zIndex: 99,
          }}
        />
      ))}

      {/* User Avatar */}
      <Animated.Image
        source={{ uri }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: "#FFF",
          transform: [{ scale: scaleAnim }],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -2,
          right: -2,
          width: 14,
          height: 14,
          backgroundColor: "#22C55E",
          borderRadius: 7,
          borderWidth: 2,
          borderColor: "#FFF",
        }}
      />
    </TouchableOpacity>
  );
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { users, stores, adminInfo, loading, fetchDashboardData, fetchAdminSession } = useDashboardStore();

  const [refreshing, setRefreshing]       = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);

  const activeStoresCount = useMemo(
    () => stores.filter(s => s.status?.toString().toUpperCase().trim() === "ACTIVE").length,
    [stores]
  );

  useEffect(() => {
    fetchAdminSession();
    fetchDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAdminSession(), fetchDashboardData()]);
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6600" />}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-center bg-primary/10 self-start px-2.5 py-1 rounded-full mb-1">
                <Text className="text-[8px] font-poppins-medium text-primary uppercase tracking-wider">
                  Welcome back, {adminInfo.username.split(" ")[0]}!
                </Text>
              </View>
              <Text className="text-3xl font-poppins-bold text-textPrimary leading-tight">Dashboard</Text>
            </View>
            
            <AvatarWithBurst
              uri={adminInfo.avatar}
              onLongPress={() => setShowProfileCard(true)}
              onPressOut={() => setShowProfileCard(false)}
            />
          </View>
          <View className="h-[1px] bg-backgroundMuted mt-4" />
        </View>

        {/* Stats */}
        <View className="px-6 mb-6 mt-4">
          <View className="flex-row gap-2">
            <StatCard label="Total Users"   val={users.length}        icon="groups"     color="#3B82F6" />
            <StatCard label="Total Stores"  val={stores.length}       icon="storefront" color="#22C55E" />
            <StatCard label="Active Stores" val={activeStoresCount}   icon="storefront" color="#16A34A" />
          </View>
        </View>

        {/* User Management */}
        <View className="px-6 mb-8">
          <SectionHeader title="Manage Users" onAction={() => router.push("/(super_admin)/users")} />
          <View style={[SOFT_CARD_SHADOW, styles.userContainer]}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
              {users.length === 0 ? (
                <Text className="text-center py-10 text-textMuted font-poppins">No users found</Text>
              ) : (
                users.map((user, idx) => <UserRow key={user.id} user={user} isFirst={idx === 0} />)
              )}
            </ScrollView>
          </View>
        </View>

        {/* Store Management */}
        <View className="px-6 mb-6">
          <SectionHeader title="Store Management" onAction={() => router.push("/(super_admin)/stores")} />
          <View style={{ gap: 12 }}>
            {stores.length === 0 ? (
              <Text className="text-center text-textMuted py-4 font-poppins">No stores found.</Text>
            ) : (
              stores.map(store => <StoreCard key={store.id} store={store} />)
            )}
          </View>
        </View>
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={showProfileCard} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 items-center justify-center px-6"
          activeOpacity={1}
          onPress={() => setShowProfileCard(false)}
        >
          <View style={SOFT_CARD_SHADOW} className="bg-white w-full max-w-[280px] rounded-[30px] p-8 items-center">
            <Image
              source={{ uri: adminInfo.avatar }}
              style={{ width: 90, height: 90, borderRadius: 32, marginBottom: 16 }}
            />
            <Text className="text-xl font-poppins-bold text-textPrimary text-center">{adminInfo.name}</Text>
            <Text className="text-sm font-poppins text-textMuted mb-8 text-center">@{adminInfo.username}</Text>
            <TouchableOpacity
              onPress={() => { setShowProfileCard(false); router.push("/(super_admin)/profile"); }}
              className="w-full bg-primary py-1.5 rounded-3xl items-center shadow-sm"
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  userContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
} as const;