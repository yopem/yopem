import { TaggedError } from "better-result"

export class NotFoundError extends TaggedError("NotFoundError")<{
  resource: string
  id: string
  message: string
}>() {
  constructor(args: { resource: string; id: string }) {
    super({
      ...args,
      message: `${args.resource} with id ${args.id} not found`,
    })
  }
}

export class ValidationError extends TaggedError("ValidationError")<{
  field: string
  message: string
}>() {}

export class DuplicateError extends TaggedError("DuplicateError")<{
  resource: string
  field: string
  value: string
  message: string
}>() {
  constructor(args: { resource: string; field: string; value: string }) {
    super({
      ...args,
      message: `${args.resource} with ${args.field} '${args.value}' already exists`,
    })
  }
}

export class DatabaseOperationError extends TaggedError(
  "DatabaseOperationError",
)<{
  operation: string
  table: string
  cause: unknown
  message: string
}>() {
  constructor(args: { operation: string; table: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super({
      ...args,
      message: `Database ${args.operation} failed on ${args.table}: ${msg}`,
    })
  }
}

export type DatabaseError =
  | NotFoundError
  | ValidationError
  | DuplicateError
  | DatabaseOperationError
