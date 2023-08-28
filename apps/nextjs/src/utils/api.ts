import { createTRPCReact } from "@trpc/react-query";

import type { AppRouter } from "@yopem/api";

export const api = createTRPCReact<AppRouter>();

export { type RouterInputs, type RouterOutputs } from "@yopem/api";
