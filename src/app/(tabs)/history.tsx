import React, { useState } from "react";
import { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  AnimatedView,
  SafeAreaView,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
} from "../../tw";

const TABS = ["All", "Earned", "Claimed"];

export default function History() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <AnimatedView entering={FadeInDown.duration(400)}>
        {/* Top bar */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 16,
            backgroundColor: "#FFFFFF",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: "Poppins-Bold",
                  fontSize: 26,
                  color: "#0F172A",
                  lineHeight: 32,
                }}
              >
                Activity
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 13,
                  color: "#94A3B8",
                  marginTop: 2,
                }}
              >
                Track your rewards journey
              </Text>
            </View>

            {/* Points Badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFF4ED",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 50,
                borderWidth: 1.5,
                borderColor: "#FFD4B3",
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 14 }}>⭐</Text>
              <Text
                style={{
                  fontFamily: "Poppins-Bold",
                  fontSize: 14,
                  color: "#FF6600",
                }}
              >
                2,450
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 12,
                  color: "#FF6600",
                  opacity: 0.8,
                }}
              >
                pts
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <StatChip label="Total Earned" value="+3,750" color="#22C55E" bg="#F0FDF4" />
            <StatChip label="Total Spent" value="-1,300" color="#EF4444" bg="#FEF2F2" />
            <StatChip label="This Week" value="+227" color="#FF6600" bg="#FFF4ED" />
          </View>

          {/* Segmented Control */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#F8FAFC",
              padding: 4,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            {TABS.map((tab, i) => {
              const isActive = activeTab === i;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(i)}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 11,
                    alignItems: "center",
                    backgroundColor: isActive ? "#FF6600" : "transparent",
                    shadowColor: isActive ? "#FF6600" : "transparent",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isActive ? 0.25 : 0,
                    shadowRadius: 6,
                    elevation: isActive ? 4 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: isActive ? "Poppins-SemiBold" : "Poppins-Medium",
                      fontSize: 13,
                      color: isActive ? "#FFFFFF" : "#8B8D98",
                    }}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Subtle divider */}
        <View style={{ height: 1, backgroundColor: "#F1F5F9", marginHorizontal: 0 }} />
      </AnimatedView>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* TODAY */}
        <AnimatedView entering={FadeInUp.delay(100).duration(500)}>
          <SectionLabel label="Today" />
          <View style={{ gap: 4 }}>
            <HistoryItem
              title="The Daily Brew"
              subtitle="Purchase Points"
              time="10:24 AM"
              points="+45"
              positive
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuB5UrWxqFKu85Q6t5k1XYZX5msC9nEcivRLk_W8Egr5k12jVaYNYvQ1Q5wh_w7lzH0J6q9RJFJv1_rla_RVoS_QYDE5YKHkVRanYFOlk3kIv27V41DeqICTsa-dXdiVRHJTSDtZwL6DpyIkYTzBXGh-MEPn-yUZp34ClrLZSxdDkdCz3UgOMu8ok-Gf0-YR1lIJ1vEe-2Szd54GnwwHxg14sJJ6JT-1cv4y4N74zcpTZMwjzJo6rn4UHn8e1cefHZ6X_Be4qJoyXQ"
              tag="Purchase"
              tagColor="#FF6600"
            />
            <HistoryItem
              title="Burger Hub"
              subtitle="Redeemed Burger"
              time="08:15 AM"
              points="-800"
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuCDzVbbcDnW0KxdXyzYto5A0eD3-MrP-HJyQuJ16GJWpd8LXKUo5Fndi_Ifv3ShnX0mqyNijarrU4eVmtQeqq3pNto-Ho2-d5QqJMvZw8AQSkuKiEO3GlpYlCX_fRKgXKtLei5HXTcAwbBzR8JaocCw_2-YnssPSnELptffzKui7ClKlpMLtqcded1E2fm59P9sYC1Kh4wgNuGcbq9t7QKDBoGy0wABF9xGh2YUQq9qxJM7tpCn8otxtJSxsmGafagpq3TKXKcYHg"
              tag="Redeemed"
              tagColor="#EF4444"
            />
          </View>
        </AnimatedView>

        {/* YESTERDAY */}
        <AnimatedView entering={FadeInUp.delay(200).duration(500)}>
          <SectionLabel label="Yesterday" />
          <View style={{ gap: 4 }}>
            <HistoryItem
              title="System Reward"
              subtitle="7-Day Streak Bonus"
              time=""
              points="+150"
              positive
              icon="🔥"
              tag="Streak"
              tagColor="#FF6600"
            />
            <HistoryItem
              title="Bella Bakery"
              subtitle="Purchase Points"
              time="4:30 PM"
              points="+32"
              positive
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuBMNKkMJqZhTJ3-sPoTS6RM5-3PofP5W9h3KKmZ5ButaYD7bcOSj_VPOLGbRXT9CL_9dPR0k3rYPpU-dgHvEUaFL8Sv9bCB-qZz517H4LgXnNbg7SXNn5xHZSPQdzWufMp0Q_SqSAli49mnZ92bwiV3T2_KUenYkcmojk3vdeIToslg5SKCPGMs7Pn7khoMuxWOswEWEjP-TZ465YdtWBUGRxH2yghWPhyBX-I4mpXitqA5iuhHGk5N7BM2EoMIQITg2wpnKf4ORw"
              tag="Purchase"
              tagColor="#FF6600"
            />
          </View>
        </AnimatedView>

        {/* OCTOBER 14 */}
        <AnimatedView entering={FadeInUp.delay(300).duration(500)}>
          <SectionLabel label="October 14" />
          <View style={{ gap: 4 }}>
            <HistoryItem
              title="Iron Gym"
              subtitle="Location Check-in"
              time="6:00 AM"
              points="+10"
              positive
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuCkbOOvlwTwDNwhkROLzoIwvBgyEScWV8Flwxtl3QlyNWfSuOfeWFjRwsXD-G0_G2HRxeyOg7oK9dfzvtzqfRzDahy1xdLfHj5vqDkbwHfvasndc16rHw3wXCywrQoNY5unEh4cHmFofmUrPv0XH2Pglbt-QLgU-UBRRB6BxxatssPU2fqevQub5yoetDMEoHOJpCuyT9jy0AT7qfAI5GIKkk0ttASL1eL5y9p8msRE6sOrEKMU-G_1E8X-pcms3LLSa4a3wLICQw"
              tag="Check-in"
              tagColor="#22C55E"
            />
            <HistoryItem
              title="Zen Studio"
              subtitle="Discount Voucher"
              time="11:45 AM"
              points="-500"
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuCWjyL0GY6w2llQQhUrAZYxiS9wzf9Zkww8zwknp6802tWHgFiGobSBFCYQgC7SSJsNkbeZ_NBfE7a8NTlYfUVy_28_afCiqDppV1HJBEKJ03NtqamvYGXLia5m3Yy_7dkIOa4MuDo3Am49S5HSFj4a1N4QphPqVHiQ99eY-kbwtNyTCmrMRAQr11NN6FtrQq7oRt9lAjtgbcPxOCGLZx4jm8-tndrGLx9MHn6yPsn8w4XvoPae2wYDals8hmRBNtE7ZPKqaNZXeQ"
              tag="Voucher"
              tagColor="#8B8D98"
            />
          </View>
        </AnimatedView>

        {/* LOAD MORE */}
        <TouchableOpacity
          style={{
            marginTop: 28,
            paddingVertical: 16,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: "#E2E8F0",
            borderStyle: "dashed",
            alignItems: "center",
            backgroundColor: "#F8FAFC",
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-Medium",
              fontSize: 13,
              color: "#94A3B8",
            }}
          >
            Load older activity
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* Section Label */
function SectionLabel({ label }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 28,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          color: "#94A3B8",
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: "#F1F5F9" }} />
    </View>
  );
}

/* Stat Chip */
function StatChip({ label, value, color, bg }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 10,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 14,
          color: color,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: "Poppins-Regular",
          fontSize: 10,
          color: "#94A3B8",
          marginTop: 1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/* History Item */
function HistoryItem({ title, subtitle, time, points, positive, image, icon, tag, tagColor }) {
  const isPositive = positive;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 14,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      {/* Left: icon + info */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        {/* Avatar */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: "#F8FAFC",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {image ? (
            <Image source={{ uri: image }} style={{ width: "100%", height: "100%" }} />
          ) : (
            <Text style={{ fontSize: 22 }}>{icon}</Text>
          )}
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 14,
                color: "#0F172A",
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {/* Tag pill */}
            <View
              style={{
                backgroundColor: tagColor + "18",
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-Medium",
                  fontSize: 10,
                  color: tagColor,
                }}
              >
                {tag}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 12,
                color: "#8B8D98",
              }}
            >
              {subtitle}
            </Text>
            {time ? (
              <>
                <Text style={{ color: "#CBD5E1", fontSize: 10 }}>•</Text>
                <Text
                  style={{
                    fontFamily: "Poppins-Regular",
                    fontSize: 12,
                    color: "#94A3B8",
                  }}
                >
                  {time}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </View>

      {/* Points */}
      <View style={{ alignItems: "flex-end", gap: 3 }}>
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 16,
            color: isPositive ? "#22C55E" : "#EF4444",
          }}
        >
          {points}
        </Text>
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 10,
            color: "#94A3B8",
          }}
        >
          points
        </Text>
      </View>
    </View>
  );
}