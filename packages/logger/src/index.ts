import pino from "pino"

export const formatError = (error: unknown): string =>
  error instanceof Error ? (error.stack ?? error.message) : String(error)

export const logger = pino({
  levelComparison: "DESC",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
})
