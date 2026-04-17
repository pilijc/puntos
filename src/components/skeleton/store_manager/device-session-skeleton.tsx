import React from "react";
import { View } from "@/tw";

export default function DeviceSessionSkeleton() {
  return (
    <View className="w-full">
      {[...Array(2)].map((_, index) => {
        const isLast = index === 1;

        return (
          <View key={index} className={index > 0 ? "border-t border-border pt-3 mt-3" : ""}>
            <View className="flex-row items-center py-1 gap-x-3">
              <View className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800" />

              <View className="flex-1 gap-y-2">
                <View className="w-40 h-3 rounded bg-slate-100 dark:bg-neutral-800" />
                <View className="w-24 h-2.5 rounded bg-slate-100 dark:bg-neutral-800" />
              </View>

              <View className="w-5 h-5 rounded-full bg-slate-100 dark:bg-neutral-800" />
            </View>
          </View>
        );
      })}
    </View>
  );
}
