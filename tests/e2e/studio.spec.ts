import { test, expect } from '@playwright/test';
import JSZip from 'jszip';
import { readFile, mkdir } from 'node:fs/promises';

test('website template changes, edits persist, and output matches the editor', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '个人学术网站' })).toBeVisible();
  await page.getByRole('button', { name: /Structured/ }).click();
  await expect(page.frameLocator('iframe').locator('body')).toHaveClass('research');
  await page.getByRole('button', { name: '编辑内容', exact: false }).first().click();
  await page.locator('.editor-panel-heading').getByRole('button', { name: 'English' }).click();
  await page.getByLabel('姓名', { exact: true }).fill('Ada Example');
  await expect(page.getByText('已保存到此浏览器', { exact: true })).toBeVisible();
  await page.reload();
  await page.locator('.editor-panel-heading').getByRole('button', { name: 'English' }).click();
  await expect(page.getByLabel('姓名', { exact: true })).toHaveValue('Ada Example');
  await page.getByRole('button', { name: '查看我的网站' }).click();
  await expect(page.frameLocator('iframe').getByRole('heading', { name: 'Ada Example', exact: true })).toBeVisible();
});
test('website ZIP excludes hidden publications', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch', { name: '学术发表网站显示' }).click();
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出网站', exact: false }).click();
  const download = await event;
  const zip = await JSZip.loadAsync(await readFile((await download.path())!));
  const html = await zip.file('index.html')!.async('string');
  expect(html).not.toContain('Example publication A');
  expect(html).not.toContain('PRIVATE');
  expect(html).toContain('Lin Chen');
});
test('PDF and complete TeX exports work for Chinese and English', async ({ page }) => {
  await page.goto('/#cv');
  await page.getByRole('button', { name: '中文', exact: true }).click();
  const pdfEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载 PDF CV', exact: false }).click();
  const pdf = await pdfEvent; const pdfBytes = await readFile((await pdf.path())!);
  expect(pdfBytes.subarray(0, 5).toString()).toBe('%PDF-');
  await mkdir('test-results/export-audit', { recursive: true });
  await pdf.saveAs('test-results/export-audit/chinese-cv.pdf');
  const texEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'LaTeX 源文件', exact: false }).click();
  const tex = await texEvent;
  await tex.saveAs('test-results/export-audit/tex-source.zip');
  const zip = await JSZip.loadAsync(await readFile((await tex.path())!));
  for (const filename of ['main.tex', 'publications.bib', 'fonts/NotoSerifSC-Regular.ttf', 'fonts/OFL.txt', 'README.txt']) expect(zip.file(filename)).not.toBeNull();
  expect(await zip.file('main.tex')!.async('string')).toContain('陈林');
  const docxEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Word 文件', exact: true }).click();
  await (await docxEvent).saveAs('test-results/export-audit/chinese-cv.docx');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  const enEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载 PDF CV', exact: false }).click();
  const en = await enEvent; await en.saveAs('test-results/export-audit/english-cv.pdf');
});
test('all templates render and the app reflows on mobile', async ({ page }) => {
  await page.goto('/');
  for (const template of ['Classic', 'Structured', 'Editorial']) {
    await page.getByRole('button', { name: new RegExp(template.replace('&', '\\&')) }).click();
    await expect(page.frameLocator('iframe').getByRole('heading', { name: 'Lin Chen', exact: true })).toBeVisible();
  }
  await page.screenshot({ path: 'test-results/website-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: '打开导航' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '打开导航' }).click();
  await page.getByRole('button', { name: '简历工作室', exact: true }).click();
  await expect(page.getByRole('heading', { name: '学术简历工作室' })).toBeVisible();
  await page.screenshot({ path: 'test-results/cv-mobile.png', fullPage: true });
});
test('layout demos preserve drafts and bilingual interface and Word export work', async ({ page }) => {
  await page.goto('/#cv');
  await expect(page.getByText('已保存到此浏览器', {exact:true})).toBeVisible();
  const sections = await page.evaluate(() => JSON.parse(localStorage.getItem('profileup-draft-v1')!).settings.cvSections);
  for (const style of ['经典学术履历', '紧凑排版', '传统衬线', '居中简约', '现代无衬线', '书卷衬线']) {
    await page.locator('.cv-template').filter({ has: page.getByText(style, {exact:true}) }).click();
    await expect(page.locator('.preview-bottom')).toContainText(style);
    await expect(page.getByText('已保存到此浏览器', {exact:true})).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('profileup-draft-v1')!).settings.cvSections)).toEqual(sections);
  }
  await page.getByRole('button', {name: /书卷衬线 Word/}).click();
  await expect(page.getByLabel('英文字体', {exact:true})).toHaveValue('garamond');
  await expect(page.getByText('已保存到此浏览器', {exact:true})).toBeVisible();
  const before = await page.evaluate(() => localStorage.getItem('profileup-draft-v1'));
  await page.getByRole('button',{name:'版式示例',exact:true}).click();
  await expect(page.locator('.demo-notice')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('profileup-draft-v1'))).toBe(before);
  const event = page.waitForEvent('download');
  await page.getByRole('button',{name:'Word 文件',exact:true}).click();
  const download=await event; await mkdir('test-results/export-audit',{recursive:true});
  await download.saveAs('test-results/export-audit/academic-cv.docx');
  const zip=await JSZip.loadAsync(await readFile((await download.path())!));
  expect(await zip.file('word/document.xml')!.async('string')).toContain('Lin Chen');
  expect(await zip.file('word/styles.xml')!.async('string')).toContain('EB Garamond');
  await page.getByLabel('Interface language / 界面语言').selectOption('en');
  await expect(page.getByRole('heading',{name:'Academic CV studio',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/Editorial Serif Word/})).toBeVisible();
  await page.screenshot({path:'test-results/cv-studio-english.png',fullPage:true});
});
test('all font choices generate PDFs and research interests are free text', async ({ page }) => {
  await page.goto('/#cv');
  await page.getByRole('button',{name:'中文',exact:true}).click();
  for(const family of ['termes','pagella','garamond','modern','heros']){
    await page.getByLabel('英文字体',{exact:true}).selectOption(family);
    const event=page.waitForEvent('download');
    await page.getByRole('button',{name:'下载 PDF CV',exact:false}).click();
    const file=await event;
    expect((await readFile((await file.path())!)).subarray(0,5).toString()).toBe('%PDF-');
  }
  await page.getByRole('button',{name:'编辑内容',exact:false}).first().click();
  await expect(page.getByRole('textbox',{name:'搜索研究领域'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'ACM CCS',exact:true})).toHaveCount(0);
  await page.getByLabel('研究兴趣',{exact:true}).fill('自定义研究问题');
  await expect(page.getByLabel('研究兴趣',{exact:true})).toHaveValue('自定义研究问题');
  await page.getByText('研究兴趣：填写参考（可选）',{exact:true}).click();
  await expect(page.getByRole('link',{name:'教育部学科目录（仅供参考）',exact:true})).toBeVisible();
});
