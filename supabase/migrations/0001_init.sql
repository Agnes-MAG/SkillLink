-- SkillLink - Intelligent Campus Skill Exchange Platform
-- Initial schema: tables, indexes, triggers, RPCs and row level security.
-- Run this in the Supabase SQL editor (or `supabase db push`) before starting the app.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('student', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type user_status as enum ('active', 'suspended', 'deleted');
  end if;
  if not exists (select 1 from pg_type where typname = 'skill_type') then
    create type skill_type as enum ('offer', 'need');
  end if;
  if not exists (select 1 from pg_type where typname = 'session_status') then
    create type session_status as enum (
      'pending',
      'accepted',
      'declined',
      'cancelled',
      'completed_pending_rating',
      'completed',
      'expired',
      'escalated'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type notification_type as enum (
      'request_received',
      'request_accepted',
      'request_declined',
      'request_cancelled',
      'session_completed',
      'rating_received',
      'message',
      'moderation'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  department text not null default 'Other',
  year text not null default 'Other',
  bio text,
  avatar_url text,
  role user_role not null default 'student',
  status user_status not null default 'active',
  accepting_requests boolean not null default true,
  onboarding_completed boolean not null default false,
  rating numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  response_rate numeric(5, 2) not null default 0,
  completion_rate numeric(5, 2) not null default 0,
  avg_response_hours numeric(8, 2),
  completed_sessions integer not null default 0,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_len check (char_length(full_name) <= 100),
  constraint profiles_bio_len check (bio is null or char_length(bio) <= 500)
);

-- ---------------------------------------------------------------------------
-- skills
-- ---------------------------------------------------------------------------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  name_normalized text generated always as (lower(btrim(name))) stored,
  category text not null,
  description text,
  type skill_type not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint skills_name_len check (char_length(btrim(name)) between 2 and 50),
  constraint skills_description_len check (
    description is null or char_length(description) between 10 and 500
  ),
  constraint skills_category_allowed check (
    category in (
      'Programming', 'Design', 'Writing', 'Language',
      'Music', 'Sports', 'Business', 'Science', 'Other'
    )
  )
);

create unique index if not exists skills_unique_per_user
  on public.skills (user_id, name_normalized, type);

create index if not exists skills_user_idx on public.skills (user_id);
create index if not exists skills_type_category_idx on public.skills (type, category);
create index if not exists skills_name_idx on public.skills (name_normalized);

-- A user may not offer and need the exact same skill (business rule 6.1).
create or replace function public.enforce_skill_exclusivity()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.skills s
    where s.user_id = new.user_id
      and s.name_normalized = lower(btrim(new.name))
      and s.type <> new.type
      and s.id is distinct from new.id
  ) then
    raise exception 'You already listed "%" as the opposite skill type', new.name
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists skills_exclusivity on public.skills;
create trigger skills_exclusivity
  before insert or update on public.skills
  for each row execute function public.enforce_skill_exclusivity();

-- ---------------------------------------------------------------------------
-- skill_relations: lightweight taxonomy powering tier-3 (semantic) matching
-- ---------------------------------------------------------------------------
create table if not exists public.skill_relations (
  id uuid primary key default gen_random_uuid(),
  skill_name text not null,
  related_name text not null,
  weight numeric(3, 2) not null default 0.5,
  unique (skill_name, related_name)
);

-- ---------------------------------------------------------------------------
-- sessions (the exchange state machine)
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  status session_status not null default 'pending',
  notes text,
  scheduled_at timestamptz,
  responded_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null default now() + interval '48 hours',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_notes_len check (notes is null or char_length(notes) <= 500),
  constraint sessions_distinct_parties check (requester_id <> provider_id)
);

create index if not exists sessions_requester_idx on public.sessions (requester_id, status);
create index if not exists sessions_provider_idx on public.sessions (provider_id, status);
create index if not exists sessions_skill_idx on public.sessions (skill_id);

-- Only one live session per (requester, provider, skill) triple.
create unique index if not exists sessions_no_duplicate_open
  on public.sessions (requester_id, provider_id, skill_id)
  where status in ('pending', 'accepted', 'completed_pending_rating');

-- ---------------------------------------------------------------------------
-- ratings
-- ---------------------------------------------------------------------------
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  rater_id uuid not null references public.profiles (id) on delete cascade,
  rated_user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (session_id, rater_id),
  constraint ratings_comment_len check (comment is null or char_length(comment) <= 500),
  constraint ratings_no_self check (rater_id <> rated_user_id)
);

create index if not exists ratings_rated_user_idx on public.ratings (rated_user_id);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  flagged boolean not null default false,
  created_at timestamptz not null default now(),
  constraint messages_content_len check (char_length(btrim(content)) between 1 and 2000)
);

create index if not exists messages_session_idx on public.messages (session_id, created_at);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever a user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, department, year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'department', 'Other'),
    coalesce(new.raw_user_meta_data ->> 'year', 'Other')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at housekeeping
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists sessions_touch on public.sessions;
create trigger sessions_touch before update on public.sessions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Session guards: capacity limits + legal state transitions
-- ---------------------------------------------------------------------------
create or replace function public.enforce_session_limits()
returns trigger
language plpgsql
as $$
declare
  provider_pending integer;
  requester_pending integer;
  provider_open boolean;
begin
  select accepting_requests into provider_open
  from public.profiles where id = new.provider_id;

  if provider_open is not true then
    raise exception 'This student is not accepting requests right now'
      using errcode = 'check_violation';
  end if;

  select count(*) into provider_pending
  from public.sessions
  where provider_id = new.provider_id and status = 'pending';

  if provider_pending >= 3 then
    raise exception 'Provider is at capacity (3 pending requests)'
      using errcode = 'check_violation';
  end if;

  select count(*) into requester_pending
  from public.sessions
  where requester_id = new.requester_id and status = 'pending';

  if requester_pending >= 5 then
    raise exception 'You already have 5 pending requests'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists sessions_limits on public.sessions;
create trigger sessions_limits
  before insert on public.sessions
  for each row execute function public.enforce_session_limits();

create or replace function public.enforce_session_transition()
returns trigger
language plpgsql
as $$
declare
  allowed session_status[];
begin
  if new.status = old.status then
    return new;
  end if;

  allowed := case old.status
    when 'pending' then array['accepted', 'declined', 'cancelled', 'expired']::session_status[]
    when 'accepted' then array['completed_pending_rating', 'cancelled', 'escalated']::session_status[]
    when 'completed_pending_rating' then array['completed', 'escalated']::session_status[]
    when 'escalated' then array['completed', 'cancelled']::session_status[]
    else array[]::session_status[]
  end;

  if not (new.status = any (allowed)) then
    raise exception 'Illegal session transition % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  if new.status in ('accepted', 'declined') and new.responded_at is null then
    new.responded_at := now();
  end if;

  if new.status = 'completed_pending_rating' and new.completed_at is null then
    new.completed_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists sessions_transition on public.sessions;
create trigger sessions_transition
  before update on public.sessions
  for each row execute function public.enforce_session_transition();

-- ---------------------------------------------------------------------------
-- Trust statistics: response rate, completion rate, completed sessions
-- ---------------------------------------------------------------------------
create or replace function public.recalculate_user_stats(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  answered integer;
  answered_fast integer;
  decided integer;
  completed integer;
  avg_hours numeric;
begin
  select
    count(*) filter (where responded_at is not null),
    count(*) filter (where responded_at is not null and responded_at <= created_at + interval '24 hours'),
    avg(extract(epoch from (responded_at - created_at)) / 3600.0) filter (where responded_at is not null)
  into answered, answered_fast, avg_hours
  from public.sessions
  where provider_id = target and status <> 'pending';

  select
    count(*) filter (where status in ('completed', 'completed_pending_rating', 'cancelled', 'escalated')),
    count(*) filter (where status in ('completed', 'completed_pending_rating'))
  into decided, completed
  from public.sessions
  where (provider_id = target or requester_id = target)
    and status in ('completed', 'completed_pending_rating', 'cancelled', 'escalated');

  update public.profiles
  set response_rate = case when coalesce(answered, 0) = 0 then 0
        else round(100.0 * answered_fast / answered, 2) end,
      completion_rate = case when coalesce(decided, 0) = 0 then 0
        else round(100.0 * completed / decided, 2) end,
      avg_response_hours = round(coalesce(avg_hours, 0), 2),
      completed_sessions = coalesce(completed, 0)
  where id = target;
end;
$$;

create or replace function public.sessions_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_user_stats(new.provider_id);
  perform public.recalculate_user_stats(new.requester_id);
  return new;
end;
$$;

drop trigger if exists sessions_stats on public.sessions;
create trigger sessions_stats
  after insert or update of status on public.sessions
  for each row execute function public.sessions_after_change();

-- ---------------------------------------------------------------------------
-- Weighted rating with time decay and rater-quality weighting (spec 3.1)
-- ---------------------------------------------------------------------------
create or replace function public.recalculate_user_rating(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  weighted numeric;
  total_weight numeric;
  n integer;
begin
  select
    sum(r.score * w.weight),
    sum(w.weight),
    count(*)
  into weighted, total_weight, n
  from public.ratings r
  join public.profiles rater on rater.id = r.rater_id
  cross join lateral (
    select
      (case
        when r.created_at >= now() - interval '30 days' then 1.0
        when r.created_at >= now() - interval '90 days' then 0.7
        else 0.4
      end)
      *
      (case
        when rater.rating >= 4.0 then 1.1
        when rater.rating > 0 and rater.rating < 2.5 then 0.8
        else 1.0
      end) as weight
  ) w
  where r.rated_user_id = target;

  update public.profiles
  set rating = case when coalesce(total_weight, 0) = 0 then 0
        else round(weighted / total_weight, 2) end,
      rating_count = coalesce(n, 0)
  where id = target;
end;
$$;

-- Auto-moderation: three or more 1-star ratings within 30 days suspends the account.
create or replace function public.ratings_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  one_stars integer;
  session_row public.sessions%rowtype;
  rating_count integer;
begin
  perform public.recalculate_user_rating(new.rated_user_id);

  insert into public.notifications (user_id, type, title, body, link)
  values (
    new.rated_user_id,
    'rating_received',
    'You received a new rating',
    new.score || ' star' || case when new.score = 1 then '' else 's' end || ' from a recent exchange',
    '/profile'
  );

  select count(*) into one_stars
  from public.ratings
  where rated_user_id = new.rated_user_id
    and score = 1
    and created_at >= now() - interval '30 days';

  if one_stars >= 3 then
    update public.profiles set status = 'suspended' where id = new.rated_user_id;
    insert into public.notifications (user_id, type, title, body, link)
    select p.id, 'moderation', 'Account auto-suspended',
           'A student was auto-suspended after 3 one-star ratings in 30 days.', '/admin'
    from public.profiles p where p.role = 'admin';
  end if;

  -- Close out the session once both participants have rated.
  select * into session_row from public.sessions where id = new.session_id;
  select count(*) into rating_count from public.ratings where session_id = new.session_id;

  if session_row.status = 'completed_pending_rating' and rating_count >= 2 then
    update public.sessions set status = 'completed' where id = new.session_id;
  end if;

  return new;
end;
$$;

drop trigger if exists ratings_recalculate on public.ratings;
create trigger ratings_recalculate
  after insert on public.ratings
  for each row execute function public.ratings_after_insert();

-- ---------------------------------------------------------------------------
-- Session notifications
-- ---------------------------------------------------------------------------
create or replace function public.notify_session_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  skill_name text;
begin
  select name into skill_name from public.skills where id = new.skill_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, title, body, link)
    values (new.provider_id, 'request_received',
            'New skill request',
            'Someone requested your skill: ' || coalesce(skill_name, 'a skill'),
            '/sessions');
  elsif new.status is distinct from old.status then
    if new.status = 'accepted' then
      insert into public.notifications (user_id, type, title, body, link)
      values (new.requester_id, 'request_accepted', 'Request accepted',
              'Your request for ' || coalesce(skill_name, 'a skill') || ' was accepted', '/sessions');
    elsif new.status = 'declined' then
      insert into public.notifications (user_id, type, title, body, link)
      values (new.requester_id, 'request_declined', 'Request declined',
              'Your request for ' || coalesce(skill_name, 'a skill') || ' was declined', '/sessions');
    elsif new.status = 'cancelled' then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        case when auth.uid() = new.requester_id then new.provider_id else new.requester_id end,
        'request_cancelled', 'Session cancelled',
        coalesce(skill_name, 'A session') || ' was cancelled', '/sessions');
    elsif new.status = 'completed_pending_rating' then
      insert into public.notifications (user_id, type, title, body, link)
      values
        (new.requester_id, 'session_completed', 'Session completed',
         'Rate your exchange for ' || coalesce(skill_name, 'a skill'), '/sessions'),
        (new.provider_id, 'session_completed', 'Session completed',
         'Rate your exchange for ' || coalesce(skill_name, 'a skill'), '/sessions');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists sessions_notify on public.sessions;
create trigger sessions_notify
  after insert or update of status on public.sessions
  for each row execute function public.notify_session_event();

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
  sender_name text;
begin
  select case when s.requester_id = new.sender_id then s.provider_id else s.requester_id end
  into recipient
  from public.sessions s where s.id = new.session_id;

  select full_name into sender_name from public.profiles where id = new.sender_id;

  insert into public.notifications (user_id, type, title, body, link)
  values (recipient, 'message', 'New message',
          coalesce(nullif(sender_name, ''), 'A student') || ' sent you a message', '/chat');

  return new;
end;
$$;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- ---------------------------------------------------------------------------
-- expire_stale_sessions: pending requests die after 48 hours (spec 1.2)
-- Call from the client on dashboard load, or schedule with pg_cron.
-- ---------------------------------------------------------------------------
create or replace function public.expire_stale_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.sessions
  set status = 'expired'
  where status = 'pending' and expires_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- ---------------------------------------------------------------------------
-- Platform analytics for the admin dashboard
-- ---------------------------------------------------------------------------
create or replace function public.admin_analytics()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Admins only' using errcode = 'insufficient_privilege';
  end if;

  select json_build_object(
    'total_users', (select count(*) from public.profiles),
    'suspended_users', (select count(*) from public.profiles where status = 'suspended'),
    'total_sessions', (select count(*) from public.sessions),
    'completed_sessions', (select count(*) from public.sessions where status = 'completed'),
    'conversion_rate', (
      select case when count(*) = 0 then 0
        else round(100.0 * count(*) filter (where status in ('completed', 'completed_pending_rating')) / count(*), 1)
      end from public.sessions
    ),
    'avg_response_hours', (
      select round(coalesce(avg(extract(epoch from (responded_at - created_at)) / 3600.0), 0), 1)
      from public.sessions where responded_at is not null
    ),
    'daily_active_users', (
      select coalesce(json_agg(row_to_json(d) order by d.day), '[]'::json) from (
        select date_trunc('day', last_seen_at)::date as day, count(*) as users
        from public.profiles
        where last_seen_at >= now() - interval '7 days'
        group by 1
      ) d
    ),
    'top_offered', (
      select coalesce(json_agg(row_to_json(o)), '[]'::json) from (
        select name_normalized as name, count(*) as total
        from public.skills where type = 'offer' and is_active
        group by 1 order by total desc limit 5
      ) o
    ),
    'top_needed', (
      select coalesce(json_agg(row_to_json(n)), '[]'::json) from (
        select name_normalized as name, count(*) as total
        from public.skills where type = 'need' and is_active
        group by 1 order by total desc limit 5
      ) n
    )
  ) into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.skill_relations enable row level security;
alter table public.sessions enable row level security;
alter table public.ratings enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Avoids recursive RLS lookups when checking for admin rights.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_session_participant(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sessions s
    where s.id = target and (s.requester_id = auth.uid() or s.provider_id = auth.uid())
  );
$$;

drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users" on public.profiles
  for select to authenticated using (true);

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "admins update any profile" on public.profiles;
create policy "admins update any profile" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "skills are readable by authenticated users" on public.skills;
create policy "skills are readable by authenticated users" on public.skills
  for select to authenticated using (true);

drop policy if exists "users manage their own skills" on public.skills;
create policy "users manage their own skills" on public.skills
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "skill relations are readable" on public.skill_relations;
create policy "skill relations are readable" on public.skill_relations
  for select to authenticated using (true);

drop policy if exists "participants read sessions" on public.sessions;
create policy "participants read sessions" on public.sessions
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = provider_id or public.is_admin());

drop policy if exists "requesters create sessions" on public.sessions;
create policy "requesters create sessions" on public.sessions
  for insert to authenticated with check (auth.uid() = requester_id);

drop policy if exists "participants update sessions" on public.sessions;
create policy "participants update sessions" on public.sessions
  for update to authenticated
  using (auth.uid() = requester_id or auth.uid() = provider_id or public.is_admin())
  with check (auth.uid() = requester_id or auth.uid() = provider_id or public.is_admin());

drop policy if exists "ratings are readable" on public.ratings;
create policy "ratings are readable" on public.ratings
  for select to authenticated using (true);

drop policy if exists "participants insert ratings" on public.ratings;
create policy "participants insert ratings" on public.ratings
  for insert to authenticated
  with check (auth.uid() = rater_id and public.is_session_participant(session_id));

drop policy if exists "participants read messages" on public.messages;
create policy "participants read messages" on public.messages
  for select to authenticated
  using (public.is_session_participant(session_id) or public.is_admin());

drop policy if exists "participants send messages" on public.messages;
create policy "participants send messages" on public.messages
  for insert to authenticated
  with check (auth.uid() = sender_id and public.is_session_participant(session_id));

drop policy if exists "participants update messages" on public.messages;
create policy "participants update messages" on public.messages
  for update to authenticated
  using (public.is_session_participant(session_id))
  with check (public.is_session_participant(session_id));

drop policy if exists "admins delete messages" on public.messages;
create policy "admins delete messages" on public.messages
  for delete to authenticated using (public.is_admin());

drop policy if exists "users read their notifications" on public.notifications;
create policy "users read their notifications" on public.notifications
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users update their notifications" on public.notifications;
create policy "users update their notifications" on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'alter publication supabase_realtime add table public.messages';
    execute 'alter publication supabase_realtime add table public.notifications';
    execute 'alter publication supabase_realtime add table public.sessions';
  end if;
exception
  when duplicate_object then null;
end
$$;

-- ---------------------------------------------------------------------------
-- Storage bucket for avatars
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars are public" on storage.objects;
create policy "avatars are public" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "users manage their own avatar" on storage.objects;
create policy "users manage their own avatar" on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
