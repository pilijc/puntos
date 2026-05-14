import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";

type Props = { children: React.ReactNode };

export function QueryProvider({ children }: Props) {
  const [client] = React.useState(() => getQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
