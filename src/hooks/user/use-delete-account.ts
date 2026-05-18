import { useDeleteAccountMutation } from '@/hooks/user/rq';

export function useDeleteAccount() {
    const deleteAccountMutation = useDeleteAccountMutation();

    const deleteAccount = async () => {
        if (deleteAccountMutation.isPending) return;

        try {
            await deleteAccountMutation.mutateAsync();
        } catch (error) {
            console.error('[useDeleteAccount] Failed to delete account:', error);
        }
    };
    
    return {
        deleteAccount,
        isDeleting: deleteAccountMutation.isPending,
    };
}
