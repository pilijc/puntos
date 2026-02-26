import React from "react";
import { TextInput, Image } from "react-native";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router"; // ✅ Changed to Expo Router

export default function SuperAdminHome() {
  const router = useRouter(); // ✅ Initialize router

  const softCardShadow = {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
      staffCount: "4 Staff",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&auto=format&fit=crop&q=60",
      status: "ACTIVE",
      primaryAction: "Edit",
      dangerAction: "Deactivate",
    },
    {
      id: "s2",
      name: "Brew & Bean Co.",
      location: "Seattle, WA",
      owner: "Jessica Wong",
      staffCount: "2 Staff",
      image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=300&auto=format&fit=crop&q=60",
      status: "PENDING",
      primaryAction: "Approve",
      dangerAction: "Reject",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="bg-primary rounded-b-[30px] px-6 pt-2 pb-16 overflow-hidden">
          <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          
          <View className="flex-row items-center justify-between mt-2">
            <View className="w-8 h-8" />
            <Text className="text-white text-base font-poppins-bold">Super Admin</Text>
            <TouchableOpacity className="w-9 h-9 rounded-full bg-white/15 items-center justify-center relative">
              <MaterialIcons name="notifications-none" size={18} color="#FFFFFF" />
              <View className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-danger border border-primary" />
            </TouchableOpacity>
          </View>

          <View className="mt-6 mb-2">
            <Text className="text-white text-2xl font-poppins-bold">Dashboard</Text>
            <Text className="text-[11px] text-white/80 font-poppins uppercase tracking-wider">Welcome back, Admin</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="px-6 -mt-10 mb-6">
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={[softCardShadow, { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 20, paddingVertical: 18, alignItems: "center" }]}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <MaterialIcons name="groups" size={20} color="#3B82F6" />
              </View>
              <Text style={{ fontSize: 22, fontFamily: "Poppins-Bold", color: "#0F172A" }}>12,451</Text>
              <Text style={{ fontSize: 9, fontFamily: "Poppins-Bold", color: "#94A3B8", letterSpacing: 0.5 }}>TOTAL USERS</Text>
            </View>

            <View style={[softCardShadow, { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 20, paddingVertical: 18, alignItems: "center" }]}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <MaterialIcons name="storefront" size={20} color="#22C55E" />
              </View>
              <Text style={{ fontSize: 22, fontFamily: "Poppins-Bold", color: "#0F172A" }}>84</Text>
              <Text style={{ fontSize: 9, fontFamily: "Poppins-Bold", color: "#94A3B8", letterSpacing: 0.5 }}>ACTIVE STORES</Text>
            </View>
          </View>
        </View>

        {/* Manage Users */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-poppins-bold text-slate-900">Manage Users</Text>

            {/* ✅ ONLY THIS WAS UPDATED */}
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => router.push("/(super_admin)/users")}
            >
              <Text className="text-[11px] font-poppins-bold text-primary mr-1">VIEW ALL</Text>
              <MaterialIcons name="chevron-right" size={14} color="#FF6600" />
            </TouchableOpacity>
          </View>

          <View style={[softCardShadow, { backgroundColor: "#FFFFFF", borderRadius: 20, overflow: "hidden" }]}>
            {mockUsers.map((user, index) => (
              <View key={user.id} style={{ flexDirection: "row", alignItems: "center", padding: 14, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: "#F8FAFC" }}>
                <Image source={{ uri: user.avatar }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#F1F5F9" }} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontSize: 14, fontFamily: "Poppins-Bold", color: "#1E293B" }}>{user.name}</Text>
                  <Text style={{ fontSize: 12, fontFamily: "Poppins-Regular", color: "#64748B", marginTop: -2 }}>{user.email}</Text>
                </View>
                <TouchableOpacity className="bg-red-50 px-3 py-1.5 rounded-lg">
                  <Text className="text-red-500 text-[11px] font-poppins-bold">Block</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Store Management */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-poppins-bold text-slate-900 mb-4">Store Management</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ paddingRight: 20 }}>
            {storeFilters.map((filter, index) => (
              <TouchableOpacity
                key={filter}
                className={`px-4 py-2 rounded-full mr-2 border ${index === 0 ? 'bg-primary border-primary' : 'bg-white border-slate-200'}`}
              >
                <Text className={`text-[12px] font-poppins-medium ${index === 0 ? 'text-white' : 'text-slate-600'}`}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ gap: 12 }}>
            {mockStores.map((store) => (
              <View key={store.id} style={[softCardShadow, { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16 }]}>
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row flex-1">
                    <Image source={{ uri: store.image }} style={{ width: 50, height: 50, borderRadius: 12 }} />
                    <View className="ml-3 flex-1 justify-center">
                      <Text style={{ fontSize: 14, fontFamily: "Poppins-Bold", color: "#1E293B" }}>{store.name}</Text>
                      <Text style={{ fontSize: 11, fontFamily: "Poppins-Regular", color: "#64748B" }}>{store.location}</Text>
                    </View>
                  </View>
                  <View className={`px-2 py-1 rounded-md ${store.status === 'ACTIVE' ? 'bg-green-50' : 'bg-amber-50'}`}>
                    <Text className={`text-[9px] font-poppins-bold ${store.status === 'ACTIVE' ? 'text-green-600' : 'text-amber-600'}`}>{store.status}</Text>
                  </View>
                </View>

                <View className="flex-row bg-slate-50 rounded-xl p-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-[8px] font-poppins-bold text-slate-400 uppercase tracking-tighter">Owner</Text>
                    <Text className="text-[12px] font-poppins-medium text-slate-700">{store.owner}</Text>
                  </View>
                  <View className="flex-1 border-l border-slate-200 pl-3">
                    <Text className="text-[8px] font-poppins-bold text-slate-400 uppercase tracking-tighter">Team</Text>
                    <Text className="text-[12px] font-poppins-medium text-slate-700">{store.staffCount}</Text>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity className="flex-1 bg-slate-100 py-2.5 rounded-lg items-center">
                    <Text className="text-[12px] font-poppins-bold text-slate-600">{store.primaryAction}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 border border-red-100 py-2.5 rounded-lg items-center">
                    <Text className="text-[12px] font-poppins-bold text-red-500">{store.dangerAction}</Text>
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