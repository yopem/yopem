import { TaggedError } from "better-result"

export class RedisConnectionError extends TaggedError("RedisConnectionError")<{
  message: string
  cause: unknown
}>() {
  constructor(args: { cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super({ cause: args.cause, message: `Redis connection failed: ${msg}` })
  }
}

export class CacheOperationError extends TaggedError("CacheOperationError")<{
  operation: string
  key?: string
  message: string
  cause: unknown
}>() {
  constructor(args: { operation: string; key?: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super({
      ...args,
      message: `Cache ${args.operation} failed${args.key ? ` for key ${args.key}` : ""}: ${msg}`,
    })
  }
}

export class CacheSerializationError extends TaggedError(
  "CacheSerializationError",
)<{
  operation: "serialize" | "deserialize"
  message: string
  cause: unknown
}>() {
  constructor(args: {
    operation: "serialize" | "deserialize"
    cause: unknown
  }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super({ ...args, message: `Cache ${args.operation} failed: ${msg}` })
  }
}
