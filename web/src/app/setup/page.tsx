import Link from 'next/link';

const postbackTemplate =
  'https://YOUR_DOMAIN/api/cpx/postback?status={status}&trans_id={trans_id}&user_id={user_id}&sub_id={subid_1}&sub_id_2={subid_2}&amount_local={amount_local}&amount_usd={amount_usd}&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}&type={type}';

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
        <Link href="/" className="text-sm text-amber-400 hover:underline">
          ← Back
        </Link>

        <h1 className="text-3xl font-semibold">CPX + StayOn setup</h1>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-amber-300">1. Configure this backend</h2>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-300">
{`cd web
cp ../.env.example .env.local
# Fill CPX_APP_ID and CPX_SECURE_HASH from publisher.cpx-research.com
npm run dev`}
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-amber-300">2. CPX Postback Settings</h2>
          <p className="text-zinc-400">
            In CPX publisher dashboard → your app → Postback Settings, paste this as{' '}
            <strong>Main Postback URL</strong> (replace YOUR_DOMAIN):
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-xs text-emerald-300">
            {postbackTemplate}
          </pre>
          <p className="text-sm text-zinc-500">
            Expert settings (Screen Out, Bonus/Rating, Event Canceled) can use the same URL.
            Whitelist IPs: 188.40.3.73, 2a01:4f8:d0a:30ff::2, 157.90.97.92
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-amber-300">3. Extension settings</h2>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-300">
{`// settings.json
{
  "stayon.apiBaseUrl": "https://YOUR_DOMAIN",
  "stayon.cpxSurveys": true
}`}
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-amber-300">4. Test flow</h2>
          <ol className="list-decimal space-y-2 pl-5 text-zinc-300">
            <li>Run agent in Cursor → StayOn panel opens (busy).</li>
            <li>CPX SurveyWall loads in the panel (earn mode).</li>
            <li>Complete or screen out of a survey.</li>
            <li>CPX calls your postback → ledger credits tokens.</li>
            <li>Extension polls and adds ⭐ to local wallet.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
