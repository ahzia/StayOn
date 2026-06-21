import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
        <Link href="/" className="text-sm text-brand hover:text-brand-hover">
          ← Home
        </Link>
        <h1 className="text-3xl font-semibold text-foreground">Privacy (beta)</h1>
        <Card className="space-y-4 text-sm text-muted">
          <p>
            StayOn is a beta product. This page describes what we collect during the beta test.
          </p>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">Survey profile</h2>
            <p>
              If you use paid surveys, we store email, date of birth, and country on the StayOn
              backend to match you with CPX Research surveys. This is required by our survey
              partner.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">Extension identity</h2>
            <p>
              The extension generates a random user ID (UUID) stored locally. We use it to credit
              survey rewards and show your earnings page. We do not read your code, prompts, or
              repository files.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">Cursor hooks</h2>
            <p>
              Project hooks send agent busy/idle signals to a localhost bridge only. They store at
              most 120 characters of your prompt as context for the panel — not full transcripts.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">Contact</h2>
            <p>
              Questions or deletion requests: contact the StayOn team via the channel that sent you
              the beta invite.
            </p>
          </section>
        </Card>
      </div>
    </main>
  );
}
