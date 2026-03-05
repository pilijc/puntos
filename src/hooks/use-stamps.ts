import { useState, useCallback, useEffect } from "react";
import { getUserStamps, StampProgress } from "@/services/stamp-service";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/supabase/supabase";

export function useStamps() {
  const [stamps, setStamps] = useState<StampProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { sessionToken } = useAuthStore(); // Check session

  const fetchStamps = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setIsLoading(false);
        setStamps([]);
        return;
      }

      const data = await getUserStamps(user.id);
      setStamps(data);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  // Initial fetch
  useEffect(() => {
    fetchStamps();
  }, [fetchStamps]);

  return {
    stamps,
    isLoading,
    error,
    refetch: fetchStamps,
  };
}
