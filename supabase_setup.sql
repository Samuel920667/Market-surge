-- ─────────────────────────────────────────────────────────────────────────────
-- MarketSurge — Supabase Database Setup
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- Holdings table
create table if not exists public.holdings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  symbol      text not null,
  shares      numeric(12, 4) not null check (shares > 0),
  avg_cost    numeric(12, 4) not null check (avg_cost > 0),
  created_at  timestamptz default now()
);

-- Index for fast per-user queries
create index if not exists holdings_user_id_idx on public.holdings(user_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Users can only see and modify their own holdings

alter table public.holdings enable row level security;

create policy "Users can view own holdings"
  on public.holdings for select
  using (auth.uid() = user_id);

create policy "Users can insert own holdings"
  on public.holdings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own holdings"
  on public.holdings for update
  using (auth.uid() = user_id);

create policy "Users can delete own holdings"
  on public.holdings for delete
  using (auth.uid() = user_id);
