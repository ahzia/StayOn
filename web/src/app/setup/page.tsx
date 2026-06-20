import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { CodeBlock } from '@/components/ui/code-block';

const postbackTemplate =
  'https://YOUR_DOMAIN/api/cpx/postback?status={status}&trans_id={trans_id}&user_id={user_id}&sub_id={subid_1}&sub_id_2={subid_2}&amount_local={amount_local}&amount_usd={amount_usd}&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}&type={type}';

export default function SetupPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
        <Link href="/" className="text-sm text-brand transition-colors hover:text-brand-hover">
          ← Back
        </Link>

        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          CPX + StayOn setup
        </h1>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-brand">1. Configure this backend</h2>
          <CodeBlock>{`cd web
cp .env.example .env.local
# Fill CPX_APP_ID and CPX_SECURE_HASH from publisher.cpx-research.com
npm run dev`}</CodeBlock>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-brand">2. CPX Postback Settings</h2>
          <p className="text-muted">
            In CPX publisher dashboard → your app → Postback Settings, paste this as{' '}
            <strong className="text-foreground">Main Postback URL</strong> (replace YOUR_DOMAIN):
          </p>
          <CodeBlock accent>{postbackTemplate}</CodeBlock>
          <p className="text-sm text-subtle-text">
            Expert settings (Screen Out, Bonus/Rating, Event Canceled) can use the same URL.
            Whitelist IPs: 188.40.3.73, 2a01:4f8:d0a:30ff::2, 157.90.97.92
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-brand">3. Extension settings</h2>
          <CodeBlock>{`// settings.json
{
  "stayon.apiBaseUrl": "https://YOUR_DOMAIN",
  "stayon.cpxSurveys": true
}`}</CodeBlock>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-brand">4. Test flow</h2>
          <Card className="space-y-2">
            <ol className="list-decimal space-y-2 pl-5 text-muted">
              <li>Run agent in Cursor → StayOn panel opens (busy).</li>
              <li>CPX SurveyWall loads in the panel (earn mode).</li>
              <li>Complete or screen out of a survey.</li>
              <li>CPX calls your postback → ledger credits points.</li>
              <li>Extension polls and adds points to the local wallet.</li>
            </ol>
          </Card>
        </section>
      </div>
    </main>
  );
}
