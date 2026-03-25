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