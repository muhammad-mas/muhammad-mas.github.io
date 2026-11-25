import { QueryClient } from '@tanstack/react-query';

// The site only reads static JSON that changes when it's redeployed,
// so data never goes stale during a visit.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
