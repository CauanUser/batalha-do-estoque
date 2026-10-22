-- Batalha do Estoque: schema inicial para Supabase
-- Execute no SQL Editor de um projeto NOVO. Leia os comentários antes de usar publicamente.
create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references auth.users(id) on delete cascade,
  question_index integer not null default -1 check (question_index between -1 and 14),
  status text not null default 'lobby' check (status in ('lobby','question','results')),
  revealed boolean not null default false,
  question_started_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  score integer not null default 0 check (score >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  question_index integer not null check (question_index between 0 and 14),
  selected_option integer not null check (selected_option between 0 and 3),
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  unique(player_id, question_index)
);

alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.answers enable row level security;

-- Rooms: anyone may view a room by code; only the authenticated owner may create/update it.
drop policy if exists "rooms are publicly readable" on public.rooms;
create policy "rooms are publicly readable" on public.rooms for select to anon, authenticated using (true);
drop policy if exists "signed-in user creates own room" on public.rooms;
create policy "signed-in user creates own room" on public.rooms for insert to authenticated with check (auth.uid() = host_id);
drop policy if exists "owner updates own room" on public.rooms;
create policy "owner updates own room" on public.rooms for update to authenticated using (auth.uid() = host_id) with check (auth.uid() = host_id);

-- Players: prototype allows guests to join; public names/scores are visible in rooms.
drop policy if exists "players are publicly readable" on public.players;
create policy "players are publicly readable" on public.players for select to anon, authenticated using (true);
drop policy if exists "guests may join a room" on public.players;
create policy "guests may join a room" on public.players for insert to anon, authenticated with check (char_length(display_name) between 1 and 30);
drop policy if exists "players may update own score prototype" on public.players;
create policy "players may update own score prototype" on public.players for update to anon, authenticated using (true) with check (true);

-- Prototype answer submissions. Before public production, move scoring/answer validation into
-- server-side RPC and prevent clients from changing scores directly.
drop policy if exists "answers are publicly readable" on public.answers;
create policy "answers are publicly readable" on public.answers for select to anon, authenticated using (true);
drop policy if exists "guests may submit answers" on public.answers;
create policy "guests may submit answers" on public.answers for insert to anon, authenticated with check (selected_option between 0 and 3);

do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.players;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.answers;
exception when duplicate_object then null;
end $$;
