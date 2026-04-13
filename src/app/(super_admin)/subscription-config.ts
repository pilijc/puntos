/**
 * Configuration for Store Manager Subscriptions.
 * Based on the policy that the first 2 stores are free, 
 * and additional stores require a subscription.
 */
export const SUB_CONFIG = {
  // The maximum number of free stores a Store Manager is allowed to have
  FREE_STORES_LIMIT: 2,
  
  // The subscription pricing when they exceed the free tier
  PREMIUM_TIER: {
    basePrice: 19.99,
    currency: "USD",
    name: "Premium Multi-Store Subscription",
  },
  
  // Message displayed when a manager hits the limit
  LIMIT_MESSAGE: "This Store Manager has reached the limit of 2 free stores. Approving this store will generate a subscription charge.",
};
