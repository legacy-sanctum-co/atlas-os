"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { authClient } from "@/core/auth/client";
import { Button } from "@/design/primitives/button";

interface PasskeySummary {
  id: string;
  name: string | null;
  deviceType: string;
  createdAt: string | null;
}

export function PasskeyManager({ passkeys }: { passkeys: PasskeySummary[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supported = useSyncExternalStore(
    () => () => undefined,
    () => "PublicKeyCredential" in window,
    () => true,
  );

  async function onAdd() {
    setError(null);
    setPending("add");
    const name = `${platformLabel()} · ${new Date().toISOString().slice(0, 10)}`;
    const result = await authClient.passkey.addPasskey({ name });
    setPending(null);
    if (result?.error) {
      setError("Passkey registration did not complete.");
      return;
    }
    router.refresh();
  }

  async function onRemove(id: string) {
    setError(null);
    setPending(id);
    const result = await authClient.passkey.deletePasskey({ id });
    setPending(null);
    if (result?.error) {
      setError("Could not remove that passkey.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {passkeys.length === 0 ? (
        <p className="text-sm text-ink-3">No passkeys registered.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line-1">
          {passkeys.map((key) => (
            <li key={key.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-ink-1">{key.name ?? "Passkey"}</p>
                <p className="text-data text-2xs text-ink-3">
                  {key.deviceType}
                  {key.createdAt ? ` · ${key.createdAt.slice(0, 10)}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(key.id)}
                loading={pending === key.id}
                disabled={pending !== null}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error ? (
        <p role="alert" className="text-xs text-signal-critical">
          {error}
        </p>
      ) : null}
      <div>
        <Button
          variant="secondary"
          onClick={onAdd}
          loading={pending === "add"}
          disabled={pending !== null || !supported}
        >
          Add passkey
        </Button>
        {!supported ? (
          <p className="mt-2 text-xs text-ink-3">This browser does not expose WebAuthn.</p>
        ) : null}
      </div>
    </div>
  );
}

function platformLabel(): string {
  if (typeof navigator === "undefined") return "Device";
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad/i.test(ua)) return "iOS";
  if (/Mac/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "Device";
}
