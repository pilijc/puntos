export interface DashboardMetricTileProps {
    label: string;
    value: number | string;
    subtitle?: string;
    icon: string;
    loading: boolean;
    highlight?: boolean;
}

export interface DashboardActivityChartProps {
    data: number[];
    labels: string[];
}