export interface Stamp {
  store_id: string;
  total_stamps: number;
  reward_id: string;
}

export interface StampStore {
  total_stamps: number;
  reward_id: string;
  setTotalStamps: (total_stamps: number) => void;
  setRewardId: (reward_id: string) => void;
  reset: () => void;
}