import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // 5 minutos para os dados ficarem 'stale' (velhos) e forçar refetch silencioso
      staleTime: 1000 * 60 * 5, 
      // 7 dias de retenção no cache físico (IndexedDB) para uso offline
      cacheTime: 1000 * 60 * 60 * 24 * 7, 
    },
  },
});

// Configura a ponte entre React Query e IndexedDB (idb-keyval)
const asyncStoragePersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => {
      const val = await get(key);
      return val === undefined ? null : val;
    },
    setItem: async (key, value) => {
      await set(key, value);
    },
    removeItem: async (key) => {
      await del(key);
    },
  },
});

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
