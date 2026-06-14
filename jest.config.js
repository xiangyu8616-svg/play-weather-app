/**
 * 轻量级测试配置 — 不依赖 React Native / expo preset
 * 
 * 只测纯逻辑模块：astronomyService, designTokens, cache
 * 使用 ts-jest 编译 TypeScript
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleFileExtensions: ['ts', 'js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.vercel/'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'es2020',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }],
  },
};
