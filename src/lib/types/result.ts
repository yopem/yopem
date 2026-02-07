export interface ErrorInfo {
  provider: string
  errorType: "network" | "auth" | "validation" | "unknown"
  message: string
  details?: Record<string, unknown>
}

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: ErrorInfo }

export function success<T>(data: T): Result<T> {
  return { success: true, data }
}

export function failure<T>(error: ErrorInfo): Result<T> {
  return { success: false, error }
}
