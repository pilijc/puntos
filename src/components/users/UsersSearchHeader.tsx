import React, { useRef } from "react";
import { TextInput, FlatList, Platform, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { View, Text, TouchableOpacity } from "@/tw";
import { Feather } from "@expo/vector-icons";
import { TYPO, COLORS } from "@/type/super-admin/user";
import type { UserRoleTab, AccountStatusFilter } from "@/store/super-admin/user-store";

interface UsersSearchHeaderProps {
  search: string;
  onSearchChange: (text: string) => void;
  activeTab: UserRoleTab;
  onTabChange: (tab: UserRoleTab) => void;
  statusFilter: AccountStatusFilter;
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
  const { t: translate } = useTranslation();
  const isWeb = Platform.OS === "web";

  // ── Web layout ──
  if (isWeb) {
    return (
      <>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            paddingTop: 20,
            paddingBottom: 20,
            paddingHorizontal: 50,
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

          {/* Right column: search bar + tabs — both share the same left/right edges */}
          <View style={{ flexDirection: "column", gap: 8 }}>
            {/* Search bar */}

            <Pressable
              onPress={() => searchInputRef.current?.focus()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f8fafc",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                height: 48,
                paddingHorizontal: 16,
                flex: 1,
                cursor: "text" as any,
              }}
            >
              <Feather
                name="search"
                size={18}
                color={COLORS.textMuted}
                style={{ marginRight: 10 }}
              />
              <TextInput
                ref={searchInputRef}
                value={search}
                onChangeText={onSearchChange}
                placeholder={translate("superAdmin.users.searchPlaceholder")}
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={
                  {
                    flex: 1,
                    fontSize: 18,
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
                  } as any
                }
              />
              {search.length > 0 && (
                <Pressable onPress={() => onSearchChange("")} style={{ padding: 4 }}>
                  <Feather name="x" size={14} color={COLORS.textMuted} />
                </Pressable>
              )}
            </Pressable>

            {/* Tabs + Filter — right-aligned, same width as search bar */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => onTabChange(tab)}
                  style={{
                    height: 40,
                    paddingHorizontal: 18,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isActive ? "#FF6600" : "#f1f5f9",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: "Poppins-SemiBold",
                      color: isActive ? "#ffffff" : "#64748b",
                    }}
                  >
                    {translate(`superAdmin.users.tabs.${tab.toLowerCase()}`)}
                  </Text>
                </Pressable>
              );
            })}

            <View style={{ width: 1, height: 24, backgroundColor: "#e2e8f0", marginHorizontal: 4 }} />

            <Pressable
              onPress={onFilterPress}
              style={{
                flexDirection: "row",
                alignItems: "center",
                height: 40,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: statusFilter !== "All" ? "#fed7aa" : "#e2e8f0",
                backgroundColor: statusFilter !== "All" ? "#fff7ed" : "#f8fafc",
                gap: 8,
              }}
            >
              <Feather
                name="sliders"
                size={16}
                color={statusFilter !== "All" ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: "Poppins-SemiBold",
                  color: statusFilter !== "All" ? COLORS.primary : "#64748b",
                }}
              >
                {translate("superAdmin.users.filter")}
              </Text>
            </Pressable>
            </View>
          </View>
        </View>
      </>
    );
  }


  // ── Mobile layout (unchanged) ──
  return (
    <View className="px-5 pt-4">
      <View className="mb-4">
        <Text className={TYPO.title}>{translate("superAdmin.users.title")}</Text>
      </View>

      <TouchableOpacity
        activeOpacity={1}
        onPress={() => searchInputRef.current?.focus()}
        className="flex-row items-center bg-backgroundMuted dark:bg-darkBackgroundMuted rounded-xl px-3.5 mb-4 h-11 border border-slate-200/50 dark:border-darkBorder w-full overflow-hidden"
      >
        <Feather name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          ref={searchInputRef}
          className="flex-1 text-[14px] font-poppins text-textPrimary dark:text-darkTextPrimary h-full py-0 m-0"
          style={{ paddingTop: 0, paddingBottom: 0 }}
          placeholder={translate("superAdmin.users.searchPlaceholder")}
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
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
            className={`flex-row items-center h-10 px-4 rounded-full mr-2 border ${statusFilter !== "All"
                ? "bg-primary/5 border-primary/30"
                : "bg-white dark:bg-darkBackgroundMuted border-slate-100 dark:border-darkBorder"
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
              {translate("superAdmin.users.filter")}
            </Text>
          </TouchableOpacity>
        }
        renderItem={({ item: tab }) => (
          <TouchableOpacity
            onPress={() => onTabChange(tab)}
            className={`flex-row items-center h-10 px-4 rounded-full mr-2 ${activeTab === tab
                ? "bg-primary"
                : "bg-white dark:bg-darkBackgroundMuted border border-slate-100 dark:border-darkBorder"
              }`}
          >
            <Text
              className={`${TYPO.chip} ${activeTab === tab ? "text-white" : "text-textMuted"
                }`}
            >
              {translate(`superAdmin.users.tabs.${tab.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
