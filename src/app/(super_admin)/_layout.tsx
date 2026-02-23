import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { getRoleTypeForUser } from "@/services/access-service";

export default function SuperAdminLayout() {
  const router = useRouter();

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/(onboarding)/welcome");
          return;
        }

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

  return <Stack screenOptions={{ headerShown: false }} />;
}
