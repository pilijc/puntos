import { Tabs } from "expo-router";
import { useColorScheme, Platform, Text, View, Image } from "react-native";
import React, { useCallback } from "react";
import { usePathname } from "expo-router";
import { BottomTabBar, type BottomTabBarButtonProps, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Users, Store, Settings, CircleDollarSign } from 'lucide-react-native';
import { useSuperAdminLayout } from "@/hooks/super-admin/use-super-admin-layout";

const WEB_SIDEBAR_WIDTH = 260;
const WEB_SIDEBAR_INSET_X = 16;
const WEB_SIDEBAR_BRAND_PADDING_X = 24;
const WEB_TAB_ICON_SIZE = 18;
const WEB_TAB_ACTIVE_MARGIN_END = 100;
const WEB_TAB_ACTIVE_BG_LIGHT = "#F3F4F6";
const WEB_TAB_ACTIVE_BG_DARK = "#431407";
const WEB_SIDEBAR_BORDER_LIGHT = "#F1F5F9";
const WEB_SIDEBAR_BORDER_DARK = "#404040";
const TAB_ACCENT = "#FF6600";

type SidebarTabId = "index" | "users" | "stores" | "settings" | "subscription-config";
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

    if (p.includes("/subscription-config/") || p.endsWith("/subscription-config/")) {
        return "subscription-config";
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

            <View style={{ flex: 1, minHeight: 0 }}>
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
  
  // Standard React Native platform detection
  const isWeb = Platform.OS === "web";
  
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
        tabBar={isWeb ? renderWebTabBar : undefined}
        screenOptions={{
            headerShown: false,
            tabBarPosition: isWeb ? "left" : "bottom",
            tabBarLabelPosition: isWeb ? "beside-icon" : undefined,
            ...(isWeb ? { animation: "none" as const } : {}),
            tabBarActiveBackgroundColor: isWeb
                ? isDark
                    ? WEB_TAB_ACTIVE_BG_DARK
                    : WEB_TAB_ACTIVE_BG_LIGHT
                : undefined,
            tabBarInactiveBackgroundColor: isWeb ? "transparent" : undefined,
            tabBarStyle: isWeb
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
            tabBarButton: isWeb
                ? (btnProps) => <WebSuperAdminTabBarButton {...btnProps} />
                : undefined,
            tabBarItemStyle: isWeb
                ? { alignSelf: "stretch", width: "100%" }
                : undefined,
            tabBarLabelStyle: {
                fontSize: isWeb ? 12 : 10,
                fontFamily: "Poppins-Medium",
                marginBottom: isWeb ? 0 : insets.bottom > 0 ? 0 : 4,
                ...(isWeb ? { paddingRight: 8 } : {}),
            },
        }}
    >
      <Tabs.Screen
        name="index"
        options={{
            title: translate("layout.overview"),
            tabBarIcon: ({ color, size }) => (
                <LayoutDashboard 
                    size={isWeb ? WEB_TAB_ICON_SIZE : size} 
                    color={isWeb && activeTab === "index" ? TAB_ACCENT : color} 
                />
            ),
            tabBarLabel: isWeb
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
                    size={isWeb ? WEB_TAB_ICON_SIZE : size} 
                    color={isWeb && activeTab === "users" ? TAB_ACCENT : color} 
                />
            ),
            tabBarLabel: isWeb
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
                    size={isWeb ? WEB_TAB_ICON_SIZE : size} 
                    color={isWeb && activeTab === "stores" ? TAB_ACCENT : color} 
                />
            ),
            tabBarLabel: isWeb
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
        name="subscription-config"
        options={{
          title: translate("layout.subscription"),
          tabBarIcon: ({ color, size }) => (
            <CircleDollarSign 
                size={isWeb ? WEB_TAB_ICON_SIZE : size} 
                color={isWeb && activeTab === "subscription-config" ? TAB_ACCENT : color} 
            />
          ),
          tabBarLabel: isWeb
            ? ({ color, position }) => (
                    <WebSidebarTabLabel
                        text={translate("layout.subscription")}
                        navColor={color}
                        position={position}
                        isRowActive={activeTab === "subscription-config"}
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
                    size={isWeb ? WEB_TAB_ICON_SIZE : size} 
                    color={isWeb && activeTab === "settings" ? TAB_ACCENT : color} 
                />
            ),
            tabBarLabel: isWeb
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