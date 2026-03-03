import React, { useState } from "react";
import { Image, Modal, ScrollView } from "react-native";
import { SafeAreaView, Text, TouchableOpacity, View } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

export default function SuperAdminHome() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const softCardShadow = {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  };

  const mockUsers = Array.from({ length: 30 }, (_, i) => {
    const names = [
      "Alex Morgan","Sarah Jenkins","Michael Chen","Emma Watson",
      "Daniel Cruz","Sophia Lee","James Carter","Olivia Brown",
      "Liam Garcia","Isabella Martinez","Noah Anderson",
      "Mia Thompson","Lucas White","Charlotte Hall",
      "Ethan Young","Amelia King","Logan Wright",
      "Harper Scott","Elijah Green","Evelyn Adams",
      "Mason Baker","Abigail Nelson","Jacob Hill",
      "Emily Rivera","William Torres","Ella Roberts",
      "Benjamin Flores","Avery Mitchell","Henry Perez","Scarlett Cox"
    ];
    const name = names[i];
    const email = name.toLowerCase().replace(" ", ".") + "@example.com";

    return {
      id: `u${i + 1}`,
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${name}`,
      section: i < 20 ? "recent" : "all",
    };
  });

  const [recentUsers, setRecentUsers] = useState(mockUsers.filter(u => u.section === "recent"));
  const storeFilters = ["All Stores", "Active", "Deactivated"];

  // USER-STATIC
  const mockStores = [
    {
      id: "s1",
      name: "The Coffee Foundry",
      location: "Brooklyn, NY",
      owner: "David Miller",
      staffCount: "4 Staff",
      image:
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&auto=format&fit=crop&q=60",
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
      image:
        "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=300&auto=format&fit=crop&q=60",
      status: "PENDING",
      primaryAction: "Approve",
      dangerAction: "Reject",
    },
  ];

  const iconColorMap = {
    registration: "#3B82F6",
    action: "#FF6600",
    alert: "#EF4444",
    default: "#64748B"
  };
  // NOTIFICATIONS-STATIC
  const notifications = [
    { id: "n1", title: "New Registration", message: "Alex Morgan registered The Coffee Foundry", time: "2m ago", type: "registration", icon: "person-add", unread: true },
    { id: "n2", title: "Action Required", message: "Brew & Bean Co. is waiting for your review", time: "1h ago", type: "action", icon: "warning", unread: true },
    { id: "n3", title: "System Alert", message: "New security patches have been applied", time: "5h ago", type: "alert", icon: "info", unread: false },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top", "left", "right"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="bg-primary rounded-b-[30px] px-6 pt-2 pb-16 overflow-hidden">
          <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <View className="flex-row items-center justify-between mt-2">
            <View className="w-8 h-8" />
            <Text className="text-white text-base font-poppins-bold">Super Admin</Text>
            <TouchableOpacity 
              className="w-9 h-9 rounded-full bg-white/15 items-center justify-center relative"
              onPress={() => setShowNotifications(true)}
            >
              <MaterialIcons name="notifications-none" size={18} color="#FFFFFF" />
              <View className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-danger border border-primary" />
            </TouchableOpacity>
          </View>
          <View className="mt-6 mb-2">
            <Text className="text-white text-2xl font-poppins-bold">Dashboard</Text>
            <Text className="text-[11px] text-white/80 font-poppins uppercase tracking-wider">
              Welcome back, Admin
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="px-6 -mt-10 mb-6">
          <View style={{ flexDirection: "row", gap: 12 }}>

            <View style={[softCardShadow, { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 20, paddingVertical: 18, alignItems: "center" }]}>
              <MaterialIcons name="groups" size={20} color="#3B82F6" />
              <Text className="text-[22px] font-poppins-bold text-slate-900 mt-2">{mockUsers.length}</Text>
              <Text className="text-[9px] font-poppins-bold text-slate-400">TOTAL USERS</Text>
            </View>

            <View style={[softCardShadow, { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 20, paddingVertical: 18, alignItems: "center" }]}>
              <MaterialIcons name="storefront" size={20} color="#22C55E" />
              <Text className="text-[22px] font-poppins-bold text-slate-900 mt-2">{mockStores.length}</Text>
              <Text className="text-[9px] font-poppins-bold text-slate-400">TOTAL STORES</Text>
            </View>

            <View style={[softCardShadow, { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 20, paddingVertical: 18, alignItems: "center" }]}>
              <MaterialIcons name="storefront" size={20} color="#16A34A" />
              <Text className="text-[22px] font-poppins-bold text-slate-900 mt-2">{mockStores.filter(store => store.status === "ACTIVE").length}</Text>
              <Text className="text-[9px] font-poppins-bold text-slate-400">ACTIVE STORES</Text>
            </View>
          </View>
        </View>

        {/* Notification Modal */}
        <Modal visible={showNotifications} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: 32, maxHeight: "65%" }}>
              <View style={{ width: 36, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 20 }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#0F172A" }}>Notifications</Text>
                  <View style={{ backgroundColor: "#FF6600", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>
                      {notifications.filter(n => n.unread).length}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowNotifications(false)} style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                <Text style={{ fontSize: 11, color: "#FF6600", fontWeight: "600" }}>Mark all as read</Text>
              </TouchableOpacity>
              <ScrollView showsVerticalScrollIndicator={false}>
                {notifications.map((n, index) => (
                  <View key={n.id}>
                    {index !== 0 && <View style={{ height: 1, backgroundColor: "#F1F5F9", marginHorizontal: 24 }} />}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 24,
                        paddingVertical: 14,
                        backgroundColor: n.unread ? "#FAFAFA" : "#FFFFFF",
                      }}
                    >
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          backgroundColor: (iconColorMap[n.type] || iconColorMap.default) + "15",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 14,
                          flexShrink: 0,
                        }}
                      >
                        <MaterialIcons name={n.icon || "notifications-none"} size={18} color={iconColorMap[n.type] || iconColorMap.default} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#1E293B", marginBottom: 2 }}>
                          {n.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#64748B", lineHeight: 17 }}>
                          {n.message}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end", marginLeft: 10, gap: 6 }}>
                        <Text style={{ fontSize: 10, color: "#94A3B8" }}>{n.time}</Text>
                        {n.unread && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#FF6600" }} />}
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
        <Modal visible={showBlockModal} animationType="fade" transparent>
          <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "center", alignItems: "center" }}>
            <View style={{ backgroundColor: "#FFF", borderRadius: 20, padding: 24, width: "80%", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>Block User</Text>
              <Text style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginBottom: 24 }}>
                Are you sure you want to block{" "}
                <Text style={{ fontWeight: "700", color: "#EF4444" }}>{selectedUser?.name}</Text>
                ?
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center" }}
                  onPress={() => setShowBlockModal(false)}
                >
                  <Text style={{ color: "#64748B", fontWeight: "600" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#EF4444", alignItems: "center" }}
                  onPress={() => {
                    setShowBlockModal(false);
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "600" }}>Block</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Manage Users */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-poppins-bold text-slate-900">Manage Users</Text>
            <TouchableOpacity className="flex-row items-center" onPress={() => router.push("/(super_admin)/users")}>
              <Text className="text-[11px] font-poppins-bold text-primary mr-1">VIEW ALL</Text>
              <MaterialIcons name="chevron-right" size={14} color="#FF6600" />
            </TouchableOpacity>
          </View>

          <View style={[softCardShadow, { backgroundColor: "#FFFFFF", borderRadius: 20, overflow: "hidden", maxHeight: 300 }]}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {recentUsers.map((user, index) => (
                <View key={user.id} style={{ flexDirection: "row", alignItems: "center", padding: 14, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: "#F1F5F9" }}>
                  <Image source={{ uri: user.avatar }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#F1F5F9" }} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text className="text-[14px] font-poppins-bold text-slate-800">{user.name}</Text>
                    <Text className="text-[12px] font-poppins text-slate-500">{user.email}</Text>
                  </View>
                  <TouchableOpacity
                    className="bg-red-50 px-3 py-1.5 rounded-lg"
                    onPress={() => {
                      setSelectedUser(user);
                      setShowBlockModal(true);
                    }}
                  >
                    <Text className="text-red-500 text-[11px] font-poppins-bold">Block</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Store Management */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-poppins-bold text-slate-900">Store Management</Text>
            <TouchableOpacity onPress={() => router.push("/(super_admin)/stores")}>
              <Text className="text-[11px] font-poppins-bold text-primary">VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {storeFilters.map((filter, index) => (
              <TouchableOpacity key={filter} className={`px-4 py-2 rounded-full mr-2 border ${index === 0 ? "bg-primary border-primary" : "bg-white border-slate-200"}`}>
                <Text className={`text-[12px] font-poppins-medium ${index === 0 ? "text-white" : "text-slate-600"}`}>{filter}</Text>
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
                      <Text className="text-[14px] font-poppins-bold text-slate-800">{store.name}</Text>
                      <Text className="text-[11px] font-poppins text-slate-500">{store.location}</Text>
                    </View>
                  </View>
                  <View className={`px-2 py-1 rounded-md ${store.status === "ACTIVE" ? "bg-green-50" : "bg-amber-50"}`}>
                    <Text className={`text-[9px] font-poppins-bold ${store.status === "ACTIVE" ? "text-green-600" : "text-amber-600"}`}>{store.status}</Text>
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