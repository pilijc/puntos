import React, { useRef } from "react";
import { TextInput, FlatList, Platform, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { View, Text, TouchableOpacity } from "@/tw";
import { Search, X } from "lucide-react-native";
import { Feather } from "@expo/vector-icons";
import { TYPO, COLORS } from "@/type/super-admin/user";
import { WEB_PAGE_PADDING } from "@/type/super-admin/layout";
import type { UserRoleTab, AccountStatusFilter } from "@/store/super-admin/user-store";

interface UsersSearchHeaderProps {
  search: string;
  onSearchChange: (text: string) => void;
  activeTab: UserRoleTab;
  onTabChange: (tab: UserRoleTab) => void;
  statusFilter: AccountStatusFilter;
  onFilterPress: () => void;
  counts: Record<UserRoleTab, number>;
}

const TABS: UserRoleTab[] = ["All", "User", "Manager", "Staff"];

export function UsersSearchHeader({
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  statusFilter,
  onFilterPress,
  counts,
}: UsersSearchHeaderProps) {
  const searchInputRef = useRef<import("react-native").TextInput>(null);
  const { t: translate } = useTranslation();
  const isWeb = Platform.OS === "web";

  // ── Web layout ──
  if (isWeb) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          paddingTop: 20,
          paddingBottom: 20,
          paddingHorizontal: WEB_PAGE_PADDING,
          backgroundColor: "#fcfdfeff",
          borderBottomWidth: 1,
          borderBottomColor: "#f1f5f9",
        }}
      >
        {/* Left: Title */}
        <Text
          style={{
            fontSize: 22,
            fontFamily: "Poppins-Bold",
            color: "#0f172a",
            paddingTop: 8,
          }}
        >
          {translate("superAdmin.users.title")}
        </Text>

        <View style={{ flex: 1 }} />

        <View style={{ flexDirection: "column", gap: 8 }}>
          {/* Search bar */}
          <Pressable
            onPress={() => searchInputRef.current?.focus()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f8fafc",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              height: 48,
              paddingHorizontal: 16,
              flex: 1,
              cursor: "text" as any,
            }}
          >
            <Feather name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              ref={searchInputRef}
              value={search}
              onChangeText={onSearchChange}
              placeholder={translate("superAdmin.users.searchPlaceholder")}
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                  flex: 1,
                  fontSize: 14,
                  fontFamily: "Poppins-Regular",
                  color: "#0f172a",
                  outline: "none",
                  border: "none",
                  boxShadow: "none",
                  backgroundColor: "transparent",
                  padding: 0,
                  margin: 0,
                  height: "100%",
                  minWidth: 0,
                } as any}
            />
            {search.length > 0 && (
              <Pressable onPress={() => onSearchChange("")} style={{ padding: 4 }}>
                <Feather name="x" size={14} color={COLORS.textMuted} />
              </Pressable>
            )}
          </Pressable>

          {/* Tabs + Filter */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
            <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl p-1.5 flex-row gap-x-1 shadow-sm border border-neutral-100 dark:border-darkBorder">
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => onTabChange(tab)}
                    style={{
                      height: 36,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 6,
                      backgroundColor: isActive ? "#FF6600" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: isActive ? "Poppins-Bold" : "Poppins-SemiBold",
                        color: isActive ? "#ffffff" : "#64748b",
                      }}
                    >
                      {translate(`superAdmin.users.tabs.${tab.toLowerCase()}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: "#e2e8f0", marginHorizontal: 4 }} />
            <Pressable
              onPress={onFilterPress}
              style={{
                flexDirection: "row",
                alignItems: "center",
                height: 44,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: statusFilter !== "All" ? "#fed7aa" : "#e2e8f0",
                backgroundColor: statusFilter !== "All" ? "#fff7ed" : "#f8fafc",
                gap: 8,
              }}
            >
              <Feather name="sliders" size={16} color={statusFilter !== "All" ? COLORS.primary : COLORS.textMuted} />
              <Text style={{ fontSize: 13, fontFamily: "Poppins-SemiBold", color: statusFilter !== "All" ? COLORS.primary : "#64748b" }}>
                {translate("superAdmin.users.filter")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── Mobile layout ──
  return (
    <View className="z-10 bg-white dark:bg-darkBackground">
      {/* ── Main Header ── */}
      <View className="flex-row items-center px-6 py-3 border-b border-neutral-100 dark:border-darkBorder">
        <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary flex-shrink-0">
          {translate("superAdmin.users.title")}
        </Text>
        
        {/* Search Pill - flex-1 and w-full ensures it stretches to the right */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => searchInputRef.current?.focus()}
          className="flex-1 ml-4 flex-row items-center bg-slate-50 dark:bg-darkBackgroundCard rounded-full px-3 h-10 border border-slate-100 dark:border-darkBorder"
        >
          <Search size={16} color="#94A3B8" />
          <TextInput
            ref={searchInputRef}
            className="flex-1 ml-2 font-poppins text-[10px] text-neutral-900 dark:text-white"
            style={{ 
              includeFontPadding: false, 
              textAlignVertical: 'center',
              height: 40,
              paddingTop: Platform.OS === 'android' ? 2 : 0 // Small tweak to fix Poppins vertical misalignment
            }}
            placeholder={translate("superAdmin.users.searchPlaceholder")}
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange("")}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Tabs Row ── */}
      <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(item) => item}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
          ListHeaderComponent={(
            <TouchableOpacity
              onPress={onFilterPress}
              style={{ marginRight: 32 }}
              className={`py-3 items-center flex-row justify-center gap-1.5 border-b-2 ${statusFilter !== "All" ? "border-primary" : "border-transparent"}`}
            >
              <Feather 
                name="sliders" 
                size={14} 
                color={statusFilter !== "All" ? "#FF6600" : "#64748B"} 
              />
              <Text className={`text-sm ${statusFilter !== "All" ? "font-poppins-bold text-primary" : "font-poppins-medium text-slate-400"}`}>
                {translate("superAdmin.users.filter")}
              </Text>
            </TouchableOpacity>
          )}
          renderItem={({ item: tab }) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                onPress={() => onTabChange(tab)}
                style={{ marginRight: 32 }}
                className={`py-3 items-center flex-row justify-center border-b-2 ${isActive ? "border-primary" : "border-transparent"}`}
              >
                <Text className={`text-sm ${isActive ? "font-poppins-bold text-primary" : "font-poppins-medium text-slate-400"}`}>
                  {translate(`superAdmin.users.tabs.${tab.toLowerCase()}`)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
}
