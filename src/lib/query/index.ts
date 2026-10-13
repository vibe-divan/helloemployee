import { QueryClient } from "@tanstack/react-query";

/** Creates a query client. One per router instance; lives for the app's lifetime. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        retry: false,
      },
    },
  });
}
