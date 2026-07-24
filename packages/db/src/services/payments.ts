import { eq } from "drizzle-orm"

import { db } from "db"
import { polarCheckoutSessionsTable, polarPaymentEventsTable } from "db/schema"
import { createCustomId } from "utils/custom-id"

export async function recordPolarPaymentEvent(input: {
  eventType: string
  polarEventId?: string
  payload: unknown
}): Promise<void> {
  await db.insert(polarPaymentEventsTable).values({
    id: createCustomId(),
    eventType: input.eventType,
    polarEventId: input.polarEventId ?? createCustomId(),
    payload: JSON.stringify(input.payload),
  })
}

export async function completePolarCheckoutSession(
  checkoutId: string,
): Promise<void> {
  await db
    .update(polarCheckoutSessionsTable)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(polarCheckoutSessionsTable.checkoutId, checkoutId))
}
