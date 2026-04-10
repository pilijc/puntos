import { useState } from 'react';
import { router } from 'expo-router';
import { deleteUserAccountService } from '@/services/user/settings-service';

export function useDeleteAccount() {
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteAccount = async () => {
        if (isDeleting) return;

        setIsDeleting(true);

        try {
            await deleteUserAccountService();
            router.replace('/(onboarding)/welcome');
        } catch (error) {
            console.error('[useDeleteAccount] Failed to delete account:', error);
        } finally {
            setIsDeleting(false);
        }
    };
    
    return {
        deleteAccount,
        isDeleting,
    };
}