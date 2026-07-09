-- Expected Supabase schema for the noto usability testing tool.
-- Review before running against an existing project.

create table if not exists public.studies (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  product text not null default '',
  link text not null default '',
  description text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.steps (
  id text primary key,
  study_id text not null references public.studies(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  chapter integer not null default 1,
  sort_order integer not null default 0
);

create table if not exists public.sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  study_id text not null references public.studies(id) on delete cascade,
  person_name text not null default '',
  person_code text not null default '',
  person_notes text not null default '',
  tester text not null default '',
  date date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id text primary key,
  session_id text not null references public.sessions(id) on delete cascade,
  step_id text references public.steps(id) on delete set null,
  type text,
  severity integer,
  text text not null default '',
  timestamp timestamptz not null default now()
);

create table if not exists public.audits (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  subject text not null default '',
  auditor text not null default '',
  date text not null default '',
  heuristic_sets jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_findings (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  audit_id text not null references public.audits(id) on delete cascade,
  criterion text not null default '',
  title text not null default '',
  description text not null default '',
  severity integer not null default 3,
  recommendation text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_finding_images (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  audit_id text not null references public.audits(id) on delete cascade,
  finding_id text not null references public.audit_findings(id) on delete cascade,
  storage_path text not null,
  file_name text not null default '',
  mime_type text not null default '',
  size_bytes integer not null default 0,
  caption text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists steps_study_id_sort_order_idx on public.steps(study_id, sort_order);
create index if not exists sessions_user_id_created_at_idx on public.sessions(user_id, created_at desc);
create index if not exists sessions_study_id_idx on public.sessions(study_id);
create index if not exists entries_session_id_timestamp_idx on public.entries(session_id, timestamp);
create index if not exists audits_user_id_created_at_idx on public.audits(user_id, created_at desc);
create index if not exists audit_findings_audit_id_created_at_idx on public.audit_findings(audit_id, created_at);
create index if not exists audit_finding_images_finding_id_sort_order_idx on public.audit_finding_images(finding_id, sort_order);

alter table public.studies enable row level security;
alter table public.steps enable row level security;
alter table public.sessions enable row level security;
alter table public.entries enable row level security;
alter table public.audits enable row level security;
alter table public.audit_findings enable row level security;
alter table public.audit_finding_images enable row level security;

drop policy if exists "users manage own studies" on public.studies;
create policy "users manage own studies"
on public.studies for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage steps through own studies" on public.steps;
create policy "users manage steps through own studies"
on public.steps for all
using (
  exists (
    select 1 from public.studies
    where studies.id = steps.study_id
      and studies.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.studies
    where studies.id = steps.study_id
      and studies.user_id = auth.uid()
  )
);

drop policy if exists "users manage own sessions" on public.sessions;
create policy "users manage own sessions"
on public.sessions for all
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.studies
    where studies.id = sessions.study_id
      and studies.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.studies
    where studies.id = sessions.study_id
      and studies.user_id = auth.uid()
  )
);

drop policy if exists "users manage entries through own sessions" on public.entries;
create policy "users manage entries through own sessions"
on public.entries for all
using (
  exists (
    select 1 from public.sessions
    where sessions.id = entries.session_id
      and sessions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.sessions
    where sessions.id = entries.session_id
      and sessions.user_id = auth.uid()
  )
);

drop policy if exists "users manage own audits" on public.audits;
create policy "users manage own audits"
on public.audits for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own audit findings" on public.audit_findings;
create policy "users manage own audit findings"
on public.audit_findings for all
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.audits
    where audits.id = audit_findings.audit_id
      and audits.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.audits
    where audits.id = audit_findings.audit_id
      and audits.user_id = auth.uid()
  )
);

drop policy if exists "users manage own audit finding images" on public.audit_finding_images;
create policy "users manage own audit finding images"
on public.audit_finding_images for all
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.audit_findings
    join public.audits on audits.id = audit_findings.audit_id
    where audit_findings.id = audit_finding_images.finding_id
      and audit_findings.audit_id = audit_finding_images.audit_id
      and audits.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.audit_findings
    join public.audits on audits.id = audit_findings.audit_id
    where audit_findings.id = audit_finding_images.finding_id
      and audit_findings.audit_id = audit_finding_images.audit_id
      and audits.user_id = auth.uid()
  )
);

drop policy if exists "users upload own audit finding images" on storage.objects;
create policy "users upload own audit finding images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'audit-finding-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "users read own audit finding images" on storage.objects;
create policy "users read own audit finding images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'audit-finding-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "users delete own audit finding images" on storage.objects;
create policy "users delete own audit finding images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'audit-finding-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
