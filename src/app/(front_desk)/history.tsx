import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";

const mockTransactions = [
    {
        id: "t1",
        name: "Sarah Jenkins",
        date: "Oct 24, 2023",
        time: "10:45 AM",
        amount: 500,
        points: 50,
    },
    {
        id: "t2",
        name: "Marcus Thorne",
        date: "Oct 24, 2023",
        time: "09:32 AM",
        amount: 1200,
        points: 120,
    },
    {
        id: "t3",
        name: "Alex Morgan",
        date: "Oct 24, 2023",
        time: "08:15 AM",
        amount: 300,
        points: 30,
    },
    {
        id: "t4",
        name: "Lena Park",
        date: "Oct 24, 2023",
        time: "11:20 AM",
        amount: 850,
        points: 85,
    },
    {
        id: "t5",
        name: "Carlos Rivera",
        date: "Oct 24, 2023",
        time: "12:05 PM",
        amount: 650,
        points: 65,
    },
    {
        id: "t6",
        name: "Priya Nair",
        date: "Oct 24, 2023",
        time: "01:30 PM",
        amount: 200,
        points: 20,
    },
    {
        id: "t7",
        name: "James Whitfield",
        date: "Oct 24, 2023",
        time: "02:48 PM",
        amount: 1500,
        points: 150,
    },
    {
        id: "t8",
        name: "Sophie Laurent",
        date: "Oct 24, 2023",
        time: "03:10 PM",
        amount: 400,
        points: 40,
    },
    {
        id: "t9",
        name: "David Kim",
        date: "Oct 24, 2023",
        time: "04:22 PM",
        amount: 950,
        points: 95,
    },
    {
        id: "t10",
        name: "Nina Castillo",
        date: "Oct 24, 2023",
        time: "05:05 PM",
        amount: 700,
        points: 70,
    },
];

const totalPtsToday = mockTransactions.reduce((sum, t) => sum + t.points, 0);

export default function FrontDeskHistory() {
    const { t: translate } = useTranslation();

    return (
        <SafeAreaView className="flex-1 bg-slate-100 dark:bg-darkBackground">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Orange Header ── */}
                <View className="bg-primary rounded-b-[35px] px-6 pt-2 pb-6 overflow-hidden relative">
                    {/* Decorative circles */}
                    <View className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-white/10" />
                    <View className="absolute -bottom-12 -left-10 w-32 h-32 rounded-full bg-white/10" />

                    {/* Title row */}
                    <View className="flex-row items-center justify-center mt-2 relative">
                        <Text className="text-white text-[22px] font-poppins-bold">
                            {translate("layout.transactions")}
                        </Text>
                        <TouchableOpacity className="absolute right-0 w-7 h-7 rounded-full bg-white items-center justify-center">
                            <Text className="text-primary font-poppins-bold text-sm">?</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Total points banner */}
                    <View className="mt-7 bg-white/[0.18] rounded-2xl py-5 px-6 items-center">
                        <Text className="text-white/80 text-[11px] font-poppins-bold tracking-[1.5px] uppercase">
                            {translate("frontdesk.transactionHistory.totalPointsToday")}
                        </Text>
                        <Text className="text-white text-[38px] font-poppins-bold mt-1">
                            {totalPtsToday.toLocaleString()} PTS
                        </Text>

                        {/* View All button */}
                        <TouchableOpacity className="mt-4 flex-row items-center bg-white/20 px-5 py-2.5 rounded-full border border-white/35">
                            <MaterialIcons name="history" size={16} color="#FFFFFF" />
                            <Text className="text-white font-poppins-bold text-sm ml-1.5">
                                {translate("frontdesk.transactionHistory.viewAllTransactions")}
                            </Text>
                            <MaterialIcons name="chevron-right" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Transaction List ── */}
                <View className="px-6 mt-5">
                    <View className="bg-white dark:bg-darkBackgroundMuted rounded-xl overflow-hidden border border-white dark:border-darkBorder">
                        {mockTransactions.slice(0, 4).map((txn, index) => (
                            <View
                                key={txn.id}
                                className={`flex-row justify-between items-center py-[18px] px-5 ${index !== 0 ? "border-t border-neutral-200 dark:border-darkBorder" : ""
                                    }`}
                            >
                                {/* Avatar + name/time */}
                                <View className="flex-row items-center flex-1">
                                    <View className="w-11 h-11 rounded-full bg-orange-50 dark:bg-primary/10 items-center justify-center mr-3.5">
                                        <MaterialIcons name="person" size={22} color="#FF6600" />
                                    </View>
                                    <View>
                                        <Text className="text-[15px] font-poppins-bold text-slate-900 dark:text-darkTextPrimary">
                                            {txn.name}
                                        </Text>
                                        <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextMuted mt-0.5">
                                            {txn.date} • {txn.time}
                                        </Text>
                                    </View>
                                </View>

                                {/* Amount + points */}
                                <View className="items-end">
                                    <Text className="text-[15px] font-poppins-bold text-slate-900 dark:text-darkTextPrimary">
                                        ₱{txn.amount.toLocaleString()}
                                    </Text>
                                    <Text className="text-sm font-poppins-bold text-primary mt-0.5">
                                        +{txn.points} PTS
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {/* View More */}
                        <TouchableOpacity className="py-4 items-center border-t border-slate-100 dark:border-darkBorder">
                            <View className="flex-row items-center">
                                <Text className="text-sm font-poppins-bold text-primary">
                                    {translate("frontdesk.transactionHistory.viewMore")}
                                </Text>
                                <MaterialIcons name="expand-more" size={18} color="#FF6600" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
