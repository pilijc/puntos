import { Tabs } from "expo-router";
import { AppState, useColorScheme, Platform, Text, View, Image, useWindowDimensions } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "expo-router";
import { BottomTabBar, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";

import { supabase } from "@/supabase/supabase";
import { getRoleTypeForUser, getWebAdjustedHomeRoute } from "@/services/access-service";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Store, ArrowLeftRight, Settings, CreditCard, PanelLeft, PanelLeftClose } from "lucide-react-native";
import { useDeviceSession } from "@/hooks/store-manager/use-device-session";
import { useAuthActions } from "@/hooks/use-auth-actions";
import { useManagerStoresStore } from "@/store/manager-stores-store";
import { useSupportChatStore } from "@/store/support-chat-store";
import { getManagerSubscription, getSubscriptionPlans } from "@/services/store-manager/subscription-service";
import { isPaidUnlimitedPlan } from "@/services/store-manager/subscription-limits";
import { getQueryClient } from "@/lib/query-client";
import { storeManagerKeys } from "@/hooks/store-manager/rq/query-keys";
import { lockExtraOwnerStores } from "@/services/store-service";
import { Modal } from "@/components/modal";
import { refreshDeviceHeartbeatService } from "@/services/store-manager/device-session-service";
import { SESSION_TIMEOUT_MS } from "@/type/store-manager/device-session";
import { useAppearanceStore } from "@/store/appearance-store";
import { useIsDark } from "@/hooks/use-is-dark";
import { logger } from "@/utils/logger";

const WEB_SIDEBAR_WIDTH = 260;
const WEB_SIDEBAR_COLLAPSED_WIDTH = 76;
const WEB_SIDEBAR_INSET_X = 16;
const WEB_TAB_ICON_SIZE = 18;
const WEB_TAB_ACTIVE_BG_LIGHT = "#F3F4F6";
const WEB_TAB_ACTIVE_BG_DARK = "rgba(255, 102, 0, 0.1)";
const WEB_SIDEBAR_BORDER_LIGHT = "#F1F5F9";
const WEB_SIDEBAR_BORDER_DARK = "#404040";
const TAB_ACCENT = "#FF6600";
const IDLE_LOGOUT_GRACE_MS = 60 * 1000;
const IDLE_WARNING_MS = Math.max(SESSION_TIMEOUT_MS - IDLE_LOGOUT_GRACE_MS, 1000);
const ACTIVITY_THROTTLE_MS = 10 * 1000;

type SidebarTabId = "index" | "stores" | "transactions" | "subscription" | "settings";
type TabLabelPosition = "beside-icon" | "below-icon";
type WebSidebarMode = "collapsed" | "normal";

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

function getTabIcon(routeName: string, color: string, size: number): React.ReactNode {
    switch (routeName) {
        case "index":        return <LayoutDashboard size={size} color={color} />;
        case "stores":       return <Store            size={size} color={color} />;
        case "transactions": return <ArrowLeftRight   size={size} color={color} />;
        case "subscription": return <CreditCard       size={size} color={color} />;
        case "settings":     return <Settings         size={size} color={color} />;
        default:             return null;
    }
}

type WebStoreManagerSidebarTabBarProps = BottomTabBarProps & {
    isDark: boolean;
    mode: WebSidebarMode;
    onHoverIn: () => void;
    onHoverOut: () => void;
    onToggleCollapse: () => void;
};

const HIDDEN_SCREENS = new Set([
    "profile", "store/create-store", "view-store/[id]",
    "streak/index", "streak/configure-streaks", "stamp/configure-stamp",
    "stamp/index", "reward/index", "reward/add-rewards", "reward/view-reward",
    "qr/index", "qr/configure-qr", "staff/index", "staff/add-staff",
    "detail/index", "detail/edit-details", "chat-support", "manager-inbox",
]);

function WebStoreManagerSidebarTabBar({
    isDark,
    mode,
    onHoverIn,
    onHoverOut,
    onToggleCollapse,
    state,
    descriptors,
    navigation,
}: WebStoreManagerSidebarTabBarProps) {
    const { t: translate } = useTranslation();
    const pathname = usePathname();
    const { width: windowWidth } = useWindowDimensions();
    const isMobileWeb = windowWidth < 768;
    const chromeBg = isDark ? "#262626" : "#FFFFFF";
    const expandedWidth = isMobileWeb ? windowWidth : WEB_SIDEBAR_WIDTH;
    const sidebarWidth = mode === "normal" ? expandedWidth : WEB_SIDEBAR_COLLAPSED_WIDTH;
    const activeTab = activeSidebarTabFromPath(withTrailingSlash(pathname));
    const activeBackground = isDark ? WEB_TAB_ACTIVE_BG_DARK : WEB_TAB_ACTIVE_BG_LIGHT;
    const inactiveColor = isDark ? "#737373" : "#8B8D98";
    const px = WEB_SIDEBAR_INSET_X;

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
            <View style={{ width: expandedWidth, flex: 1, flexDirection: "column" }}>
            {/* ── Brand header ── */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingLeft: 19, // Centers logo at 37px (19 + 18)
                    paddingTop: 20,
                    paddingBottom: 20,
                }}
            >
                <Image
                    source={require("@/assets/images/puntos-icon.png")}
                    style={{ width: 36, height: 36 }}
                    resizeMode="contain"
                />
                <Text style={{ 
                    fontSize: 18, 
                    fontFamily: "Poppins-Bold", 
                    color: isDark ? "#FFFFFF" : TAB_ACCENT,
                    marginStart: 12,
                    opacity: mode === "collapsed" ? 0 : 1,
                    transitionProperty: "opacity",
                    transitionDuration: "180ms",
                } as any}>
                    PUNTOS
                </Text>
            </View>



            {/* ── Nav items ── */}
            <View style={{ flex: 1, paddingHorizontal: px, paddingTop: 8 }}>
                {visibleRoutes.map((route) => {
                    const options = descriptors[route.key]?.options ?? {};
                    const isActive = activeTab === route.name;
                    const iconColor = isActive ? TAB_ACCENT : inactiveColor;
                    const badge = (options as any).tabBarBadge;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: "tabPress" as any,
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (isMobileWeb && mode === "normal") {
                            onToggleCollapse();
                        }

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
                                width: mode === "collapsed" ? 42 : "100%",
                                overflow: "hidden",
                                transitionProperty: "width, background-color",
                                transitionDuration: "180ms",
                            } as any}
                        >
                            {/* Icon + optional badge */}
                            <View style={{ width: 18, alignItems: 'center', justifyContent: 'center', position: "relative" }}>
                                {getTabIcon(route.name, iconColor, WEB_TAB_ICON_SIZE)}
                                {badge != null && (
                                    <View style={{
                                        position: "absolute", top: -4, right: -8,
                                        backgroundColor: TAB_ACCENT, borderRadius: 8,
                                        minWidth: 16, height: 16,
                                        alignItems: "center", justifyContent: "center",
                                        paddingHorizontal: 3,
                                    }}>
                                        <Text style={{ color: "#fff", fontSize: 9, fontFamily: "Poppins-Medium" }}>
                                            {badge}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Label (expanded only) */}
                            <Text
                                numberOfLines={1}
                                style={{
                                    fontSize: 12,
                                    fontFamily: "Poppins-Medium",
                                    marginStart: 10,
                                    color: isActive ? TAB_ACCENT : inactiveColor,
                                    opacity: mode === "collapsed" ? 0 : 1,
                                    transitionProperty: "opacity",
                                    transitionDuration: "180ms",
                                } as any}
                            >
                                {String(options.title ?? route.name)}
                            </Text>
                        </PlatformPressable>
                    );
                })}
            </View>

            {/* ── Footer / Toggle ── */}
            <View
                style={{
                    paddingBottom: 24,
                    paddingTop: 16,
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 28, height: 44 }}>
                    <PlatformPressable
                        onPress={onToggleCollapse}
                        hoverEffect={undefined}
                        style={{ flexDirection: "row", alignItems: "center", height: 44 }}
                    >
                        <View style={{ width: 18, alignItems: "center" }}>
                            {mode === "collapsed" ? (
                                <PanelLeft size={18} color={isDark ? "#A3A3A3" : "#6B7280"} />
                            ) : (
                                <PanelLeftClose size={18} color={isDark ? "#A3A3A3" : "#6B7280"} />
                            )}
                        </View>
                        <Text
                            numberOfLines={1}
                            style={{
                                marginStart: 12,
                                fontSize: 12,
                                fontFamily: "Poppins-Medium",
                                color: isDark ? "#A3A3A3" : "#6B7280",
                                opacity: mode === "collapsed" ? 0 : 1,
                                transitionProperty: "opacity",
                                transitionDuration: "180ms",
                            } as any}
                        >
                            {translate("layout.collapseSidebar", "Collapse")}
                        </Text>
                    </PlatformPressable>
                </View>
            </View>
            </View>
        </View>
    );
}

export default function StoreManagerLayout() {
    const { t: translate } = useTranslation();
    const isDark = useIsDark();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    const path = withTrailingSlash(pathname);
    const { handleLogout } = useAuthActions();
    const handleLogoutRef = useRef(handleLogout);
    const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
    const [webSidebarMode, setWebSidebarMode] = useState<WebSidebarMode>("collapsed");
    const [idleWarningVisible, setIdleWarningVisible] = useState(false);
    const [idleWarningHasCountdown, setIdleWarningHasCountdown] = useState(true);
    const [idleCountdown, setIdleCountdown] = useState(IDLE_LOGOUT_GRACE_MS / 1000);
    const idleWarningVisibleRef = useRef(false);
    const idleWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const idleLogoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const idleCountdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastActivityRecordedAtRef = useRef(0);
    const { } = useDeviceSession(currentUserId);

    // Bootstrap support chat so unread count shows in settings
    const stores = useManagerStoresStore((state) => state.stores);
    const fetchStores = useManagerStoresStore((state) => state.fetchStores);
    const { loadAllManagerConversations, conversations, subscribeInbox, cleanupRealtime } = useSupportChatStore();
    const [didEnforceStoreLocks, setDidEnforceStoreLocks] = useState(false);

    useEffect(() => {
        handleLogoutRef.current = handleLogout;
    }, [handleLogout]);

    useEffect(() => {
        idleWarningVisibleRef.current = idleWarningVisible;
    }, [idleWarningVisible]);

    const clearIdleTimers = useCallback(() => {
        if (idleWarningTimerRef.current) {
            clearTimeout(idleWarningTimerRef.current);
            idleWarningTimerRef.current = null;
        }
        if (idleLogoutTimerRef.current) {
            clearTimeout(idleLogoutTimerRef.current);
            idleLogoutTimerRef.current = null;
        }
        if (idleCountdownTimerRef.current) {
            clearInterval(idleCountdownTimerRef.current);
            idleCountdownTimerRef.current = null;
        }
    }, []);

    const handleIdleLogout = useCallback(async () => {
        clearIdleTimers();
        setIdleWarningVisible(false);
        await handleLogoutRef.current();
    }, [clearIdleTimers]);

    const showIdleWarning = useCallback((withCountdown = true) => {
        setIdleCountdown(IDLE_LOGOUT_GRACE_MS / 1000);
        setIdleWarningHasCountdown(withCountdown);
        setIdleWarningVisible(true);

        if (!withCountdown) return;

        idleCountdownTimerRef.current = setInterval(() => {
            setIdleCountdown((seconds) => Math.max(seconds - 1, 0));
        }, 1000);

        idleLogoutTimerRef.current = setTimeout(() => {
            void handleIdleLogout();
        }, IDLE_LOGOUT_GRACE_MS);
    }, [handleIdleLogout]);

    const scheduleIdleWarning = useCallback((delayMs = IDLE_WARNING_MS) => {
        if (!currentUserId) return;
        if (idleWarningTimerRef.current) {
            clearTimeout(idleWarningTimerRef.current);
        }
        idleWarningTimerRef.current = setTimeout(() => showIdleWarning(true), Math.max(delayMs, 1000));
    }, [currentUserId, showIdleWarning]);

    const recordActivity = useCallback(() => {
        if (!currentUserId || idleWarningVisibleRef.current) return;
        const now = Date.now();
        if (now - lastActivityRecordedAtRef.current < ACTIVITY_THROTTLE_MS) return;

        lastActivityRecordedAtRef.current = now;
        scheduleIdleWarning();
    }, [currentUserId, scheduleIdleWarning]);

    const handleStaySignedIn = useCallback(async () => {
        if (!currentUserId) return;

        clearIdleTimers();
        setIdleWarningVisible(false);
        setIdleWarningHasCountdown(true);
        setIdleCountdown(IDLE_LOGOUT_GRACE_MS / 1000);

        try {
            await refreshDeviceHeartbeatService(currentUserId);
        } finally {
            lastActivityRecordedAtRef.current = Date.now();
            scheduleIdleWarning();
        }
    }, [clearIdleTimers, currentUserId, scheduleIdleWarning]);

    useEffect(() => {
        if (!currentUserId) {
            clearIdleTimers();
            setIdleWarningVisible(false);
            setIdleWarningHasCountdown(true);
            return;
        }

        lastActivityRecordedAtRef.current = Date.now();
        scheduleIdleWarning();

        return clearIdleTimers;
    }, [clearIdleTimers, currentUserId, scheduleIdleWarning]);

    useEffect(() => {
        if (!currentUserId) return;

        const sub = AppState.addEventListener("change", (state) => {
            if (state !== "active") {
                clearIdleTimers();
                if (idleWarningVisibleRef.current) {
                    setIdleWarningHasCountdown(false);
                }
                return;
            }

            if (idleWarningVisibleRef.current) return;

            const idleMs = Date.now() - lastActivityRecordedAtRef.current;
            if (idleMs >= IDLE_WARNING_MS) {
                clearIdleTimers();
                showIdleWarning(false);
                return;
            }

            scheduleIdleWarning(IDLE_WARNING_MS - idleMs);
        });

        return () => sub.remove();
    }, [clearIdleTimers, currentUserId, scheduleIdleWarning, showIdleWarning]);

    useEffect(() => {
        if (Platform.OS !== "web" || typeof window === "undefined") return;

        const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
        events.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));

        return () => {
            events.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
        };
    }, [recordActivity]);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    useEffect(() => {
        const enforceStoreLocksIfNeeded = async () => {
            if (!currentUserId) return;
            if (didEnforceStoreLocks) return;
            if (!stores?.length) return;

            try {
                const ownedStores = stores.filter((s) => String(s.owner_id ?? "") === String(currentUserId));
                if (ownedStores.length <= 1) {
                    setDidEnforceStoreLocks(true);
                    return;
                }

                const qc = getQueryClient();
                const [plans, managerRow] = await Promise.all([
                    qc.fetchQuery({
                        queryKey: storeManagerKeys.subscriptionPlans(),
                        queryFn: getSubscriptionPlans,
                    }),
                    qc.fetchQuery({
                        queryKey: storeManagerKeys.managerSubscription(currentUserId),
                        queryFn: () => getManagerSubscription(currentUserId),
                    }),
                ]);

                const planListForGate = (plans ?? []) as Array<{ id: number; slug?: string | null }>;
                const isEntitled = isPaidUnlimitedPlan(managerRow, planListForGate);
                if (isEntitled) {
                    setDidEnforceStoreLocks(true);
                    return;
                }

                // Free plan: keep one owned store unlocked, lock the rest (DB-backed).
                // Preference: a store already unlocked; otherwise most recently created.
                const unlockedCandidate =
                    ownedStores.find((s) => s.billing_suspended === false) ??
                    ownedStores
                        .slice()
                        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];

                const keepId = unlockedCandidate?.id;
                if (keepId == null) {
                    setDidEnforceStoreLocks(true);
                    return;
                }

                await lockExtraOwnerStores({ ownerId: currentUserId, unlockedStoreId: keepId });
                await fetchStores(true);
                setDidEnforceStoreLocks(true);
            } catch (e) {
                // If this fails, we don't want to block navigation; server-side/RLS should still protect critical writes.
                logger.warn("[subscription] store lock enforcement failed:", (e as any)?.message ?? e);
            }
        };

        void enforceStoreLocksIfNeeded();
    }, [currentUserId, didEnforceStoreLocks, fetchStores, stores]);

    useEffect(() => {
        if (!currentUserId) return;
        loadAllManagerConversations(currentUserId);
    }, [currentUserId, loadAllManagerConversations]);

    useEffect(() => {
        subscribeInbox();
        return () => cleanupRealtime();
    }, [subscribeInbox, cleanupRealtime]);

    const activeTab = activeSidebarTabFromPath(path);
    const storesRowActive = activeTab === "stores";
    const chatUnread = conversations.reduce((sum, c) => sum + (c.unread_store_count ?? 0), 0);

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
                    // Enforce session limit on direct navigation bypass
                    const { getHomeRouteForUserId } = require("@/services/access-service");
                    const { registerDeviceSessionForRoute } = require("@/services/shared/device-session-route-service");
                    const nextRoute = getWebAdjustedHomeRoute(await getHomeRouteForUserId(user.id));
                    const sessionCheck = await registerDeviceSessionForRoute(user.id, nextRoute);
                    if (!sessionCheck.allowed) {
                        await handleLogoutRef.current();
                        return;
                    }
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
            <WebStoreManagerSidebarTabBar
                {...barProps}
                isDark={isDark}
                mode={webSidebarMode}
                onHoverIn={() => {}}
                onHoverOut={() => {}}
                onToggleCollapse={() => {
                    setWebSidebarMode((m) => {
                        return m === "collapsed" ? "normal" : "collapsed";
                    });
                }}
            />
        ),
        [isDark, webSidebarMode],
    );

    return (
        <View style={{ flex: 1 }} onTouchStart={recordActivity}>
            <Tabs
                initialRouteName="index"
                tabBar={isWeb ? renderWebTabBar : undefined}
                screenOptions={{
                headerShown: false,
                tabBarPosition: isWeb ? "left" : "bottom",
                tabBarLabelPosition: isWeb ? "beside-icon" : undefined,
                ...(isWeb ? { animation: "none" as const } : {}),
                tabBarStyle: isWeb
                    ? { display: "none" }
                    : {
                          backgroundColor: isDark ? "#262626" : "#FFFFFF",
                          borderTopColor: isDark ? "#404040" : "#e5e5e5",
                          height: Platform.OS === "ios" ? 88 : 60 + insets.bottom,
                          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                          elevation: 0,
                      },
                tabBarActiveTintColor: TAB_ACCENT,
                tabBarInactiveTintColor: isDark ? "#737373" : "#8B8D98",
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
                        ? ({ color, position }) => webSidebarMode !== "collapsed" ? (
                              <WebSidebarTabLabel
                                  text={translate("label.dashboard")}
                                  navColor={color}
                                  position={position}
                                  isRowActive={activeTab === "index"}
                              />
                          ) : null
                        : undefined,
                }}
            />
            <Tabs.Screen
                name="stores"
                options={{
                    title: translate("storeManager.tabs.stores"),
                    tabBarIcon: ({ color, size }) => (
                        <Store
                            size={isWeb ? WEB_TAB_ICON_SIZE : Platform.OS === "android" ? 20 : size}
                            color={storesRowActive ? TAB_ACCENT : color}
                        />
                    ),
                    tabBarLabel: isWeb
                        ? ({ color, position }) => webSidebarMode !== "collapsed" ? (
                            <StoresTabLabel
                                text={translate("storeManager.tabs.stores")}
                                navColor={color}
                                position={position}
                                isRowActive={storesRowActive}
                                isWeb={isWeb}
                                insetBottom={insets.bottom}
                            />
                        ) : null
                    : undefined,
                }}
            />

            <Tabs.Screen
                name="subscription"
                options={{
                    title: translate("storeManager.tabs.subscription"),
                    tabBarIcon: ({ color, size }) => (
                        <CreditCard
                            size={isWeb ? WEB_TAB_ICON_SIZE : Platform.OS === "android" ? 20 : size}
                            color={webSidebarIconColor(isWeb, activeTab, "subscription", color)}
                        />
                    ),
                    tabBarLabel: isWeb
                        ? ({ color, position }) => webSidebarMode !== "collapsed" ? (
                              <WebSidebarTabLabel
                                  text={translate("storeManager.tabs.subscription")}
                                  navColor={color}
                                  position={position}
                                  isRowActive={activeTab === "subscription"}
                              />
                          ) : null
                        : undefined,
                }}
            />

            <Tabs.Screen
                name="transactions"
                options={{
                    title: translate("label.transactions"),
                    tabBarIcon: ({ color, size }) => (
                        <ArrowLeftRight
                            size={isWeb ? WEB_TAB_ICON_SIZE : Platform.OS === "android" ? 20 : size}
                            color={webSidebarIconColor(isWeb, activeTab, "transactions", color)}
                        />
                    ),
                    tabBarLabel: isWeb
                        ? ({ color, position }) => webSidebarMode !== "collapsed" ? (
                              <WebSidebarTabLabel
                                  text={translate("label.transactions")}
                                  navColor={color}
                                  position={position}
                                  isRowActive={activeTab === "transactions"}
                              />
                          ) : null
                        : undefined,
                }}
            />

            <Tabs.Screen
                name="settings"
                options={{
                    title: translate("label.settings"),
                    tabBarBadge: chatUnread > 0 ? (chatUnread > 99 ? "99+" : chatUnread) : undefined,
                    tabBarBadgeStyle: { backgroundColor: "#FF6600", fontSize: 10 },
                    tabBarIcon: ({ color, size }) => (
                        <Settings
                            size={isWeb ? WEB_TAB_ICON_SIZE : Platform.OS === "android" ? 20 : size}
                            color={webSidebarIconColor(isWeb, activeTab, "settings", color)}
                        />
                    ),
                    tabBarLabel: isWeb
                        ? ({ color, position }) => webSidebarMode !== "collapsed" ? (
                              <WebSidebarTabLabel
                                  text={translate("label.settings")}
                                  navColor={color}
                                  position={position}
                                  isRowActive={activeTab === "settings"}
                              />
                          ) : null
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
            <Tabs.Screen name="chat-support" options={{ href: null, tabBarStyle: isWeb ? undefined : { display: "none" } }} />
                <Tabs.Screen name="manager-inbox" options={{ href: null, tabBarStyle: isWeb ? undefined : { display: "none" } }} />
            </Tabs>
            <Modal
                visible={idleWarningVisible}
                onClose={handleStaySignedIn}
                title={translate("storeManager.sessionTimeout.title")}
                message={
                    idleWarningHasCountdown
                        ? translate("storeManager.sessionTimeout.message", { seconds: idleCountdown })
                        : translate("storeManager.sessionTimeout.resumeMessage")
                }
                showCloseButton={false}
                dismissOnBackdrop={false}
                buttons={[
                    {
                        label: translate("storeManager.sessionTimeout.signOut"),
                        variant: "secondary",
                        onPress: handleIdleLogout,
                    },
                    {
                        label: translate("storeManager.sessionTimeout.staySignedIn"),
                        variant: "primary",
                        onPress: handleStaySignedIn,
                    },
                ]}
            />
        </View>
    );
}
