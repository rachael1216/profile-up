import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const address = 'http://127.0.0.1:5173/';
const vite = join(root, 'node_modules/vite/bin/vite.js');
const stateDir = join(root, '.local');
const logPath = join(stateDir, 'preview.log');

async function probe() {
  try {
    const response = await fetch(address, { signal: AbortSignal.timeout(1500) });
    const html = await response.text();
    return response.ok && html.includes('<title>Profile Up') ? 'ready' : 'occupied';
  } catch (error) {
    return error.cause?.code === 'ECONNREFUSED' ? 'stopped' : 'unknown';
  }
}

async function start() {
  const current = await probe();
  if (current === 'ready') {
    console.log(`Profile Up 已在运行：${address}#cv`);
    return;
  }
  if (current === 'occupied') throw new Error('5173 端口被其他网页占用。请先关闭该服务，再重新启动 Profile Up。');
  if (!existsSync(vite)) throw new Error('缺少项目依赖。请在 profile-up 文件夹运行 npm ci 后重试。');

  mkdirSync(stateDir, { recursive: true });
  const log = openSync(logPath, 'a');
  let child;
  try {
    child = spawn(process.execPath, [vite, '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
      cwd: root, detached: true, stdio: ['ignore', log, log]
    });
  } finally {
    closeSync(log);
  }
  let startupError;
  child.on('error', error => { startupError = error; });
  child.unref();
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 250));
    if (startupError) throw startupError;
    if (await probe() === 'ready') {
      writeFileSync(join(stateDir, 'preview.pid'), String(child.pid));
      console.log(`Profile Up 已启动：${address}#cv\n关闭启动窗口后仍可访问；重启电脑后请再次双击启动。\n日志：${logPath}`);
      return;
    }
    if (child.exitCode !== null) break;
  }
  throw new Error(`启动失败，请查看日志：${logPath}\n${readFileSync(logPath, 'utf8').slice(-1500)}`);
}

start().catch(error => { console.error(error.message); process.exitCode = 1; });
