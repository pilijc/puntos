export type PointsType = 'percentage' | 'fixed';

export interface PointsCalculationConfig{
    purchaseAmount: number;
    pointsType: PointsType;
    percentage?: number;
    baseAmount?: number;
    fixedPoints?: number;
    minimumSpend?: number;
    maxPoints?: number;
}

export interface PointsResult {
    points: number;
    calculation: string;
}
