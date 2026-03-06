import { useState, useCallback, useEffect } from "react";
import { getUserStampRewards, StampReward } from "@/services/stamp-reward-service";
import { supabase } from "@/supabase/supabase";

export function useStampRewards() {
  const [stampRewards, setStampRewards] = useState<StampReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStampRewards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setIsLoading(false);
        setStampRewards([]);
        return;
      }

      const data = await getUserStampRewards(user.id);
      setStampRewards(data);
    } catch (e: any) {
      setError(e);
      console.error("Error inside useStampRewards:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStampRewards();
  }, [fetchStampRewards]);

  return {
    stampRewards,
    isLoading,
    error,
    refetch: fetchStampRewards,
  };
}
