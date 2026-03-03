import React, { useState, useMemo } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
} from "@/tw";
import { Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

type UserRole = "All" | "Customer" | "Store Manager" | "Front Desk";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  imageUri: string;
  section: "recent" | "all";
  status: "Active" | "Blocked";
  stores?: string[];
};

const customers: User[] = Array.from({ length: 30 }, (_, i) => {
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

  const roles: UserRole[] = ["Customer", "Store Manager", "Front Desk"];
  const role = roles[i % 3];
  const name = names[i];
  const email = name.toLowerCase().replace(" ", ".") + "@example.com";

  const stores =
    role === "Store Manager"
      ? ["Downtown Cafe", "Eastside Hub"]
      : role === "Front Desk"
      ? ["Central Plaza"]
      : undefined;

  return {
    id: `u${i + 1}`,
    name,
    email,
    role,
    imageUri: `https://api.dicebear.com/7.x/avataaars/png?seed=${name}`,
    section: i < 5 ? "recent" : "all",
    status: "Active",
    stores,
  };
});

export default function CustomersScreen() {
  const [activeTab, setActiveTab] = useState<UserRole>("All");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<User[]>(customers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const itemsPerPage = 15;

  const filteredData = useMemo(() => {
    return users.filter((c) => {
      const matchesRole = activeTab === "All" || c.role === activeTab;
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [activeTab, search, users]);

  const recentCustomers =
    search === "" ? filteredData.filter((c) => c.section === "recent") : [];

  const allCustomersFull =
    search === ""
      ? filteredData.filter((c) => c.section === "all")
      : filteredData;

  const displayedAllCustomers = allCustomersFull.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleBlockUser = () => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, status: "Blocked" } : u
      )
    );
    setShowBlockModal(false);
  };

  const handleUnblockUser = () => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, status: "Active" } : u
      )
    );
    setShowBlockModal(false);
  };

  const renderCustomerCard = (c: User) => (
    <TouchableOpacity
      key={c.id}
      activeOpacity={0.85}
      onPress={() => {
        setSelectedUser(c);
        setShowBlockModal(true);
      }}
    >
      <View className="flex-row items-center justify-between bg-white px-4 py-4 rounded-2xl shadow-sm border border-slate-100 mb-3">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
            <Image source={{ uri: c.imageUri }} className="w-full h-full" />
          </View>

          <View className="ml-4 flex-1">
            <Text className="text-[15px] font-poppins-bold text-slate-900">
              {c.name}
            </Text>
            <Text className="text-[12px] font-poppins text-slate-500 mt-0.5">
              {c.email}
            </Text>

            <View className="mt-2">
              <View
                className={`px-3 py-1 rounded-full self-start ${
                  c.status === "Blocked"
                    ? "bg-red-50"
                    : c.role === "Customer"
                    ? "bg-blue-50"
                    : c.role === "Store Manager"
                    ? "bg-purple-50"
                    : "bg-emerald-50"
                }`}
              >
                <Text
                  className={`text-[10px] font-poppins-bold uppercase tracking-wide ${
                    c.status === "Blocked"
                      ? "text-red-600"
                      : c.role === "Customer"
                      ? "text-blue-600"
                      : c.role === "Store Manager"
                      ? "text-purple-600"
                      : "text-emerald-600"
                  }`}
                >
                  {c.status === "Blocked" ? "Blocked" : c.role}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      
      {/* Unified Header */}
      <View className="bg-primary px-6 pt-4 pb-10 rounded-b-[2.5rem] shadow-xl">
        
        {/* Top Row */}
        <View className="flex-row items-center h-10 mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="flex-1 text-center text-white text-xl font-poppins-bold">
            User Management
          </Text>

          <View className="w-6" />
        </View>

        {/* Search */}
        <View className="bg-white/95 rounded-2xl px-4 py-3 shadow-md border border-white/30">
          <View className="flex-row items-center">
            <MaterialIcons name="search" size={20} color="#94A3B8" />
            <TextInput
              className="flex-1 ml-3 text-[14px] font-poppins text-slate-800"
              placeholder="Search by name or email..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                setCurrentPage(1);
              }}
            />
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-6"
        >
          {(["All", "Customer", "Store Manager", "Front Desk"] as UserRole[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.85}
              onPress={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-5 py-2.5 rounded-full mr-3 border ${
                activeTab === tab
                  ? "bg-white border-white"
                  : "bg-white/20 border-white/30"
              }`}
            >
              <Text
                className={`text-[12px] font-poppins-bold ${
                  activeTab === tab
                    ? "text-primary"
                    : "text-white"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4 mt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {recentCustomers.length > 0 && search === "" && (
          <View className="mb-8">
            <Text className="text-[11px] text-slate-400 font-poppins-bold uppercase tracking-widest mb-3 px-1">
              Recent Users
            </Text>
            {recentCustomers.map(renderCustomerCard)}
          </View>
        )}

        <View className="mb-8">
          <Text className="text-[11px] text-slate-400 font-poppins-bold uppercase tracking-widest mb-3 px-1">
            All Users
          </Text>
          {displayedAllCustomers.map(renderCustomerCard)}
        </View>
      </ScrollView>

      {/* Dynamic Block / Unblock Modal */}
      <Modal
        visible={showBlockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockModal(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white w-full rounded-[28px] p-6">
            {/* Icon */}
            <View
              className={`w-16 h-16 rounded-full items-center justify-center self-center mb-4 ${
                selectedUser?.status === "Blocked" ? "bg-blue-100" : "bg-red-100"
              }`}
            >
              <MaterialIcons
                name={selectedUser?.status === "Blocked" ? "lock-open" : "block"}
                size={32}
                color={selectedUser?.status === "Blocked" ? "#007AFF" : "#dc2626"}
              />
            </View>

            <Text className="text-lg font-poppins-bold text-center mb-2">
              {selectedUser?.status === "Blocked" ? "Unblock User" : "Block User"}
            </Text>
            <Text className="text-[12px] text-slate-500 text-center mb-6">
              {selectedUser?.status === "Blocked"
                ? "Are you sure you want to unblock this user? They will regain access to the application."
                : selectedUser?.role === "Customer"
                ? "Are you sure you want to block this user? They will no longer be able to access the application."
                : selectedUser?.role === "Store Manager"
                ? "Confirming this will restrict user access."
                : "Are you sure you want to block this staff member?"}
            </Text>

            {selectedUser && (
              <View className="bg-slate-50 rounded-2xl p-4 mb-6 items-center w-full">
                <Image
                  source={{ uri: selectedUser.imageUri }}
                  className="w-16 h-16 rounded-full mb-2"
                />
                <Text className="font-poppins-bold">{selectedUser.name}</Text>
                <Text className="text-[11px] text-slate-500">{selectedUser.email}</Text>
                <Text className="text-[10px] uppercase font-bold text-orange-500 mt-1">
                  {selectedUser.role}
                </Text>

                {selectedUser.role === "Store Manager" && selectedUser.stores && (
                  <View className="w-full mt-4">
                    <Text className="text-[10px] text-slate-400 font-bold uppercase mb-2 text-center">
                      Stores Managed
                    </Text>
                    {selectedUser.stores.map((store) => (
                      <View
                        key={store}
                        className="border border-orange-200 bg-white rounded-lg p-3 mb-2 flex-row justify-between items-center"
                      >
                        <Text className="text-xs font-medium text-slate-700">{store}</Text>
                        <MaterialIcons name="open-in-new" size={14} color="#f97316" />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 bg-slate-100 rounded-xl"
                onPress={() => setShowBlockModal(false)}
              >
                <Text className="text-center font-poppins-bold text-slate-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl ${
                  selectedUser?.status === "Blocked" ? "bg-orange-500" : "bg-primary"
                }`}
                onPress={
                  selectedUser?.status === "Blocked"
                    ? handleUnblockUser
                    : handleBlockUser
                }
              >
                <Text className="text-center font-poppins-bold text-white">
                  {selectedUser?.status === "Blocked" ? "Unblock" : "Block"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}