#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  echo "未找到 Node.js。请先安装 Node.js 22 或更新版本。"
  read -r -p "按回车键关闭。"
  exit 1
fi
if node scripts/start-local.mjs; then
  open 'http://127.0.0.1:5173/#cv'
else
  read -r -p "启动失败，按回车键关闭。"
  exit 1
fi
