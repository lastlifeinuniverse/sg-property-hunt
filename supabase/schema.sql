-- ============================================================
-- SG Property Hunt — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New query
-- ============================================================

-- 1. LISTINGS — one row per unit on the market
create table if not exists listings (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),

  -- Project / location
  project_name  text not null,
  district      smallint not null check (district between 1 and 28),
  area          text,                        -- e.g. "Bishan", "Marine Parade"
  address       text,
  lat           numeric(9,6),
  lng           numeric(9,6),

  -- Unit details
  floor_level   smallint,
  unit_size_sqft numeric(8,2),
  bedrooms      smallint,
  bathrooms     smallint,
  facing        text,                        -- N/S/E/W/NE/NW/SE/SW

  -- Financials
  asking_price  integer,                     -- SGD
  psf           numeric(8,2),               -- computed or manual
  tenure        text default 'freehold',    -- freehold / 99yr / 999yr
  top_year      smallint,

  -- Listing meta
  listing_url   text,
  listing_source text default 'manual',     -- manual / propertyguru / 99co
  days_on_market smallint,
  agent_name    text,
  agent_contact text,

  -- Status
  status        text default 'active'        -- active / viewing / shortlisted / passed / transacted
);

-- 2. RATINGS — like/dislike decisions, before or after viewing
create table if not exists ratings (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  listing_id   uuid references listings(id) on delete cascade,

  decision     text not null check (decision in ('like','dislike','maybe')),
  stage        text default 'pre_viewing'    check (stage in ('pre_viewing','post_viewing')),

  -- Structured reason tags (array of strings)
  reasons      text[] default '{}',          -- e.g. ['price_high','facing_west','low_floor']

  notes        text
);

-- 3. VIEWING NOTES — structured post-visit form
create table if not exists viewing_notes (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  listing_id      uuid references listings(id) on delete cascade,

  viewed_at       date,
  agent_asking    integer,                   -- actual asking price discussed

  -- Condition scores 1–5
  score_fixtures  smallint check (score_fixtures between 1 and 5),
  score_flooring  smallint check (score_flooring between 1 and 5),
  score_kitchen   smallint check (score_kitchen between 1 and 5),
  score_bathroom  smallint check (score_bathroom between 1 and 5),
  score_natural_light smallint check (score_natural_light between 1 and 5),
  score_noise     smallint check (score_noise between 1 and 5),
  score_facilities smallint check (score_facilities between 1 and 5),
  score_carpark   smallint check (score_carpark between 1 and 5),

  -- Checklist flags
  has_renovation  boolean default false,
  reno_age_years  smallint,
  deal_breakers   text[] default '{}',       -- e.g. ['water_stain','old_wiring','west_facing_heat']

  -- Free text
  notes_general   text,
  notes_unit      text,
  notes_building  text,
  notes_area      text,

  -- Photo references (Supabase storage paths)
  photos          text[] default '{}'
);

-- 4. CRITERIA WEIGHTS — user's scoring preferences
create table if not exists criteria (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  name          text not null default 'default',

  -- Weights (must sum to 1.0, validated in app)
  w_location    numeric(4,3) default 0.25,
  w_price       numeric(4,3) default 0.25,
  w_unit        numeric(4,3) default 0.25,
  w_condition   numeric(4,3) default 0.25,

  -- Hard filters
  max_budget    integer default 2000000,
  min_size_sqft numeric(8,2) default 700,
  min_floor     smallint default 3,
  preferred_districts integer[] default '{10,11,15,19,20}',
  preferred_tenure text[] default '{freehold,999yr}',
  max_psf       numeric(8,2),
  mrt_max_walk_min smallint default 10,

  -- PSF benchmarks by district (for fair-value check)
  psf_benchmarks jsonb default '{}'
);

-- Insert a default criteria row
insert into criteria (name) values ('My Criteria')
on conflict do nothing;

-- ============================================================
-- Indexes
-- ============================================================
create index on listings(district);
create index on listings(status);
create index on listings(asking_price);
create index on ratings(listing_id);
create index on viewing_notes(listing_id);

-- ============================================================
-- Row Level Security (enable when you add auth)
-- For now, open access for MVP single-user testing
-- ============================================================
alter table listings enable row level security;
alter table ratings enable row level security;
alter table viewing_notes enable row level security;
alter table criteria enable row level security;

-- Open policies for MVP (tighten once you add Supabase Auth)
create policy "Allow all for MVP" on listings for all using (true) with check (true);
create policy "Allow all for MVP" on ratings for all using (true) with check (true);
create policy "Allow all for MVP" on viewing_notes for all using (true) with check (true);
create policy "Allow all for MVP" on criteria for all using (true) with check (true);
