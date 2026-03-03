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
  const [users, setUsers] = useState<User[]>(customers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const filteredData = useMemo(() => {
    return users.filter((c) => {
      const matchesRole = activeTab === "All" || c.role === activeTab;
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [activeTab, search, users]);

  const groupedUsers = useMemo(() => {
    const groups: Record<string, User[]> = {};
    filteredData.forEach((user) => {
      const firstLetter = user.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(user);
    });
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {} as Record<string, User[]>);
  }, [filteredData]);

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

  const getRoleBadgeStyle = (user: User) => {
    if (user.status === "Blocked")
      return { bg: "bg-red-50", text: "text-red-500", label: "Blocked" };

    switch (user.role) {
      case "Customer":
        return { bg: "bg-blue-50", text: "text-blue-500", label: "Customer" };
      case "Store Manager":
        return { bg: "bg-purple-50", text: "text-purple-500", label: "Store Manager" };
      case "Front Desk":
        return { bg: "bg-green-50", text: "text-green-500", label: "Front Desk" };
      default:
        return { bg: "bg-gray-50", text: "text-gray-500", label: user.role };
    }
  };

const renderCustomerCard = (c: User) => {
  const badge = getRoleBadgeStyle(c);

  return (
    <TouchableOpacity
      key={c.id}
      onPress={() => {
        setSelectedUser(c);
        setShowBlockModal(true);
      }}
    >
      <View className="flex-row items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-50 mb-2">

        {/* LEFT SIDE */}
        <View className="flex-row items-center gap-3 flex-1">
          <View className="w-10 h-10 rounded-full overflow-hidden bg-orange-50 items-center justify-center border border-orange-100">
            <Image source={{ uri: c.imageUri }} className="w-full h-full" />
          </View>

          <View className="flex-1">
            <Text className="text-[13px] font-poppins-bold text-slate-900">
              {c.name}
            </Text>

            <View className="flex-row items-center flex-wrap">
              <Text className="text-[12px] font-poppins text-slate-500">
                {c.email}
              </Text>

              <View className={`ml-2 px-2 py-0.5 rounded-md ${badge.bg}`}>
                <Text
                  className={`text-[9px] font-poppins-bold uppercase ${badge.text}`}
                >
                  {badge.label}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={22}
          color="#9a9591"
        />

      </View>
    </TouchableOpacity>
  );
};

  return (
    <SafeAreaView className="flex-1 bg-[#f8f6f6]" edges={["top", "left", "right"]}>
      {/* HEADER */}
      <View className="bg-primary px-6 pt-3 pb-6 rounded-b-[2rem] shadow-lg z-10">
        <View className="flex-row items-center mb-3 h-10">
          <TouchableOpacity onPress={() => router.back()} className="py-2 pr-2">
            <MaterialIcons name="chevron-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="text-white text-lg font-poppins-bold flex-1 text-center">
            Users
          </Text>

          <View className="w-8" />
        </View>

      {/* Search */}
      <View className="relative bg-slate-50 rounded-lg mb-3">
        <Text className="absolute left-3 top-1/2 -translate-y-1/2 text-[22px] text-[#FF6600] z-30">
          ⌕
        </Text>
        <TextInput
          className="w-full py-3 pl-10 pr-4 text-[11px] font-poppins text-slate-800"
          placeholder="Search by name or email..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={(text) => {
            setSearch(text);
          }}
        />
      </View>

        {/* TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(["All", "Customer", "Store Manager", "Front Desk"] as UserRole[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`h-8 px-4 rounded-full items-center justify-center mr-2 ${
                activeTab === tab ? "bg-white" : "bg-white/20"
              }`}
            >
              <Text
                className={`text-[11px] font-poppins-bold ${
                  activeTab === tab ? "text-primary" : "text-white"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* USER LIST */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
      >
        {Object.keys(groupedUsers).map((letter) => (
          <View key={letter} className="mb-4">
            <Text className="text-slate-400 text-[10px] font-poppins-bold uppercase mb-2 px-1">
              {letter}
            </Text>
            {groupedUsers[letter].map(renderCustomerCard)}
          </View>
        ))}
      </ScrollView>

      {/* ROLE-BASED BLOCK MODAL */}

      <Modal
        visible={showBlockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockModal(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="bg-white w-full rounded-[28px] p-6">

            {/* ICON */}
            <View className="w-16 h-16 bg-red-200 rounded-full items-center justify-center self-center mb-4">
              <MaterialIcons name="block" size={32} color="#dc2626" />
            </View>

            {/* TITLE */}
            <Text className="text-lg font-poppins-bold text-center mb-2">
              {selectedUser?.status === "Blocked"
                ? "Unblock User"
                : "Block User"}
            </Text>

            {/* DESCRIPTION */}
            <Text className="text-[12px] text-slate-500 text-center mb-6">
              Are you sure you want to{" "}
              {selectedUser?.status === "Blocked" ? "unblock" : "block"} this{" "}
              {selectedUser?.role.toLowerCase()}?
            </Text>

            {/* USER DETAILS */}
            {selectedUser && (
              <View className="bg-slate-50 rounded-2xl p-4 mb-4 w-full">

                {/* Basic Info */}
                <View className="items-center mb-4">
                  <Image
                    source={{ uri: selectedUser.imageUri }}
                    className="w-16 h-16 rounded-full mb-2"
                  />
                  <Text className="font-poppins-bold">
                    {selectedUser.name}
                  </Text>
                  <Text className="text-[11px] text-slate-500">
                    {selectedUser.email}
                  </Text>
                </View>

                {/* STORE MANAGER VIEW */}
                {selectedUser.role === "Store Manager" &&
                  selectedUser.stores?.length && (
                    <View>
                      <Text className="text-[10px] font-poppins-bold text-slate-400 uppercase mb-2">
                        Stores Managed
                      </Text>
                      {selectedUser.stores.map((store, i) => (
                        <View
                          key={i}
                          className="mb-2 px-3 py-2 bg-white rounded-lg border border-orange-400"
                        >
                          <Text className="text-[12px]">
                            {store}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                {/* FRONT DESK VIEW */}
                {selectedUser.role === "Front Desk" &&
                  selectedUser.stores?.length && (
                    <View>
                      <Text className="text-[10px] font-poppins-bold text-slate-400 uppercase mb-2">
                        Store Belonged
                      </Text>

                      <View className="w-full bg-orange-400 rounded-xl px-4 py-3 flex-row items-center justify-between">
                        <Text className="text-white font-bold text-[12px]">
                          {selectedUser.stores[0]}
                        </Text>
                        <MaterialIcons
                          name="chevron-right"
                          size={20}
                          color="white"
                        />
                      </View>
                    </View>
                  )}

                {/* CUSTOMER VIEW */}
                {selectedUser.role === "Customer" && (
                  <View className="items-center">
                    <Text className="text-[11px] text-slate-400">
                      This user is a customer.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* BUTTONS */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 bg-slate-100 rounded-xl"
                onPress={() => setShowBlockModal(false)}
              >
                <Text className="text-center font-poppins-bold text-slate-600">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 bg-red-500 rounded-xl"
                onPress={
                  selectedUser?.status === "Blocked"
                    ? handleUnblockUser
                    : handleBlockUser
                }
              >
                <Text className="text-center font-poppins-bold text-white">
                  {selectedUser?.status === "Blocked"
                    ? "Unblock"
                    : "Block User"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}