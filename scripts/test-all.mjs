// 统一测试入口：node --import ./scripts/register-loader.mjs scripts/test-all.mjs
import './test-shooting-window.mjs';
import './test-phenomenon.mjs';
import './test-cache.mjs';
import './test-api-proxy.mjs';
import './test-device-tier.mjs';
import { summary } from './helpers/tap.mjs';

summary();
