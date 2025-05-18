import { QueryCache, QueryClient } from "@tanstack/react-query"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"
import type { AppRouter } from "@yopem/api"
import { apiUrl } from "@yopem/constant"

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // TODO: change to toast
      console.error(error.message, {
        action: {
          label: "retry",
          onClick: () => {
            void queryClient.invalidateQueries()
          },
        },
      })
    },
  }),
})

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${apiUrl}/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        })
      },
    }),
  ],
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
})
