import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/supabase";
import { getMyStores } from "@/services/store-service";
import { storeManagerKeys } from "./query-keys";

async function fetchManagerStores() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return [];
  return getMyStores(user.id);
}

export function useManagerStoresQuery() {
  return useQuery({
    queryKey: storeManagerKeys.managerStores(),
    queryFn: fetchManagerStores,
    staleTime: 30_000,
  });
}
