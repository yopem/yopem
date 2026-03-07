import { createORPCClientFromLink, createORPCLink } from "./shared.ts"

export const clientApi = createORPCClientFromLink(createORPCLink())
