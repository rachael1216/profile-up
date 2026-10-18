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
  basics: { name: L('陈林', 'Lin Chen'), title: L('博士研究生', 'Doctoral researcher'), institution: L('示例大学', 'Example University'), department: L('示例学院', 'Example department'), location: L('中国 · 杭州', 'Hangzhou, China'), biography: L('此处填写个人简介，包括当前单位、研究工作或教学经历。', 'Add a short biography with your current affiliation, research or teaching experience.'), statement: L('此处填写研究计划或研究陈述，可在网页与简历中分别选择是否展示。', 'Describe your research here. Choose separately whether to include this section on your website and CV.'), email: 'lin.chen@example.edu', phone: '', aliases: 'Lin Chen; L. Chen; 陈林', interests: L('研究主题一, 研究主题二', 'Research topic A, Research topic B'), skills: L('数据分析, 文献整理, 学术写作', 'Data analysis, Literature review, Academic writing'), photo: '', showEmail: true, showPhone: false },
  links: [{ id: 'link-1', label: 'Google Scholar', url: 'https://scholar.google.com/', visible: true }, { id: 'link-2', label: 'GitHub', url: 'https://github.com/', visible: true }, { id: 'link-3', label: 'ORCID', url: 'https://orcid.org/', visible: true }],
  education: [{ id: 'edu-1', institution: L('示例大学', 'Example University'), degree: L('博士研究生', 'Ph.D. candidate'), department: L('示例学院', 'Example department'), period: '2023 – Present', visible: true }, { id: 'edu-2', institution: L('示例理工学院', 'Example Institute of Technology'), degree: L('学士', 'Bachelor’s degree'), department: L(), period: '2019 – 2023', visible: true }],
  positions: [{ id: 'pos-1', institution: L('示例研究团队', 'Example research group'), title: L('研究助理', 'Research Assistant'), period: '2023 – Present', visible: true }],
  publications: [{ id: 'pub-1', title: L('论文题目一（示例）', 'Example publication A (Demo)'), authors: 'Lin Chen, Alex Lee, Morgan Taylor', venue: 'Illustrative research manuscript', year: '2026', url: '', status: 'preprint', visible: true }, { id: 'pub-2', title: L('论文题目二（示例）', 'Example publication B (Demo)'), authors: 'Lin Chen, Morgan Taylor', venue: 'Illustrative research manuscript', year: '2025', url: '', status: 'preprint', visible: true }],
  projects: [{ id: 'proj-1', title: L('Open Learning Lab', 'Open Learning Lab'), description: L('一个用于探索交互式学习体验的开放项目。', 'An open project exploring interactive learning experiences.'), period: '2025 – Present', url: '', visible: true }],
  awards: [{ id: 'award-1', title: L('研究生学术奖学金（示例）', 'Graduate Research Scholarship (Demo)'), organization: L('示例大学', 'Example University'), year: '2025', visible: true }],
  teaching: [{ id: 'course-1', title: L('交互设计入门', 'Introduction to Interaction Design'), description: L('开放课程笔记、阅读材料与实践练习。', 'Open course notes, readings, and hands-on exercises.'), period: '2026 Spring', url: '', kind: 'course', visible: true }],
  news: [{ id: 'news-1', title: L('开始分享交互设计课程笔记。', 'Sharing my interaction design course notes.'), date: '2026-09-12', url: '', visible: true }],
  team: [{ id: 'person-1', name: L('示例合作者', 'Example Collaborator'), role: L('研究合作伙伴', 'Research collaborator'), url: '', visible: true }],
  settings: { siteTitle: 'Lin Chen · Academic Website', slug: 'lin-chen', language: 'en', interfaceLanguage: 'zh', websiteTemplate: 'classic', cvTemplate: 'classic', latinFont: 'termes', chineseFont: 'serif', fontSize: 11, lineSpacing: 1.45, accent: 'ink', paper: 'a4', showPhoto: true, websiteSections: sectionIds.map(id => ({ id, enabled: id !== 'team' && id !== 'skills' && id !== 'positions' })), cvSections: ['education', 'positions', 'publications', 'projects', 'awards', 'teaching', 'skills'].map(id => ({ id: id as SectionId, enabled: true })) }
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
