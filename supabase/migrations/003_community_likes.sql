-- ============================================================
-- 玩天气 App — 迁移 003：社区点赞 + 作者资料公开读 + 照片存储桶
--
-- 背景：ROADMAP 2.9 社区功能（帖子列表/发帖/点赞）
-- 执行：node scripts/run-supabase-migration.js supabase/migrations/003_community_likes.sql
-- ============================================================

-- --------------------------------------------------------
-- 1. 点赞表（谁赞过哪帖，用于点赞状态与防重复点赞）
-- --------------------------------------------------------
create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create index if not exists idx_post_likes_user_id on public.post_likes(user_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);

-- --------------------------------------------------------
-- 2. likes_count 自动维护（触发器，避免客户端并发计数漂移）
-- --------------------------------------------------------
create or replace function public.handle_post_like_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_post_like_change on public.post_likes;
create trigger on_post_like_change
  after insert or delete on public.post_likes
  for each row execute procedure public.handle_post_like_count();

-- --------------------------------------------------------
-- 3. RLS 策略
-- --------------------------------------------------------
alter table public.post_likes enable row level security;

-- 用户只能看到自己的点赞记录（点赞数由 posts.likes_count 公开字段承载）
create policy "Users can view own likes" on public.post_likes
  for select using (auth.uid() = user_id);

create policy "Users can like posts" on public.post_likes
  for insert with check (auth.uid() = user_id);

create policy "Users can unlike own likes" on public.post_likes
  for delete using (auth.uid() = user_id);

-- 帖子作者资料对外可读（昵称/头像是社区公开信息）
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

-- --------------------------------------------------------
-- 4. 帖子照片存储桶（post-photos，公开读）
-- --------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', true)
on conflict (id) do nothing;

-- 公开读
create policy "Post photos are publicly readable" on storage.objects
  for select using (bucket_id = 'post-photos');

-- 登录用户上传到自己 uid 前缀的目录（<uid>/filename）
create policy "Users can upload own post photos" on storage.objects
  for insert with check (
    bucket_id = 'post-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own post photos" on storage.objects
  for delete using (
    bucket_id = 'post-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
