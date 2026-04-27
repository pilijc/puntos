import { Tabs } from "expo-router";
import { useColorScheme, Platform, Text, View, Image,} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "expo-router";
import { BottomTabBar, type BottomTabBarButtonProps, type BottomTabBarProps,} from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { useRoute } from "@react-navigation/native";
import { supabase } from "@/supabase/supabase";
import { getRoleTypeForUser, getWebAdjustedHomeRoute } from "@/services/access-service";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Store, ArrowLeftRight, Settings, CreditCard } from "lucide-react-native";
import { useDeviceSession } from "@/hooks/store-manager/use-device-session";

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

type SidebarTabId = "index" | "stores" | "transactions" | "subscription" | "settings";
type TabLabelPosition = "beside-icon" | "below-icon";

function withTrailingSlash(pathname: string) {
    return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

const STORES_SECTION_PREFIXES = [
    "/(store_manager)/stores/",
    "/(store_manager)/view-store/",
    "/(store_manager)/store/",
    "/(store_manager)/reward/",
    "/(store_manager)/stamp/",
    "/(store_manager)/streak/",
    "/(store_manager)/qr/",
    "/(store_manager)/staff/",
    "/(store_manager)/detail/",
    "/stores/",
    "/view-store/",
    "/store/",
    "/reward/",
    "/stamp/",
    "/streak/",
    "/qr/",
    "/staff/",
    "/detail/",
] as const;

function pathStartsWithAny(path: string, prefixes: readonly string[]) {
    return prefixes.some((prefix) => path.startsWith(prefix));
}

function activeSidebarTabFromPath(path: string): SidebarTabId {
    const p = withTrailingSlash(path);

    if (pathStartsWithAny(p, STORES_SECTION_PREFIXES)) {
        return "stores";
    }

    if (
        p.startsWith("/(store_manager)/transactions/") ||
        p === "/(store_manager)/transactions/" ||
        p.startsWith("/transactions/")
    ) {
        return "transactions";
    }

    if (
        p.startsWith("/(store_manager)/subscription") ||
        p === "/(store_manager)/subscription/" ||
        p.startsWith("/subscription/")
    ) {
        return "subscription";
    }

    if (
        p.startsWith("/(store_manager)/settings/") ||
        p === "/(store_manager)/settings/" ||
        p.startsWith("/settings/") ||
        p.includes("/(store_manager)/profile")
    ) {
        return "settings";
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

function StoresTabLabel(props: {
    text: string;
    navColor: string;
    position: TabLabelPosition;
    isRowActive: boolean;
    isWeb: boolean;
    insetBottom: number;
}) {
    const { text, navColor, position, isRowActive, isWeb, insetBottom } = props;
    return (
        <Text
            style={{
                fontSize: isWeb ? 12 : 10,
                fontFamily: "Poppins-Medium",
                marginBottom: isWeb ? 0 : insetBottom > 0 ? 0 : 4,
                marginStart: position === "beside-icon" ? (isWeb ? 10 : 5) : 0,
                paddingRight: isWeb ? 8 : 0,
                color: isRowActive ? TAB_ACCENT : navColor,
            }}
        >
            {text}
        </Text>
    );
}

function webSidebarIconColor(
    isWeb: boolean,
    activeTab: SidebarTabId,
    thisTab: SidebarTabId,
    navigationTint: string,
) {
    return isWeb && activeTab === thisTab ? TAB_ACCENT : navigationTint;
}

function WebStoreManagerTabBarButton(props: BottomTabBarButtonProps) {
    const route = useRoute();
    const pathname = usePathname();
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

type WebStoreManagerSidebarTabBarProps = BottomTabBarProps & { isDark: boolean };

function WebStoreManagerSidebarTabBar({ isDark, ...props }: WebStoreManagerSidebarTabBarProps) {
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
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: WEB_SIDEBAR_BRAND_PADDING_X,
                    paddingTop: 14,
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

export default function StoreManagerLayout() {
    const { t: translate } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    const path = withTrailingSlash(pathname);
    const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
    const { } = useDeviceSession(currentUserId);

    const activeTab = activeSidebarTabFromPath(path);
    const storesRowActive = activeTab === "stores";

    useEffect(() => {
        const verifyAccess = async () => {
            try {
                const {
                    data: { user },

                } = await supabase.auth.getUser();
                if (!user) return;

                const roleType = await getRoleTypeForUser(user.id);
                if (roleType !== "manager" && roleType !== "store_owner") {
                    if (roleType === "super_admin") {
                        router.replace("/(super_admin)");
                    } else if (roleType === "front_desk") {
                        router.replace(getWebAdjustedHomeRoute("/(front_desk)") as any);
                    } else {
                        router.replace(getWebAdjustedHomeRoute("/(user)") as any);
                    }
                } else {
                    // valid manager/owner — activate heartbeat by providing userId to the hook
                    setCurrentUserId(user.id);
                }
            } catch {
                router.replace(getWebAdjustedHomeRoute("/(user)") as any);
            }
        };
        verifyAccess();
    }, [router]);

    const isWeb = Platform.OS === "web";

    const renderWebTabBar = useCallback(
        (barProps: BottomTabBarProps) => (
            <WebStoreManagerSidebarTabBar {...barProps} isDark={isDark} />
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
                          backgroundColor: isDark ? "#262626" : "#FFFFFF",
                          borderTopColor: isDark ? "#404040" : "#e5e5e5",
                          height: Platform.OS === "ios" ? 88 : 60 + insets.bottom,
                          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                          elevation: 0,
                      },
                tabBarActiveTintColor: TAB_ACCENT,
                tabBarInactiveTintColor: isDark ? "#737373" : "#8B8D98",
                tabBarButton: isWeb
                    ? (btnProps) => <WebStoreManagerTabBarButton {...btnProps} />
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
                    title: translate("label.dashboard"),
                    tabBarIcon: ({ color, size }) => (
                        <LayoutDashboard
                            size={
                                isWeb
                                    ? WEB_TAB_ICON_SIZE
                                    : Platform.OS === "android"
                                      ? 20
                                      : size
                            }
                            color={webSidebarIconColor(isWeb, activeTab, "index", color)}
                        />
                  
                    ),
                    tabBarLabel: isWeb
                        ? ({ color, position }) => (
                              <WebSidebarTabLabel
                                  text={translate("label.dashboard")}
                                  navColor={color}
                                  position={position}
                                  isRowActive={activeTab === "index"}
                              />
                          )
                        : undefined,
                }}
            />
            <Tabs.Screen
                name="stores"
                options={{
                    title: translate("store_manager.tabs.stores"),
                    tabBarIcon: ({ color, size }) => (
                        <Store
                            size={
                                isWeb
                                    ? WEB_TAB_ICON_SIZE
                                    : Platform.OS === "android"
                                      ? 20
                                      : size
                            }
                            color={storesRowActive ? TAB_ACCENT : color}
                        />
                    ),
                    tabBarLabel: ({ color, position }) => (
                        <StoresTabLabel
                            text={translate("store_manager.tabs.stores")}
                            navColor={color}
                            position={position}
                            isRowActive={storesRowActive}
                            isWeb={isWeb}
                            insetBottom={insets.bottom}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: translate("label.transactions"),
                    tabBarIcon: ({ color, size }) => (
                        <ArrowLeftRight
                            size={
                                isWeb
                                    ? WEB_TAB_ICON_SIZE
                                    : Platform.OS === "android"
                                      ? 20
                                      : size
                            }
                            color={webSidebarIconColor(
                                isWeb,
                                activeTab,
                                "transactions",
                                color,
                            )}
                        />
                    ),
                    tabBarLabel: isWeb
                        ? ({ color, position }) => (
                              <WebSidebarTabLabel
                                  text={translate("label.transactions")}
                                  navColor={color}
                                  position={position}
                                  isRowActive={activeTab === "transactions"}
                              />
                          )
                        : undefined,
                }}
            />
            <Tabs.Screen
                name="subscription"
                options={{
                    title: translate("store_manager.tabs.subscription"),
                    tabBarIcon: ({ color, size }) => (
                        <CreditCard
                            size={
                                isWeb
                                    ? WEB_TAB_ICON_SIZE
                                    : Platform.OS === "android"
                                      ? 20
                                      : size
                            }
                            color={webSidebarIconColor(
                                isWeb,
                                activeTab,
                                "subscription",
                                color,
                            )}
                        />
                    ),
          
                    tabBarLabel: isWeb
                        ? ({ color, position }) => (
                              <WebSidebarTabLabel
                                  text={translate("store_manager.tabs.subscription")}
                                  navColor={color}
                                  position={position}
                                  isRowActive={activeTab === "subscription"}
                              />
                          )
                        : undefined,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: translate("label.settings"),
                    tabBarIcon: ({ color, size }) => (
                        <Settings
                            size={
                                isWeb
                                    ? WEB_TAB_ICON_SIZE
                                    : Platform.OS === "android"
                                      ? 20
                                      : size
                            }
                            color={webSidebarIconColor(
                                isWeb,
                                activeTab,
                                "settings",
                                color,
                            )}
                        />
                    ),
              
                    tabBarLabel: isWeb
                        ? ({ color, position }) => (
                              <WebSidebarTabLabel
                                  text={translate("label.settings")}
                                  navColor={color}
                                  position={position}
                                  isRowActive={activeTab === "settings"}
                              />
                          )
                        : undefined,
                }}
            />
            <Tabs.Screen name="profile" options={{ href: null }} />
            <Tabs.Screen name="store/create-store" options={{ href: null }} />
            <Tabs.Screen name="view-store/[id]" options={{ href: null }} />
            <Tabs.Screen name="streak/index" options={{ href: null }} />
            <Tabs.Screen name="streak/configure-streaks" options={{ href: null }} />
            <Tabs.Screen name="stamp/configure-stamp" options={{ href: null }} />
            <Tabs.Screen name="stamp/index" options={{ href: null }} />
            <Tabs.Screen name="reward/index" options={{ href: null }} />
            <Tabs.Screen name="reward/add-rewards" options={{ href: null }} />
            <Tabs.Screen name="reward/view-reward" options={{ href: null }} />
            <Tabs.Screen name="qr/index" options={{ href: null }} />
            <Tabs.Screen name="qr/configure-qr" options={{ href: null }} />
            <Tabs.Screen name="staff/index" options={{ href: null }} />
            <Tabs.Screen name="staff/add-staff" options={{ href: null }} />
            <Tabs.Screen name="detail/index" options={{ href: null }} />
            <Tabs.Screen name="detail/edit-details" options={{ href: null }} />
            <Tabs.Screen name="chat-support" options={{ href: null, tabBarStyle: { display: "none" } }} />
        </Tabs>
    );
}
