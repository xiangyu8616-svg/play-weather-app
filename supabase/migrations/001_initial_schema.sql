-- ============================================================
-- 玩天气 App — Supabase 初始 Schema
-- 
-- 执行方式：Supabase Dashboard → SQL Editor → New query → Run
-- 或：supabase db push (CLI)
-- ============================================================

-- --------------------------------------------------------
-- 1. 用户资料扩展（Supabase Auth 自带 auth.users）
-- --------------------------------------------------------
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nickname text,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 自动在 auth.users 插入时创建 profiles 记录
-- 需要在 Supabase Dashboard → Database → Functions 中创建触发器
-- 或执行下面的函数：

-- --------------------------------------------------------
-- 2. 收藏地点
-- --------------------------------------------------------
create table public.saved_locations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  location_id text not null,           -- 和风天气城市ID（如 101010100）
  location_name text not null,         -- 城市名称（如 北京）
  lat numeric,                         -- 纬度
  lon numeric,                         -- 经度
  is_default boolean default false,    -- 是否默认城市（首页显示）
  sort_order int default 0,            -- 排序权重
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- 同一用户不能重复收藏同一城市
  unique(user_id, location_id)
);

-- --------------------------------------------------------
-- 3. 社区帖子（S2 末启用，先建表）
-- --------------------------------------------------------
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  content text,
  photo_urls text[],                   -- 照片URL数组
  location_name text,                  -- 拍摄地点名称
  weather_data jsonb,                  -- 拍摄时天气数据快照（云量/能见度/温度等）
  tags text[],                         -- 标签（如 {"极光","北京"}）
  likes_count int default 0,
  comments_count int default 0,
  status text default 'published',     -- published | draft | deleted
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 帖子状态索引
-- create index idx_posts_status on public.posts(status);
-- create index idx_posts_user_id on public.posts(user_id);
-- create index idx_posts_created_at on public.posts(created_at desc);

-- --------------------------------------------------------
-- 4. Row Level Security（RLS）策略
-- --------------------------------------------------------

-- profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 新用户注册时自动创建 profile 记录（通过 trigger）
-- 需在 Supabase Functions 中创建，或手动执行：
-- create function public.handle_new_user()
-- returns trigger as $$
-- begin
--   insert into public.profiles (id, nickname)
--   values (new.id, new.raw_user_meta_data->>'name');
--   return new;
-- end;
-- $$ language plpgsql security definer;
-- 
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();

-- saved_locations
alter table public.saved_locations enable row level security;

create policy "Users can view own saved locations" on public.saved_locations
  for select using (auth.uid() = user_id);

create policy "Users can insert own saved locations" on public.saved_locations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own saved locations" on public.saved_locations
  for update using (auth.uid() = user_id);

create policy "Users can delete own saved locations" on public.saved_locations
  for delete using (auth.uid() = user_id);

-- posts
alter table public.posts enable row level security;

create policy "Published posts are viewable by everyone" on public.posts
  for select using (status = 'published');

create policy "Users can create own posts" on public.posts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own posts" on public.posts
  for update using (auth.uid() = user_id);

create policy "Users can delete own posts" on public.posts
  for delete using (auth.uid() = user_id);

-- --------------------------------------------------------
-- 5. 备注
-- --------------------------------------------------------
-- Supabase Free Tier 限制：
-- - Database: 500 MB
-- - Storage: 1 GB
-- - Auth MAU: 50,000
-- - Edge Functions: 500,000 invocations/month
-- - 2 active projects per org
-- 
-- 上线前需配置：
-- - SMTP（发验证码邮件）：Settings → Auth → Email → SMTP Settings
-- - OAuth 提供商（可选）：Settings → Auth → Providers → Google/Apple
-- - 自定义域名（可选）：Settings → General → Custom Domain
