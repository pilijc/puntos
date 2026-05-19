export interface Reward {
  id?: string | null;
  store_id: string;
  title: string;
  description: string;
  points_cost: number;
  stock: number;
  image_url: string;
  is_active: boolean;
}

export interface RewardState {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  points_cost: number;
  setPointsCost: (value: number) => void;
  stock: number;
  setStock: (value: number) => void;
  image_url: string;
  setImageUrl: (value: string) => void;
  titleError: boolean;
  setTitleError: (value: boolean) => void;
  imageError: boolean;
  setImageError: (value: boolean) => void;
  pointsCostError: boolean;
  setPointsCostError: (value: boolean) => void;
  stockError: boolean;
  setStockError: (value: boolean) => void;
  reset: () => void;
}
