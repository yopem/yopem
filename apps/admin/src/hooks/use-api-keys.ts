import { queryApi } from "@repo/orpc/query"
import type {
  AddApiKeyInput,
  DeleteApiKeyInput,
  UpdateApiKeyInput,
} from "@repo/utils/api-keys-schema"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useApiKeys() {
  return useQuery({
    ...queryApi.admin.getApiKeys.queryOptions(),
  })
}

export function useApiKeyStats() {
  return useQuery({
    ...queryApi.admin.getApiKeyStats.queryOptions(),
  })
}

export function useAddApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AddApiKeyInput) => {
      return queryApi.admin.addApiKey.call(input)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeys.queryKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeyStats.queryKey(),
      })
    },
  })
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateApiKeyInput) => {
      return queryApi.admin.updateApiKey.call(input)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeys.queryKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeyStats.queryKey(),
      })
    },
  })
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DeleteApiKeyInput) => {
      return queryApi.admin.deleteApiKey.call(input)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeys.queryKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeyStats.queryKey(),
      })
    },
  })
}
