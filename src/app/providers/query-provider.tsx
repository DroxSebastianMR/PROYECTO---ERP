import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState, type ReactNode } from "react";

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      }),
  );
  const [persister] = useState(() =>
    createSyncStoragePersister({ storage: window.localStorage, key: "districorp.query-cache" }),
  );

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister, maxAge: 10 * 60_000, dehydrateOptions: { shouldDehydrateQuery: (query) => ["products", "inventory", "purchases", "sales"].includes(String(query.queryKey[0])) } }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
