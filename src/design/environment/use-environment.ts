"use client";

import { useSyncExternalStore } from "react";

import {
  MEDIA_QUERIES,
  type DevicePosture,
  type EnvironmentMode,
  type EnvironmentState,
  type ViewportSegments,
} from "./mode";

/**
 * Client mirror of the CSS environment. Layout never depends on this hook;
 * it exists for logic that must know the mode (e.g. where to host a sheet).
 * Fold data is read defensively and is null where unsupported.
 */

const SERVER_SNAPSHOT: EnvironmentState = { mode: "compact", posture: null, segments: null };

function readMode(): EnvironmentMode {
  if (window.matchMedia(MEDIA_QUERIES.command).matches) return "command";
  if (window.matchMedia(MEDIA_QUERIES.portable).matches) return "portable";
  return "compact";
}

function readPosture(): DevicePosture | null {
  const query = window.matchMedia(MEDIA_QUERIES.folded);
  // A media string the browser cannot parse reports the input unchanged with
  // `matches: false`; supported browsers echo a normalized `media` string.
  if (query.media === "not all") return null;
  return query.matches ? "folded" : "continuous";
}

function readSegments(): ViewportSegments | null {
  const viewport = (window as Window & { viewport?: { segments?: DOMRect[] | null } }).viewport;
  const segments = viewport?.segments;
  if (!segments || segments.length < 2) return null;
  const lefts = new Set(segments.map((segment) => Math.round(segment.left)));
  const tops = new Set(segments.map((segment) => Math.round(segment.top)));
  return { horizontal: lefts.size, vertical: tops.size };
}

let cached: EnvironmentState | null = null;

function snapshot(): EnvironmentState {
  const next: EnvironmentState = {
    mode: readMode(),
    posture: readPosture(),
    segments: readSegments(),
  };
  if (
    cached &&
    cached.mode === next.mode &&
    cached.posture === next.posture &&
    cached.segments?.horizontal === next.segments?.horizontal &&
    cached.segments?.vertical === next.segments?.vertical
  ) {
    return cached;
  }
  cached = next;
  return next;
}

function subscribe(onChange: () => void): () => void {
  const queries = Object.values(MEDIA_QUERIES).map((media) => window.matchMedia(media));
  for (const query of queries) query.addEventListener("change", onChange);
  window.addEventListener("resize", onChange);
  const viewport = (window as Window & { viewport?: EventTarget }).viewport;
  viewport?.addEventListener?.("segmentschange", onChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
    viewport?.removeEventListener?.("segmentschange", onChange);
  };
}

export function useEnvironment(): EnvironmentState {
  return useSyncExternalStore(subscribe, snapshot, () => SERVER_SNAPSHOT);
}

export function useEnvironmentMode(): EnvironmentMode {
  return useEnvironment().mode;
}
