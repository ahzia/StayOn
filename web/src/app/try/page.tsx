import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { CodeBlock } from '@/components/ui/code-block';
import { PointsDisplay } from '@/components/ui/points-display';
import { getPublicStats } from '@/lib/db/stats';

export const dynamic = 'force-dynamic';

export default async function TryPage() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  let stats = null;
  let statsError: string | undefined;
  try {
    stats = await getPublicStats();
  } catch (err) {
    statsError = err instanceof Error ? err.message : String(err);
  }

  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
        <Link href="/" className="text-sm text-brand hover:text-brand-hover">
          ← Home
        </Link>

        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Try StayOn at MEGATHON
          </h1>
          <p className="text-lg text-muted">
            Install the extension, run a Cursor Agent prompt, complete a paid survey, and see your
            earnings on this site.
          </p>
        </header>

        {stats && (
          <Card raised className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted">Testers</p>
              <p className="text-2xl font-semibold text-foreground">{stats.installs}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Confirmed surveys</p>
              <p className="text-2xl font-semibold text-foreground">{stats.confirmedSurveys}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Points earned (all users)</p>
              <p className="text-2xl font-semibold text-foreground">
                <PointsDisplay amount={stats.totalPointsEarned} />
              </p>
            </div>
          </Card>
        )}
        {statsError && (
          <Card>
            <p className="text-sm text-muted">Live stats unavailable: {statsError}</p>
          </Card>
        )}

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-brand">1. Install extension</h2>
          <Card className="space-y-2 text-sm text-muted">
            <p>
              <strong className="text-foreground">Option A — Open VSX (recommended):</strong> Cursor →
              Extensions → search <strong>StayOn</strong> → Install → reload.
            </p>
            <p>
              <strong className="text-foreground">Option B — VSIX:</strong> download{' '}
              <strong className="text-foreground">stayon-0.1.5.vsix</strong> from GitHub Releases →
              Install from VSIX → reload.
            </p>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-brand">2. One-time setup</h2>
          <Card className="space-y-2 text-sm text-muted">
            <p>
              Open your project folder, then <strong className="text-foreground">Cmd+Shift+P</strong>{' '}
              (Ctrl+Shift+P on Windows) → <strong>StayOn: Set Up</strong>
            </p>
            <p>No bash or jq — works on Windows and Mac. Then submit an Agent prompt.</p>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-brand">3. Backend URL</h2>
          <p className="text-sm text-muted">
            The shipped VSIX should point here automatically. If the panel says “Connect backend”:
          </p>
          <CodeBlock>{`{
  "stayon.apiBaseUrl": "${appUrl}",
  "stayon.cpxSurveys": true
}`}</CodeBlock>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-brand">4. Earn</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>Open StayOn panel → set up survey profile (valid email + country).</li>
            <li>Pick <strong>Surveys</strong> at the bottom.</li>
            <li>Submit a Cursor <strong>Agent</strong> prompt.</li>
            <li>Click <strong>Open in browser</strong> and complete a survey.</li>
            <li>Points sync within ~30 seconds (1000 survey points = $1).</li>
            <li>Payout withdrawal is not in this beta yet — balances are tracked on /earnings.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-brand">5. See your income</h2>
          <Card className="space-y-2 text-sm text-muted">
            <p>
              StayOn panel → <strong>Wallet</strong> tab → <strong>View earnings online</strong>
            </p>
            <p>
              Or open{' '}
              <Link href="/earnings" className="text-brand hover:underline">
                /earnings
              </Link>{' '}
              and paste your extension user ID (shown in Wallet).
            </p>
          </Card>
        </section>

        <section className="flex flex-wrap gap-3">
          <Link
            href="/earnings"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          >
            View earnings
          </Link>
          <Link
            href="/privacy"
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-surface"
          >
            Privacy (beta)
          </Link>
        </section>
      </div>
    </main>
  );
}
