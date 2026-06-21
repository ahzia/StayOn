import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InlineCode } from '@/components/ui/code-block';
import { PointsDisplay } from '@/components/ui/points-display';
import { getPublicStats } from '@/lib/db/stats';
import { brand } from '@/theme';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let stats = null;
  try {
    stats = await getPublicStats();
  } catch {
    // stats optional on home
  }

  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-brand">
            {brand.name} · MEGATHON
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground">
            Earn points while Cursor Agent works
          </h1>
          <p className="text-lg text-muted">
            Real hook-based busy detection, a gamified side panel, and CPX Research paid surveys
            — with a live earnings ledger on this site.
          </p>
        </header>

        {stats && stats.confirmedSurveys > 0 && (
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
              <p className="text-sm text-muted">Points earned</p>
              <p className="text-2xl font-semibold text-foreground">
                <PointsDisplay amount={stats.totalPointsEarned} />
              </p>
            </div>
          </Card>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="font-medium text-brand">Cursor extension</h2>
            <p className="mt-2 text-sm text-muted">
              Side panel, survey earnings, streaks, and agent-ready alerts during Agent waits.
            </p>
          </Card>
          <Card>
            <h2 className="font-medium text-brand">This web app</h2>
            <p className="mt-2 text-sm text-muted">
              CPX postbacks, Supabase ledger, per-user earnings — proof of real income.
            </p>
          </Card>
        </section>

        <Card raised className="space-y-4">
          <h2 className="text-xl font-medium text-foreground">Try it in 5 minutes</h2>
          <ol className="list-decimal space-y-2 pl-5 text-muted">
            <li>Install StayOn in Cursor (Open VSX or VSIX from /try).</li>
            <li>
              <strong className="text-foreground">StayOn: Set Up</strong> in your project folder.
            </li>
            <li>Submit an Agent prompt → complete a survey in the browser.</li>
            <li>
              Wallet → <strong className="text-foreground">View earnings online</strong>.
            </li>
          </ol>
          <div className="flex flex-wrap gap-3">
            <Button href="/try">Get started →</Button>
            <Button href="/earnings" variant="secondary">
              Earnings demo →
            </Button>
          </div>
        </Card>

        <footer className="flex flex-wrap gap-4 text-sm text-subtle-text">
          <span>
            <a href="/try" className="text-brand hover:underline">Try</a> ·{' '}
            <a href="/earnings" className="text-brand hover:underline">Earnings</a> ·{' '}
            <a href="/privacy" className="text-brand hover:underline">Privacy</a>
          </span>
          <span>
            API: <InlineCode>/api/stats/summary</InlineCode>
          </span>
        </footer>
      </div>
    </main>
  );
}
