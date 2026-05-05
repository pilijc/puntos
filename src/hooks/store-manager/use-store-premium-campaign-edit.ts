import { useCallback, useEffect, useState } from "react";
import {
  getOwnerPremiumCampaignExpiryDateIso,
  getStoreOwnerId,
  ownerCanManagePremiumCampaigns,
} from "@/services/store-manager/premium-campaign-gate";

export function useStorePremiumCampaignEdit(storeId: string | undefined) {
  const [canEdit, setCanEdit] = useState(true);
  const [loading, setLoading] = useState(true);
  const [expiresAtIso, setExpiresAtIso] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      setCanEdit(true);
      setExpiresAtIso(null);
      return;
    }
    setLoading(true);
    try {
      const ownerId = await getStoreOwnerId(storeId);
      const allowed = await ownerCanManagePremiumCampaigns(ownerId);
      setCanEdit(allowed);
      setExpiresAtIso(await getOwnerPremiumCampaignExpiryDateIso(ownerId));
    } catch {
      setCanEdit(true);
      setExpiresAtIso(null);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { canEdit, loading, expiresAtIso, refresh };
}
