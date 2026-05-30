-- =====================================================
-- TaskFlow Supabase Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ===== PROFILES =====
-- Extends Supabase auth.users with app-specific data
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text not null default '',
  avatar_url text default '',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== GROUPS =====
do $$ begin
  create type group_type as enum ('business', 'family', 'students', 'custom');
exception when duplicate_object then null;
end $$;

create table if not exists public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text default '',
  type group_type not null default 'custom',
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- ===== GROUP MEMBERS =====
do $$ begin
  create type member_role as enum ('owner', 'admin', 'member');
exception when duplicate_object then null;
end $$;

create table if not exists public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role member_role not null default 'member',
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- ===== TASKS =====
create table if not exists public.tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text default '',
  date timestamptz,
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  status text not null default 'todo' check (status in ('todo', 'in-progress', 'done')),
  tags text[] default '{}',
  subtasks jsonb default '[]',
  recurrence jsonb,
  estimated_time integer default 0,
  time_spent integer default 0,
  -- Ownership
  owner_id uuid references public.profiles(id) on delete cascade not null,
  -- Optional group association
  group_id uuid references public.groups(id) on delete set null,
  -- Assignment
  assigned_to uuid references public.profiles(id) on delete set null,
  -- Timestamps
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- ===== ROW LEVEL SECURITY =====
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.tasks enable row level security;

-- Drop existing policies to avoid duplicates
do $$ begin
  drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
  drop policy if exists "Users can update own profile" on public.profiles;
  drop policy if exists "Group members can view group" on public.groups;
  drop policy if exists "Authenticated users can create groups" on public.groups;
  drop policy if exists "Group owners can update group" on public.groups;
  drop policy if exists "Group owners can delete group" on public.groups;
  drop policy if exists "Members can view group members" on public.group_members;
  drop policy if exists "Group admins can add members" on public.group_members;
  drop policy if exists "Group admins can remove members" on public.group_members;
  drop policy if exists "Users can view own tasks" on public.tasks;
  drop policy if exists "Users can create tasks" on public.tasks;
  drop policy if exists "Task owners and assignees can update" on public.tasks;
  drop policy if exists "Task owners can delete" on public.tasks;
end $$;

-- Profiles: users can read any profile (for group member display), update own
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- Groups: owners and members can view their groups
create policy "Group members can view group"
  on public.groups for select
  to authenticated
  using (
    owner_id = auth.uid()
    or id in (select group_id from public.group_members where user_id = auth.uid())
  );

create policy "Authenticated users can create groups"
  on public.groups for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Group owners can update group"
  on public.groups for update
  to authenticated
  using (owner_id = auth.uid());

create policy "Group owners can delete group"
  on public.groups for delete
  to authenticated
  using (owner_id = auth.uid());

-- Helper functions to avoid infinite recursion in group_members policies
create or replace function public.get_my_group_ids()
returns setof uuid as $$
  select group_id from public.group_members where user_id = auth.uid();
$$ language sql security definer stable;

create or replace function public.get_my_admin_group_ids()
returns setof uuid as $$
  select group_id from public.group_members
  where user_id = auth.uid() and role in ('owner', 'admin');
$$ language sql security definer stable;

-- Group members: members can see other members in their groups
create policy "Members can view group members"
  on public.group_members for select
  to authenticated
  using (
    group_id in (select public.get_my_group_ids())
  );

create policy "Group admins can add members"
  on public.group_members for insert
  to authenticated
  with check (
    group_id in (select public.get_my_admin_group_ids())
    or user_id = auth.uid() -- users can join themselves (via invite code)
  );

create policy "Group admins can remove members"
  on public.group_members for delete
  to authenticated
  using (
    group_id in (select public.get_my_admin_group_ids())
    or user_id = auth.uid() -- members can leave
  );

-- Tasks: personal tasks + group tasks visible to group members
create policy "Users can view own tasks"
  on public.tasks for select
  to authenticated
  using (
    owner_id = auth.uid()
    or assigned_to = auth.uid()
    or group_id in (select group_id from public.group_members where user_id = auth.uid())
  );

create policy "Users can create tasks"
  on public.tasks for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Task owners and assignees can update"
  on public.tasks for update
  to authenticated
  using (
    owner_id = auth.uid()
    or assigned_to = auth.uid()
    or group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "Task owners can delete"
  on public.tasks for delete
  to authenticated
  using (owner_id = auth.uid());

-- ===== INDEXES =====
create index if not exists idx_tasks_owner on public.tasks(owner_id);
create index if not exists idx_tasks_group on public.tasks(group_id);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to);
create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_group_members_group on public.group_members(group_id);
create index if not exists idx_groups_invite on public.groups(invite_code);

-- ===== REALTIME =====
-- Enable realtime for tasks and group_members tables
do $$ begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.group_members;
exception when duplicate_object then null;
end $$;

-- ===== INVITE CODE LOOKUP FUNCTION =====
-- Bypasses RLS so users can find a group by invite code before they're members
create or replace function public.join_group_by_invite(code text)
returns uuid as $$
declare
  found_group_id uuid;
begin
  select id into found_group_id from public.groups where invite_code = code;
  if found_group_id is null then
    raise exception 'Invalid invite code';
  end if;
  -- Insert user as member
  insert into public.group_members (group_id, user_id, role)
  values (found_group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;
  return found_group_id;
end;
$$ language plpgsql security definer;

-- ===== CREATE GROUP FUNCTION =====
-- Atomically creates a group AND adds the creator as owner member
-- Bypasses RLS to avoid chicken-and-egg policy issues
create or replace function public.create_group(
  group_name text,
  group_description text default '',
  group_type group_type default 'custom'
)
returns json as $$
declare
  new_group_id uuid;
  result json;
begin
  -- Insert the group
  insert into public.groups (name, description, type, owner_id)
  values (group_name, group_description, group_type, auth.uid())
  returning id into new_group_id;

  -- Insert creator as owner member
  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, auth.uid(), 'owner');

  -- Return the full group row as JSON
  select row_to_json(g) into result
  from public.groups g
  where g.id = new_group_id;

  return result;
end;
$$ language plpgsql security definer;

-- ===== SECURITY: Restrict assignee updates =====
-- Assignees can only update status, time_spent, completed_at, and subtasks
-- Prevents privilege escalation (e.g., changing owner_id or assigned_to)
create or replace function public.restrict_assignee_updates()
returns trigger as $$
begin
  -- If the user is the owner or a group admin, allow all changes
  if old.owner_id = auth.uid() then
    return new;
  end if;

  if old.group_id is not null and exists (
    select 1 from public.group_members
    where group_id = old.group_id and user_id = auth.uid() and role in ('owner', 'admin')
  ) then
    return new;
  end if;

  -- For assignees / regular group members: only allow safe field changes
  -- Revert any unauthorized field modifications
  new.owner_id := old.owner_id;
  new.group_id := old.group_id;
  new.assigned_to := old.assigned_to;
  new.title := old.title;
  new.description := old.description;
  new.date := old.date;
  new.priority := old.priority;
  new.tags := old.tags;
  new.recurrence := old.recurrence;
  new.estimated_time := old.estimated_time;
  new.created_at := old.created_at;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_assignee_update_limits on public.tasks;
create trigger enforce_assignee_update_limits
  before update on public.tasks
  for each row execute function public.restrict_assignee_updates();

-- ===== GROUP MESSAGES (Chat) =====
create table if not exists public.group_messages (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) <= 2000),
  message_type text not null default 'text' check (message_type in ('text', 'system')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.group_messages enable row level security;

-- Policies: only group members can read/write messages
create policy "Group members can view messages"
  on public.group_messages for select
  to authenticated
  using (group_id in (select public.get_my_group_ids()));

create policy "Group members can send messages"
  on public.group_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and group_id in (select public.get_my_group_ids())
  );

create policy "Users can delete own messages"
  on public.group_messages for delete
  to authenticated
  using (sender_id = auth.uid());

-- Indexes
create index if not exists idx_group_messages_group on public.group_messages(group_id, created_at desc);
create index if not exists idx_group_messages_sender on public.group_messages(sender_id);

-- Enable realtime for messages
do $$ begin
  alter publication supabase_realtime add table public.group_messages;
exception when duplicate_object then null;
end $$;
