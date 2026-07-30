/**
 * 一次性脚本：对 Supabase 项目执行 001_initial_schema.sql 迁移
 * 用法：node scripts/run-supabase-migration.js
 * 连接信息从 secrets/supabase-db-password.txt 读取（gitignored）
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const PROJECT_REF = 'rcrbqeebrffqifaofuou';
const password = fs
  .readFileSync(path.join(__dirname, '..', 'secrets', 'supabase-db-password.txt'), 'utf8')
  .trim();
// 可通过命令行参数指定迁移文件，默认 001
const sqlFile = process.argv[2] || path.join('supabase', 'migrations', '001_initial_schema.sql');
const sql = fs.readFileSync(path.join(__dirname, '..', sqlFile), 'utf8');

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
  console.log('[migration] 已连接，执行 SQL ...');
  await client.query(sql);
  console.log('[migration] 执行完成，验证表结构 ...');
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
  );
  console.log('[migration] public 表:', rows.map((r) => r.table_name).join(', '));
  const { rows: rls } = await client.query(
    `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename`
  );
  console.log('[migration] RLS 状态:', JSON.stringify(rls));
  await client.end();
})().catch((e) => {
  console.error('[migration] 失败:', e.message);
  process.exit(1);
});
