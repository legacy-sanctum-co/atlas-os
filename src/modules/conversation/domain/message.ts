import { z } from "zod";

/**
 * Minimal, provider-neutral message model. Mirrors the shape of AI SDK
 * UIMessage parts so M3 can persist streamed messages without translation,
 * but this module does not import the AI SDK.
 */

export const MESSAGE_ROLES = ["user", "assistant", "system"] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export const messagePartSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("reasoning"), text: z.string() }),
  z.object({
    type: z.literal("tool"),
    toolCallId: z.string(),
    toolName: z.string(),
    state: z.enum(["input-streaming", "input-available", "output-available", "output-error"]),
    input: z.unknown().optional(),
    output: z.unknown().optional(),
    errorText: z.string().optional(),
  }),
  z.object({
    type: z.literal("file"),
    mediaType: z.string(),
    url: z.string(),
    filename: z.string().optional(),
  }),
]);
export type MessagePart = z.infer<typeof messagePartSchema>;

export const messageSchema = z.object({
  id: z.uuid(),
  role: z.enum(MESSAGE_ROLES),
  parts: z.array(messagePartSchema).min(1),
});
export type Message = z.infer<typeof messageSchema>;

export function textOf(parts: readonly MessagePart[]): string {
  return parts
    .filter((part): part is Extract<MessagePart, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}
