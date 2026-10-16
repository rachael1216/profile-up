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
export type DisciplineTerm = { id: string; scheme: 'moe' | 'acm'; code: string; zh: string; en: string; parent: string };
export const disciplineSources = {
  moe: { title: '研究生教育学科专业目录（2022）', en: 'MOE Graduate Discipline Catalogue (2022)', version: '2022', url: 'https://www.moe.gov.cn/srcsite/A22/moe_833/202209/t20220914_660828.html', note: '教育部官方代码节选；英文为本产品参考译名，非官方英文版。2025 年调整说明见来源。' },
  acm: { title: 'ACM Computing Classification System', en: 'ACM Computing Classification System', version: '2012', url: 'https://www.acm.org/publications/class-2012', note: '投稿常用 ACM CCS 层级节选；中文为参考译名，节点使用名称路径，不伪造数字代码。' },

};
const moeData = [
 ['0101','哲学','Philosophy','哲学'],['0201','理论经济学','Theoretical Economics','经济学'],['0202','应用经济学','Applied Economics','经济学'],['0301','法学','Law','法学'],['0302','政治学','Political Science','法学'],['0303','社会学','Sociology','法学'],['0401','教育学','Education','教育学'],['0402','心理学','Psychology','教育学'],['0501','中国语言文学','Chinese Language and Literature','文学'],['0502','外国语言文学','Foreign Languages and Literature','文学'],['0503','新闻传播学','Journalism and Communication','文学'],['0602','中国史','Chinese History','历史学'],['0603','世界史','World History','历史学'],['0701','数学','Mathematics','理学'],['0702','物理学','Physics','理学'],['0703','化学','Chemistry','理学'],['0705','地理学','Geography','理学'],['0710','生物学','Biology','理学'],['0714','统计学','Statistics','理学'],['0802','机械工程','Mechanical Engineering','工学'],['0805','材料科学与工程','Materials Science and Engineering','工学'],['0808','电气工程','Electrical Engineering','工学'],['0810','信息与通信工程','Information and Communication Engineering','工学'],['0811','控制科学与工程','Control Science and Engineering','工学'],['0812','计算机科学与技术','Computer Science and Technology','工学'],['0830','环境科学与工程','Environmental Science and Engineering','工学'],['0831','生物医学工程','Biomedical Engineering','工学'],['0835','软件工程','Software Engineering','工学'],['0839','网络空间安全','Cyberspace Security','工学'],['0901','作物学','Crop Science','农学'],['0905','畜牧学','Animal Science','农学'],['1001','基础医学','Basic Medicine','医学'],['1002','临床医学','Clinical Medicine','医学'],['1004','公共卫生与预防医学','Public Health and Preventive Medicine','医学'],['1007','药学','Pharmacy','医学'],['1011','护理学','Nursing','医学'],['1201','管理科学与工程','Management Science and Engineering','管理学'],['1202','工商管理学','Business Administration','管理学'],['1301','艺术学','Art Studies','艺术学'],['1403','设计学','Design','交叉学科']
];
const acmData = [
 ['Human-centered computing','以人为中心的计算','Human-centered computing','Computing'],['Human-centered computing / Human computer interaction (HCI)','人机交互','Human computer interaction (HCI)','Human-centered computing'],['Human-centered computing / Visualization','可视化','Visualization','Human-centered computing'],['Human-centered computing / Collaborative and social computing','协作与社会计算','Collaborative and social computing','Human-centered computing'],['Computing methodologies / Artificial intelligence','人工智能','Artificial intelligence','Computing methodologies'],['Computing methodologies / Machine learning','机器学习','Machine learning','Computing methodologies'],['Computing methodologies / Computer vision','计算机视觉','Computer vision','Computing methodologies'],['Computing methodologies / Artificial intelligence / Natural language processing','自然语言处理','Natural language processing','Computing methodologies'],['Information systems / Information retrieval','信息检索','Information retrieval','Information systems'],['Information systems / Data management systems','数据管理系统','Data management systems','Information systems'],['Software and its engineering','软件及其工程','Software and its engineering','Computing'],['Security and privacy','安全与隐私','Security and privacy','Computing'],['Theory of computation','计算理论','Theory of computation','Computing'],['Applied computing','应用计算','Applied computing','Computing']
];
export const disciplineTerms: DisciplineTerm[] = [
  ...moeData.map(([code, zh, en, parent]) => ({ id: `moe:${code}`, scheme: 'moe' as const, code, zh, en, parent })),
  ...acmData.map(([code, zh, en, parent], i) => ({ id: `acm:${i}`, scheme: 'acm' as const, code, zh, en, parent }))
];
