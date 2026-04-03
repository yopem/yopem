import z from "zod"

const schema = z.object({
  WEB_PORT: z.coerce.number().default(3000),
  ADMIN_PORT: z.coerce.number().default(3001),
  SERVER_PORT: z.coerce.number().default(4000),
})

const { WEB_PORT, ADMIN_PORT, SERVER_PORT } = schema.parse({
  WEB_PORT: process.env["WEB_PORT"],
  ADMIN_PORT: process.env["ADMIN_PORT"],
  SERVER_PORT: process.env["SERVER_PORT"],
})

export const webPort = WEB_PORT
export const adminPort = ADMIN_PORT
export const serverPort = SERVER_PORT
