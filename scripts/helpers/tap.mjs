// 极简断言库：所有测试文件共享计数器，test-all.mjs 末尾统一 summary
let pass = 0;
let fail = 0;
const failures = [];

export function check(name, cond) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`  ✗ ${name}`);
  }
}

export function section(title) {
  console.log(`\n■ ${title}`);
}

export function summary() {
  console.log(`\n═══════════════════════════`);
  console.log(`总计: ${pass} 通过, ${fail} 失败`);
  if (failures.length) {
    console.log('失败用例:');
    failures.forEach((f) => console.log(`  - ${f}`));
  }
  process.exit(fail ? 1 : 0);
}
