import React from 'react';
import { View } from '@/tw';

export function DashboardMetricTileSkeleton() {
    return (
        <View
            key="loading-val"
            className="h-[28px] w-16 bg-background dark:bg-darkBackground rounded my-[1px] animate-pulse will-change-animation"
        />
    )
};