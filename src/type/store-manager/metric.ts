import { StoreRow } from "@/services/store-service";

export interface DashboardMetricTileProps {
    label: string;
    value: number | string;
    subtitle?: string;
    icon: any;
    loading?: boolean;
}

export interface DashboardActivityChartProps {
    data: number[];
    labels: string[];
    weekRange: string;
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

export interface StoreDailyMetric {
    id: string;
    store_id: number;
    metric_date: string;
    scans_count: number;
}

export interface StoreUserLoyalty {
    store_id: number;
    user_id: string;
    purchase_count: number;
}