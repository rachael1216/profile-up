import FileLibrary from './components/FileLibrary';
import CloudPanel from './components/CloudPanel';
import { useEffect, useRef, useState, cloneElement, isValidElement, Children, type ReactNode } from 'react';
import { ArrowDown, ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, Code2, Download, ExternalLink, Eye, FileJson, FileText, Globe2, GraduationCap, GripVertical, HelpCircle, ImagePlus, LayoutDashboard, LayoutTemplate, Link2, Menu, Monitor, Plus, Search, Settings2, ShieldCheck, Smartphone, Sparkles, Trash2, Upload, UserRound, X } from 'lucide-react';
import { cvCatalog, fontCatalog, chineseFonts, type CVTemplate, type FontId, type ChineseFontId } from './lib/catalog';
import { translate } from './lib/i18n';
import { demoProfile, layoutDemo, emptyProfile, L, localized, newRecord, parseBackup, sectionIds, sectionNames as sectionNamesZh, sectionEnglish, type Localized, type Output, type Profile, type SectionId, type Template } from './lib/model';
import { renderCV, renderWebsite, templateDescriptions, templateNames } from './lib/render';
type Page = 'home' | 'editor' | 'website' | 'cv' | 'exports';
type EditorKey = 'basics' | 'links' | Exclude<SectionId, 'about' | 'skills'>;
const navigation = [{
  id: 'home',
  name: '工作台',
  icon: LayoutDashboard
}, {
  id: 'editor',
  name: '内容编辑',
  icon: FileText
}, {
  id: 'website',
  name: '个人网站',
  icon: Globe2
}, {
  id: 'cv',
  name: '简历工作室',
  icon: GraduationCap
}, {
  id: 'exports',
  name: '导出中心',
  icon: ArrowDownToLine
}] as const;
const templates: Template[] = ['classic', 'research', 'teaching'];
function initialDraft(storageKey: string, fallback:Profile=demoProfile) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        return {
          profile: parseBackup(JSON.parse(raw)),
          error: ''
        };
      } catch {
        localStorage.setItem('profileup-recovery-v1', raw);
        return {
          profile: structuredClone(fallback),
          error: '旧草稿格式无法读取，原始内容已保留在浏览器恢复备份中。'
        };
      }
    }
  } catch {
    return {
      profile: structuredClone(fallback),
      error: '浏览器存储不可用，请及时下载 JSON 备份。'
    };
  }
  return {
    profile: structuredClone(fallback),
    error: ''
  };
}
function Field({
  label,
  children,
  hint,
  wide
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  wide?: boolean;
}) {
  return <div className={`field ${wide ? 'wide' : ''}`}><span>{label}</span>{Children.map(children,child=>isValidElement(child)&&typeof child.type==='string'&&['input','textarea','select'].includes(child.type)?cloneElement(child as React.ReactElement<Record<string,unknown>>,{'aria-label':label}):child)}{hint && <small>{hint}</small>}</div>;
}
function Switch({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return <button type="button" className={`switch ${checked ? 'on' : ''}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><span /></button>;
}
function MiniTemplate({
  template,
  cv = false
}: {
  template: Template;
  cv?: boolean;
}) {
  return <div className={`mini-template ${template} ${cv ? 'cv-mini' : ''}`} aria-hidden="true"><div className="mini-nav"><i /><span /><span /></div><div className="mini-hero"><div className="mini-portrait">LC</div><div><b>Lin Chen</b><span>Researcher & educator</span><i /><i /></div></div><div className="mini-body"><strong>{template === 'research' ? 'Selected projects' : template === 'teaching' ? 'Teaching' : cv ? 'Education' : 'About me'}</strong><i /><i /><i className="short" /><strong>{template === 'research' ? 'Publications' : cv ? 'Publications' : 'Selected work'}</strong><div className="mini-entry"><em /><div><i /><i className="short" /></div></div><div className="mini-entry"><em /><div><i /><i className="short" /></div></div></div></div>;
}
export default function App({ account = null, cloudId, initialProfile, profileLabel, workspace, onCloudSaved, onInterfaceLanguageChange }: { account?: { id: string; name: string } | null; cloudId?:string; initialProfile?:Profile; profileLabel?:string; workspace?:ReactNode; onCloudSaved?:()=>void; onInterfaceLanguageChange?:(lang:'zh'|'en')=>void }) {
  const storageKey = account ? `profileup-draft-v1:${account.id}:${cloudId??'new'}` : 'profileup-draft-v1';
  const [loaded] = useState(() => initialDraft(storageKey,initialProfile)),
    [profile, setProfile] = useState<Profile>(loaded.profile);
  const [page, setPage] = useState<Page>(() => ['home', 'editor', 'website', 'cv', 'exports'].includes(location.hash.slice(1)) ? location.hash.slice(1) as Page : 'website');
  const [demoMode, setDemoMode] = useState(false),
    [cvFilter, setCVFilter] = useState<'all' | 'Word' | 'TeX'>('all');
  const uiLanguage = profile.settings.interfaceLanguage,
    tr = (value: string) => translate(value, uiLanguage);
  const sectionNames = uiLanguage === 'en' ? sectionEnglish : sectionNamesZh;
  const cvProfile = demoMode ? layoutDemo(profile.settings.cvTemplate, profile.settings) : profile;
  const [editor, setEditor] = useState<EditorKey>('basics'),
    [editLang, setEditLang] = useState<'zh' | 'en'>('zh');
  const [mobile, setMobile] = useState(false),
    [saved, setSaved] = useState(false),
    [storageError, setStorageError] = useState(loaded.error);
  const [busy, setBusy] = useState(''),
    [compileProgress,setCompileProgress]=useState(''),
    [toast, setToast] = useState(''),
    [help, setHelp] = useState(false),
    [preview, setPreview] = useState<Output | null>(null),
    [sideOpen, setSideOpen] = useState(false),
    [confirm, setConfirm] = useState<'empty' | 'demo' | null>(null);
  const importInput = useRef<HTMLInputElement>(null),
    photoInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setSaved(false);
    const id = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(profile));
        setSaved(true);
      } catch {
        setStorageError(tr("草稿未能保存：浏览器存储已满或被禁用，请下载 JSON 备份。"));
      }
    }, 400);
    return () => {clearTimeout(id);try{localStorage.setItem(storageKey,JSON.stringify(profile));}catch{}};
  }, [profile]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const onHash = () => {
      const id = location.hash.slice(1);
      if (navigation.some(n => n.id === id)) setPage(id as Page);
    };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHelp(false);
        setPreview(null);
        setConfirm(null);
        setSideOpen(false);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
  const update = (fn: (p: Profile) => void) => setProfile(current => {
    const p = structuredClone(current);
    fn(p);
    return p;
  });
  const go = (id: Page) => {
    setPage(id);
    location.hash = id;
    setSideOpen(false);
    window.scrollTo({
      top: 0
    });
  };
  const settings = <K extends keyof Profile['settings'],>(key: K, value: Profile['settings'][K]) => update(p => {
    p.settings[key] = value;
  });
  const basic = (key: keyof Profile['basics'], value: string | boolean | Localized) => update(p => {
    (p.basics as Record<string, unknown>)[key] = value;
  });
  const localBasic = (key: keyof Profile['basics'], value: string) => basic(key, {
    ...(profile.basics[key] as Localized),
    [editLang]: value
  });
  const displayName = localized(profile.basics.name, profile.settings.language) || 'Your name';
  const html = page === 'cv' ? renderCV(cvProfile) : renderWebsite(profile);
  const runExport = async (kind: 'website' | 'pdf' | 'tex' | 'docx' | 'json') => {
    if (busy) return;
    if (kind !== 'json' && !localized(profile.basics.name, profile.settings.language).trim()) {
      setToast(tr("请先在内容编辑中填写姓名。"));
      go('editor');
      return;
    }
    setBusy(kind);
    try {
      const exportProfile = page === 'cv' ? cvProfile : profile;
      const e = await import('./lib/exports');
      if (kind === 'website') await e.exportWebsite(profile);
      if (kind === 'pdf') await e.exportPDF(exportProfile,setCompileProgress);
      if (kind === 'tex') await e.exportTex(exportProfile);
      if (kind === 'docx') {
        const d = await import('./lib/docx');
        await d.exportDOCX(exportProfile);
      }
      if (kind === 'json') e.exportJSON(profile);
      setToast(tr("文件已生成，下载已开始。"));
    } catch (e) {
      setToast(e instanceof Error ? e.message : tr("导出失败，请重试。"));
    } finally {
      setBusy('');setCompileProgress('');
    }
  };
  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 6000000) throw new Error(tr("JSON 文件超过 6 MB 限制。"));
      const p = parseBackup(JSON.parse(await file.text()));
      setProfile(p);
      setToast(tr("备份已导入，可以继续编辑。"));
    } catch (e) {
      setToast(e instanceof SyntaxError ? tr("JSON 文件格式不正确。") : e instanceof Error && !('issues' in e) ? e.message : tr("备份字段或版本不兼容，请使用 Profile Up 导出的 JSON 文件。"));
    }
    if (importInput.current) importInput.current.value = '';
  };
  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 10000000) {
      setToast(tr("请选择小于 10 MB 的 JPG 或 PNG 照片。"));
      return;
    }
    try {
      const bitmap = await createImageBitmap(file),
        canvas = document.createElement('canvas');
      const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
      canvas.width = bitmap.width * scale;
      canvas.height = bitmap.height * scale;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      basic('photo', canvas.toDataURL('image/jpeg', .86));
      bitmap.close();
      setToast(tr("照片已更新。"));
    } catch {
      setToast(tr("照片无法读取，请尝试其他 JPG 或 PNG 文件。"));
    }
    if (photoInput.current) photoInput.current.value = '';
  };
  const sectionControls = (output: Output) => {
    const key = output === 'website' ? 'websiteSections' : 'cvSections';
    return <div className="section-controls">{profile.settings[key].map((s, i, all) => <div className="section-row" key={s.id}><GripVertical size={14} className="grip" /><span>{sectionNames[s.id]}</span><div className="reorder"><button title={tr("上移")} aria-label={`${sectionNames[s.id]}上移`} disabled={i === 0} onClick={() => update(p => {
            const a = p.settings[key];
            [a[i - 1], a[i]] = [a[i], a[i - 1]];
          })}><ArrowUp size={12} /></button><button title={tr("下移")} aria-label={`${sectionNames[s.id]}下移`} disabled={i === all.length - 1} onClick={() => update(p => {
            const a = p.settings[key];
            [a[i + 1], a[i]] = [a[i], a[i + 1]];
          })}><ArrowDown size={12} /></button></div><Switch checked={s.enabled} label={`${sectionNames[s.id]}${output === 'cv' ? 'CV' : tr("网站")}显示`} onChange={value => update(p => {
          p.settings[key][i].enabled = value;
        })} /></div>)}{sectionIds.filter(id => !profile.settings[key].some(s => s.id === id)).length > 0 && <select aria-label={tr("添加简历模块")} value="" onChange={e => update(p => p.settings[key].push({
        id: e.target.value as SectionId,
        enabled: true
      }))}><option value="">{tr("+ 添加模块")}</option>{sectionIds.filter(id => !profile.settings[key].some(s => s.id === id)).map(id => <option key={id} value={id}>{sectionNames[id]}</option>)}</select>}</div>;
  };
  const builder = (output: Output) => <>
    <div className="page-heading"><div><p className="eyebrow">{output === 'website' ? 'PROFILE UP / WEBSITE' : 'PROFILE UP / CURRICULUM VITAE'}</p><h1>{output === 'website' ? tr("个人学术网站") : tr("学术简历工作室")}</h1><p>{output === 'website' ? tr("选择版式，整理研究、教学与学术经历。") : tr("选择排版风格，调整中英文字体与篇幅，预览并导出。")}</p></div><button className="button secondary" onClick={() => go('editor')}><FileText size={15} />{tr("编辑内容")}<ArrowUpRight size={14} /></button></div>
    <div className="section-heading"><h2>{tr("选择")}{output === 'website' ? tr("主页") : tr("简历")}{tr("风格")}<span>01 / 03</span></h2><span className="subtle">{tr("切换模板，内容即刻呈现")}</span></div>
    {output === 'website' ? <div className="template-grid">{templates.map((template, i) => <button key={template} className={`template-option ${profile.settings[output === 'website' ? 'websiteTemplate' : 'cvTemplate'] === template ? 'selected' : ''}`} onClick={() => settings(output === 'website' ? 'websiteTemplate' : 'cvTemplate', template)} aria-pressed={profile.settings[output === 'website' ? 'websiteTemplate' : 'cvTemplate'] === template}><MiniTemplate template={template} cv={false} /><div className="template-caption"><div><span className="template-number">0{i + 1}</span><strong>{templateNames[template]}</strong></div><span className="selection-dot">{profile.settings[output === 'website' ? 'websiteTemplate' : 'cvTemplate'] === template && <Check size={11} />}</span></div><p>{tr(templateDescriptions[template])}</p></button>)}</div> : <div className="cv-library"><div className="cv-library-bar"><p>{tr('按排版风格选择；所有模板均支持 PDF、Word 与 TeX 导出。')}</p><div className="format-filter">{(['all', 'Word', 'TeX'] as const).map(format => <button key={format} className={cvFilter === format ? 'active' : ''} onClick={() => setCVFilter(format)}>{format === 'all' ? tr('全部版式') : format}</button>)}</div></div><div className="cv-template-grid">{(Object.entries(cvCatalog) as [CVTemplate, typeof cvCatalog[CVTemplate]][]).filter(([, value]) => cvFilter === 'all' || value.format === cvFilter).map(([id, value], i) => <button className={`cv-template ${profile.settings.cvTemplate === id ? 'selected' : ''}`} key={id} aria-pressed={profile.settings.cvTemplate === id} onClick={() => update(p => {p.settings.cvTemplate=id;p.settings.latinFont=cvCatalog[id].font;p.settings.chineseFont=cvCatalog[id].chineseFont;})}><span className="cv-template-index">{String(i + 1).padStart(2, '0')}</span><div><small>{uiLanguage === 'en' ? value.styleEn : value.styleZh}</small><strong>{uiLanguage === 'en' ? value.en : value.zh}</strong><span>{value.format} {tr('参考布局')} · {fontCatalog[value.font].name}</span></div><span className="selection-dot">{profile.settings.cvTemplate === id && <Check size={11} />}</span></button>)}</div><div className="cv-library-note"><p>{uiLanguage === 'en' ? cvCatalog[profile.settings.cvTemplate].styleEn : cvCatalog[profile.settings.cvTemplate].note}</p><button onClick={() => update(p => {
          const preset = cvCatalog[p.settings.cvTemplate];
          p.settings.latinFont = preset.font;
          p.settings.chineseFont = preset.chineseFont;

        })}>{tr('应用推荐字体')} <ArrowRight size={13} /></button></div><div className="demo-toggle"><div><strong>{tr('预览内容')}</strong><span>{tr('示例为同一份虚构资料，便于比较版式，不会覆盖你的内容。')}</span></div><div className="segmented"><button className={!demoMode ? 'active' : ''} onClick={() => setDemoMode(false)}>{tr('我的内容')}</button><button className={demoMode ? 'active' : ''} onClick={() => setDemoMode(true)}>{tr('版式示例')}</button></div></div>{demoMode && <p className="demo-notice">{tr('当前显示版式示例；此页面的 PDF / Word / TeX 导出也将使用示例内容。')}</p>}</div>}
    <div className="section-heading preview-heading"><h2>{tr("调整与预览")}<span>02 / 03</span></h2><span className="live-dot">{tr("实时更新")}</span></div>
    <div className="builder-grid"><aside className="customize-panel"><div className="panel-title"><Settings2 size={16} /><h3>{output === 'website' ? tr("网站设置") : tr("简历设置")}</h3></div><div className="settings-content">
      {output === 'website' && <><Field label={tr("网站标题")}><input value={profile.settings.siteTitle} onChange={e => settings('siteTitle', e.target.value)} placeholder="Your name · Academic Website" /></Field><Field label={tr("网址名称")} hint={tr("用作导出文件夹名，支持英文、数字与连字符")}><div className="slug-field"><Globe2 size={13} /><input aria-label={tr("网址名称")} value={profile.settings.slug} onChange={e => settings('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'my-website')} /></div></Field></>}
      <Field label={tr("内容语言")}><div className="segmented"><button className={profile.settings.language === 'zh' ? 'active' : ''} onClick={() => settings('language', 'zh')}>{tr("中文")}</button><button className={profile.settings.language === 'en' ? 'active' : ''} onClick={() => settings('language', 'en')}>English</button></div></Field>
      <Field label={tr('英文字体')}><select aria-label={tr('英文字体')} value={profile.settings.latinFont} onChange={e => settings('latinFont', e.target.value as FontId)}>{Object.entries(fontCatalog).map(([id, font]) => <option key={id} value={id}>{font.name}</option>)}</select></Field>
      <Field label={tr('中文字体')}><select aria-label={tr('中文字体')} value={profile.settings.chineseFont} onChange={e => settings('chineseFont', e.target.value as ChineseFontId)}>{Object.entries(chineseFonts).map(([id, font]) => <option key={id} value={id}>{font.name}</option>)}</select></Field>
      {output === 'cv' && <><Field label={tr('正文字号')}><select aria-label={tr('正文字号')} value={profile.settings.fontSize} onChange={e => settings('fontSize', Number(e.target.value))}>{[9, 10, 10.5, 11, 12, 13].map(size => <option key={size} value={size}>{size} pt</option>)}</select></Field><Field label={tr('行距')}><select aria-label={tr('行距')} value={profile.settings.lineSpacing} onChange={e => settings('lineSpacing', Number(e.target.value))}>{[1.2, 1.35, 1.45, 1.6, 1.8].map(value => <option key={value} value={value}>{value}</option>)}</select></Field></>}
      <p className="font-note">{tr('PDF / TeX 使用开源字体；Word 使用对应常见字体，缺失时由阅读器回退。')}</p>
      {output === 'cv' && <Field label={tr("纸张大小")}><div className="segmented">{(['a4', 'letter'] as const).map(paper => <button key={paper} className={profile.settings.paper === paper ? 'active' : ''} onClick={() => settings('paper', paper)}>{paper === 'a4' ? 'A4' : 'US Letter'}</button>)}</div></Field>}
      <Field label={tr("强调色")}><div className="color-options">{(['terracotta', 'forest', 'ink'] as const).map((color, i) => <button key={color} className={`color-dot ${color} ${profile.settings.accent === color ? 'chosen' : ''}`} aria-label={[tr("勃艮第"), tr("学院绿"), tr("牛津蓝")][i]} aria-pressed={profile.settings.accent === color} onClick={() => settings('accent', color)}>{profile.settings.accent === color && <Check size={13} />}</button>)}<span className="subtle">{{
                  terracotta: tr("勃艮第"),
                  forest: tr("学院绿"),
                  ink: tr("牛津蓝")
                }[profile.settings.accent]}</span></div></Field>
      <div className="setting-switch"><span>{tr("显示个人照片")}</span><Switch checked={profile.settings.showPhoto} label={tr("显示个人照片")} onChange={value => settings('showPhoto', value)} /></div>
      <div className="settings-divider" /><div className="small-heading">{tr("内容模块")}<span>{tr("按需选择与排序")}</span></div>{sectionControls(output)}
    </div><div className="panel-footnote"><ShieldCheck size={14} /><span>{tr("隐藏的模块不会出现在导出文件中。")}</span></div></aside>
    <div className="preview-panel"><div className="preview-toolbar"><div className="browser-dots"><i /><i /><i /></div><span className="preview-address">{output === 'website' ? `${profile.settings.slug} / preview` : `${profile.settings.slug}-cv.pdf`}</span><div className="device-options"><button aria-label={tr("桌面预览")} className={!mobile ? 'active' : ''} onClick={() => setMobile(false)}><Monitor size={15} /></button><button aria-label={tr("手机预览")} className={mobile ? 'active' : ''} onClick={() => setMobile(true)}><Smartphone size={15} /></button></div></div><div className={`preview-canvas ${mobile ? 'mobile' : ''} ${output}`}><iframe title={output === 'website' ? tr("个人网站实时预览") : tr("CV 实时预览")} srcDoc={html} sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" /></div><div className="preview-bottom"><span>{displayName} <span className="subtle">/ {output === 'website' ? templateNames[profile.settings.websiteTemplate] : cvCatalog[profile.settings.cvTemplate][uiLanguage === 'en' ? 'en' : 'zh']}</span></span><button onClick={() => setPreview(output)}><Eye size={14} />{tr("放大预览")}</button></div></div></div>
    <div className="publish-strip"><div className="publish-icon">{output === 'website' ? <Globe2 size={25} /> : <FileText size={25} />}</div><div><h3>{output === 'website' ? tr("导出个人网站") : tr("导出学术简历")}</h3><p>{output === 'website' ? tr("下载完整静态网站，可部署到 GitHub Pages 或自有域名。") : tr("下载可搜索的 PDF，或继续编辑的完整 LaTeX 源项目。")}</p></div><div className="publish-actions">{output === 'cv' && <button className="button secondary" disabled={!!busy} onClick={() => runExport('docx')}><FileText size={15} />{busy === 'docx' ? tr('生成中…') : tr('Word 文件')}</button>}{output === 'cv' && <button className="button secondary" disabled={!!busy} onClick={() => runExport('tex')}><Code2 size={15} />{busy === 'tex' ? tr("生成中…") : tr("LaTeX 源文件")}</button>}<button className="button primary" disabled={!!busy} onClick={() => runExport(output === 'website' ? 'website' : 'pdf')}><Download size={15} />{busy ? tr("正在生成…") : output === 'website' ? tr("导出网站") : tr("下载 PDF CV")}<ArrowRight size={14} /></button></div></div>
  </>;
  const renderBasics = () => <><details className="interest-advice"><summary>{uiLanguage==='en'?'Research interests: optional writing reference':'研究兴趣：填写参考（可选）'}</summary><p>{uiLanguage==='en'?'Describe the questions, methods or subjects you work on. You can use your own terms; choosing a discipline is not required.':'可填写你研究的问题、采用的方法或关注的对象。用自己的关键词即可，无需选择学科。'}</p><a href="https://www.moe.gov.cn/srcsite/A22/moe_833/202209/t20220914_660828.html" target="_blank" rel="noopener noreferrer">{uiLanguage==='en'?'Official discipline catalogue (optional reference)':'教育部学科目录（仅供参考）'}</a></details><div className="photo-editor">{profile.basics.photo ? <img src={profile.basics.photo} alt={tr("个人照片")} /> : <div className="photo-placeholder"><UserRound size={30} /></div>}<div><h3>{tr("个人照片（可选）")}</h3><p>{tr("支持 JPG / PNG，最大 10 MB；可在输出中隐藏。")}</p><button className="button secondary small" onClick={() => photoInput.current?.click()}><ImagePlus size={14} />{tr("上传照片")}</button>{profile.basics.photo && <button className="text-button" onClick={() => basic('photo', '')}>{tr("移除")}</button>}</div></div><div className="form-grid">
    {([{
        key: 'name',
        label: tr("姓名"),
        hint: tr("保留你希望在该语言页面上使用的名字")
      }, {
        key: 'title',
        label: tr("职位 / 身份"),
        hint: tr("例如：博士研究生、讲师、研究员")
      }, {
        key: 'institution',
        label: tr("单位 / 学校")
      }, {
        key: 'department',
        label: tr("院系 / 细分机构（可选）")
      }, {
        key: 'location',
        label: tr("所在地（可选）")
      }, {
        key: 'interests',
        label: tr("研究兴趣"),
        hint: tr("自由填写，多个关键词可用逗号分隔")
      }] as const).map(f => <Field key={f.key} label={f.label} hint={'hint' in f ? f.hint : undefined}><input value={profile.basics[f.key][editLang]} onChange={e => localBasic(f.key, e.target.value)} /></Field>)}
    <Field label={tr("个人简介")} wide hint={tr("用几句话介绍你的研究与兴趣。")}><textarea rows={4} value={profile.basics.biography[editLang]} onChange={e => localBasic('biography', e.target.value)} /></Field><Field label="Research statement" wide><textarea rows={4} value={profile.basics.statement[editLang]} onChange={e => localBasic('statement', e.target.value)} /></Field><Field label={tr("个人技能")} wide hint={tr("例如：Python, 统计分析, 质性研究")}><input value={profile.basics.skills[editLang]} onChange={e => localBasic('skills', e.target.value)} /></Field><Field label={tr("论文署名 / 其他姓名")} wide hint={tr("仅在编辑器中保存，不自动导出。")}><input value={profile.basics.aliases} onChange={e => basic('aliases', e.target.value)} /></Field><Field label={tr("联系邮箱")}><input type="email" value={profile.basics.email} onChange={e => basic('email', e.target.value)} /><span className="inline-switch">{tr("在输出中显示")}<Switch checked={profile.basics.showEmail} label={tr("公开联系邮箱")} onChange={v => basic('showEmail', v)} /></span></Field><Field label={tr("其他联系方式（可选）")}><input value={profile.basics.phone} onChange={e => basic('phone', e.target.value)} /><span className="inline-switch">{tr("在输出中显示")}<Switch checked={profile.basics.showPhone} label={tr("公开其他联系方式")} onChange={v => basic('showPhone', v)} /></span></Field>
  </div><p className="editor-note"><ShieldCheck size={15} />{tr("联系邮箱由用户填写；登录验证不代表机构身份认证。")}</p></>;
  const definitions: Record<Exclude<EditorKey, 'basics'>, {
    key: string;
    label: string;
    local?: boolean;
    area?: boolean;
  }[]> = {
    education: [{
      key: 'institution',
      label: tr("学校"),
      local: true
    }, {
      key: 'degree',
      label: tr("学位 / 阶段与专业"),
      local: true
    }, {
      key: 'department',
      label: tr("细分机构（可选）"),
      local: true
    }, {
      key: 'period',
      label: tr("起止时间（可从中学开始）")
    }],
    positions: [{
      key: 'title',
      label: tr("职位"),
      local: true
    }, {
      key: 'institution',
      label: tr("机构"),
      local: true
    }, {
      key: 'period',
      label: tr("起止时间")
    }],
    publications: [{
      key: 'title',
      label: tr("论文 / 成果标题"),
      local: true
    }, {
      key: 'authors',
      label: tr("作者署名（保留原顺序）")
    }, {
      key: 'venue',
      label: tr("期刊 / 会议 / 出版物")
    }, {
      key: 'year',
      label: tr("年份")
    }, {
      key: 'url',
      label: tr("DOI / 网页链接")
    }],
    projects: [{
      key: 'title',
      label: tr("项目名称"),
      local: true
    }, {
      key: 'description',
      label: tr("项目介绍 / 个人贡献"),
      local: true,
      area: true
    }, {
      key: 'period',
      label: tr("起止时间")
    }, {
      key: 'url',
      label: tr("项目链接")
    }],
    awards: [{
      key: 'title',
      label: tr("荣誉 / 奖项"),
      local: true
    }, {
      key: 'organization',
      label: tr("颁发机构"),
      local: true
    }, {
      key: 'year',
      label: tr("年份")
    }],
    teaching: [{
      key: 'title',
      label: tr("课程 / 资源名称"),
      local: true
    }, {
      key: 'description',
      label: tr("简介"),
      local: true,
      area: true
    }, {
      key: 'period',
      label: tr("学期 / 时间")
    }, {
      key: 'url',
      label: tr("课程、笔记或视频链接")
    }],
    news: [{
      key: 'title',
      label: tr("动态标题"),
      local: true
    }, {
      key: 'date',
      label: tr("日期")
    }, {
      key: 'url',
      label: tr("来源 / 报道链接（可选）")
    }],
    team: [{
      key: 'name',
      label: tr("姓名"),
      local: true
    }, {
      key: 'role',
      label: tr("关系 / 角色"),
      local: true
    }, {
      key: 'url',
      label: tr("个人主页链接")
    }],
    links: [{
      key: 'label',
      label: tr("平台 / 链接名称")
    }, {
      key: 'url',
      label: tr("完整链接（https://…）")
    }]
  };
  const collection = () => {
    if (editor === 'basics') return null;
    const key = editor,
      records = profile[key] as unknown as Record<string, unknown>[];
    return <><div className="collection-intro"><p>{tr("按需添加。双语字段分别填写；没有译文时会使用另一种语言。")}</p><button className="button primary small" onClick={() => update(p => {
          (p[key] as unknown as Record<string, unknown>[]).push(newRecord(key));
        })}><Plus size={14} />{tr("添加条目")}</button></div>{records.length === 0 && <div className="collection-empty"><BookOpen size={26} /><h3>{tr("从第一条内容开始。")}</h3><p>{tr("你的经历与成果，值得被记录和分享。")}</p></div>}{records.map((record, index) => <article className="record-card" key={String(record.id)}><div className="record-toolbar"><span className="record-index">{String(index + 1).padStart(2, '0')}</span><span className="record-visible">{tr("在输出中显示")}<Switch checked={!!record.visible} label={`条目${index + 1}显示`} onChange={v => update(p => {
              (p[key] as unknown as Record<string, unknown>[])[index].visible = v;
            })} /></span><button className="icon-button" aria-label={`删除条目${index + 1}`} onClick={() => update(p => {
            (p[key] as unknown as Record<string, unknown>[]).splice(index, 1);
          })}><Trash2 size={15} /></button></div><div className="form-grid">{definitions[key].map(f => {
            const value = f.local ? (record[f.key] as Localized)[editLang] : String(record[f.key]);
            const change = (value: string) => update(p => {
              const r = (p[key] as unknown as Record<string, unknown>[])[index];
              r[f.key] = f.local ? {
                ...(r[f.key] as Localized),
                [editLang]: value
              } : value;
            });
            return <Field label={f.label} key={f.key} wide={f.area || f.key === 'title' || f.key === 'url'}>{f.area ? <textarea value={value} rows={3} onChange={e => change(e.target.value)} /> : <input value={value} onChange={e => change(e.target.value)} />}</Field>;
          })}{key === 'publications' && <Field label={tr("成果状态")}><select value={String(record.status)} onChange={e => update(p => {
              p.publications[index].status = e.target.value as 'published';
            })}><option value="published">{tr("已发表")}</option><option value="accepted">{tr("已接收")}</option><option value="preprint">{tr("预印本")}</option></select></Field>}{key === 'teaching' && <Field label={tr("资源类型")}><select value={String(record.kind)} onChange={e => update(p => {
              p.teaching[index].kind = e.target.value as 'course';
            })}><option value="course">{tr("课程")}</option><option value="notes">{tr("笔记 / 讲义")}</option><option value="tutorial">{tr("教程")}</option><option value="video">{tr("授课视频")}</option></select></Field>}</div></article>)}{key === 'links' && <p className="editor-note"><Link2 size={15} />{tr("链接为用户填写，当前版本未验证账号归属。导出只启用 HTTP / HTTPS 链接。")}</p>}</>;
  };
  return <div className="app-shell"><input ref={importInput} type="file" accept=".json,application/json" className="hidden" onChange={e => importBackup(e.target.files?.[0])} /><input ref={photoInput} type="file" accept="image/jpeg,image/png" className="hidden" onChange={e => uploadPhoto(e.target.files?.[0])} />{sideOpen && <button className="sidebar-scrim" aria-label={tr("关闭导航")} onClick={() => setSideOpen(false)} />}
    <aside className={`sidebar ${sideOpen ? 'open' : ''}`}><button className="brand" onClick={() => go('home')}><span className="brand-icon"><ArrowUpRight size={24} /></span><span>Profile<span className="brand-up">Up</span><i /></span></button><div className="workspace-label">{tr("工作室")}</div><nav aria-label={tr("主导航")}>{navigation.map(n => <button key={n.id} className={page === n.id ? 'active' : ''} onClick={() => go(n.id)}><n.icon size={18} /><span>{tr(n.name)}</span>{page === n.id && <span className="nav-indicator" />}</button>)}</nav><div className="sidebar-guide"><div className="guide-icon"><BookOpen size={19} /></div><h3>{tr("网页与简历")}<br />{tr("使用说明")}</h3><p>{tr("个人主页 · 学术履历")}<br />{tr("中文 / English")}</p><button onClick={() => setHelp(true)}>{tr("查看使用指南")}<ArrowUpRight size={14} /></button></div><div className="sidebar-bottom"><a href="/wasmtex/index.html" target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#717171"}}>TeX · Open-source notices</a><button onClick={() => setHelp(true)}><HelpCircle size={17} />{tr("帮助与使用指南")}</button><div className="workspace-user"><div className="user-avatar">{displayName.slice(0, 1).toUpperCase()}</div><div><strong>{tr("个人工作空间")}</strong><span>{tr("公开 demo · v0.5")}</span></div><ShieldCheck size={15} /></div></div></aside>
    <div className="workspace"><header className="topbar"><div className="breadcrumb"><button className="mobile-menu" aria-label={tr("打开导航")} onClick={() => setSideOpen(true)}><Menu size={20} /></button><span>{tr("工作空间")}</span><ChevronRight size={13} /><strong>{tr(navigation.find(n => n.id === page)?.name ?? '')}</strong></div><div className="topbar-right"><select className="interface-language" aria-label={tr("Interface language / 界面语言")} value={uiLanguage} onChange={e => {settings('interfaceLanguage', e.target.value as 'zh' | 'en');onInterfaceLanguageChange?.(e.target.value as 'zh'|'en');}}><option value="zh">{tr("中文")}</option><option value="en">English</option></select><span className={`save-status ${saved ? 'saved' : ''}`}><span />{saved ? tr("已保存到此浏览器") : tr("保存中…")}</span><button className="icon-button" aria-label={tr("使用指南")} onClick={() => setHelp(true)}><HelpCircle size={18} /></button><div className="topbar-avatar">{displayName.slice(0, 1).toUpperCase()}</div></div></header>
    <main className="main-content">{storageError && <div className="warning-banner">{storageError}<button aria-label={tr("关闭提示")} onClick={() => setStorageError('')}><X size={14} /></button></div>}
      {account && localStorage.getItem('profileup-draft-v1') && <button className="text-button" onClick={()=>{try { const old=parseBackup(JSON.parse(localStorage.getItem('profileup-draft-v1')!)); setProfile(old);setToast('已导入本机离线草稿，请检查后保存到云端。'); } catch {setToast('本机草稿无法读取，请使用 JSON 备份导入。');}}}>导入本机离线草稿</button>}
      {workspace}
      <CloudPanel account={account} cloudId={cloudId} profileLabel={profileLabel} onSaved={onCloudSaved} profile={profile} onLoad={setProfile} onAlert={setToast} />
      {cloudId && <FileLibrary key={cloudId} profileId={cloudId} selected={profile.websiteFiles} onSelect={ids=>update(p=>{p.websiteFiles=ids;})} english={uiLanguage==='en'} />}
      {compileProgress && <p className="tex-progress" role="status">{compileProgress}</p>}
      {page === 'website' && builder('website')}{page === 'cv' && builder('cv')}
      {page === 'home' && <><div className="home-hero"><div><p className="eyebrow">PROFILE UP · DEMO</p><h1>{tr("个人网站与")}<br />{tr("学术简历。")}</h1><p>{tr("填写资料，制作个人网页和简历。")}<br />{tr("选择模板、调整内容，再预览和下载。")}</p><div className="home-actions"><button className="button primary" onClick={() => go('website')}>{tr("搭建个人网站")}<ArrowRight size={16} /></button><button className="button secondary" onClick={() => go('cv')}>{tr("制作学术简历")}</button></div></div><div className="hero-composition"><div className="hero-window"><div className="window-bar"><i /><i /><i /><span>your-name / website</span></div><MiniTemplate template="classic" /></div><div className="hero-cv"><MiniTemplate template="teaching" cv /></div><span className="hero-note">Website / Curriculum vitae</span></div></div><div className="section-heading"><h2>{tr("从这里开始")}</h2><span className="subtle">{tr("当前为可编辑的示例内容，可替换为你的信息")}</span></div><div className="start-grid">{[{
              icon: FileText,
              title: tr("填写个人资料"),
              desc: tr("填写基本信息、经历与成果。"),
              action: tr("编辑内容"),
              target: 'editor'
            }, {
              icon: Globe2,
              title: tr("个人网页"),
              desc: tr("选模板，调整模块，实时预览。"),
              action: tr("搭建网站"),
              target: 'website'
            }, {
              icon: GraduationCap,
              title: tr("学术简历"),
              desc: tr("选择模板，设置字体和纸张。"),
              action: tr("制作简历"),
              target: 'cv'
            }].map(x => <button className="start-card" key={x.target} onClick={() => go(x.target as Page)}><x.icon size={22} /><h3>{x.title}</h3><p>{x.desc}</p><span>{x.action}<ArrowRight size={15} /></span></button>)}</div><div className="local-info"><ShieldCheck size={20} /><div><strong>{tr("本机草稿")}</strong><p>{tr("编辑会自动保存到本机；登录后可主动保存云端草稿、发布个人主页。导出与发布只包含选择显示的内容。")}</p></div><button className="text-button" onClick={() => runExport('json')}>{tr("备份内容")}<ArrowUpRight size={14} /></button></div></>}
      {page === 'editor' && <><div className="page-heading"><div><p className="eyebrow">PROFILE UP / CONTENT</p><h1>{tr("内容与经历")}</h1><p>{tr("这里填写的内容，将用于生成你的个人网站与学术简历。")}</p></div><button className="button secondary" onClick={() => importInput.current?.click()}><Upload size={15} />{tr("导入 JSON 备份")}</button></div><div className="editor-layout"><aside className="editor-tabs"><span className="small-label">{tr("内容组块")}</span>{(['basics', 'education', 'positions', 'publications', 'projects', 'awards', 'teaching', 'news', 'team', 'links'] as EditorKey[]).map(key => <button key={key} className={editor === key ? 'active' : ''} onClick={() => setEditor(key)}>{key === 'basics' ? <UserRound size={16} /> : key === 'links' ? <Link2 size={16} /> : <BookOpen size={15} />}<span>{key === 'basics' ? tr("基本信息与介绍") : key === 'links' ? tr("学术与社交链接") : sectionNames[key]}</span>{key !== 'basics' && <small>{profile[key].length}</small>}</button>)}<div className="editor-tab-actions"><button onClick={() => setConfirm('empty')}>{tr("新建空白内容")}</button><button onClick={() => setConfirm('demo')}>{tr("载入示例内容")}</button></div></aside><section className="editor-panel"><div className="editor-panel-heading"><h2>{editor === 'basics' ? tr("基本信息与介绍") : editor === 'links' ? tr("学术与社交链接") : sectionNames[editor]}</h2><div className="segmented"><button className={editLang === 'zh' ? 'active' : ''} onClick={() => setEditLang('zh')}>{tr("中文")}</button><button className={editLang === 'en' ? 'active' : ''} onClick={() => setEditLang('en')}>English</button></div></div><div className="editor-panel-body">{editor === 'basics' ? renderBasics() : collection()}</div><div className="editor-footer"><span><CheckCircle2 size={14} />{tr("内容修改后，预览自动更新")}</span><button className="button primary small" onClick={() => go('website')}>{tr("查看我的网站")}<ArrowRight size={14} /></button></div></section></div></>}
      {page === 'exports' && <><div className="page-heading"><div><p className="eyebrow">PROFILE UP / EXPORTS</p><h1>{tr("文件导出")}</h1><p>{tr("下载你的个人网站与简历，在喜欢的平台上展示自己。")}</p></div></div><div className="export-summary"><div className="summary-avatar">{displayName.slice(0, 1)}</div><div><strong>{displayName}</strong><p>{localized(profile.basics.institution, profile.settings.language)} · {profile.settings.language === 'zh' ? tr("中文") : 'English'}</p></div><span className="outline-label">{tr("当前内容版本")}</span></div><div className="export-grid">{[{
              kind: 'website',
              icon: Globe2,
              title: tr("个人学术网站"),
              format: 'HTML · ZIP',
              desc: tr("完整静态网页，包含所选模块与照片。可部署到 GitHub Pages 或任意静态托管。"),
              action: tr("下载网站"),
              note: templateNames[profile.settings.websiteTemplate]
            }, {
              kind: 'pdf',
              icon: FileText,
              title: tr("PDF 学术简历"),
              format: 'PDF',
              desc: tr("XeLaTeX 编译的 PDF。支持中英文、照片和多页内容。"),
              action: tr("下载 PDF"),
              note: `${cvCatalog[profile.settings.cvTemplate][uiLanguage === 'en' ? 'en' : 'zh']} · ${profile.settings.paper.toUpperCase()}`
            }, {
              kind: 'tex',
              icon: Code2,
              title: tr("LaTeX 源项目"),
              format: 'TEX · ZIP',
              desc: tr("包含主文件、字体、照片和编译说明，可使用 XeLaTeX 继续编辑与生成。"),
              action: tr("下载源文件"),
              note: tr("完整依赖 · 可重新编译")
            }, {
              kind: 'docx',
              icon: FileText,
              title: tr("Word 学术简历"),
              format: 'DOCX',
              desc: tr("原生可编辑文档，保留段落与样式，可在 Word 或 WPS 继续修改。"),
              action: tr("下载 Word"),
              note: tr("字体缺失时使用阅读器回退字体")
            }, {
              kind: 'json',
              icon: FileJson,
              title: tr("完整内容备份"),
              format: 'JSON',
              desc: tr("保存全部内容与设置，包含隐藏信息。可重新导入 Profile Up，请妥善保管。"),
              action: tr("下载备份"),
              note: tr("含私有 / 隐藏内容")
            }].map(x => <article className="export-card" key={x.kind}><div className="export-card-top"><div className="export-icon"><x.icon size={23} /></div><span>{x.format}</span></div><h2>{x.title}</h2><p>{x.desc}</p><small>{x.note}</small><button className="button secondary" disabled={!!busy} onClick={() => runExport(x.kind as 'website')}><Download size={15} />{busy === x.kind ? tr("正在生成…") : x.action}</button></article>)}</div><div className="deploy-note"><div className="deploy-symbol"><Globe2 size={24} /></div><div><h3>{tr("把网站放到你自己的地址。")}</h3><p>{tr("下载网站 ZIP 后，解压并将 index.html 上传到静态托管。自动连接 GitHub 与域名将在后续版本接入。")}</p></div><a className="button secondary" href="https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site" target="_blank" rel="noreferrer">{tr("GitHub Pages 指南")}<ExternalLink size={14} /></a></div></>}
      <footer className="app-footer"><span>Profile Up <span className="footer-dot">·</span> Academic websites & curricula vitae.</span><span>{tr("个人网站与学术简历工作室")}</span></footer>
    </main></div>
    {toast && <div className="toast" role="status"><CheckCircle2 size={17} /><span>{tr(toast)}</span><button aria-label={tr("关闭通知")} onClick={() => setToast('')}><X size={14} /></button></div>}
    {(help || preview || confirm) && <div className="modal-overlay" onClick={() => {
      setHelp(false);
      setPreview(null);
      setConfirm(null);
    }}><section className={`modal ${preview ? 'preview-modal' : ''}`} role="dialog" aria-modal="true" aria-label={preview ? tr("完整预览") : confirm ? tr("替换内容确认") : tr("使用指南")} onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>{preview ? preview === 'cv' ? tr("学术 CV 预览") : tr("个人网站预览") : confirm ? tr("替换当前内容？") : tr("欢迎使用 Profile Up")}</h2><button autoFocus className="icon-button" aria-label={tr("关闭弹窗")} onClick={() => {
            setHelp(false);
            setPreview(null);
            setConfirm(null);
          }}><X size={20} /></button></div>{preview ? <iframe title={tr("完整输出预览")} srcDoc={preview === 'cv' ? renderCV(cvProfile) : renderWebsite(profile)} sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" /> : confirm ? <div className="modal-content"><p>{tr("此操作会将当前内容替换为")}{confirm === 'empty' ? tr("空白内容") : tr("示例内容")}{tr("。建议先下载 JSON 备份。")}</p><div className="modal-actions"><button className="button secondary" onClick={() => runExport('json')}>{tr("先下载备份")}</button><button className="button primary" onClick={() => {
              setProfile(confirm === 'empty' ? emptyProfile() : structuredClone(demoProfile));
              setConfirm(null);
              setToast(tr("内容已更新。"));
            }}>{tr("确认替换")}</button></div></div> : <div className="modal-content"><p className="help-intro">{tr("填写资料后，分别设置网页和简历。")}</p><ol><li><strong>{tr("编辑内容")}</strong><p>{tr("替换示例信息，按组块填写经历、成果和链接；分别编辑中文与英文。")}</p></li><li><strong>{tr("挑选模板")}</strong><p>{tr("在个人网站和简历工作室选择风格，设置模块顺序与公开范围。")}</p></li><li><strong>{tr("预览并下载")}</strong><p>{tr("导出静态网站、PDF、TeX 源项目；完整 JSON 备份可以再次导入。")}</p></li></ol><div className="help-limit"><ShieldCheck size={17} /><p>{tr("demo 支持多份资料、PDF 附件和个人主页发布。邮箱与短信验证需开通发送服务。机构邮箱认证与外部账号归属验证尚未接入。示例人物和成果用于演示。PDF 使用 XeLaTeX 编译；Word 与网页预览的分页可能不同。")}</p></div><button className="button primary" onClick={() => {
            setHelp(false);
            go('editor');
          }}>{tr("开始填写我的内容")}<ArrowRight size={15} /></button></div>}</section></div>}
  </div>;
}
