import { z } from 'zod';
import { cvCatalog, type CVTemplate } from './catalog';

const text = z.string().max(20000);
const local = z.object({ zh: text, en: text });
const recordBase = { id: z.string().max(100), visible: z.boolean() };
const education = z.object({ ...recordBase, institution: local, degree: local, department: local, period: text });
const position = z.object({ ...recordBase, institution: local, title: local, period: text });
const publication = z.object({ ...recordBase, title: local, authors: text, venue: text, year: text, url: text, status: z.enum(['published', 'accepted', 'preprint']) });
const project = z.object({ ...recordBase, title: local, description: local, period: text, url: text });
const award = z.object({ ...recordBase, title: local, organization: local, year: text });
const course = z.object({ ...recordBase, title: local, description: local, period: text, url: text, kind: z.enum(['course', 'notes', 'tutorial', 'video']) });
const news = z.object({ ...recordBase, title: local, date: text, url: text });
const person = z.object({ ...recordBase, name: local, role: local, url: text });
const link = z.object({ ...recordBase, label: text, url: text });
const section = z.enum(['about', 'education', 'positions', 'publications', 'projects', 'awards', 'teaching', 'news', 'team', 'skills']);
export const sectionIds = section.options;
export type SectionId = z.infer<typeof section>;
export const sectionNames: Record<SectionId, string> = { about: '研究介绍', education: '教育经历', positions: '任职经历', publications: '学术发表', projects: '研究项目', awards: '荣誉奖项', teaching: '教学与资源', news: '最新动态', team: '团队与合作', skills: '个人技能' };
export const sectionEnglish: Record<SectionId, string> = { about: 'About', education: 'Education', positions: 'Appointments', publications: 'Publications', projects: 'Research projects', awards: 'Honors & awards', teaching: 'Teaching & resources', news: 'News', team: 'People & collaborators', skills: 'Skills' };
const arrangement = z.array(z.object({ id: section, enabled: z.boolean() })).max(10).refine(a => new Set(a.map(x => x.id)).size === a.length, '模块不能重复');
export const profileSchema = z.object({
  version: z.literal(1),
  websiteFiles: z.array(z.string().uuid()).max(50).default([]),
  fieldIds: z.array(z.string().max(160)).max(100).default([]),
  basics: z.object({ name: local, title: local, institution: local, department: local, location: local, biography: local, statement: local, email: text, phone: text, aliases: text, interests: local, skills: local, photo: z.string().max(1500000), showEmail: z.boolean(), showPhone: z.boolean() }),
  links: z.array(link).max(30), education: z.array(education).max(100), positions: z.array(position).max(100), publications: z.array(publication).max(1000), projects: z.array(project).max(100), awards: z.array(award).max(100), teaching: z.array(course).max(100), news: z.array(news).max(100), team: z.array(person).max(100),
  settings: z.object({ siteTitle: text, slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), language: z.enum(['zh', 'en']), interfaceLanguage: z.enum(['zh', 'en']).default('zh'), websiteTemplate: z.enum(['classic', 'research', 'teaching']), cvTemplate: z.enum(['classic', 'research', 'teaching', 'science', 'social', 'clinical']), latinFont: z.enum(['termes','pagella','garamond','modern','heros']).default('termes'), chineseFont: z.enum(['serif','sans']).default('serif'), fontSize: z.number().min(9).max(13).default(11), lineSpacing: z.number().min(1.2).max(1.9).default(1.45), accent: z.enum(['terracotta', 'forest', 'ink']), paper: z.enum(['a4', 'letter']), showPhoto: z.boolean(), websiteSections: arrangement, cvSections: arrangement })
});
export type Profile = z.infer<typeof profileSchema>;
export type Localized = z.infer<typeof local>;
export type Output = 'website' | 'cv';
export type Template = 'classic' | 'research' | 'teaching';
export const L = (zh = '', en = zh): Localized => ({ zh, en });
export const localized = (value: Localized, lang: 'zh' | 'en') => value[lang] || value[lang === 'zh' ? 'en' : 'zh'];
export const uid = () => crypto.randomUUID();
export const demoProfile: Profile = {
  version: 1,
  websiteFiles: [],
  fieldIds: [],
  basics: { name: L('姓名', 'Name'), title: L('职位或身份', 'Position or role'), institution: L('单位或学校', 'Institution'), department: L('院系或机构', 'Department'), location: L(), biography: L('此处填写个人简介，包括当前单位、研究工作或教学经历。', 'Add a short biography with your current affiliation, research or teaching experience.'), statement: L('此处填写研究计划或研究陈述，可在网页与简历中分别选择是否展示。', 'Describe your research here. Choose separately whether to include this section on your website and CV.'), email: 'name@example.edu', phone: '', aliases: '', interests: L('研究主题一, 研究主题二', 'Research topic A, Research topic B'), skills: L('数据分析, 文献整理, 学术写作', 'Data analysis, Literature review, Academic writing'), photo: '', showEmail: true, showPhone: false },
  links: [{ id: 'link-1', label: 'Google Scholar', url: 'https://scholar.google.com/', visible: true }, { id: 'link-2', label: 'GitHub', url: 'https://github.com/', visible: true }, { id: 'link-3', label: 'ORCID', url: 'https://orcid.org/', visible: true }],
  education: [{ id: 'edu-1', institution: L('学校名称', 'Institution'), degree: L('学位或学习阶段', 'Degree or study level'), department: L('院系（选填）', 'Department (optional)'), period: 'YYYY – YYYY', visible: true }, { id: 'edu-2', institution: L('学校名称', 'Institution'), degree: L('学位或学习阶段', 'Degree or study level'), department: L(), period: 'YYYY – YYYY', visible: true }],
  positions: [],
  publications: [{ id: 'pub-1', title: L('论文题目一（示例）', 'Example publication A (Demo)'), authors: '', venue: '期刊或会议 / Journal or conference', year: 'YYYY', url: '', status: 'preprint', visible: true }, { id: 'pub-2', title: L('论文题目二（示例）', 'Example publication B (Demo)'), authors: '', venue: '期刊或会议 / Journal or conference', year: 'YYYY', url: '', status: 'preprint', visible: true }],
  projects: [{ id: 'proj-1', title: L('项目名称', 'Project title'), description: L('填写项目问题、承担的工作和相关成果。', 'Describe the project, your role and its outputs.'), period: 'YYYY – YYYY', url: '', visible: true }],
  awards: [{ id: 'award-1', title: L('奖项名称', 'Award title'), organization: L('颁发单位', 'Awarding institution'), year: 'YYYY', visible: true }],
  teaching: [{ id: 'course-1', title: L('课程或讲义名称', 'Course or material title'), description: L('添加课程介绍、笔记或讲义，并按需附上链接。', 'Add a course description, notes or lecture materials, with an optional link.'), period: 'YYYY', url: '', kind: 'course', visible: true }],
  news: [{ id: 'news-1', title: L('动态标题', 'News item'), date: '', url: '', visible: true }],
  team: [],
  settings: { siteTitle: 'Academic website', slug: 'my-website', language: 'en', interfaceLanguage: 'zh', websiteTemplate: 'classic', cvTemplate: 'classic', latinFont: 'termes', chineseFont: 'serif', fontSize: 11, lineSpacing: 1.45, accent: 'ink', paper: 'a4', showPhoto: true, websiteSections: sectionIds.map(id => ({ id, enabled: id !== 'team' && id !== 'skills' && id !== 'positions' })), cvSections: ['education', 'positions', 'publications', 'projects', 'awards', 'teaching', 'skills'].map(id => ({ id: id as SectionId, enabled: true })) }
};
export function emptyProfile(): Profile {
  const p = structuredClone(demoProfile);
  Object.assign(p.basics, { name: L(), title: L(), institution: L(), department: L(), location: L(), biography: L(), statement: L(), interests: L(), skills: L(), email: '', aliases: '' });
  for (const key of ['education', 'positions', 'publications', 'projects', 'awards', 'teaching', 'news', 'team', 'links'] as const) p[key] = [];
  p.settings.siteTitle = 'My academic website'; p.settings.slug = 'my-website';
  p.fieldIds = [];
  return p;
}
export function layoutDemo(template: CVTemplate, settings: Profile['settings']): Profile {
  const p = structuredClone(demoProfile);
  p.settings = { ...settings, cvTemplate: template };
  return p;
}
export function projectProfile(profile: Profile, output: Output): Profile {
  const p = structuredClone(profile);
  const enabled = new Set(profile.settings[output === 'website' ? 'websiteSections' : 'cvSections'].filter(s => s.enabled).map(s => s.id));
  if (!p.basics.showEmail) p.basics.email = '';
  if (!p.basics.showPhone) p.basics.phone = '';
  p.basics.aliases = '';
  if (!p.settings.showPhoto || !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(p.basics.photo)) p.basics.photo = '';
  if (!enabled.has('about')) { p.basics.biography = L(); p.basics.statement = L(); p.basics.interests = L(); }
  if (!enabled.has('skills')) p.basics.skills = L();
  for (const key of ['education', 'positions', 'publications', 'projects', 'awards', 'teaching', 'news', 'team'] as const) {
    (p[key] as { visible: boolean }[]) = enabled.has(key) ? p[key].filter(x => x.visible) : [];
  }
  p.links = p.links.filter(l => l.visible);
  return p;
}
export function parseBackup(value: unknown): Profile { return profileSchema.parse(value); }
export const newRecord = (key: string): Record<string, unknown> => {
  const base = { id: uid(), visible: true };
  switch (key) {
    case 'education': return { ...base, institution: L(), degree: L(), department: L(), period: '' };
    case 'positions': return { ...base, institution: L(), title: L(), period: '' };
    case 'publications': return { ...base, title: L(), authors: '', venue: '', year: '', url: '', status: 'published' };
    case 'projects': return { ...base, title: L(), description: L(), period: '', url: '' };
    case 'awards': return { ...base, title: L(), organization: L(), year: '' };
    case 'teaching': return { ...base, title: L(), description: L(), period: '', url: '', kind: 'course' };
    case 'news': return { ...base, title: L(), date: '', url: '' };
    case 'team': return { ...base, name: L(), role: L(), url: '' };
    default: return { ...base, label: '', url: '' };
  }
};
