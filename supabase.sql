-- Estrutura inicial para multiplayer. Aplicar no SQL Editor do Supabase.
create extension if not exists pgcrypto;
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_token text not null,
  question_index integer not null default -1 check (question_index between -1 and 14),
  seconds_left integer not null default 15 check (seconds_left between 0 and 15),
  status text not null default 'lobby' check (status in ('lobby','question','results')),
  revealed boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  display_name text not null,
  score integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  question_index integer not null check (question_index between 0 and 14),
  selected_option integer not null check (selected_option between 0 and 3),
  created_at timestamptz not null default now(),
  unique(player_id, question_index)
);
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.answers enable row level security;
-- Políticas abaixo são permissivas para protótipo/teste. Não usar em ambiente público sem
-- implementar autenticação e validação segura do papel de apresentador no servidor.
create policy "prototype rooms read" on public.rooms for select to anon, authenticated using (true);
create policy "prototype rooms insert" on public.rooms for insert to anon, authenticated with check (true);
create policy "prototype rooms update" on public.rooms for update to anon, authenticated using (true) with check (true);
create policy "prototype players read" on public.players for select to anon, authenticated using (true);
create policy "prototype players insert" on public.players for insert to anon, authenticated with check (true);
create policy "prototype players update" on public.players for update to anon, authenticated using (true) with check (true);
create policy "prototype answers read" on public.answers for select to anon, authenticated using (true);
create policy "prototype answers insert" on public.answers for insert to anon, authenticated with check (true);
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.answers;
