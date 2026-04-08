import React from "react";
import { View } from "@/tw";

function SkeletonBox({ className }: { className?: string }) {
  return (
    <View className={`bg-slate-200 dark:bg-slate-700 animate-pulse ${className}`} />
  );
}

export function StreakCardSkeleton() {
  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
      
      <View className="bg-white dark:bg-slate-900 flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center gap-x-2">
          <SkeletonBox className="w-8 h-8 rounded-lg" />
          <SkeletonBox className="w-32 h-4 rounded" />
        </View>
        <SkeletonBox className="w-16 h-5 rounded-full" />
      </View>

      <View className="bg-white dark:bg-slate-900 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex-row justify-between">
        <SkeletonBox className="w-12 h-3 rounded" />
        <SkeletonBox className="w-20 h-3 rounded" />
      </View>

      <View className="bg-white dark:bg-slate-900 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex-row justify-between">
        <SkeletonBox className="w-12 h-3 rounded" />
        <SkeletonBox className="w-20 h-3 rounded" />
      </View>

      <View className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-row justify-between">
        <SkeletonBox className="w-20 h-3 rounded" />
        <SkeletonBox className="w-12 h-3 rounded" />
      </View>

      <View className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-row justify-between">
        <SkeletonBox className="w-16 h-3 rounded" />
        <SkeletonBox className="w-24 h-3 rounded" />
      </View>

      <View className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <SkeletonBox className="w-full h-3 rounded mb-2" />
        <SkeletonBox className="w-2/3 h-3 rounded" />
      </View>

      <View className="bg-white dark:bg-slate-900 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-x-2">
          <SkeletonBox className="w-8 h-8 rounded-lg" />
          <SkeletonBox className="w-24 h-3 rounded" />
        </View>
        <SkeletonBox className="w-6 h-6 rounded" />
      </View>

      <View className="bg-white dark:bg-slate-900 px-4 pb-4 pt-2 gap-y-2 border-t border-slate-100 dark:border-slate-800">
        <SkeletonBox className="w-full h-10 rounded-xl" />
        <SkeletonBox className="w-full h-10 rounded-xl" />
      </View>
    </View>
  );
}


export function StreakSkeleton() {

  return (
    <View className="flex-1 bg-backgroundMuted dark:bg-[#111921]">
      
      <View className="px-4 pt-12 pb-3 flex-row items-center">
        <SkeletonBox className="w-10 h-10 rounded-full" />
        <SkeletonBox className="flex-1 h-4 rounded mx-4" />
      </View>

      <View className="flex-row px-6 py-3 border-b border-slate-100 dark:border-slate-800">
        {[1, 2, 3].map((i) => (
          <View key={i} className="flex-1 items-center">
            <SkeletonBox className="w-16 h-3 rounded mb-1" />
            <SkeletonBox className="w-6 h-3 rounded-full" />
          </View>
        ))}
      </View>

      <View className="p-4 gap-y-3">
        {[1, 2, 3].map((i) => (
          <StreakCardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}