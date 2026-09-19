/** Public surface of the events module. */
export { ATLAS_EVENT_TYPES, type AtlasEventInput, type AtlasEventType } from "./domain/event";
export { recordEvent } from "./server/record-event";
