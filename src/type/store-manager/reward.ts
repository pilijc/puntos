export interface Reward {
  id?: string | null;
  store_id: string;
  title: string;
  description: string;
  points_cost: number;
  stock:number
  image_url: string;
}

export interface RewardState {
  title: string;
  setTitle:(value: string) => void;
  description: string;
  setDescription:(value: string) => void;
  points_cost: number;
  setPointsCost:(value: number) => void;
  stock:number
  setStock:(value: number) => void;
  image_url: string;
  setImageUrl:    (value: string) => void;
  reset: () => void;
}
