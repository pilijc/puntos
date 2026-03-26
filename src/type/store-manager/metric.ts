import { StoreRow } from "@/services/store-service";

export interface DashboardMetricTileProps {
    label: string;
    value: number | string;
    subtitle?: string;
    icon: string;
    highlight?: boolean;
    loading?: boolean;
}

export interface DashboardActivityChartProps {
    data: number[];
    labels: string[];
    loading?: boolean;
}

export interface StoreTransaction {
    id: number;
    points_earned: number;
    created_at: string;
    user_name: string;
    staff_name: string;
    loading?: boolean;
}

export interface RetentionData {
    returningCount: number;
    newCount: number;
    returningPercent: number;
    newPercent: number;
}

export interface StorePickerDropdownProps {
    stores: StoreRow[];
    selectedStore: StoreRow | undefined;
    isVisible: boolean;
    onOpen: () => void;
    onClose: () => void;
    onSelect: (storeId: number) => void;
}

export interface StampBucket {
    label: string;
    count: number;
    maxStamps: number;
}

export interface StampDistributionProps {
    buckets: StampBucket[];
    maxStamps: number;
    loading?: boolean;
}