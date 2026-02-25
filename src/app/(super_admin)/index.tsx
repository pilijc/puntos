import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, TextInput, Image } from "react-native";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "@/tw";
import { supabase } from "@/supabase/supabase";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function SuperAdminHome() {
  const router = useRouter();

  const softCardShadow = {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  };

  const mockUsers = [
    {
      id: "u1",
      name: "Alex Morgan",
      email: "alex.m@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=Alex&backgroundColor=ffdfbf",
    },
    {
      id: "u2",
      name: "Sarah Jenkins",
      email: "s.jenkins88@gmail.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=Sarah&backgroundColor=ffecb3",
    },
    {
      id: "u3",
      name: "Michael Chen",
      email: "mike.chen@tech.co",
      avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=Michael&backgroundColor=fbe9e7",
    },
  ];

  const storeFilters = ["All Stores", "Active", "Deactivated"];

  const mockStores = [
    {
      id: "s1",
      name: "The Coffee Foundry",
      location: "Brooklyn, NY",
      owner: "David Miller",
      staffCount: "4 Staff Members",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&auto=format&fit=crop&q=60",
      status: "ACTIVE",
      primaryAction: "Edit Details",
      dangerAction: "Deactivate",
    },
    {
      id: "s2",
      name: "Brew & Bean Co.",
      location: "Seattle, WA",
      owner: "Jessica Wong",
      staffCount: "2 Staff Members",
      image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=300&auto=format&fit=crop&q=60",
      status: "PENDING",
      primaryAction: "Approve",
      dangerAction: "Reject",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-backgroundMuted">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="bg-primary rounded-b-[35px] px-6 pt-2 pb-20 overflow-hidden">
          {/* Decorative Circles */}
          <View className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
          <View className="absolute -bottom-12 -left-10 w-28 h-28 rounded-full bg-white/10" />

          {/* Header Top Bar */}
          <View className="flex-row items-center justify-between mt-2">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/15 items-center justify-center">
              <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Text className="text-white text-xl font-poppins-bold">Super Admin</Text>

            <TouchableOpacity className="w-10 h-10 rounded-full bg-white/15 items-center justify-center relative">
              <MaterialIcons name="notifications-none" size={19} color="#FFFFFF" />
              <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger" />
            </TouchableOpacity>
          </View>

          {/* Welcome Text */}
          <View className="mt-8 mb-2">
            <Text className="text-white text-4xl font-poppins-bold">Dashboard</Text>
            <Text className="mt-1 text-[13px] text-white/90 font-poppins">Welcome back, Administrator</Text>
          </View>
        </View>

        {/* Metrics Section */}
        <View className="px-6 -mt-12 mb-8">
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {/* Total Users Card */}
            <View
              style={[
                softCardShadow,
                { width: "48%", backgroundColor: "#FFFFFF", borderRadius: 24, paddingVertical: 28, alignItems: "center" }
              ]}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <MaterialIcons name="groups" size={24} color="#3B82F6" />
              </View>
              <Text style={{ fontSize: 28, fontFamily: "Poppins-Bold", color: "#0F172A", lineHeight: 32 }}>12,451</Text>
              <Text style={{ marginTop: 6, fontSize: 10, fontFamily: "Poppins-Bold", color: "#94A3B8", letterSpacing: 1 }}>TOTAL USERS</Text>
            </View>

            {/* Active Stores Card */}
            <View
              style={[
                softCardShadow,
                { width: "48%", backgroundColor: "#FFFFFF", borderRadius: 24, paddingVertical: 28, alignItems: "center" }
              ]}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <MaterialIcons name="storefront" size={24} color="#22C55E" />
              </View>
              <Text style={{ fontSize: 28, fontFamily: "Poppins-Bold", color: "#0F172A", lineHeight: 32 }}>84</Text>
              <Text style={{ marginTop: 6, fontSize: 10, fontFamily: "Poppins-Bold", color: "#94A3B8", letterSpacing: 1 }}>ACTIVE STORES</Text>
            </View>
          </View>
        </View>

        {/* Search Bar Section */}
        <View className="px-6 mb-8">
          <View
            style={[
              softCardShadow,
              {
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                borderRadius: 9999, // fully rounded pill
                paddingHorizontal: 20,
                height: 56,
              }
            ]}
          >
            <MaterialIcons name="search" size={24} color="#94A3B8" />

            <TextInput
              placeholder="Search users, stores, or emails..."
              placeholderTextColor="#94A3B8"
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 15,
                fontFamily: "Poppins-Regular",
                color: "#0F172A",
              }}
            />

            <TouchableOpacity style={{ padding: 4 }}>
              <MaterialIcons name="tune" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Manage Users Section */}
        <View className="px-6 mb-12">
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4, paddingVertical: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="person-outline" size={26} color="#FF6600" />
              <Text style={{ fontSize: 22, fontFamily: "Poppins-Bold", color: "#0F172A", marginLeft: 8 }}>Manage Users</Text>
            </View>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 13, fontFamily: "Poppins-Bold", color: "#FF6600", marginRight: 2 }}>VIEW ALL</Text>
              <MaterialIcons name="chevron-right" size={18} color="#FF6600" />
            </TouchableOpacity>
          </View>

          {/* Users List Container */}
          <View
            style={[
              softCardShadow,
              {
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                overflow: "hidden",
                marginTop: 0,
              }
            ]}
          >
            {mockUsers.map((user, index) => (
              <View
                key={user.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 20,
                  paddingHorizontal: 20,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: "#F1F5F9",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Image
                    source={{ uri: user.avatar }}
                    style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#F8FAFC" }}
                  />
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={{ fontSize: 16, fontFamily: "Poppins-Bold", color: "#0F172A", marginTop: 4 }}>{user.name}</Text>
                    <Text style={{ fontSize: 14, fontFamily: "Poppins-Regular", color: "#64748B", marginTop: -2 }}>{user.email}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: "#FEF2F2",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#EF4444", fontSize: 14, fontFamily: "Poppins-Medium" }}>Block</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Store Management Section */}
        <View className="px-6 mb-12">
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4, paddingVertical: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="storefront" size={26} color="#FF6600" />
              <Text style={{ fontSize: 22, fontFamily: "Poppins-Bold", color: "#0F172A", marginLeft: 8 }}>Store Management</Text>
            </View>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 13, fontFamily: "Poppins-Bold", color: "#FF6600", marginRight: 2 }}>VIEW ALL</Text>
              <MaterialIcons name="chevron-right" size={18} color="#FF6600" />
            </TouchableOpacity>
          </View>

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ paddingRight: 20 }}>
            {storeFilters.map((filter, index) => {
              const active = index === 0; // Hardcoded 'All Stores' as active for visual matching
              return (
                <TouchableOpacity
                  key={filter}
                  style={{
                    backgroundColor: active ? "#FF6600" : "#FFFFFF",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 9999,
                    marginRight: 10,
                    borderWidth: active ? 0 : 1,
                    borderColor: "#E2E8F0"
                  }}
                >
                  <Text style={{ fontSize: 13, fontFamily: "Poppins-Medium", color: active ? "#FFFFFF" : "#475569" }}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Store Cards */}
          <View style={{ gap: 16 }}>
            {mockStores.map((store) => (
              <View
                key={store.id}
                style={[
                  softCardShadow,
                  {
                    backgroundColor: "#FFFFFF",
                    borderRadius: 24,
                    padding: 20,
                  }
                ]}
              >
                {/* Top Row: Image, Info, Status */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <View style={{ flexDirection: "row", flex: 1 }}>
                    <Image
                      source={{ uri: store.image }}
                      style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: "#F1F5F9" }}
                    />
                    <View style={{ marginLeft: 16, flex: 1, justifyContent: "center" }}>
                      <Text style={{ fontSize: 16, fontFamily: "Poppins-Bold", color: "#0F172A" }}>{store.name}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                        <MaterialIcons name="place" size={14} color="#64748B" />
                        <Text style={{ fontSize: 13, fontFamily: "Poppins-Regular", color: "#64748B", marginLeft: 2 }}>{store.location}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Status Pill */}
                  <View
                    style={{
                      backgroundColor: store.status === "ACTIVE" ? "#DCFCE7" : "#FEF3C7",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: "Poppins-Bold",
                        color: store.status === "ACTIVE" ? "#16A34A" : "#B45309"
                      }}
                    >
                      {store.status}
                    </Text>
                  </View>
                </View>

                {/* Middle Row: Owner & Front Desk */}
                <View style={{ backgroundColor: "#F8FAFC", borderRadius: 16, padding: 16, flexDirection: "row", marginBottom: 20 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontFamily: "Poppins-Bold", color: "#94A3B8", letterSpacing: 1 }}>OWNER</Text>
                    <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: "#334155", marginTop: 4 }}>{store.owner}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontFamily: "Poppins-Bold", color: "#94A3B8", letterSpacing: 1 }}>FRONT DESK</Text>
                    <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: "#334155", marginTop: 4 }}>{store.staffCount}</Text>
                  </View>
                </View>

                {/* Bottom Row: Actions */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: "#F1F5F9",
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: "center"
                    }}
                  >
                    <Text style={{ fontSize: 14, fontFamily: "Poppins-Bold", color: "#475569" }}>{store.primaryAction}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      borderWidth: 1,
                      borderColor: store.status === "ACTIVE" ? "#FECACA" : "#FECACA",
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: "center"
                    }}
                  >
                    <Text style={{ fontSize: 14, fontFamily: "Poppins-Bold", color: "#EF4444" }}>{store.dangerAction}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
