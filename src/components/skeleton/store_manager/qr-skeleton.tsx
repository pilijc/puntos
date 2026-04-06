import React from "react";
import { View } from "@/tw";

function SkeletonBox({ className }: { className: string }) {
  return <View className={`bg-slate-200 dark:bg-neutral-700 animate-pulse ${className}`} />;
}

export function QRSkeleton() {
  return (
    <View className="mx-4">
      <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-14 items-center gap-y-2">
        <SkeletonBox className="w-14 h-14 rounded-2xl" />

        <SkeletonBox className="w-44 h-4 rounded mt-1" />
        <SkeletonBox className="w-full h-3 rounded mt-2" />
        <SkeletonBox className="w-5/6 h-3 rounded" />

        <SkeletonBox className="w-full h-11 rounded-xl mt-4" />
      </View>
    </View>
  );
}