import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  changePasswordService,
  deleteUserAccountService,
} from "@/services/user/settings-service";
import { userKeys } from "./query-keys";

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUserAccountService,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: userKeys.root });
      router.replace("/(onboarding)/welcome");
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: changePasswordService,
  });
}
