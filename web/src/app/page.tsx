import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-widest text-amber-400">StayOn</p>
          <h1 className="text-4xl font-semibold leading-tight">
            Earn while Cursor Agent works
          </h1>
          <p className="text-lg text-zinc-400">
            StayOn detects real agent busy time via Cursor hooks, opens a gamified side panel,
            and connects to CPX Research for real paid surveys.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="font-medium text-amber-300">VS Code extension</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Side panel, tokens, streaks, and CPX SurveyWall during agent waits.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="font-medium text-amber-300">This web app</h2>
            <p className="mt-2 text-sm text-zinc-400">
              CPX postback receiver, reward ledger, and setup docs. Host on Vercel or your domain.
            </p>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-xl font-medium">Quick start</h2>
          <ol className="list-decimal space-y-2 pl-5 text-zinc-300">
            <li>Clone the StayOn repo and open the repo root in Cursor.</li>
            <li>
              <code className="rounded bg-zinc-800 px-1">cd extension && npm install && npm run compile</code>
            </li>
            <li>Press F5 to launch the Extension Development Host.</li>
            <li>Trust project hooks in Cursor Settings → Hooks.</li>
            <li>
              Deploy this Next.js app and set{' '}
              <code className="rounded bg-zinc-800 px-1">stayon.apiBaseUrl</code> in the extension.
            </li>
          </ol>
          <Link
            href="/setup"
            className="inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
          >
            Full setup guide →
          </Link>
        </section>

        <footer className="text-sm text-zinc-500">
          Backend postback: <code>/api/cpx/postback</code> · Survey wall: <code>/api/cpx/wall</code>
        </footer>
      </div>
    </main>
  );
}
