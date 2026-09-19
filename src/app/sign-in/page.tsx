import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/core/auth/session";
import { hasOwner } from "@/core/auth/owner";
import { AtlasMark } from "@/design/primitives/atlas-mark";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  if (await getSession()) redirect("/");
  const ownerExists = await hasOwner();

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <AtlasMark size={44} />
          <div className="text-center">
            <h1 className="text-display text-2xl text-ink-1">Atlas</h1>
            <p className="mt-1 text-xs text-ink-3">
              {ownerExists ? "Private system. Owner access only." : "Establish the owner account."}
            </p>
          </div>
        </div>
        <div className="material-instrument rounded-xl p-6">
          <SignInForm mode={ownerExists ? "sign-in" : "bootstrap"} />
        </div>
        <div className="hairline mt-8" />
      </div>
    </div>
  );
}
