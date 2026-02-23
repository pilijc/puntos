import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/tw";

const metrics = [
  {
    id: "users",
    icon: "groups" as const,
    value: "12,450",
    label: "TOTAL USERS",
    iconBg: "bg-blue-100",
    iconColor: "#3B82F6",
  },
  {
    id: "stores",
    icon: "storefront" as const,
    value: "84",
    label: "ACTIVE STORES",
    iconBg: "bg-green-100",
    iconColor: "#22C55E",
  },
];

const users = [
  {
    id: "u1",
    name: "Alex Morgan",
    email: "alex.m@example.com",
    avatar: "https://i.pravatar.cc/120?img=12",
  },
  {
    id: "u2",
    name: "Sarah Jenkins",
    email: "s.jenkins88@gmail.com",
    avatar: "https://i.pravatar.cc/120?img=32",
  },
  {
    id: "u3",
    name: "Michael Chen",
    email: "mike.chen@tech.co",
    avatar: "https://i.pravatar.cc/120?img=18",
  },
];

const stores = [
  {
    id: "s1",
    name: "The Coffee Foundry",
    location: "Brooklyn, NY",
    owner: "David Miller",
    staffCount: "4 Staff Members",
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&auto=format&fit=crop&q=60",
    status: "ACTIVE" as const,
    primaryAction: "Edit Details",
    dangerAction: "Deactivate",
  },
  {
    id: "s2",
    name: "Brew & Bean Co.",
    location: "Seattle, WA",
    owner: "Jessica Wong",
    staffCount: "2 Staff Members",
    image:
      "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=300&auto=format&fit=crop&q=60",
    status: "PENDING" as const,
    primaryAction: "Approve",
    dangerAction: "Reject",
  },
];

const storeFilters = ["All Stores", "Active", "Deactivated", "Newest"] as const;
const bottomItems = ["Overview", "Users", "Stores", "Settings"] as const;
const bottomIcons: Record<(typeof bottomItems)[number], React.ComponentProps<typeof MaterialIcons>["name"]> = {
  Overview: "dashboard",
  Users: "groups",
  Stores: "storefront",
  Settings: "settings",
};

const softCardShadow = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
};

function SectionTitle({
  title,
  icon,
}: {
  title: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
}) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center">
        <MaterialIcons name={icon} size={16} color="#FF6600" />
        <Text className="ml-1 text-2xl font-poppins-bold text-textPrimary">{title}</Text>
      </View>
      <TouchableOpacity className="flex-row items-center">
        <Text className="text-xs font-poppins-semibold text-primary">VIEW ALL</Text>
        <MaterialIcons name="chevron-right" size={14} color="#FF6600" />
      </TouchableOpacity>
    </View>
  );
}

function StatusPill({ status }: { status: "ACTIVE" | "PENDING" }) {
  if (status === "ACTIVE") {
    return (
      <View className="px-2 py-1 rounded-md bg-green-100">
        <Text className="text-[10px] font-poppins-bold text-success">ACTIVE</Text>
      </View>
    );
  }

  return (
    <View className="px-2 py-1 rounded-md bg-amber-100">
      <Text className="text-[10px] font-poppins-bold text-amber-700">PENDING</Text>
    </View>
  );
}

export default function SuperAdminHome() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<(typeof storeFilters)[number]>("All Stores");

  return (
    <SafeAreaView className="flex-1 bg-backgroundMuted">
      <ScrollView className="flex-1" contentContainerClassName="pb-36" showsVerticalScrollIndicator={false}>
        <View className="bg-primary rounded-b-[30px] px-4 pt-2 pb-20 overflow-hidden">
          <View className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
          <View className="absolute -bottom-12 -left-10 w-28 h-28 rounded-full bg-white/10" />

          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/15 items-center justify-center">
              <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Text className="text-white text-xl font-poppins-bold">Super Admin</Text>

            <TouchableOpacity className="w-10 h-10 rounded-full bg-white/15 items-center justify-center">
              <MaterialIcons name="notifications-none" size={19} color="#FFFFFF" />
              <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger" />
            </TouchableOpacity>
          </View>

          <View className="mt-5">
            <Text className="text-white text-4xl font-poppins-bold">Dashboard</Text>
            <Text className="mt-1 text-sm text-white/85 font-poppins">Welcome back, Administrator</Text>
          </View>
        </View>

        <View className="px-3 -mt-12">
          <View className="flex-row mb-4" style={{ columnGap: 10 }}>
            {metrics.map((metric) => (
              <View key={metric.id} className="flex-1 bg-white rounded-2xl border border-neutral-200 py-4 items-center" style={softCardShadow}>
                <View className={`w-8 h-8 rounded-full items-center justify-center ${metric.iconBg}`}>
                  <MaterialIcons name={metric.icon} size={16} color={metric.iconColor} />
                </View>
                <Text className="mt-2 text-4xl font-poppins-bold text-textPrimary">{metric.value}</Text>
                <Text className="mt-1 text-[10px] tracking-[1px] font-poppins-semibold text-textMuted">{metric.label}</Text>
              </View>
            ))}
          </View>

          <View className="h-11 rounded-xl bg-white border border-neutral-200 px-3 flex-row items-center mb-5" style={softCardShadow}>
            <MaterialIcons name="search" size={17} color="#94A3B8" />
            <TextInput
              placeholder="Search users, stores, or emails..."
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-2 text-sm font-poppins text-textPrimary"
            />
            <TouchableOpacity className="p-1">
              <MaterialIcons name="tune" size={17} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View className="mb-5">
            <SectionTitle title="Manage Users" icon="person-outline" />

            <View className="rounded-2xl bg-white border border-neutral-200 overflow-hidden" style={softCardShadow}>
              {users.map((user, index) => (
                <View
                  key={user.id}
                  className="px-3 py-3"
                  style={{
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: "#E5E7EB",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View className="flex-row items-center flex-1 pr-2">
                    <Image source={{ uri: user.avatar }} className="w-10 h-10 rounded-full bg-neutral-200" contentFit="cover" />
                    <View className="ml-2.5 flex-1">
                      <Text className="text-sm font-poppins-semibold text-textPrimary">{user.name}</Text>
                      <Text className="text-xs font-poppins text-textMuted">{user.email}</Text>
                    </View>
                  </View>

                  <TouchableOpacity className="bg-danger/10 px-3 py-1.5 rounded-lg">
                    <Text className="text-xs font-poppins-medium text-danger">Block</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View>
            <SectionTitle title="Store Management" icon="storefront" />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerClassName="gap-x-2 pr-4">
              {storeFilters.map((filter) => {
                const active = filter === activeFilter;
                return (
                  <TouchableOpacity
                    key={filter}
                    onPress={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-full ${active ? "bg-primary" : "bg-white border border-neutral-200"}`}
                  >
                    <Text className={`text-xs font-poppins-medium ${active ? "text-white" : "text-neutral-500"}`}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View className="gap-y-3">
              {stores.map((store) => (
                <View key={store.id} className="bg-white rounded-2xl p-3 border border-neutral-200" style={softCardShadow}>
                  <View className="flex-row items-start justify-between mb-2.5">
                    <View className="flex-row items-center flex-1 pr-2">
                      <Image source={{ uri: store.image }} className="w-12 h-12 rounded-lg bg-neutral-200" contentFit="cover" />
                      <View className="ml-2.5 flex-1">
                        <Text className="text-sm font-poppins-bold text-textPrimary">{store.name}</Text>
                        <View className="flex-row items-center mt-0.5">
                          <MaterialIcons name="place" size={11} color="#8B8D98" />
                          <Text className="text-xs font-poppins text-textMuted">{store.location}</Text>
                        </View>
                      </View>
                    </View>

                    <StatusPill status={store.status} />
                  </View>

                  <View className="rounded-lg bg-backgroundMuted p-2.5 flex-row justify-between mb-2.5">
                    <View className="flex-1">
                      <Text className="text-[10px] font-poppins-semibold text-textMuted">OWNER</Text>
                      <Text className="text-xs mt-0.5 font-poppins-medium text-textSecondary">{store.owner}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] font-poppins-semibold text-textMuted">FRONT DESK</Text>
                      <Text className="text-xs mt-0.5 font-poppins-medium text-textSecondary">{store.staffCount}</Text>
                    </View>
                  </View>

                  <View className="flex-row" style={{ columnGap: 8 }}>
                    <TouchableOpacity className="flex-1 py-2 rounded-lg bg-neutral-100 items-center">
                      <Text className="text-xs font-poppins-semibold text-neutral-600">{store.primaryAction}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 py-2 rounded-lg border border-danger/30 items-center">
                      <Text className="text-xs font-poppins-semibold text-danger">{store.dangerAction}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl border-t border-neutral-200 px-6 pt-3 pb-5"
        style={{
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 8,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {bottomItems.map((item, index) => {
          const active = index === 0;
          return (
            <TouchableOpacity key={item} className="w-16 items-center">
              <MaterialIcons name={bottomIcons[item]} size={20} color={active ? "#FF6600" : "#94A3B8"} />
              <Text className={`mt-1 text-[10px] font-poppins-medium ${active ? "text-primary" : "text-textMuted"}`}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
