import type { Context } from "hono"

import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "zod"

import { redisCache } from "cache"

import type { AppContext } from "./context"
import type { Procedure } from "./procedure"

import { requireAdmin, requireAuth } from "./middleware"
import { adminRouter } from "./procedures/admin"
import { assetsRouter } from "./procedures/assets"
import { categoriesRouter } from "./procedures/categories"
import { productsRouter } from "./procedures/products"
import { sessionRouter } from "./procedures/session"
import { tagsRouter } from "./procedures/tags"
import { userRouter } from "./procedures/user"

const routers = {
  admin: adminRouter,
  assets: assetsRouter,
  categories: categoriesRouter,
  products: productsRouter,
  session: sessionRouter,
  tags: tagsRouter,
  user: userRouter,
}

const jsonResponse = (schema?: z.ZodTypeAny) => ({
  description: "Success",
  content: {
    "application/json": {
      schema: schema ?? z.any(),
    },
  },
})

const isFileSchema = (schema: z.ZodTypeAny): boolean => {
  if (schema.constructor.name !== "ZodCustom") return false
  try {
    return schema.safeParse(new File([], "probe")).success
  } catch {
    return false
  }
}

const unwrapOptional = (
  schema: z.ZodTypeAny,
): { schema: z.ZodTypeAny; required: boolean } => {
  if (schema.constructor.name === "ZodOptional") {
    return {
      schema: (schema as z.ZodOptional<z.ZodTypeAny>).unwrap(),
      required: false,
    }
  }

  return { schema, required: true }
}

const buildRequest = (procedure: Procedure) => {
  if (!procedure.inputSchema) {
    return {
      body: {
        content: {
          "application/json": {
            schema: z.object({}),
          },
        },
        required: false,
      },
    }
  }

  if (isFileSchema(procedure.inputSchema)) {
    return undefined
  }

  const { schema, required } = unwrapOptional(procedure.inputSchema)

  return {
    body: {
      content: {
        "application/json": {
          schema,
        },
      },
      required,
    },
  }
}

const buildHandler =
  (procedure: Procedure) => async (c: Context<AppContext>) => {
    const session = c.get("session")
    const context = {
      session: session!,
      redis: redisCache,
    }

    let input: unknown

    if (procedure.inputSchema) {
      if (isFileSchema(procedure.inputSchema)) {
        const body = await c.req.parseBody()
        const file = Array.isArray(body.file) ? body.file[0] : body.file
        input = procedure.inputSchema.parse(file)
      } else {
        let raw: unknown = {}
        try {
          raw = await c.req.json()
        } catch {
          // empty body is allowed for optional inputs
        }
        input = procedure.inputSchema.parse(raw)
      }
    }

    const result = await procedure.handler({ context, input })

    return c.json(result as object, 200)
  }

export const apiApp = new OpenAPIHono<AppContext>()

const publicApp = new OpenAPIHono<AppContext>()
const protectedApp = new OpenAPIHono<AppContext>()
const adminApp = new OpenAPIHono<AppContext>()

protectedApp.use("*", requireAuth)
adminApp.use("*", requireAuth, requireAdmin)

for (const [namespace, router] of Object.entries(routers)) {
  for (const [action, procedure] of Object.entries(router)) {
    const target =
      procedure.auth === "admin"
        ? adminApp
        : procedure.auth === "protected"
          ? protectedApp
          : publicApp

    const route = createRoute({
      method: "post",
      path: `/${namespace}/${action}`,
      tags: [namespace],
      request: buildRequest(procedure),
      responses: {
        200: jsonResponse(),
      },
    })

    target.openapi(route, buildHandler(procedure))
  }
}

apiApp.route("/", publicApp)
apiApp.route("/", protectedApp)
apiApp.route("/", adminApp)
