import { vi } from "vite-plus/test"

export interface MockDb {
  setReturn(value: unknown[][]): void
  transaction<T>(fn: (tx: MockDb) => Promise<T>): Promise<T>
  query: {
    productsTable: {
      findFirst: () => Promise<unknown>
    }
  }
  [key: string | symbol]: unknown
}

export const createMockDb = (): MockDb => {
  const returnQueue: unknown[][] = []

  const dequeue = (): unknown[] => {
    if (returnQueue.length === 0) {
      return []
    }
    return returnQueue.shift() ?? []
  }

  const createProxy = (): MockDb => {
    const target: MockDb = {
      setReturn(value: unknown[][]) {
        returnQueue.length = 0
        for (const item of value) {
          returnQueue.push(item)
        }
      },
      transaction(fn) {
        return fn(createProxy())
      },
      query: {
        productsTable: {
          findFirst: vi.fn().mockImplementation(() => {
            const value = dequeue()
            return Promise.resolve(value[0] ?? null)
          }),
        },
      },
    }

    return new Proxy(target, {
      get(_obj, prop) {
        if (prop === "then") {
          return (onResolve: (value: unknown) => unknown) =>
            Promise.resolve(dequeue()).then(onResolve)
        }

        if (prop === "returning") {
          return () => Promise.resolve(dequeue())
        }

        if (prop in target) {
          return target[prop as keyof MockDb]
        }

        if (typeof prop === "symbol") {
          return undefined
        }

        return (..._args: unknown[]) => createProxy()
      },
    })
  }

  return createProxy()
}
