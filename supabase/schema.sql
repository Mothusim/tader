-- =========================================
-- Tader Multi-Tenant Supabase Schema
-- Run this in your Supabase SQL Editor
-- =========================================

-- ---- Organizations ----
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique default substr(md5(random()::text), 1, 10),
  created_at timestamptz default now()
);

-- ---- Profiles (extends auth.users) ----
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete set null,
  name text,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  created_at timestamptz default now()
);

-- Automatically create a blank profile on sign-up via trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---- Watchlists ----
create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  ticker text not null,
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  unique(org_id, ticker)
);

-- ---- Research History ----
create table public.research_history (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  ticker text not null,
  recommendation text,
  confidence float,
  analysis jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- =========================================
-- Row Level Security Policies
-- =========================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.watchlists enable row level security;
alter table public.research_history enable row level security;

-- Helper function to bypass RLS for self-lookup and prevent infinite recursion
create or replace function public.get_auth_org_id()
returns uuid
language sql security definer set search_path = public
as $$
  select org_id from profiles where id = auth.uid();
$$;

-- Organizations: users can only see their own org
create policy "Users can view own organization"
  on public.organizations for select
  using (id = public.get_auth_org_id());

-- Profiles: users can view profiles in their organization
create policy "Users can view profiles in their org"
  on public.profiles for select
  using (org_id = public.get_auth_org_id());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Watchlists: org-scoped access
create policy "Org members can read watchlists"
  on public.watchlists for select
  using (org_id = public.get_auth_org_id());

create policy "Org members can insert watchlists"
  on public.watchlists for insert
  with check (org_id = public.get_auth_org_id());

create policy "Org admins can delete watchlists"
  on public.watchlists for delete
  using (
    org_id = public.get_auth_org_id()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Research History: org-scoped access
create policy "Org members can read research history"
  on public.research_history for select
  using (org_id = public.get_auth_org_id());

create policy "Org members can insert research history"
  on public.research_history for insert
  with check (
    org_id = (select org_id from public.profiles where id = auth.uid())
  );
create table public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  ticker text not null,
  result jsonb,
  generated_at timestamptz default now()
);

alter table public.analysis_results enable row level security;

create policy "Org members can read analysis results"
  on public.analysis_results for select
  using (org_id = public.get_auth_org_id());

create policy "Org members can insert analysis results"
  on public.analysis_results for insert
  with check (org_id = public.get_auth_org_id());

-- =========================================
-- RPC Functions
-- =========================================

-- Setup User Organization
-- Bypasses RLS to allow new users to create or join an organization during signup
create or replace function public.setup_user_org(
  p_user_id uuid,
  p_email text,
  p_name text,
  p_org_action text,
  p_org_name text,
  p_invite_code text
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_org_id uuid;
  v_role text;
begin
  if p_org_action = 'create' then
    if p_org_name is null or p_org_name = '' then
      raise exception 'Organization name required';
    end if;
    
    insert into public.organizations (name)
    values (p_org_name)
    returning id into v_org_id;
    
    v_role := 'admin';
  else
    if p_invite_code is null or p_invite_code = '' then
      raise exception 'Invite code required';
    end if;
    
    select id into v_org_id from public.organizations where invite_code = p_invite_code;
    
    if v_org_id is null then
      raise exception 'Invalid invite code';
    end if;
    
    v_role := 'employee';
  end if;

  update public.profiles
  set org_id = v_org_id, role = v_role, name = p_name
  where id = p_user_id;

  return v_org_id;
end;
$$;

grant execute on function public.setup_user_org to authenticated;
