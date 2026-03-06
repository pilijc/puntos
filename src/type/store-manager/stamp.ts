export interface Stamp {
  store_id: string;
  total_stamps: number;
  reward_id: number;
}

export interface StampStore {
  total_stamps: number;
  reward_id: number;
  setTotalStamps: (total_stamps: number) => void;
  setRewardId: (reward_id: number) => void;
  reset: () => void;
}