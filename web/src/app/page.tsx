import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InlineCode } from '@/components/ui/code-block';
import { PointsDisplay } from '@/components/ui/points-display';
import { brand } from '@/theme';

export default function HomePage() {
  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-brand">
            {brand.name}
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground">
            Earn points while Cursor Agent works
          </h1>
          <p className="text-lg text-muted">
            {brand.name} detects real agent busy time via Cursor hooks, opens a gamified side panel,
            and connects to CPX Research for real paid surveys.
          </p>
          <p className="text-sm text-muted">
            Example balance: <PointsDisplay amount={1250} /> · cash estimate shown separately in the app
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="font-medium text-brand">VS Code extension</h2>
            <p className="mt-2 text-sm text-muted">
              Side panel, points, streaks, and CPX SurveyWall during agent waits.
            </p>
          </Card>
          <Card>
            <h2 className="font-medium text-brand">This web app</h2>
            <p className="mt-2 text-sm text-muted">
              CPX postback receiver, reward ledger, and setup docs. Host on Vercel or your domain.
            </p>
          </Card>
        </section>

        <Card raised className="space-y-4">
          <h2 className="text-xl font-medium text-foreground">Quick start</h2>
          <ol className="list-decimal space-y-2 pl-5 text-muted">
            <li>Clone the StayOn repo and open the repo root in Cursor.</li>
            <li>
              <InlineCode>cd extension && npm install && npm run compile</InlineCode>
            </li>
            <li>Press F5 to launch the Extension Development Host.</li>
            <li>Trust project hooks in Cursor Settings → Hooks.</li>
            <li>
              Deploy this Next.js app and set{' '}
              <InlineCode>stayon.apiBaseUrl</InlineCode> in the extension.
            </li>
          </ol>
          <div className="flex flex-wrap gap-3">
            <Button href="/try">Try StayOn (MEGATHON) →</Button>
            <Button href="/setup" variant="secondary">Full setup guide →</Button>
          </div>
        </Card>

        <footer className="flex flex-wrap gap-4 text-sm text-subtle-text">
          <span>
            <a href="/try" className="text-brand hover:underline">Try</a> ·{' '}
            <a href="/earnings" className="text-brand hover:underline">Earnings</a> ·{' '}
            <a href="/setup" className="text-brand hover:underline">Setup</a>
          </span>
          <span>
            API: <InlineCode>/api/cpx/postback</InlineCode> · <InlineCode>/api/stats/summary</InlineCode>
          </span>
        </footer>
      </div>
    </main>
  );
}
