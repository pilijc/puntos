import { useState, useCallback, useEffect } from "react";
import { getUserStreaks, UserStreak } from "@/services/streak-service";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/supabase/supabase";

export function useStreaks() {
  const [streaks, setStreaks] = useState<UserStreak[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { sessionToken } = useAuthStore(); // Check session

  const fetchStreaks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setIsLoading(false);
        setStreaks([]);
        return;
      }

      const data = await getUserStreaks(user.id);
      setStreaks(data);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  // Initial fetch
  useEffect(() => {
    fetchStreaks();
  }, [fetchStreaks]);

  return {
    streaks,
    isLoading,
    error,
    refetch: fetchStreaks,
  };
}
