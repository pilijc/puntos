export interface UserProfile {
    id: string;
    name?: string;
    avatar_url?: string;
    role?: string;
    [key: string]: any;
}

export interface UserPreferences {
    near_store_notifications: boolean;
    location_enabled: boolean;
    promo_emails: boolean;
    [key: string]: any;
}
