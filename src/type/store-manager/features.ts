export interface StoreFeature {
    store_id: number;
    streak_enabled: boolean;
    stamp_enabled: boolean;
    reward_enabled: boolean;
		qr_enabled: boolean;
};

export const FEATURES = [
	{
		id: "streaks",
		title: "Streaks",
		description: "Reward daily consecutive visits.",
		icon: "local-fire-department" as const,
		iconColor: "#F97316",
		iconBg: "rgba(249,115,22,0.10)",
		badge: "5 points/day • 7-day streak",
	},
	{
		id: "stamps",
		title: "Stamps",
		description: "Digital punch cards for purchases.",
		icon: "loyalty" as const,
		iconColor: "#F97316",
		iconBg: "rgba(249,115,22,0.10)",
		badge: null,
	},
	{
		id: "purchased",
		title: "QR Purchase Rewards",
		description: "Scan at checkout to earn.",
		icon: "qr-code-2" as const,
		iconColor: "#F97316",
		iconBg: "rgba(249,115,22,0.10)",
		badge: null,
	},
];
  
export const TABS = ["Staff", "Features", "Rewards"];