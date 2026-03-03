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
  const stores = role === "Store Manager" ? ["Downtown Cafe", "Eastside Hub"] : role === "Front Desk" ? ["Central Plaza"] : undefined;

  return { id: `u${i + 1}`, name, email, role, imageUri: `https://api.dicebear.com/7.x/avataaars/png?seed=${name}`, section: i < 5 ? "recent" : "all", status: "Active", stores };
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
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [activeTab, search, users]);

  const recentCustomers = search === "" ? filteredData.filter((c) => c.section === "recent") : [];
  const allCustomersFull = search === "" ? filteredData.filter((c) => c.section === "all") : filteredData;
  const totalPages = Math.max(1, Math.ceil(allCustomersFull.length / itemsPerPage));
  const displayedAllCustomers = allCustomersFull.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleBlockUser = () => {
    if (!selectedUser) return;
    setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, status: "Blocked" } : u));
    setShowBlockModal(false);
  };

  const renderCustomerCard = (c: User) => (
    <TouchableOpacity key={c.id} onPress={() => { setSelectedUser(c); setShowBlockModal(true); }}>
      <View className="flex-row items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-50 mb-2">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full overflow-hidden bg-orange-50 items-center justify-center border border-orange-100">
            <Image source={{ uri: c.imageUri }} className="w-full h-full" />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-poppins-bold text-slate-900">{c.name}</Text>
            <View className="flex-row items-center flex-wrap">
              <Text className="text-[12px] font-poppins text-slate-500">{c.email}</Text>
              <View className={`ml-2 px-2 py-0.5 rounded-md ${c.status === "Blocked" ? "bg-red-50" : c.role === "Customer" ? "bg-blue-50" : c.role === "Store Manager" ? "bg-purple-50" : "bg-green-50"}`}>
                <Text className={`text-[9px] font-poppins-bold uppercase ${c.status === "Blocked" ? "text-red-500" : c.role === "Customer" ? "text-blue-500" : c.role === "Store Manager" ? "text-purple-500" : "text-green-500"}`}>
                  {c.status === "Blocked" ? "Blocked" : c.role}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f8f6f6]" edges={["top", "left", "right"]}>
      <View className="bg-primary px-6 pt-2 pb-12 rounded-b-[2rem] shadow-lg z-10">
        <View className="flex-row items-center mb-4 h-10">
          <TouchableOpacity onPress={() => router.back()} className="py-2 pr-2">
            <MaterialIcons name="chevron-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-poppins-bold tracking-tight flex-1 text-center">Users</Text>
          <View className="w-8" />
        </View>
        <View className="relative bg-slate-50 rounded-lg">
          <Text className="absolute left-3 top-2.5 text-[12px] z-30">🔍</Text>
          <TextInput
            className="w-full py-2 pl-9 pr-4 text-[12px] font-poppins text-slate-800"
            placeholder="Search by name or email..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={(text) => { setSearch(text); setCurrentPage(1); }}
          />
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-white rounded-2xl shadow-sm p-3 -mt-6 mx-4 mb-3 z-20 border border-slate-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {(["All", "Customer", "Store Manager", "Front Desk"] as UserRole[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => { setActiveTab(tab); setCurrentPage(1); }}
              className={`h-8 px-4 rounded-full items-center justify-center mr-2 ${activeTab === tab ? "bg-primary" : "bg-slate-100"}`}
            >
              <Text className={`text-[11px] font-poppins-bold ${activeTab === tab ? "text-white" : "text-slate-500"}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {recentCustomers.length > 0 && search === "" && (
          <View className="mb-4">
            <Text className="text-slate-400 text-[10px] font-poppins-bold uppercase tracking-widest mb-2 px-1">Recent</Text>
            {recentCustomers.map(renderCustomerCard)}
          </View>
        )}
        <View className="mb-4">
            <Text className="text-slate-400 text-[10px] font-poppins-bold uppercase tracking-widest mb-2 px-1">Users</Text>
            {displayedAllCustomers.map(renderCustomerCard)}
        </View>
      </ScrollView>

      {/* ROLE-AWARE BLOCK MODAL */}
      <Modal visible={showBlockModal} transparent animationType="fade" onRequestClose={() => setShowBlockModal(false)}>
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white w-full rounded-[28px] p-6">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center self-center mb-4">
              <MaterialIcons name="block" size={32} color="#dc2626" />
            </View>

            <Text className="text-lg font-poppins-bold text-center mb-2">Block User</Text>
            <Text className="text-[12px] text-slate-500 text-center mb-6">
              {selectedUser?.role === "Customer" 
                ? "Are you sure you want to block this user? They will no longer be able to access the application." 
                : selectedUser?.role === "Store Manager" 
                ? "Confirming this will restrict user access." 
                : "Are you sure you want to block this staff member?"}
            </Text>

            {selectedUser && (
              <View className="bg-slate-50 rounded-2xl p-4 mb-6 items-center w-full">
                <Image source={{ uri: selectedUser.imageUri }} className="w-16 h-16 rounded-full mb-2" />
                <Text className="font-poppins-bold">{selectedUser.name}</Text>
                <Text className="text-[11px] text-slate-500">{selectedUser.email}</Text>
                <Text className="text-[10px] uppercase font-bold text-orange-500 mt-1">{selectedUser.role}</Text>

                {/* ROLE-SPECIFIC VIEWS */}
                {selectedUser.role === "Store Manager" && selectedUser.stores && (
                  <View className="w-full mt-4">
                    <Text className="text-[10px] text-slate-400 font-bold uppercase mb-2 text-center">Stores Managed</Text>
                    {selectedUser.stores.map((store) => (
                      <View key={store} className="border border-orange-200 bg-white rounded-lg p-3 mb-2 flex-row justify-between items-center">
                        <Text className="text-xs font-medium text-slate-700">{store}</Text>
                        <MaterialIcons name="open-in-new" size={14} color="#f97316" />
                      </View>
                    ))}
                  </View>
                )}

                {selectedUser.role === "Front Desk" && selectedUser.stores && (
                  <View className="w-full mt-4">
                    <Text className="text-[10px] text-slate-400 font-bold uppercase mb-2 text-center">Store Belonged</Text>
                    <View className="bg-orange-500 rounded-lg p-4 flex-row justify-between items-center">
                      <View className="flex-row items-center gap-2">
                        <MaterialIcons name="store" size={18} color="white" />
                        <Text className="text-xs font-bold text-white">{selectedUser.stores[0]}</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color="white" />
                    </View>
                  </View>
                )}
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 py-3 bg-slate-100 rounded-xl" onPress={() => setShowBlockModal(false)}>
                <Text className="text-center font-poppins-bold text-slate-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 py-3 bg-primary rounded-xl" onPress={handleBlockUser}>
                <Text className="text-center font-poppins-bold text-white">Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}