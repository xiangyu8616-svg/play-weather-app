// 一次性：插入首条社区示例帖（验证 feed 渲染 + 3.2 冷启动首帖）
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const PROJECT_REF = 'rcrbqeebrffqifaofuou';
const password = fs
  .readFileSync(path.join(__dirname, '..', 'secrets', 'supabase-db-password.txt'), 'utf8')
  .trim();

(async () => {
  const client = new Client({
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 5432,
    user: `postgres.${PROJECT_REF}`,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  await client.connect();

  const { rows: users } = await client.query('select id, email from auth.users order by created_at limit 3');
  console.log('[seed] users:', users.map((u) => `${u.id}(${u.email})`).join(', ') || 'NONE');
  if (users.length === 0) {
    console.log('[seed] 无用户，跳过');
    await client.end();
    return;
  }

  const uid = users[0].id;
  const { rows: existing } = await client.query('select count(*)::int as c from public.posts');
  console.log('[seed] existing posts:', existing[0].c);
  if (existing[0].c > 0) {
    console.log('[seed] 已有帖子，跳过');
    await client.end();
    return;
  }

  const { rows } = await client.query(
    `insert into public.posts (user_id, content, location_name, tags)
     values ($1, $2, $3, $4) returning id, created_at`,
    [
      uid,
      '今晚霞光概率 50%，蓝时刻 19:00–19:45。提前半小时架好机位，等一场城市上空的火烧云。',
      '北京',
      ['晚霞', '蓝时刻'],
    ]
  );
  console.log('[seed] inserted:', rows[0].id, rows[0].created_at);

  // 确保作者 profile 有昵称
  const { rows: prof } = await client.query('select id, nickname from public.profiles where id=$1', [uid]);
  console.log('[seed] profile:', JSON.stringify(prof[0] || null));
  if (!prof[0]?.nickname) {
    await client.query(
      `insert into public.profiles (id, nickname) values ($1, '追光者')
       on conflict (id) do update set nickname='追光者'`,
      [uid]
    );
    console.log('[seed] nickname set to 追光者');
  }
  await client.end();
})().catch((e) => {
  console.error('[seed] 失败:', e.message);
  process.exit(1);
});
