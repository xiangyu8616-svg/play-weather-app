// 通过 module.register 挂载 loader（Node 20.6+）
import { register } from 'node:module';
register('./loader.mjs', import.meta.url);
