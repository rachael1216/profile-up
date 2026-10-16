import { fontCatalog, chineseFonts } from './catalog';
import type { Profile } from './model';
export function fontCSS(p: Profile) {
  const latin = fontCatalog[p.settings.latinFont], chinese = chineseFonts[p.settings.chineseFont];
  return `@font-face{font-family:AcademicLatin;src:url('fonts/${latin.file}') format('opentype');font-display:swap}@font-face{font-family:AcademicChinese;src:url('fonts/${chinese.file}') format('truetype');font-display:swap}body,h1,h2,h3{font-family:AcademicLatin,AcademicChinese,Georgia,'Songti SC',serif!important}`;
}
export const previewFontNote = 'PDF 与 TeX 使用可再分发的学术字体。Word 指定常见系统字体，缺失时由阅读器回退。';
