import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/supabase/supabase";
import { UserProfile, UserPreferences } from "@/type/settings";
import {
  getUserProfileService,
  getUserSettingsService,
  saveUserProfileService,
  updateUserProfileService,
  updateUserSettingsService,
} from "@/services/user/settings-service";
import { userKeys } from "./query-keys";

export type CurrentUserProfileData = {
  user: User | null;
  profile: UserProfile | null;
  preferences: UserPreferences;
};

const defaultPreferences: UserPreferences = {
  near_store_notifications: false,
  location_enabled: false,
  promo_emails: false,
};

async function fetchCurrentUserProfile(): Promise<CurrentUserProfileData> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return { user: null, profile: null, preferences: defaultPreferences };
  }

  const [profile, settings] = await Promise.all([
    getUserProfileService(user.id),
    getUserSettingsService(user.id),
  ]);

  return {
    user,
    profile,
    preferences: {
      ...defaultPreferences,
      near_store_notifications: settings?.near_store_notifications ?? false,
      location_enabled: settings?.location_enabled ?? false,
    },
  };
}

export function useCurrentUserProfileQuery() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: fetchCurrentUserProfile,
    staleTime: 30_000,
  });
}

export function useUpdateUserProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<UserProfile> }) =>
      updateUserProfileService(userId, updates),
    onMutate: async ({ updates }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });
      const previous = queryClient.getQueryData<CurrentUserProfileData>(userKeys.profile());

      queryClient.setQueryData<CurrentUserProfileData>(userKeys.profile(), (current) =>
        current
          ? {
              ...current,
              profile: current.profile ? { ...current.profile, ...updates } : current.profile,
            }
          : current,
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userKeys.profile(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
}

export function useUpdateUserPreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<UserPreferences> }) =>
      updateUserSettingsService(userId, updates),
    onMutate: async ({ updates }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });
      const previous = queryClient.getQueryData<CurrentUserProfileData>(userKeys.profile());

      queryClient.setQueryData<CurrentUserProfileData>(userKeys.profile(), (current) =>
        current
          ? {
              ...current,
              preferences: { ...current.preferences, ...updates },
            }
          : current,
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userKeys.profile(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
}

export function useSaveUserProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveUserProfileService,
    onSuccess: (updates) => {
      queryClient.setQueryData<CurrentUserProfileData>(userKeys.profile(), (current) =>
        current
          ? {
              ...current,
              profile: current.profile ? { ...current.profile, ...updates } : current.profile,
            }
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
}
