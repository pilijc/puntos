import React from "react";
import { View } from "@/tw";

export default function StaffSkeleton() {
  return (
    <View className="mx-4 mt-2">
      <View className="mb-4 flex-row items-center bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-3 gap-x-3">
        <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-neutral-700" />
        <View className="flex-1 gap-y-2">
          <View className="w-32 h-3 rounded bg-slate-200 dark:bg-neutral-700" />
          <View className="w-48 h-2.5 rounded bg-slate-200 dark:bg-neutral-700" />
        </View>
        <View className="w-10 h-3 rounded bg-slate-200 dark:bg-neutral-700" />
      </View>

      <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 overflow-hidden">
        {[...Array(5)].map((_, index) => {
          const isLast = index === 4;

          return (
            <View key={index}>
              <View className="flex-row items-center px-4 py-3.5 gap-x-3">
                <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-neutral-700" />

                <View className="flex-1 gap-y-2">
                  <View className="w-40 h-3 rounded bg-slate-200 dark:bg-neutral-700" />
                  <View className="w-52 h-2.5 rounded bg-slate-200 dark:bg-neutral-700" />
                </View>

                <View className="flex-row gap-x-2">
                  <View className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-neutral-700" />
                  <View className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-neutral-700" />
                </View>
              </View>

              {!isLast && (
                <View className="mx-4 h-px bg-slate-100 dark:bg-neutral-700" />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}