-- ============================================================
-- 002: 新用户自动创建 profile + 客户端兜底插入策略
-- 执行方式：node scripts/run-supabase-migration.js supabase/migrations/002_profile_trigger.sql
-- ============================================================

-- 1. 注册（含 OTP 首次登录）时自动创建 profiles 记录
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. profiles 插入策略（触发器失效时客户端可兜底 upsert）
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
