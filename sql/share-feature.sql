-- ============================================================
-- RentManager — Property Sharing Feature
-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor → New query.
-- Requires pgcrypto (pre-installed on all Supabase projects).
-- ============================================================

create extension if not exists pgcrypto;


-- ==========================================
-- PROPERTY SHARES
-- ==========================================

create table public.property_shares (
  id            uuid        default gen_random_uuid() primary key,
  house_id      uuid        not null references public.houses(id) on delete cascade,
  owner_id      uuid        not null references public.profiles(id) on delete cascade,
  token         text        not null unique,
  share_type    text        not null default 'public' check (share_type in ('public', 'private')),
  password_hash text,
  show_rent     boolean     not null default true,
  expires_at    timestamptz,
  view_count    integer     not null default 0,
  created_at    timestamptz not null default now()
);

create index idx_property_shares_token on public.property_shares(token);
create index idx_property_shares_house on public.property_shares(house_id);
create index idx_property_shares_owner on public.property_shares(owner_id);

alter table public.property_shares enable row level security;

create policy "owner_all_property_shares"
  on public.property_shares for all
  using (owner_id = auth.uid());


-- ==========================================
-- FUNCTION: create_property_share
-- ==========================================
-- Called by authenticated owner to generate a share token.
-- Hashes the password server-side using bcrypt (pgcrypto).

create or replace function public.create_property_share(
  p_house_id   uuid,
  p_share_type text,
  p_password   text        default null,
  p_show_rent  boolean     default true,
  p_expires_at timestamptz default null
)
returns text language plpgsql security definer as $$
declare
  v_token text;
  v_hash  text;
begin
  -- Verify caller owns this house
  if not exists (
    select 1 from public.houses where id = p_house_id and owner_id = auth.uid()
  ) then
    raise exception 'unauthorized';
  end if;

  -- Validate and hash password for private shares
  if p_share_type = 'private' then
    if p_password is null or length(p_password) = 0 then
      raise exception 'password_required';
    end if;
    v_hash := crypt(p_password, gen_salt('bf', 8));
  end if;

  -- Generate a unique URL-safe token (32 hex chars)
  loop
    v_token := encode(gen_random_bytes(16), 'hex');
    exit when not exists (select 1 from public.property_shares where token = v_token);
  end loop;

  insert into public.property_shares
    (house_id, owner_id, token, share_type, password_hash, show_rent, expires_at)
  values
    (p_house_id, auth.uid(), v_token, p_share_type, v_hash, p_show_rent, p_expires_at);

  return v_token;
end;
$$;

grant execute on function public.create_property_share(uuid, text, text, boolean, timestamptz) to authenticated;


-- ==========================================
-- FUNCTION: get_share_data
-- ==========================================
-- Public endpoint — called without authentication.
-- Validates token, checks password (private shares), then
-- returns house + room data. Increments view_count on success.

create or replace function public.get_share_data(
  p_token    text,
  p_password text default null
)
returns json language plpgsql security definer as $$
declare
  v_share public.property_shares%rowtype;
  v_house public.houses%rowtype;
  v_rooms json;
begin
  -- Look up share by token
  select * into v_share from public.property_shares where token = p_token;
  if not found then
    return json_build_object('error', 'not_found');
  end if;

  -- Check expiry
  if v_share.expires_at is not null and v_share.expires_at < now() then
    return json_build_object('error', 'expired');
  end if;

  -- Verify password for private shares
  if v_share.share_type = 'private' then
    if p_password is null or length(p_password) = 0 then
      return json_build_object('error', 'password_required');
    end if;
    if crypt(p_password, v_share.password_hash) <> v_share.password_hash then
      return json_build_object('error', 'invalid_password');
    end if;
  end if;

  -- All checks passed — count this view
  update public.property_shares set view_count = view_count + 1 where id = v_share.id;

  -- Fetch house
  select * into v_house from public.houses where id = v_share.house_id;

  -- Fetch rooms with live availability status
  select json_agg(
    json_build_object(
      'id',                 r.id,
      'room_number',        r.room_number,
      'floor',              r.floor,
      'area_sqm',           r.area_sqm,
      'monthly_rent',       r.monthly_rent,
      'utilities_included', r.utilities_included,
      'utility_details',    r.utility_details,
      'description',        r.description,
      'image_url',          r.image_url,
      'is_available',       not exists (
        select 1 from public.leases l
        where l.room_id = r.id and l.status = 'active'
      )
    ) order by r.room_number
  )
  into v_rooms
  from public.rooms r
  where r.house_id = v_house.id;

  return json_build_object(
    'house',      row_to_json(v_house),
    'rooms',      coalesce(v_rooms, '[]'::json),
    'show_rent',  v_share.show_rent,
    'share_type', v_share.share_type
  );
end;
$$;

grant execute on function public.get_share_data(text, text) to anon;
grant execute on function public.get_share_data(text, text) to authenticated;
