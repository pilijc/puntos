import { QueryClient } from "@tanstack/react-query";

let appQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (!appQueryClient) {
    appQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          gcTime: 5 * 60_000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
  }
  return appQueryClient;
}
