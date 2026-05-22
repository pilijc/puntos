import { useDeleteAccountMutation } from '@/hooks/user/rq';
import { logger } from "@/utils/logger";

export function useDeleteAccount() {
    const deleteAccountMutation = useDeleteAccountMutation();

    const deleteAccount = async () => {
        if (deleteAccountMutation.isPending) return;

        try {
            await deleteAccountMutation.mutateAsync();
        } catch (error) {
            logger.error('[useDeleteAccount] Failed to delete account:', error);
        }
    };
    
    return {
        deleteAccount,
        isDeleting: deleteAccountMutation.isPending,
    };
}
