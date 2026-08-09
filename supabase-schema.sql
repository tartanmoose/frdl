-- Run this in Supabase → SQL Editor → New query → Paste → Run

-- Friends list (Geometry Dash player profiles)
create table if not exists friends (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  profile jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ranked levels (ordered list)
create table if not exists levels (
  id uuid primary key default gen_random_uuid(),
  level_id text not null unique,
  name text not null,
  author text default '',
  difficulty text default '',
  stars int,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Public can read everything
alter table friends enable row level security;
alter table levels enable row level security;

create policy "Public read friends"
  on friends for select
  using (true);

create policy "Public read levels"
  on levels for select
  using (true);

-- No public write policies — all writes go through the API with the service role key

-- Seed starter friend (optional — the app also seeds on first load if empty)
-- insert into friends (username, profile) values ('theRealpeanutGD', '{}');
