export type FontId = 'termes' | 'pagella' | 'garamond' | 'modern' | 'heros';
export type ChineseFontId = 'serif' | 'sans';
export const fontCatalog: Record<FontId, { name: string; description: string; css: string; file: string; word: string }> = {
  termes: { name: 'Times / TeX Gyre Termes', description: '经典学术衬线 · Times 风格', css: 'ProfileTermes', file: 'TeXGyreTermes-Regular.otf', word: 'Times New Roman' },
  garamond: { name: 'EB Garamond', description: '书卷衬线 · Garamond 风格', css: 'ProfileGaramond', file: 'EBGaramond-Regular.otf', word: 'EB Garamond' },
  pagella: { name: 'Palatino / TeX Gyre Pagella', description: '宽松易读 · Palatino 风格', css: 'ProfilePagella', file: 'TeXGyrePagella-Regular.otf', word: 'Palatino Linotype' },
  modern: { name: 'Latin Modern Roman', description: '传统衬线 · Computer Modern 风格', css: 'ProfileModern', file: 'LatinModernRoman-Regular.otf', word: 'Latin Modern Roman' },
  heros: { name: 'Arial / TeX Gyre Heros', description: '简洁无衬线 · Arial 风格', css: 'ProfileHeros', file: 'TeXGyreHeros-Regular.otf', word: 'Arial' }
};
export const chineseFonts: Record<ChineseFontId, { name: string; css: string; file: string; license: string; word: string }> = {
  serif: { name: '思源宋体 / Noto Serif SC', css: 'ProfileSerifSC', file: 'NotoSerifSC-Regular.ttf', license: 'OFL-Serif.txt', word: 'Noto Serif SC' },
  sans: { name: '思源黑体 / Noto Sans SC', css: 'ProfileSansSC', file: 'NotoSansSC-Regular.ttf', license: 'OFL.txt', word: 'Noto Sans SC' }
};
export type CVTemplate = 'classic' | 'research' | 'teaching' | 'science' | 'social' | 'clinical';
export const cvCatalog: Record<CVTemplate, { zh: string; en: string; styleZh: string; styleEn: string; format: 'Word' | 'TeX'; font: FontId; chineseFont: ChineseFontId; note: string }> = {
  classic: { zh: '经典学术履历', en: 'Classic Academic', styleZh: '经典 · 时间顺序', styleEn: 'Classic · Chronological', format: 'Word', font: 'termes', chineseFont: 'serif', note: '单栏、清晰的时间顺序，适合一般学术申请。' },
  research: { zh: '紧凑排版', en: 'Compact', styleZh: '紧凑 · 结构清晰', styleEn: 'Compact · Structured', format: 'TeX', font: 'modern', chineseFont: 'serif', note: '收紧间距，使用清晰层级，适合内容较多的履历。' },
  teaching: { zh: '书卷衬线', en: 'Editorial Serif', styleZh: '衬线 · 书籍式留白', styleEn: 'Serif · Editorial spacing', format: 'Word', font: 'garamond', chineseFont: 'serif', note: '书籍式衬线与宽松留白，强调阅读节奏。' },
  science: { zh: '传统衬线', en: 'Traditional Serif', styleZh: '小型大写 · 传统层级', styleEn: 'Small caps · Traditional hierarchy', format: 'TeX', font: 'pagella', chineseFont: 'serif', note: '传统衬线与小型大写标题，采用稳健的单栏结构。' },
  social: { zh: '居中简约', en: 'Centered Minimal', styleZh: '居中页眉 · 简约单栏', styleEn: 'Centered heading · Minimal', format: 'Word', font: 'termes', chineseFont: 'serif', note: '居中姓名与联系方式，正文使用简约单栏。' },
  clinical: { zh: '现代无衬线', en: 'Modern Sans', styleZh: '无衬线 · 清晰轻量', styleEn: 'Sans serif · Clear and light', format: 'Word', font: 'heros', chineseFont: 'sans', note: '无衬线字体，去除装饰，强调清晰与简洁。' }
};
