import { requireSession } from "@/core/auth/session";
import { Pane } from "@/design/primitives/shell";
import { getProfile } from "@/modules/identity";

/**
 * Home environment, M1 state. Shows only real facts about the system: who is
 * signed in and what the foundation supports. The conversational
 * environment, ventures, and memory arrive in M2+.
 */
export default async function HomePage() {
  const session = await requireSession();
  const profile = await getProfile(session.user.id);
  const displayName = profile?.displayName ?? session.user.name;

  return (
    <Pane reading>
      <header className="mb-8">
        <p className="text-label">Atlas · foundation</p>
        <h1 className="text-display mt-2 text-3xl text-ink-1">{displayName}</h1>
        <p className="mt-2 max-w-prose text-base text-ink-2">
          The private environment is established. Intelligence, ventures, and memory are the next
          milestones; nothing here is simulated.
        </p>
      </header>

      <section aria-labelledby="foundation" className="grid gap-3 @md:grid-cols-2">
        <h2 id="foundation" className="sr-only">
          Foundation status
        </h2>
        <StatusCard label="Identity" value={session.user.email} mono />
        <StatusCard
          label="Session"
          value={`expires ${session.session.expiresAt.toISOString().slice(0, 10)}`}
          mono
        />
        <StatusCard label="Data" value="Postgres · pgvector · migrations applied" />
        <StatusCard label="Memory" value="schema ready · no memories yet" />
      </section>
    </Pane>
  );
}

function StatusCard({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="material-panel rounded-lg p-4">
      <p className="text-label">{label}</p>
      <p className={`mt-1.5 truncate text-sm text-ink-1 ${mono ? "text-data" : ""}`}>{value}</p>
    </div>
  );
}
