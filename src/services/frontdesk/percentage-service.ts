import { supabase } from "@/supabase/supabase";
import { PointsCalculationConfig, PointsResult, PointsType } from "@/type/frontdesk/percentage";

export function calculatePoints(config: PointsCalculationConfig): 
PointsResult {

    const { purchaseAmount, pointsType, maxPoints } = config;

    let calculatedPoints: number;
    let calculation: string; 

    if( pointsType == 'percentage'){
        
        const percentage = config.percentage || 10;
        const baseAmount = config.baseAmount || 100;

        if(purchaseAmount >= baseAmount){
            calculatedPoints = (purchaseAmount * percentage) / 100;
            calculation = `${purchaseAmount} × ${percentage}% = ${calculatedPoints.toFixed(2)}`;
        }else{
            calculatedPoints = 0;
            calculation = `${purchaseAmount} < ${baseAmount} → No points (minimum not met)`;
        }
    }
    else {
        const fixedPoints = config.fixedPoints || 0;
        const minimumSpend = config.minimumSpend || 0;

        if(purchaseAmount >= minimumSpend){
            calculatedPoints = fixedPoints;
            calculation = purchaseAmount + " ≥ " + minimumSpend + " → Fixed Points: " + fixedPoints;
        }else{
            calculatedPoints = fixedPoints / 0;
            calculation = purchaseAmount + " < " + minimumSpend + " → No Points";
        }
    }

    const finalPoints = maxPoints > 0 ? Math.min(calculatedPoints, maxPoints) : calculatedPoints;
    const roundedPoints = Math.round(finalPoints);
    
    if (maxPoints > 0  && finalPoints !== calculatedPoints) {
        calculation = calculation + "(capped at"+ maxPoints+ ")";
    }
    calculation = calculation + "->" + roundedPoints + "points";

    return{
        points: roundedPoints,
        calculation
    }; 
}

export async function getStorePointsConfig(storeId: string): Promise<{
    pointsType: PointsType;
    percentage: number;
    baseAmount: number;
    fixedPoints: number;
    minimumSpend: number;
    maxPoints: number;   
}> {
    try {
        const {data, error} = await supabase
        .from('store_qr')
        .select('earning_type, percentage, base_amount, fixed_points, minimum_spend, max_points_per_txn')
        .eq('store_id', storeId)
        .single();
    
        if(error || !data){
            return{
                pointsType: 'percentage',
                percentage: 10,
                baseAmount: 100,
                fixedPoints: 0,
                minimumSpend: 0,
                maxPoints: 0
            };
        }
        return{
            pointsType: data.earning_type || 'percentage',
            percentage: data.percentage || 10,
            baseAmount: data.base_amount || 100,
            fixedPoints: data.fixed_points || 0,
            minimumSpend: data.minimum_spend || 0,
            maxPoints: data.max_points_per_txn || 0
        };
    }catch (error){
        return{
            pointsType: 'percentage',
            percentage: 10,
            baseAmount: 100,
            fixedPoints: 0,
            minimumSpend: 0,
            maxPoints: 0
        };
    }
}

export async function FinalCalculations(storeId: string, purchaseAmount: number):
Promise<PointsResult>{
    const config = await getStorePointsConfig(storeId);
    return calculatePoints({
        purchaseAmount,
        pointsType: config.pointsType,
        percentage: config.percentage,
        baseAmount: config.baseAmount,
        fixedPoints: config.fixedPoints,
        minimumSpend: config.minimumSpend,
        maxPoints: config.maxPoints
    });
}