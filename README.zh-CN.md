# Profile Up

个人学术网站与简历生成系统

[在线工作室](https://profile-up-studio.beigemelon7.chatgpt.site) · [English](README.md) · [开发说明](docs/development.md) · [TeX 实现与来源](docs/tex-runtime.md)

## 概述

Profile Up 为个人学术网站和简历提供统一的编辑界面。用户可以维护多份中英双语资料，填写基本信息、教育与任职经历、论文、项目和教学资源，选择用于网页与简历的内容和版式。网页发布保存独立快照；草稿保留完整、可继续编辑的记录。简历 PDF 由浏览器中的 XeLaTeX 编译，与下载的 TeX 源项目对应。

## 使用流程

1. 使用 ChatGPT 账号登录，新建一份命名资料；同一账号可建立多份资料，或复制已保存的版本。
2. 填写中英文内容。上传证书、论文、讲义等 PDF，文件默认仅本人可下载。
3. 选择个人网页名称、模板和显示内容；需要公开的 PDF 单独勾选。
4. 保存到云端，再发布个人主页。任何人均可通过主页链接访问已发布内容。
5. 在简历工作室选择学术版式、字体、字号、行距、纸张与照片，下载 XeLaTeX 编译的 PDF 或完整 TeX 源项目。Word 导出作为可编辑的补充格式。
6. 修改后重新保存与发布。撤下主页会停止该主页及其公开附件链接的访问。

模板按视觉与排版风格组织。研究领域参考独立提供，并标明分类来源、版本和译名状态。

## 实现

React、TypeScript 与 Vinext 提供编辑界面和 API，Cloudflare Workers 运行服务，D1 保存账号关联、资料、附件元数据和发布快照，R2 保存 PDF。浏览器本机草稿按账号与资料隔离。服务端从认证服务取得用户身份；写入检查请求来源和草稿版本，避免覆盖其他窗口的更新。

PDF 使用独立 Web Worker 中的 XeLaTeX 与 dvipdfmx 编译。网站提供固定版本的引擎、字体和 TeX Live 组件，编译内容无需交给第三方在线排版服务。网页预览和 Word 使用不同排版引擎，分页可能与 PDF 不同。

## 本地运行

建议使用 Node.js 24。

```bash
npm ci
npm run build
npm run db:local
npm run dev
```

访问 `http://127.0.0.1:5173/`。本地登录使用开发身份，与云端账号和数据分离。macOS 可使用仓库内的 `启动 Profile Up.command` 在后台启动服务；重启电脑后需重新启动。

```bash
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
# 保持本地服务运行，编译六种实际 TeX 版式：
npm run verify:tex
```

## 范围与限制

当前版本为研究原型。每个账号最多 30 份资料、100 MB PDF；每份资料最多 50 个附件，单文件不超过 10 MB。草稿请求不超过 900 KB，照片在浏览器中压缩。视频以外部链接保存。当前登录服务是 ChatGPT，尚未提供独立邮箱密码注册。机构邮箱认证、外部账号归属验证、自动论文导入、自定义域名和协同编辑仍待实现。

测试覆盖资料校验、输出过滤、TeX 转义、文档导出、多 profile、账号隔离、附件权限、发布与撤下。它们属于软件功能验证；尚未开展用户研究，也未报告可用性或简历质量的 benchmark 结果。示例人物及成果均为虚构。

## 许可

应用代码采用 MIT 许可。字体、WasmTex SDK 和独立 TeX 引擎保留各自许可。引擎的许可、构建记录与对应源码见[公开说明](https://profile-up-studio.beigemelon7.chatgpt.site/wasmtex/index.html)。
