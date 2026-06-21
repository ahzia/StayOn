import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PointsDisplay } from '@/components/ui/points-display';
import { getWalletSummary } from '@/lib/ledger';
import { isValidExtensionUserId } from '@/lib/storage';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ userId?: string }>;
};

function formatUsd(points: number): string {
  return `≈ $${(points / 1000).toFixed(2)}`;
}

export default async function EarningsPage({ searchParams }: Props) {
  const { userId } = await searchParams;

  if (!userId) {
    return (
      <main className="flex-1">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
          <Link href="/try" className="text-sm text-brand hover:text-brand-hover">
            ← Try StayOn
          </Link>
          <h1 className="text-3xl font-semibold text-foreground">Your earnings</h1>
          <Card className="space-y-3">
            <p className="text-muted">
              Open this page from the StayOn panel (Wallet → <strong>View earnings online</strong>)
              or paste your extension user ID below.
            </p>
            <form className="flex flex-col gap-3 sm:flex-row" action="/earnings" method="get">
              <input
                name="userId"
                placeholder="Extension user ID (UUID)"
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
                required
              />
              <button
                type="submit"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
              >
                Load
              </button>
            </form>
          </Card>
        </div>
      </main>
    );
  }

  if (!isValidExtensionUserId(userId)) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <p className="text-destructive">Invalid user ID — must be a UUID from the StayOn extension.</p>
        </div>
      </main>
    );
  }

  let summary;
  let error: string | undefined;

  try {
    summary = await getWalletSummary(userId);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
        <Link href="/try" className="text-sm text-brand hover:text-brand-hover">
          ← Try StayOn
        </Link>

        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">Your earnings</h1>
          <p className="text-sm text-muted">
            Server balance for extension user{' '}
            <code className="rounded bg-surface px-1 text-xs">{userId}</code>
          </p>
        </header>

        {error ? (
          <Card>
            <p className="text-destructive">{error}</p>
          </Card>
        ) : summary ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <p className="text-sm text-muted">Available points</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  <PointsDisplay amount={summary.availablePoints} />
                </p>
                <p className="text-sm text-subtle-text">{summary.cashEstimate}</p>
              </Card>
              <Card>
                <p className="text-sm text-muted">Lifetime earned (surveys)</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  <PointsDisplay amount={summary.lifetimeEarnedPoints} />
                </p>
                <p className="text-sm text-subtle-text">{formatUsd(summary.lifetimeEarnedPoints)}</p>
              </Card>
            </div>

            <Card className="space-y-2">
              <p className="text-sm text-muted">
                Pending sync to extension: <PointsDisplay amount={summary.pendingPoints} />
              </p>
              <p className="text-xs text-subtle-text">
                Learn/perk points in the extension are local only and not shown here.
              </p>
            </Card>

            <Card className="space-y-3 border-brand/30 bg-brand/5">
              <h2 className="text-lg font-medium text-foreground">Claim payout</h2>
              <p className="text-sm text-muted">
                Withdrawals (bank / PayPal via Mollie) are coming in a post-beta release. Your
                confirmed survey balance is tracked here and in the extension Wallet tab — no
                action needed for the hackathon demo.
              </p>
              <p className="text-xs text-subtle-text">
                1000 survey points = $1 USD · Learn/Perks points in the extension are not withdrawable.
              </p>
            </Card>

            <section className="space-y-3">
              <h2 className="text-lg font-medium text-foreground">Recent survey rewards</h2>
              {summary.recentEvents.length === 0 ? (
                <Card>
                  <p className="text-muted">No CPX rewards yet. Complete a survey while the agent is busy.</p>
                </Card>
              ) : (
                <ul className="space-y-2">
                  {summary.recentEvents.map((event) => (
                    <li key={event.id}>
                      <Card className="flex items-center justify-between gap-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{event.label}</p>
                          <p className="text-xs text-subtle-text">
                            {new Date(event.createdAt).toLocaleString()} · {event.status}
                            {event.synced ? ' · synced' : ' · pending sync'}
                          </p>
                        </div>
                        <span className="font-semibold text-brand">
                          +<PointsDisplay amount={event.points} />
                        </span>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}

        <p className="text-xs text-subtle-text">
          Claim payout coming soon. This page shows confirmed CPX earnings stored on the StayOn server.
        </p>
      </div>
    </main>
  );
}
