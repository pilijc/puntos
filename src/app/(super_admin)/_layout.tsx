import { Tabs } from "expo-router";
import { useColorScheme, Platform, Text, View, Image, useWindowDimensions } from "react-native";
import React, { useCallback } from "react";
import { usePathname } from "expo-router";
import { BottomTabBar, type BottomTabBarButtonProps, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Users, Store, Settings, CreditCard, MessageSquare } from 'lucide-react-native';
import { useSuperAdminLayout } from "@/hooks/super-admin/use-super-admin-layout";

const WEB_SIDEBAR_WIDTH = 260;
const WEB_SIDEBAR_BREAKPOINT = 768;
const WEB_SIDEBAR_INSET_X = 16;
const WEB_SIDEBAR_BRAND_PADDING_X = 24;
const WEB_TAB_ICON_SIZE = 18;
const WEB_TAB_ACTIVE_MARGIN_END = 100;
const WEB_TAB_ACTIVE_BG_LIGHT = "#F3F4F6";
const WEB_TAB_ACTIVE_BG_DARK = "#431407";
const WEB_SIDEBAR_BORDER_LIGHT = "#F1F5F9";
const WEB_SIDEBAR_BORDER_DARK = "#404040";
const TAB_ACCENT = "#FF6600";

type SidebarTabId = "index" | "users" | "stores" | "settings" | "subscriptions" | "inbox";
type TabLabelPosition = "beside-icon" | "below-icon";

function withTrailingSlash(pathname: string) {
    return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function activeSidebarTabFromPath(path: string): SidebarTabId {
    const p = withTrailingSlash(path);

    if (p.includes("/users/") || p.endsWith("/users/")) {
        return "users";
    }

    if (p.includes("/stores/") || p.endsWith("/stores/")) {
        return "stores";
    }

    if (p.includes("/settings/") || p.endsWith("/settings/")) {
        return "settings";
    }

    if (p.includes("/subscriptions/") || p.endsWith("/subscriptions/")) {
        return "subscriptions";
    }

    if (p.includes("/inbox/") || p.endsWith("/inbox/")) {
        return "inbox";
    }

    return "index";
}

function WebSidebarTabLabel(props: {
    text: string;
    navColor: string;
    position: TabLabelPosition;
    isRowActive: boolean;
}) {
    const { text, navColor, position, isRowActive } = props;
    return (
        <Text
            style={{
                fontSize: 12,
                fontFamily: "Poppins-Medium",
                marginBottom: 0,
                marginStart: position === "beside-icon" ? 10 : 0,
                paddingRight: 8,
                color: isRowActive ? TAB_ACCENT : navColor,
            }}
        >
            {text}
        </Text>
    );
}

function WebSuperAdminTabBarButton(props: BottomTabBarButtonProps) {
    const route = useRoute();
    const pathname = usePathname() || "/";
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const activeTab = activeSidebarTabFromPath(withTrailingSlash(pathname));
    const isThisRow = activeTab === route.name;
    const activeBackground = isDark ? WEB_TAB_ACTIVE_BG_DARK : WEB_TAB_ACTIVE_BG_LIGHT;

    return (
        <View
            style={{
                alignSelf: "stretch",
                ...(isThisRow ? { marginRight: WEB_TAB_ACTIVE_MARGIN_END } : null),
            }}
        >
            <PlatformPressable
                {...props}
                hoverEffect={undefined}
                aria-selected={isThisRow}
                accessibilityState={{
                    ...props.accessibilityState,
                    selected: isThisRow,
                }}
                style={[props.style, isThisRow ? { backgroundColor: activeBackground } : null]}
            />
        </View>
    );
}

function WebSuperAdminSidebarTabBar({ isDark, ...props }: BottomTabBarProps & { isDark: boolean }) {
    const chromeBg = isDark ? "#262626" : "#FFFFFF";

    return (
        <View
            style={{
                alignSelf: "stretch",
                width: WEB_SIDEBAR_WIDTH,
                minWidth: WEB_SIDEBAR_WIDTH,
                maxWidth: WEB_SIDEBAR_WIDTH,
                flex: 1,
                flexDirection: "column",
                backgroundColor: chromeBg,
                borderRightWidth: 1,
                borderRightColor: isDark ? WEB_SIDEBAR_BORDER_DARK : WEB_SIDEBAR_BORDER_LIGHT,
                zIndex: 10,
                overflow: "hidden",
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: WEB_SIDEBAR_BRAND_PADDING_X,
                    paddingTop: 14,
                    paddingBottom: 20,
                }}
            >
                <Image
                    source={require("@/assets/images/puntos-icon.png")}
                    style={{ width: 36, height: 36 }}
                    resizeMode="contain"
                />
                <Text
                    style={{
                        fontSize: 18,
                        fontFamily: "Poppins-Bold",
                        color: isDark ? "#FFFFFF" : TAB_ACCENT,
                    }}
                >
                    PUNTOS
                </Text>
            </View>

            <View style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                <BottomTabBar {...props} />
            </View>
        </View>
    );
}

export default function SuperAdminLayout() {
  useSuperAdminLayout();

  const { t: translate } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  
  const isWeb = Platform.OS === "web";
  const { width } = useWindowDimensions();
  const useSidebar = isWeb && width >= WEB_SIDEBAR_BREAKPOINT;

  const pathname = usePathname() || "/";
  const activeTab = activeSidebarTabFromPath(withTrailingSlash(pathname));

  const renderWebTabBar = useCallback(
    (barProps: BottomTabBarProps) => (
      <WebSuperAdminSidebarTabBar {...barProps} isDark={isDark} />
    ),
    [isDark],
  );

  return (
    <Tabs
        tabBar={useSidebar ? renderWebTabBar : undefined}
        screenOptions={{
            headerShown: false,
            tabBarPosition: useSidebar ? "left" : "bottom",
            tabBarLabelPosition: useSidebar ? "beside-icon" : undefined,
            ...(useSidebar ? { animation: "none" as const } : {}),
            tabBarActiveBackgroundColor: useSidebar
                ? isDark
                    ? WEB_TAB_ACTIVE_BG_DARK
                    : WEB_TAB_ACTIVE_BG_LIGHT
                : undefined,
            tabBarInactiveBackgroundColor: useSidebar ? "transparent" : undefined,
            tabBarStyle: useSidebar
                ? {
                        backgroundColor: "transparent",
                        borderTopWidth: 0,
                        borderRightWidth: 0,
                        flex: 1,
                        width: "100%",
                        elevation: 0,
                        paddingLeft: WEB_SIDEBAR_INSET_X,
                        paddingRight: WEB_SIDEBAR_INSET_X,
                    }
                : {
                        backgroundColor: isDark ? "#171717" : "#FFFFFF",
                        borderTopColor: isDark ? "#404040" : "#F3F4F6",
                        height: 60 + insets.bottom,
                        paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                        elevation: 0,
                    },
            tabBarActiveTintColor: TAB_ACCENT,
            tabBarInactiveTintColor: isDark ? "#737373" : "#8B8D98",
            tabBarButton: useSidebar
                ? (btnProps) => <WebSuperAdminTabBarButton {...btnProps} />
                : undefined,
            tabBarItemStyle: useSidebar
                ? { alignSelf: "stretch", width: WEB_SIDEBAR_WIDTH }
                : undefined,
            tabBarLabelStyle: {
                fontSize: useSidebar ? 12 : 10,
                fontFamily: "Poppins-Medium",
                marginBottom: useSidebar ? 0 : insets.bottom > 0 ? 0 : 4,
                ...(useSidebar ? { paddingRight: 8 } : {}),
            },
        }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: translate("layout.overview"),
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard
              size={useSidebar ? WEB_TAB_ICON_SIZE : size}
              color={useSidebar && activeTab === "index" ? TAB_ACCENT : color}
            />
          ),
          tabBarLabel: useSidebar
            ? ({ color, position }) => (
              <WebSidebarTabLabel
                text={translate("layout.overview")}
                navColor={color}
                position={position}
                isRowActive={activeTab === "index"}
              />
            )
            : undefined,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: translate("layout.users"),
          tabBarIcon: ({ color, size }) => (
            <Users
              size={useSidebar ? WEB_TAB_ICON_SIZE : size}
              color={useSidebar && activeTab === "users" ? TAB_ACCENT : color}
            />
          ),
          tabBarLabel: useSidebar
            ? ({ color, position }) => (
              <WebSidebarTabLabel
                text={translate("layout.users")}
                navColor={color}
                position={position}
                isRowActive={activeTab === "users"}
              />
            )
            : undefined,
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: translate("layout.stores"),
          tabBarIcon: ({ color, size }) => (
            <Store
              size={useSidebar ? WEB_TAB_ICON_SIZE : size}
              color={useSidebar && activeTab === "stores" ? TAB_ACCENT : color}
            />
          ),
          tabBarLabel: useSidebar
            ? ({ color, position }) => (
              <WebSidebarTabLabel
                text={translate("layout.stores")}
                navColor={color}
                position={position}
                isRowActive={activeTab === "stores"}
              />
            )
            : undefined,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Chat",
          href: useSidebar ? "/(super_admin)/inbox" : null,
          tabBarIcon: ({ color, size }) => (
            <MessageSquare
              size={useSidebar ? WEB_TAB_ICON_SIZE : size}
              color={useSidebar && activeTab === "inbox" ? TAB_ACCENT : color}
            />
          ),
          tabBarLabel: useSidebar
            ? ({ color, position }) => (
              <WebSidebarTabLabel
                text="Chat"
                navColor={color}
                position={position}
                isRowActive={activeTab === "inbox"}
              />
            )
            : undefined,
          tabBarStyle: useSidebar ? undefined : { display: "none" }
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: translate("layout.subscriptions"),
          tabBarIcon: ({ color, size }) => (
            <CreditCard
              size={useSidebar ? WEB_TAB_ICON_SIZE : size}
              color={useSidebar && activeTab === "subscriptions" ? TAB_ACCENT : color}
            />
          ),
          tabBarLabel: useSidebar
            ? ({ color, position }) => (
              <WebSidebarTabLabel
                text={translate("layout.subscriptions")}
                navColor={color}
                position={position}
                isRowActive={activeTab === "subscriptions"}
              />
            )
            : undefined,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: translate("layout.settings"),
          tabBarIcon: ({ color, size }) => (
            <Settings
              size={useSidebar ? WEB_TAB_ICON_SIZE : size}
              color={useSidebar && activeTab === "settings" ? TAB_ACCENT : color}
            />
          ),
          tabBarLabel: useSidebar
            ? ({ color, position }) => (
              <WebSidebarTabLabel
                text={translate("layout.settings")}
                navColor={color}
                position={position}
                isRowActive={activeTab === "settings"}
              />
            )
            : undefined,
        }}
      />
    </Tabs>
  );
}