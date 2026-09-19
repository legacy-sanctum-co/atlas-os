import "server-only";

import type { Db } from "@/core/db/client";
import { db } from "@/core/db/client";

import type { AtlasEventInput } from "../domain/event";
import { atlasEvent } from "./schema";

type Executor = Pick<Db, "insert">;

/**
 * Appends to the event spine. Accepts a transaction so callers can record
 * the event atomically with the change it describes.
 */
export async function recordEvent(input: AtlasEventInput, executor: Executor = db): Promise<void> {
  await executor.insert(atlasEvent).values({
    type: input.type,
    userId: input.userId ?? null,
    subjectType: input.subjectType ?? null,
    subjectId: input.subjectId ?? null,
    payload: input.payload ?? {},
    actor: input.actor ?? "owner",
    requestId: input.requestId ?? null,
  });
}
