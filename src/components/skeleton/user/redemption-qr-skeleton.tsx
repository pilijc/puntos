import React from "react";
import { View } from "@/tw";

function SkeletonBox({ className }: { className: string }) {
  return <View className={`bg-slate-200 dark:bg-neutral-700 ${className}`} style={{ opacity: 0.7 }} />;
}

export const RedemptionQRSkeleton = React.memo(function RedemptionQRSkeleton() {
  return (
    <View className="w-[140px] h-[140px] items-center justify-center">
      {/* QR Code skeleton */}
      <SkeletonBox className="w-[140px] h-[140px] rounded-lg" />
      
      {/* Small overlay to indicate it's a QR code - no animation for better performance */}
      <View className="absolute inset-0 items-center justify-center">
        <View className="w-8 h-8 bg-white/80 dark:bg-neutral-800/80 rounded-lg items-center justify-center">
          <View className="w-4 h-4 bg-slate-300 dark:bg-neutral-600 rounded-sm" />
        </View>
      </View>
    </View>
  );
});
