import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView, Text, View, TouchableOpacity } from "@/tw";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { supabase } from "@/supabase/supabase";

// ────────────────── Configuration ──────────────────
const BUCKET_URL = "https://gtxlhnmpvsrvryeisbqa.supabase.co/storage/v1/object/public/puntos-public/profile-pictures";

type UserRole = "All" | "User" | "Manager" | "Staff";

const ROLE_CONFIG: Record<string, { bg: string; text: string; dot: string; icon: string }> = {
  User:    { bg: "bg-sky-50",     text: "text-sky-600",     dot: "bg-sky-400",     icon: "person"          },
  Manager: { bg: "bg-violet-50",  text: "text-violet-600",  dot: "bg-violet-400",  icon: "manage-accounts" },
  Staff:   { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400", icon: "badge"           },
  Blocked: { bg: "bg-red-50",     text: "text-red-500",     dot: "bg-red-400",     icon: "block"           },
};

const TAB_COUNTS_LABEL: Record<UserRole, string> = {
  All: "All",
  User: "Users",
  Manager: "Managers",
  Staff: "Staff",
};

export default function UsersScreen() {
  const [activeTab, setActiveTab] = useState<UserRole>("All");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // ────────────────── Data Fetching ──────────────────
  const fetchUsers = useCallback(async () => {
    try {
      // Note: Using 'users_with_email' view as per your implementation
      const { data, error } = await supabase
        .from("users_with_email")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      const processed = (data || []).map((u) => {
        const roleName = u.role_type === "manager" ? "Manager" : u.role_type === "front_desk" ? "Staff" : "User";
        
        return {
          ...u,
          name: u.name || "Unknown User",
          email: u.email || "No Email",
          imageUri: u.avatar_url 
            ? (u.avatar_url.startsWith("http") ? u.avatar_url : `${BUCKET_URL}/${u.avatar_url}`)
            : `https://api.dicebear.com/7.x/avataaars/png?seed=${u.id}`,
          role: roleName,
          status: u.role === 0 ? "Blocked" : "Active",
          stores: u.role_type === "manager" ? ["Primary Store"] : u.role_type === "front_desk" ? ["Assigned Branch"] : [],
        };
      });
      setUsers(processed);
    } catch (error: any) {
      console.error("Fetch Users Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // ────────────────── Block / Unblock ──────────────────
  const handleToggleBlock = useCallback(async () => {
    if (!selectedUser) return;

    const isCurrentlyBlocked = selectedUser.status === "Blocked";
    const newRoleValue = isCurrentlyBlocked ? 1 : 0; // 0=Blocked, 1=Active
    const newStatus = isCurrentlyBlocked ? "Active" : "Blocked";

    setUpdatingUserId(selectedUser.id);

    // Optimistic UI Update
    const previousUsers = [...users];
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? { ...u, status: newStatus } : u))
    );

    try {
      // IMPORTANT: Updating the base 'users' table, not the view
      const { error } = await supabase
        .from("users")
        .update({ role: newRoleValue })
        .eq("id", selectedUser.id);

      if (error) throw error;

      setShowBlockModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      setUsers(previousUsers); // Rollback
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdatingUserId(null);
    }
  }, [selectedUser, users]);

  // ────────────────── Memoized Filters ──────────────────
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { All: users.length };
    users.forEach((u) => { counts[u.role] = (counts[u.role] || 0) + 1; });
    return counts;
  }, [users]);

  const filteredData = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = activeTab === "All" || u.role === activeTab;
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                           u.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [activeTab, search, users]);

  const groupedUsers = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredData.forEach((user) => {
      const firstLetter = user.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(user);
    });
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredData]);

  // ────────────────── UI Components ──────────────────
  const renderCustomerCard = (c: any) => {
    const isBlocked = c.status === "Blocked";
    const badge = isBlocked ? ROLE_CONFIG["Blocked"] : (ROLE_CONFIG[c.role] || ROLE_CONFIG["User"]);

    return (
      <TouchableOpacity
        key={c.id}
        onPress={() => { setSelectedUser(c); setShowBlockModal(true); }}
        className={`flex-row items-center bg-white rounded-2xl px-4 py-3 mb-3 border ${isBlocked ? 'border-red-100' : 'border-slate-50'}`}
        style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
      >
        <Image source={{ uri: c.imageUri }} className="w-12 h-12 rounded-full border border-slate-200" />
        <View className="flex-1 ml-3">
          <Text className={`text-[14px] font-poppins-bold ${isBlocked ? 'text-slate-400' : 'text-slate-800'}`}>{c.name}</Text>
          <Text className="text-[11px] font-poppins text-slate-400">{c.email}</Text>
        </View>
        <View className={`px-2 py-1 rounded-lg ${badge.bg}`}>
          <Text className={`text-[9px] font-poppins-bold uppercase ${badge.text}`}>
            {isBlocked ? "Blocked" : c.role}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f7f7fa]">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  const willBlock = selectedUser?.status !== "Blocked";

  return (
    <SafeAreaView className="flex-1 bg-[#f7f7fa]" edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="px-5 pt-4">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-2xl font-poppins-bold text-slate-900">Users</Text>
            <Text className="text-xs font-poppins text-slate-400">{users.length} total members</Text>
          </View>
          <TouchableOpacity className="p-2 bg-white rounded-xl border border-slate-100">
            <Feather name="sliders" size={18} color="#f97316" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-slate-100 rounded-xl px-3 mb-4 h-11">
          <Feather name="search" size={16} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-2 text-sm font-poppins"
            placeholder="Search users..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {Object.keys(TAB_COUNTS_LABEL).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as UserRole)}
              className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${activeTab === tab ? "bg-orange-500" : "bg-white border border-slate-100"}`}
            >
              <Text className={`text-xs font-poppins-bold ${activeTab === tab ? "text-white" : "text-slate-500"}`}>
                {TAB_COUNTS_LABEL[tab as UserRole]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView 
        className="flex-1 px-5"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
      >
        {Object.keys(groupedUsers).map((letter) => (
          <View key={letter} className="mb-4">
            <Text className="text-[10px] font-poppins-bold text-slate-400 uppercase mb-2">{letter}</Text>
            {groupedUsers[letter].map(renderCustomerCard)}
          </View>
        ))}
      </ScrollView>

      {/* Block/Unblock Modal */}
      <Modal visible={showBlockModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-3xl p-6">
            <View className={`w-16 h-16 rounded-2xl items-center justify-center self-center mb-4 ${willBlock ? "bg-red-50" : "bg-emerald-50"}`}>
              <MaterialIcons name={willBlock ? "block" : "lock-open"} size={32} color={willBlock ? "#ef4444" : "#10b981"} />
            </View>
            <Text className="text-lg font-poppins-bold text-center text-slate-900">{willBlock ? "Block User?" : "Unblock User?"}</Text>
            <Text className="text-sm font-poppins text-center text-slate-500 mt-2 mb-6">
              {willBlock ? "This user will no longer be able to log in or access the app." : "This will restore the user's access to the application."}
            </Text>
            
            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={() => setShowBlockModal(false)}
                className="flex-1 py-3 bg-slate-100 rounded-xl items-center"
              >
                <Text className="font-poppins-bold text-slate-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleToggleBlock}
                disabled={!!updatingUserId}
                className={`flex-1 py-3 rounded-xl items-center ${willBlock ? "bg-red-500" : "bg-emerald-500"}`}
              >
                {updatingUserId ? <ActivityIndicator color="white" size="small" /> : (
                  <Text className="font-poppins-bold text-white">{willBlock ? "Block" : "Unblock"}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}