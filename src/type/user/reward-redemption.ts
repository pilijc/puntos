export interface RedemptionCode {
    id: string;
    code: string;
    user_id: string;
    reward_id: string;
    store_id: string;
    reward_title: string;
    reward_description: string;
    reward_image_url?: string | null;
    points_cost: number;
    status: "active" | "redeemed" | "expired" | "cancelled";
    created_at: string;
    expires_at: string;
    redeemed_at?: string | null;
}

export type RedemptionStatus = RedemptionCode["status"];

export interface GenerateCodeResult {
    success: boolean;
    code?: RedemptionCode;
    message?: string;
    rateLimitType?: "cooldown" | "rate_limit";
    retryAfter?: number;
}

export interface RedemptionUpdate {
    status: RedemptionStatus;
    redeemed_at?: string | null;
}

export interface ActiveRedemptionWithReward extends RedemptionCode {
 reward?: {
    title: string;
    description: string;
    image_url: string | null

    
 };
}
