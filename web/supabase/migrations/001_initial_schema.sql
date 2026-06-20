-- StayOn initial schema for Supabase (Postgres)
-- Docs: docs/17_supabase_data_model.md
-- Apply via Supabase SQL Editor or `supabase db push`

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (extends Supabase Auth — optional until Phase 3)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  payout_email text,
  country_code char(2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Extension installs (device UUID = current stayon.userId / CPX ext_user_id)
-- ---------------------------------------------------------------------------
create table if not exists public.extension_installs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  editor text not null default 'cursor',
  extension_version text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_extension_installs_user_id
  on public.extension_installs (user_id);

-- ---------------------------------------------------------------------------
-- CPX / survey targeting profile (PII)
-- ---------------------------------------------------------------------------
create table if not exists public.survey_profiles (
  extension_user_id uuid primary key references public.extension_installs (id) on delete cascade,
  email text not null,
  birthday_year smallint not null,
  birthday_month smallint not null check (birthday_month between 1 and 12),
  birthday_day smallint not null check (birthday_day between 1 and 31),
  gender text check (gender in ('m', 'f')),
  country_code char(2),
  zip_code text,
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Immutable paid reward log (CPX, BitLabs, sponsors)
-- ---------------------------------------------------------------------------
create table if not exists public.reward_events (
  id uuid primary key default gen_random_uuid(),
  external_trans_id text not null,
  extension_user_id uuid not null references public.extension_installs (id) on delete cascade,
  provider text not null default 'cpx',
  provider_status text not null default '',
  event_type text not null default '',
  status text not null check (status in ('pending', 'confirmed', 'canceled')),
  bucket text not null default 'earned' check (bucket in ('earned', 'engagement')),
  amount_usd_publisher numeric(12, 4) not null default 0,
  amount_usd_user_share numeric(12, 4) not null default 0,
  points integer not null default 0,
  offer_id text not null default '',
  session_id text not null default '',
  ip_click text not null default '',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reward_events_external_trans_id_unique unique (external_trans_id)
);

create index if not exists idx_reward_events_extension_user_id
  on public.reward_events (extension_user_id, created_at desc);

create index if not exists idx_reward_events_status
  on public.reward_events (status, extension_user_id);

-- ---------------------------------------------------------------------------
-- Materialized balance per extension install
-- ---------------------------------------------------------------------------
create table if not exists public.user_balances (
  extension_user_id uuid primary key references public.extension_installs (id) on delete cascade,
  available_points integer not null default 0 check (available_points >= 0),
  pending_points integer not null default 0 check (pending_points >= 0),
  lifetime_earned_points integer not null default 0,
  lifetime_redeemed_points integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Extension device sync (replaces ledger.synced flag)
-- ---------------------------------------------------------------------------
create table if not exists public.reward_sync_acks (
  extension_user_id uuid not null references public.extension_installs (id) on delete cascade,
  reward_event_id uuid not null references public.reward_events (id) on delete cascade,
  acked_at timestamptz not null default now(),
  primary key (extension_user_id, reward_event_id)
);

-- ---------------------------------------------------------------------------
-- Payouts (Phase E — schema ready)
-- ---------------------------------------------------------------------------
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  points integer not null check (points > 0),
  amount_eur numeric(12, 4) not null,
  method text not null,
  recipient_email text not null,
  provider text not null default 'tremendous',
  provider_order_id text,
  status text not null default 'requested'
    check (status in ('requested', 'processing', 'paid', 'failed', 'canceled')),
  failure_reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_payout_requests_user_id
  on public.payout_requests (user_id, created_at desc);

create table if not exists public.payout_events (
  id uuid primary key default gen_random_uuid(),
  payout_request_id uuid not null references public.payout_requests (id) on delete cascade,
  status text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Optional: engagement (learn, streaks) — non-withdrawable
-- ---------------------------------------------------------------------------
create table if not exists public.engagement_events (
  id uuid primary key default gen_random_uuid(),
  extension_user_id uuid not null references public.extension_installs (id) on delete cascade,
  kind text not null,
  points integer not null default 0,
  label text not null default '',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_engagement_events_install
  on public.engagement_events (extension_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers: ensure balance row exists for every install
-- ---------------------------------------------------------------------------
create or replace function public.ensure_user_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_balances (extension_user_id)
  values (new.id)
  on conflict (extension_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_extension_installs_balance on public.extension_installs;
create trigger trg_extension_installs_balance
  after insert on public.extension_installs
  for each row
  execute function public.ensure_user_balance();

-- ---------------------------------------------------------------------------
-- Apply confirmed reward to balance (call from postback handler via RPC or app code)
-- ---------------------------------------------------------------------------
create or replace function public.apply_reward_to_balance(
  p_extension_user_id uuid,
  p_points_delta integer,
  p_to_pending boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_balances (extension_user_id)
  values (p_extension_user_id)
  on conflict (extension_user_id) do nothing;

  if p_to_pending then
    update public.user_balances
    set
      pending_points = pending_points + greatest(p_points_delta, 0),
      lifetime_earned_points = lifetime_earned_points + greatest(p_points_delta, 0),
      updated_at = now()
    where extension_user_id = p_extension_user_id;
  else
    update public.user_balances
    set
      available_points = available_points + p_points_delta,
      lifetime_earned_points = lifetime_earned_points + greatest(p_points_delta, 0),
      updated_at = now()
    where extension_user_id = p_extension_user_id
      and available_points + p_points_delta >= 0;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.extension_installs enable row level security;
alter table public.survey_profiles enable row level security;
alter table public.reward_events enable row level security;
alter table public.user_balances enable row level security;
alter table public.reward_sync_acks enable row level security;
alter table public.payout_requests enable row level security;
alter table public.payout_events enable row level security;
alter table public.engagement_events enable row level security;

-- Authenticated users read their own profile
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

-- Installs linked to auth user
create policy extension_installs_select_own on public.extension_installs
  for select using (user_id = auth.uid());

-- Survey profile via linked install
create policy survey_profiles_select_own on public.survey_profiles
  for select using (
    exists (
      select 1 from public.extension_installs ei
      where ei.id = survey_profiles.extension_user_id
        and ei.user_id = auth.uid()
    )
  );

-- Balances via linked install
create policy user_balances_select_own on public.user_balances
  for select using (
    exists (
      select 1 from public.extension_installs ei
      where ei.id = user_balances.extension_user_id
        and ei.user_id = auth.uid()
    )
  );

-- Reward events via linked install
create policy reward_events_select_own on public.reward_events
  for select using (
    exists (
      select 1 from public.extension_installs ei
      where ei.id = reward_events.extension_user_id
        and ei.user_id = auth.uid()
    )
  );

-- Payouts
create policy payout_requests_select_own on public.payout_requests
  for select using (user_id = auth.uid());

create policy payout_requests_insert_own on public.payout_requests
  for insert with check (user_id = auth.uid());

-- Service role bypasses RLS — used by Next.js API routes only

-- ---------------------------------------------------------------------------
-- Updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_survey_profiles_updated_at on public.survey_profiles;
create trigger trg_survey_profiles_updated_at
  before update on public.survey_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_reward_events_updated_at on public.reward_events;
create trigger trg_reward_events_updated_at
  before update on public.reward_events
  for each row execute function public.set_updated_at();
