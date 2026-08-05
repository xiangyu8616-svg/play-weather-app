// ESM resolve 钩子：
// 1. @react-native-async-storage/async-storage → 内存 stub
// 2. 兼容 Metro 风格的目录导入（./i18n → ./i18n/index.ts）与无扩展名导入（./foo → ./foo.ts/.js/...）
const TRY_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'];
const TRY_INDEX = TRY_EXTS.map((ext) => `/index${ext}`);

async function tryResolve(url, context, nextResolve) {
  try {
    return await nextResolve(url, context);
  } catch {
    return null;
  }
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@react-native-async-storage/async-storage') {
    return {
      url: new URL('./stubs/async-storage.mjs', import.meta.url).href,
      shortCircuit: true,
    };
  }

  // 先走默认解析
  const direct = await tryResolve(specifier, context, nextResolve);
  if (direct) return direct;

  // 相对/绝对路径：尝试补扩展名、补 /index.*
  if (specifier.startsWith('.') || specifier.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(specifier)) {
    const base = new URL(specifier, context.parentURL).href;
    for (const ext of TRY_EXTS) {
      const r = await tryResolve(base + ext, context, nextResolve);
      if (r) return r;
    }
    for (const idx of TRY_INDEX) {
      const r = await tryResolve(base + idx, context, nextResolve);
      if (r) return r;
    }
  }

  // 都失败则抛出原始错误
  return nextResolve(specifier, context);
}
