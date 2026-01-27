import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryApi } from "@/lib/orpc/query"
import type {
  AddApiKeyInput,
  DeleteApiKeyInput,
  UpdateApiKeyInput,
} from "@/lib/schemas/api-keys"

export function useApiKeys() {
  return useQuery({
    ...queryApi.user.getApiKeys.queryOptions(),
  })
}

export function useApiKeyStats() {
  return useQuery({
    ...queryApi.user.getApiKeyStats.queryOptions(),
  })
}

export function useAddApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddApiKeyInput) => {
      return queryApi.user.addApiKey.call(input)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryApi.user.getApiKeys.queryKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryApi.user.getApiKeyStats.queryKey(),
      })
    },
  })
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateApiKeyInput) => {
      return queryApi.user.updateApiKey.call(input)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryApi.user.getApiKeys.queryKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryApi.user.getApiKeyStats.queryKey(),
      })
    },
  })
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DeleteApiKeyInput) => {
      return queryApi.user.deleteApiKey.call(input)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryApi.user.getApiKeys.queryKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryApi.user.getApiKeyStats.queryKey(),
      })
    },
  })
}
