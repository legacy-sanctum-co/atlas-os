"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { authClient } from "@/core/auth/client";
import { Button } from "@/design/primitives/button";
import { Field, Input } from "@/design/primitives/field";

interface SignInFormProps {
  /** `bootstrap` is shown exactly once: before the owner account exists. */
  mode: "sign-in" | "bootstrap";
}

const MIN_PASSWORD = 12;

function describeError(
  error: { status?: number | undefined; code?: string | undefined },
  mode: SignInFormProps["mode"],
): string {
  if (error.status === 429) return "Too many attempts. Wait a minute and try again.";
  if (error.code === "REGISTRATION_CLOSED") return "Registration is closed.";
  return mode === "bootstrap"
    ? "Could not create the owner account."
    : "Those credentials were not accepted.";
}

export function SignInForm({ mode }: SignInFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"password" | "passkey" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setPending("password");
    const result =
      mode === "bootstrap"
        ? await authClient.signUp.email({ email, password, name: name || "Owner" })
        : await authClient.signIn.email({ email, password });
    setPending(null);

    if (result.error) {
      setError(describeError(result.error, mode));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function onPasskey() {
    setError(null);
    setPending("passkey");
    const result = await authClient.signIn.passkey();
    setPending(null);
    if (result?.error) {
      setError("Passkey sign-in did not complete.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {mode === "bootstrap" ? (
        <Field label="Name" hint="What Atlas should call you. You can change this later.">
          {({ id, describedBy }) => (
            <Input id={id} name="name" autoComplete="name" aria-describedby={describedBy} />
          )}
        </Field>
      ) : null}
      <Field label="Email">
        {({ id, describedBy }) => (
          <Input
            id={id}
            name="email"
            type="email"
            autoComplete="username webauthn"
            inputMode="email"
            required
            aria-describedby={describedBy}
          />
        )}
      </Field>
      <Field
        label="Password"
        hint={mode === "bootstrap" ? `At least ${MIN_PASSWORD} characters.` : undefined}
        error={error ?? undefined}
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="password"
            type="password"
            autoComplete={mode === "bootstrap" ? "new-password" : "current-password"}
            required
            minLength={MIN_PASSWORD}
            invalid={invalid}
            aria-describedby={describedBy}
          />
        )}
      </Field>
      <div className="mt-2 flex flex-col gap-2">
        <Button
          type="submit"
          size="lg"
          loading={pending === "password"}
          disabled={pending !== null}
        >
          {mode === "bootstrap" ? "Create owner account" : "Enter"}
        </Button>
        {mode === "sign-in" ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onPasskey}
            loading={pending === "passkey"}
            disabled={pending !== null}
          >
            Use passkey
          </Button>
        ) : null}
      </div>
    </form>
  );
}
