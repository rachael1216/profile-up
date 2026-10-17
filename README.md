# Profile Up

Build your academic website. Compose your curriculum vitae.

Profile Up 是个人学术网站与简历制作工作室。内容编辑服务于网站搭建和 CV 生成；模板按排版风格组织，不按自定义学科分组。

## 当前原型 v0.2

- 三种网站风格：Classic、Structured、Editorial。
- 六种 CV 排版：经典学术履历、紧凑排版、书卷衬线、传统衬线、居中简约、现代无衬线。
- Word / TeX 参考布局筛选；所有 CV 都可导出 PDF、原生可编辑 DOCX 与 TeX 源项目。
- 可单独切换中英文界面、内容编辑语言和输出语言；缺失译文回退到另一语言，不进行自动翻译。
- 五种英文字体，以及思源宋体 / 思源黑体中文字体；字号、行距、纸张、颜色、照片和模块可配置。
- 使用同一份虚构内容比较模板，示例预览不会覆盖草稿。
- 可编辑基本信息、教育、任职、成果、项目、奖项、教学资源、动态、合作关系与链接。
- 研究领域参考教育部 2022 年学科目录与 ACM CCS 的明确标注节选；提供官方来源、版本和中英标签，不将参考译名称为官方英文版。
- 浏览器草稿保存、JSON 备份/恢复、模块排序与显示控制。
- 静态网站 ZIP、PDF、DOCX、完整 TeX ZIP 和 JSON 备份导出。

这是一版**本地优先原型**。尚未接入账号、邮箱/机构认证、云端存储、自动 GitHub 发布、DOI/BibTeX 导入或视频上传。团队关系和外部链接均为用户填写，未经认证。JSON 完整备份包含隐藏信息；网站与 CV 导出经过输出过滤。

## 本地运行

需要 Node.js 22 或更新版本，以及 npm。

**本机再次打开：**双击项目文件夹里的 `启动 Profile Up.command`，或在项目目录运行 `npm run local:start`。启动器会检查并复用已有服务；服务在后台运行，关闭启动窗口后仍可访问。电脑重启后需要再次启动。

`http://127.0.0.1:5173/` 是本机地址，依赖本地服务运行；GitHub 仓库用于保存代码，目前没有线上演示地址。浏览器若显示 `ERR_CONNECTION_REFUSED`，请先使用启动器恢复服务。日志位于 `.local/preview.log`。

```bash
git clone https://github.com/rachael1216/profile-up.git
cd profile-up
npm ci
npm run local:start
```

打开 `http://127.0.0.1:5173/`。浏览器草稿属于该 origin；换浏览器或端口前请下载 JSON 备份。

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

## 排版与导出

PDF 在浏览器中使用嵌入字体生成，文字可选择、搜索和复制。DOCX 使用原生段落、样式、超链接与可编辑文本。TeX 源项目包含主文件、所选字体、照片（如有）、文献元数据和构建说明，使用 XeLaTeX 编译。

PDF、Word 和 TeX 使用不同排版引擎，分页和字形可能存在差异；网页中的 CV 预览用于展示版式，不是已编译 PDF 的逐像素预览。Word 引用常见系统字体，缺失时由阅读器回退；PDF / TeX 使用具备再分发许可的对应字体。Times/Arial/Palatino 风格分别使用 TeX Gyre Termes/Heros/Pagella，不把它们宣称为微软字体本体。

网页 ZIP 包含 `index.html` 与 `fonts/`，发布时必须一起上传。Profile Up 应用本身的 GitHub 仓库同步，与每个用户的网站自动发布是两个功能；后者尚未接入。

## 目录

```text
src/App.tsx                 编辑器、网站与 CV 工作室
src/lib/model.ts            数据模型、校验、输出过滤
src/lib/catalog.ts          风格、字体、学科参考目录
src/lib/render.ts           静态网页与 CV 预览
src/lib/exports.ts          PDF、TeX、网页 ZIP 和备份
src/lib/docx.ts             原生 Word 导出
src/lib/i18n.ts             中英文界面
src/components/DisciplinePicker.tsx
public/fonts/               可再分发字体与许可证
tests/                      数据与浏览器回归测试
docs/                       开发与来源说明
```

## 后续重点

完善分页与预览一致性、内容导入、学科参考完整性、账号和持久存储，然后接入 GitHub 授权发布。模板风格独立于学科分类。研究与投稿计划应围绕网页搭建和简历制作的实际效果展开。

项目代码采用 MIT；字体分别采用目录内附带的 SIL OFL / GUST 许可证。
