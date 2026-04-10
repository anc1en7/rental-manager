-- ============================================================
-- RentManager — Database Schema
-- ============================================================
-- Run this ONCE in your Supabase project's SQL Editor.
-- Supabase Dashboard → your project → SQL Editor → New query
-- Paste everything below and click Run.
-- ============================================================


-- ==========================================
-- PROFILES
-- ==========================================
-- Extends Supabase's built-in auth.users.
-- Every user (owner + tenants) has a profile.

create table public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  name       text        not null,
  role       text        not null default 'tenant' check (role in ('owner', 'tenant')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'tenant')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- HOUSES
-- ==========================================

create table public.houses (
  id         uuid        default gen_random_uuid() primary key,
  owner_id   uuid        not null references public.profiles(id) on delete cascade,
  name       text        not null,
  address    text        not null,
  city       text        not null,
  country    text        not null default 'Germany',
  created_at timestamptz not null default now()
);


-- ==========================================
-- ROOMS
-- ==========================================

create table public.rooms (
  id                 uuid           default gen_random_uuid() primary key,
  house_id           uuid           not null references public.houses(id) on delete cascade,
  room_number        text           not null,
  floor              integer        not null default 0,
  area_sqm           numeric(7,2),
  monthly_rent       numeric(10,2)  not null,
  utilities_included boolean        not null default false,
  utility_details    text,
  description        text,
  created_at         timestamptz    not null default now()
);


-- ==========================================
-- LEASES
-- ==========================================

create table public.leases (
  id             uuid           default gen_random_uuid() primary key,
  room_id        uuid           not null references public.rooms(id) on delete cascade,
  tenant_id      uuid           not null references public.profiles(id) on delete cascade,
  start_date     date           not null,
  end_date       date           not null,
  monthly_rent   numeric(10,2)  not null,   -- snapshot at lease creation
  rent_due_day   integer        not null default 1 check (rent_due_day between 1 and 28),
  status         text           not null default 'active' check (status in ('active', 'ended')),
  created_at     timestamptz    not null default now()
);


-- ==========================================
-- RENT RECORDS
-- ==========================================
-- One record per month per lease.
-- Generated automatically when a lease is created (via frontend JS).

create table public.rent_records (
  id           uuid           default gen_random_uuid() primary key,
  lease_id     uuid           not null references public.leases(id) on delete cascade,
  due_date     date           not null,
  amount_due   numeric(10,2)  not null,
  amount_paid  numeric(10,2)  not null default 0,
  paid_at      timestamptz,
  status       text           not null default 'pending' check (status in ('pending', 'partial', 'paid')),
  notes        text,
  created_at   timestamptz    not null default now()
);


-- ==========================================
-- INDEXES
-- ==========================================

create index idx_houses_owner        on public.houses(owner_id);
create index idx_rooms_house         on public.rooms(house_id);
create index idx_leases_room         on public.leases(room_id);
create index idx_leases_tenant       on public.leases(tenant_id);
create index idx_leases_status       on public.leases(status);
create index idx_rent_records_lease  on public.rent_records(lease_id);
create index idx_rent_records_due    on public.rent_records(due_date);
create index idx_rent_records_status on public.rent_records(status);


-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Ensures each user only sees/edits their own data.

alter table public.profiles    enable row level security;
alter table public.houses      enable row level security;
alter table public.rooms       enable row level security;
alter table public.leases      enable row level security;
alter table public.rent_records enable row level security;

-- PROFILES --
create policy "own_profile_read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "own_profile_update"
  on public.profiles for update
  using (auth.uid() = id);

-- Owner must read tenant profiles to display names
create policy "owner_reads_tenant_profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.leases l
      join public.rooms r  on r.id  = l.room_id
      join public.houses h on h.id  = r.house_id
      where l.tenant_id = profiles.id
        and h.owner_id  = auth.uid()
    )
  );

-- HOUSES --
create policy "owner_all_houses"
  on public.houses for all
  using (owner_id = auth.uid());

-- ROOMS --
create policy "owner_all_rooms"
  on public.rooms for all
  using (
    exists (select 1 from public.houses
            where houses.id = rooms.house_id and houses.owner_id = auth.uid())
  );

create policy "tenant_reads_leased_room"
  on public.rooms for select
  using (
    exists (select 1 from public.leases
            where leases.room_id = rooms.id
              and leases.tenant_id = auth.uid()
              and leases.status = 'active')
  );

-- LEASES --
create policy "owner_all_leases"
  on public.leases for all
  using (
    exists (
      select 1 from public.rooms r
      join public.houses h on h.id = r.house_id
      where r.id = leases.room_id and h.owner_id = auth.uid()
    )
  );

create policy "tenant_reads_own_leases"
  on public.leases for select
  using (tenant_id = auth.uid());

-- RENT RECORDS --
create policy "owner_all_rent_records"
  on public.rent_records for all
  using (
    exists (
      select 1 from public.leases l
      join public.rooms r  on r.id  = l.room_id
      join public.houses h on h.id  = r.house_id
      where l.id = rent_records.lease_id and h.owner_id = auth.uid()
    )
  );

create policy "tenant_reads_own_rent_records"
  on public.rent_records for select
  using (
    exists (select 1 from public.leases
            where leases.id = rent_records.lease_id
              and leases.tenant_id = auth.uid())
  );
