import { Tabs } from "expo-router";
import { useColorScheme, Platform, Text, View, Image } from "react-native";
import React, { useCallback, useState } from "react";
import { usePathname } from "expo-router";
import { type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Users, Store, Settings, CreditCard, MessageSquare, PanelLeft, PanelLeftClose } from 'lucide-react-native';
import { useSuperAdminLayout } from "@/hooks/super-admin/use-super-admin-layout";

const WEB_SIDEBAR_WIDTH = 260;
const WEB_SIDEBAR_COLLAPSED_WIDTH = 76;
const WEB_SIDEBAR_INSET_X = 16;
const WEB_TAB_ICON_SIZE = 18;
const WEB_TAB_ACTIVE_BG_LIGHT = "#F3F4F6";
const WEB_TAB_ACTIVE_BG_DARK = "#431407";
const WEB_SIDEBAR_BORDER_LIGHT = "#F1F5F9";
const WEB_SIDEBAR_BORDER_DARK = "#404040";
const TAB_ACCENT = "#FF6600";

type SidebarTabId = "index" | "users" | "stores" | "settings" | "subscriptions" | "inbox";

function withTrailingSlash(pathname: string) {
    return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function activeSidebarTabFromPath(path: string): SidebarTabId {
    const p = withTrailingSlash(path);
    if (p.includes("/users/") || p.endsWith("/users/")) return "users";
    if (p.includes("/stores/") || p.endsWith("/stores/")) return "stores";
    if (p.includes("/settings/") || p.endsWith("/settings/")) return "settings";
    if (p.includes("/subscriptions/") || p.endsWith("/subscriptions/")) return "subscriptions";
    if (p.includes("/inbox/") || p.endsWith("/inbox/")) return "inbox";
    return "index";
}

function getTabIcon(routeName: string, color: string, size: number): React.ReactNode {
    switch (routeName) {
        case "index":         return <LayoutDashboard size={size} color={color} />;
        case "users":         return <Users           size={size} color={color} />;
        case "subscriptions": return <CreditCard      size={size} color={color} />;
        case "stores":        return <Store           size={size} color={color} />;
        case "settings":      return <Settings        size={size} color={color} />;
        case "inbox":         return <MessageSquare   size={size} color={color} />;
        default:              return null;
    }
}

const HIDDEN_SCREENS = new Set(["manager-inbox"]);

type WebSuperAdminSidebarTabBarProps = BottomTabBarProps & {
    isDark: boolean;
    expanded: boolean;
    onHoverIn: () => void;
    onHoverOut: () => void;
    onToggle: () => void;
};

function WebSuperAdminSidebarTabBar({
    isDark,
    expanded,
    onHoverIn,
    onHoverOut,
    onToggle,
    state,
    descriptors,
    navigation,
}: WebSuperAdminSidebarTabBarProps) {
    const pathname = usePathname();
    const chromeBg = isDark ? "#262626" : "#FFFFFF";
    const sidebarWidth = expanded ? WEB_SIDEBAR_WIDTH : WEB_SIDEBAR_COLLAPSED_WIDTH;
    const activeTab = activeSidebarTabFromPath(withTrailingSlash(pathname));
    const activeBackground = isDark ? WEB_TAB_ACTIVE_BG_DARK : WEB_TAB_ACTIVE_BG_LIGHT;
    const inactiveColor = isDark ? "#737373" : "#8B8D98";

    const visibleRoutes = state.routes.filter((r) => !HIDDEN_SCREENS.has(r.name));

    return (
        <View
            {...({ onMouseEnter: onHoverIn, onMouseLeave: onHoverOut } as any)}
            style={{
                alignSelf: "stretch",
                width: sidebarWidth,
                minWidth: sidebarWidth,
                maxWidth: sidebarWidth,
                flex: 1,
                flexDirection: "column",
                backgroundColor: chromeBg,
                borderRightWidth: 1,
                borderRightColor: isDark ? WEB_SIDEBAR_BORDER_DARK : WEB_SIDEBAR_BORDER_LIGHT,
                transitionProperty: "width, min-width, max-width",
                transitionDuration: "180ms",
                overflow: "hidden",
            }}
        >
            {/* Brand header */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingLeft: 19,
                    paddingTop: 20,
                    paddingBottom: 20,
                }}
            >
                <Image
                    source={require("@/assets/images/puntos-icon.png")}
                    style={{ width: 36, height: 36 }}
                    resizeMode="contain"
                />
                {expanded && (
                    <Text style={{
                        fontSize: 18,
                        fontFamily: "Poppins-Bold",
                        color: isDark ? "#FFFFFF" : TAB_ACCENT,
                        marginStart: 12,
                    }}>
                        PUNTOS
                    </Text>
                )}
            </View>

            {/* Nav items */}
            <View style={{ flex: 1, paddingHorizontal: WEB_SIDEBAR_INSET_X, paddingTop: 8 }}>
                {visibleRoutes.map((route) => {
                    const options = descriptors[route.key]?.options ?? {};
                    const isActive = activeTab === route.name;
                    const iconColor = isActive ? TAB_ACCENT : inactiveColor;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: "tabPress" as any,
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!isActive && !(event as any).defaultPrevented) {
                            navigation.navigate(route.name as never);
                        }
                    };

                    return (
                        <PlatformPressable
                            key={route.key}
                            onPress={onPress}
                            hoverEffect={undefined}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: isActive }}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                borderRadius: 10,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                marginBottom: 2,
                                backgroundColor: isActive ? activeBackground : "transparent",
                            }}
                        >
                            <View style={{ width: 18, alignItems: "center", justifyContent: "center" }}>
                                {getTabIcon(route.name, iconColor, WEB_TAB_ICON_SIZE)}
                            </View>
                            {expanded && (
                                <Text style={{
                                    fontSize: 12,
                                    fontFamily: "Poppins-Medium",
                                    marginStart: 10,
                                    color: isActive ? TAB_ACCENT : inactiveColor,
                                }}>
                                    {String(options.title ?? route.name)}
                                </Text>
                            )}
                        </PlatformPressable>
                    );
                })}
            </View>

            {/* Footer toggle */}
            <View
                style={{
                    paddingBottom: 24,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? "#333" : "#f0f0f0",
                    paddingTop: 16,
                }}
            >
                <PlatformPressable
                    onPress={onToggle}
                    hoverEffect={undefined}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingLeft: 28,
                        height: 44,
                    }}
                >
                    <View style={{ width: 18, alignItems: "center" }}>
                        {expanded
                            ? <PanelLeftClose size={18} color={isDark ? "#A3A3A3" : "#6B7280"} />
                            : <PanelLeft      size={18} color={isDark ? "#A3A3A3" : "#6B7280"} />}
                    </View>
                    {expanded && (
                        <Text style={{
                            marginStart: 12,
                            fontSize: 12,
                            fontFamily: "Poppins-Medium",
                            color: isDark ? "#A3A3A3" : "#6B7280",
                        }}>
                            Collapse
                        </Text>
                    )}
                </PlatformPressable>
            </View>
        </View>
    );
}

export default function SuperAdminLayout() {
    useSuperAdminLayout();

    const { t: translate } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const insets = useSafeAreaInsets();
    const isWeb = Platform.OS === "web";
    const [webSidebarExpanded, setWebSidebarExpanded] = useState(false);

    const renderWebTabBar = useCallback(
        (barProps: BottomTabBarProps) => (
            <WebSuperAdminSidebarTabBar
                {...barProps}
                isDark={isDark}
                expanded={webSidebarExpanded}
                onHoverIn={() => setWebSidebarExpanded(true)}
                onHoverOut={() => setWebSidebarExpanded(false)}
                onToggle={() => setWebSidebarExpanded((v) => !v)}
            />
        ),
        [isDark, webSidebarExpanded],
    );

    return (
        <Tabs
            tabBar={isWeb ? renderWebTabBar : undefined}
            screenOptions={{
                headerShown: false,
                tabBarPosition: isWeb ? "left" : "bottom",
                ...(isWeb ? { animation: "none" as const } : {}),
                tabBarStyle: isWeb
                    ? { display: "none" }
                    : {
                          backgroundColor: isDark ? "#171717" : "#FFFFFF",
                          borderTopColor: isDark ? "#404040" : "#F3F4F6",
                          height: 60 + insets.bottom,
                          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                          elevation: 0,
                      },
                tabBarActiveTintColor: TAB_ACCENT,
                tabBarInactiveTintColor: isDark ? "#737373" : "#8B8D98",
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontFamily: "Poppins-Medium",
                    marginBottom: insets.bottom > 0 ? 0 : 4,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: translate("layout.overview"),
                    tabBarIcon: ({ color, size }) => (
                        <LayoutDashboard size={isWeb ? WEB_TAB_ICON_SIZE : size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="users"
                options={{
                    title: translate("layout.users"),
                    tabBarIcon: ({ color, size }) => (
                        <Users size={isWeb ? WEB_TAB_ICON_SIZE : size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="subscriptions"
                options={{
                    title: translate("layout.subscriptions"),
                    tabBarIcon: ({ color, size }) => (
                        <CreditCard size={isWeb ? WEB_TAB_ICON_SIZE : size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="stores"
                options={{
                    title: translate("layout.stores"),
                    tabBarIcon: ({ color, size }) => (
                        <Store size={isWeb ? WEB_TAB_ICON_SIZE : size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: translate("layout.settings"),
                    tabBarIcon: ({ color, size }) => (
                        <Settings size={isWeb ? WEB_TAB_ICON_SIZE : size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="inbox"
                options={{
                    title: "Chat",
                    href: isWeb ? undefined : null,
                    tabBarIcon: ({ color, size }) => (
                        <MessageSquare size={isWeb ? WEB_TAB_ICON_SIZE : size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}