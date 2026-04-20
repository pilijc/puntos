import { RedemptionCode } from "../user/reward-redemption";

export interface RedemptionVerificationResult {
    success: boolean;
    code?: RedemptionCode;
    message?: string;
}

export interface RedemptionProcessResult{
    success: boolean;
    redemptionId?: string;
    pointsDeducted?: number;
    remainingPoints?: number;
    message?: string;
}

export interface RedemptionHistoryItem {
    id: string;
    user_id: string;
    user_name: string;
    reward_title:string;
    points_spent: number;
    created_at: string;
    method: "qr" | "voucher";

    
}