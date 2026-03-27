import React, { useRef } from "react";
import { TextInput, FlatList } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { Feather } from "@expo/vector-icons";
import { TYPO, COLORS } from "@/type/super-admin/user";
import type { UserRoleTab } from "@/store/super-admin/user-store";

interface UsersSearchHeaderProps {
  search: string;
  onSearchChange: (text: string) => void;
  activeTab: UserRoleTab;
  onTabChange: (tab: UserRoleTab) => void;
  statusFilter: import("@/store/super-admin/user-store").AccountStatusFilter;
  onFilterPress: () => void;
}

const TABS: UserRoleTab[] = ["All", "User", "Manager", "Staff"];

export function UsersSearchHeader({
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  statusFilter,
  onFilterPress,
}: UsersSearchHeaderProps) {
  const searchInputRef = useRef<import("react-native").TextInput>(null);

  return (
    <View className="px-5 pt-4">
      <View className="mb-4">
        <Text className={TYPO.title}>Users</Text>
      </View>

      <TouchableOpacity
        activeOpacity={1}
        onPress={() => searchInputRef.current?.focus()}
        className="flex-row items-center bg-backgroundMuted rounded-xl px-3 mb-4 h-10 border border-slate-200/50"
      >
        <Feather name="search" size={14} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          ref={searchInputRef}
          className="flex-1 text-[13px] font-poppins text-textPrimary"
          placeholder="Search..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={onSearchChange}
        />
      </TouchableOpacity>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        data={TABS}
        keyExtractor={(item) => item}
        ListHeaderComponent={
          <TouchableOpacity
            onPress={onFilterPress}
            className={`flex-row items-center h-10 px-4 rounded-full mr-2 border ${statusFilter !== "All" ? "bg-primary/5 border-primary/30" : "bg-white border-slate-100"
              }`}
          >
            <Feather
              name="sliders"
              size={13}
              color={statusFilter !== "All" ? COLORS.primary : COLORS.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text
              className={`${TYPO.chip} ${statusFilter !== "All" ? "text-primary" : "text-textMuted"
                }`}
            >
              Filter
            </Text>
          </TouchableOpacity>
        }
        renderItem={({ item: tab }) => (
          <TouchableOpacity
            onPress={() => onTabChange(tab)}
            className={`flex-row items-center h-10 px-4 rounded-full mr-2 ${activeTab === tab ? "bg-primary" : "bg-white border border-slate-100"
              }`}
          >
            <Text
              className={`${TYPO.chip} ${activeTab === tab ? "text-white" : "text-textMuted"
                }`}
            >
              {tab === "All" ? "All" : tab + "s"}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
