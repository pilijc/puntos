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
  hideTitle?: boolean;
  hideControls?: boolean;
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
  hideTitle = false,
  hideControls = false,
}: UsersSearchHeaderProps) {
  const searchInputRef = useRef<import("react-native").TextInput>(null);
  const { t: translate } = useTranslation();
  const isWeb = Platform.OS === "web";

  // ── Web layout (Separated: Title | Tabs+Filter | Search) ──
  if (isWeb) {
    return (
      <>
        {/* ── Title Header ── */}
        {!hideTitle && (
          <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-3">
            <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary py-1">
              {translate("superAdmin.users.title")}
            </Text>
          </View>
        )}
        {/* ── Unified Controls Bar (Rounded-2xl & Matched to List Background) ── */}
        {!hideControls && (
          <View style={{ width: "100%", paddingTop: 16, paddingBottom: 8 }}>
            <View
              style={{
                width: "100%",
                maxWidth: 896,
                alignSelf: "center",
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderWidth: 1,
                borderColor: "#f6f2f2ff",
                height: 50,
                borderRadius: 16, // rounded-2xl
                overflow: "hidden",
              }}
            >
              {/* 1. Search Section (Left) */}
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
                <Feather name="search" size={17} color="#94A3B8" />
                <TextInput
                  ref={searchInputRef}
                  value={search}
                  onChangeText={onSearchChange}
                  placeholder={translate("superAdmin.users.searchPlaceholder")}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontFamily: "Poppins-Medium",
                    color: "#334155",
                    outline: "none",
                    border: "none",
                    marginLeft: 10,
                    backgroundColor: "transparent",
                  } as any}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => onSearchChange("")}>
                    <Feather name="x" size={14} color="#94A3B8" />
                  </Pressable>
                )}
              </View>

              {/* Vertical Divider */}
              <View style={{ width: 1, height: 32, backgroundColor: "#f1f5f9" }} />

              {/* 2. Tabs Section (Right) */}
              <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 6 }}>
                {TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <Pressable
                      key={tab}
                      onPress={() => onTabChange(tab)}
                      style={{
                        height: 34,
                        paddingHorizontal: 16,
                        borderRadius: 10, // Matching 2xl style
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isActive ? "#FF6600" : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Poppins-SemiBold",
                          color: isActive ? "#ffffff" : "#64748b",
                        }}
                      >
                        {translate(`superAdmin.users.tabs.${tab.toLowerCase()}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Vertical Divider */}
              <View style={{ width: 1, height: 32, backgroundColor: "#f1f5f9" }} />

              {/* 3. Filter Icon Section (Right) */}
              <Pressable
                onPress={onFilterPress}
                style={{
                  width: 52,
                  height: 52,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: statusFilter !== "All" ? "#fff7ed" : "transparent",
                }}
              >
                <Feather name="sliders" size={16} color={statusFilter !== "All" ? "#FF6600" : "#94A3B8"} />
              </Pressable>
            </View>
          </View>
        )}
      </>
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
            className="flex-1 ml-4 font-poppins text-[10px] text-neutral-900 dark:text-white"
            style={{
              includeFontPadding: false,
              textAlignVertical: 'center',
              height: 40,
              paddingTop: Platform.OS === 'android' ? 11 : 2
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
          ListFooterComponent={(
            <TouchableOpacity
              onPress={onFilterPress}
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
        />
      </View>
    </View>
  );
}
