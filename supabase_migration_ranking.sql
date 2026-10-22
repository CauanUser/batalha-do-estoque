-- Corrige a constraint de status da tabela rooms para permitir o ranking entre perguntas.
-- Execute este arquivo uma única vez no Supabase: SQL Editor > New query > Run.
alter table public.rooms drop constraint if exists rooms_status_check;
alter table public.rooms
  add constraint rooms_status_check
  check (status in ('lobby', 'question', 'ranking', 'results'));

-- Garante que as alterações de sala e pontuação sejam publicadas no Realtime.
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
