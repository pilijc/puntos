import { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { getRoleTypeForUser } from "@/services/access-service";

export function useSuperAdminLayout() {
  const router = useRouter();

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const roleType = await getRoleTypeForUser(user.id);
        if (roleType !== "super_admin") {
          router.replace("/(user)");
        }
      } catch {
        router.replace("/(user)");
      }
    };
    verifyAccess();
  }, [router]);
}
