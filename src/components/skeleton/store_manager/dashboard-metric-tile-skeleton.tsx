import React from 'react';
import { View } from '@/tw';

export function DashboardMetricTileSkeleton() {
    return (
        <View
            key="loading-val"
            className="h-[34px] w-14 bg-background dark:bg-darkBackground rounded my-[2px] animate-pulse will-change-animation"
        />
    )
};