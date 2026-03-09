export type RewardType = "discount" | "free_item" | "bogo";

export interface Reward {
  id?: string | null;
  store_id: string;
  title: string;
  description: string;
  points_cost: number;
  image_url: string;
}

export interface RewardState {
  title: string;
  setTitle:(value: string) => void;
  description: string;
  setDescription:(value: string) => void;
  points_cost: number;
  setPointsCost:(value: number) => void;
  image_url: string;
  setImageUrl:    (value: string) => void;
  reset: () => void;
}
