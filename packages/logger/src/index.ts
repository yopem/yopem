import pino from "pino"

export const formatError = (error: unknown): string =>
  error instanceof Error ? (error.stack ?? error.message) : String(error)

export const logger = pino({
  levelComparison: "DESC",
  redact: {
    paths: [
      "headers.authorization",
      "headers.cookie",
      "req.headers.authorization",
      "req.headers.cookie",
      "*.apiKey",
      "*.password",
      "*.secret",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
    ],
    censor: "[Redacted]",
  },
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
})
