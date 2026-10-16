import JSZip from 'jszip';
import { fontCatalog, chineseFonts, cvCatalog } from './catalog';
import { localized, projectProfile, type Profile } from './model';
import { cvSections, downloadBlob } from './exports';
import { safeUrl } from './render';

const xml = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export async function buildDOCX(profile: Profile): Promise<Blob> {
  const p = projectProfile(profile,'cv'), zip = new JSZip(), t=(v:{zh:string;en:string})=>localized(v,p.settings.language);
  const font = fontCatalog[p.settings.latinFont], chinese = chineseFonts[p.settings.chineseFont], size = Math.round(p.settings.fontSize * 2);
  const run = (text: string, bold=false, halfPoints=size, color='262B24') => `<w:r><w:rPr><w:rFonts w:ascii="${xml(font.word)}" w:hAnsi="${xml(font.word)}" w:eastAsia="${xml(chinese.word)}"/>${bold?'<w:b/>':''}<w:sz w:val="${halfPoints}"/><w:szCs w:val="${halfPoints}"/><w:color w:val="${color}"/></w:rPr><w:t xml:space="preserve">${xml(text)}</w:t></w:r>`;
  const para = (text: string, style='Normal', bold=false, halfPoints=size, color='262B24') => `<w:p><w:pPr><w:pStyle w:val="${style}"/>${style==='Title'&&p.settings.cvTemplate==='social'?'<w:jc w:val="center"/>':''}</w:pPr>${text.split('\n').map((line,i)=>(i?'<w:r><w:br/></w:r>':'')+run(line,bold,halfPoints,color)).join('')}</w:p>`;
  const rels: string[] = ['<Relationship Id="rStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'];
  const hyperlink=(url:string,label:string)=>{const id=`rLink${rels.length}`;rels.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xml(url)}" TargetMode="External"/>`);return `<w:p><w:pPr><w:pStyle w:val="Contact"/></w:pPr><w:hyperlink r:id="${id}">${run(label,false,size-3,'405744')}</w:hyperlink></w:p>`;};
  let body = para(t(p.basics.name),'Title',false,48) + para([t(p.basics.title),t(p.basics.institution)].filter(Boolean).join(' | '),'Subtitle',false,size-1) + para(t(p.basics.location),'Contact',false,size-2);
  if (p.basics.photo) {
    const png=p.basics.photo.startsWith('data:image/png'), ext=png?'png':'jpg';zip.file(`word/media/photo.${ext}`,p.basics.photo.split(',')[1],{base64:true});
    rels.push(`<Relationship Id="rPhoto" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/photo.${ext}"/>`);
    body += `<w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="685800" cy="822960"/><wp:docPr id="1" name="Portrait" descr="${xml(t(p.basics.name))}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="Portrait"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rPhoto"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="685800" cy="822960"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
  }
  for(const contact of [p.basics.email,p.basics.phone].filter(Boolean))body+=para(contact,'Contact',false,size-2);
  for(const l of p.links.filter(l=>safeUrl(l.url)))body+=hyperlink(safeUrl(l.url),`${l.label}: ${safeUrl(l.url)}`);
  for(const section of cvSections(p)){
    body+=para(section.heading,'Heading1',true,size+2);
    for(const entry of section.entries){
      if(entry.date)body+=para(entry.date,'Date',false,size-2,'696B61');
      if(entry.title)body+=para(entry.title,'EntryTitle',true);
      for(const line of entry.lines.filter(Boolean))body+=para(line);
      if(entry.url)body+=hyperlink(entry.url,entry.url);
    }
  }
  const [w,h]=p.settings.paper==='a4'?[11906,16838]:[12240,15840];
  const document=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}<w:sectPr><w:pgSz w:w="${w}" w:h="${h}"/><w:pgMar w:top="1152" w:right="1152" w:bottom="1152" w:left="1152"/></w:sectPr></w:body></w:document>`;
  const style=(id:string,props:string,runProps='')=>`<w:style w:type="paragraph" w:styleId="${id}"${id==='Normal'?' w:default="1"':''}><w:name w:val="${id}"/>${id!=='Normal'?'<w:basedOn w:val="Normal"/>':''}<w:pPr>${props}</w:pPr><w:rPr>${runProps}</w:rPr></w:style>`;
  const styles=`<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${xml(font.word)}" w:hAnsi="${xml(font.word)}" w:eastAsia="${xml(chinese.word)}"/><w:sz w:val="${size}"/><w:lang w:val="${p.settings.language==='zh'?'zh-CN':'en-US'}" w:eastAsia="zh-CN"/></w:rPr></w:rPrDefault></w:docDefaults>${style('Normal',`<w:spacing w:after="80" w:line="${Math.round(p.settings.lineSpacing*240)}" w:lineRule="auto"/><w:widowControl/>`)}${style('Title','<w:keepNext/><w:spacing w:before="0" w:after="140"/>')}${style('Subtitle','<w:keepNext/>')}${style('Contact','<w:spacing w:after="40"/>')}${style('Heading1','<w:keepNext/><w:spacing w:before="250" w:after="130"/>')}${style('Date','<w:keepNext/><w:spacing w:before="110" w:after="30"/>')}${style('EntryTitle','<w:keepNext/><w:spacing w:after="40"/>')}</w:styles>`;
  zip.file('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`);
  zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rDoc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rCore" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>');
  zip.file('word/document.xml',document);zip.file('word/styles.xml',styles);zip.file('word/_rels/document.xml.rels',`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`);
  zip.file('docProps/core.xml',`<?xml version="1.0" encoding="UTF-8"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${xml(t(p.basics.name))} CV</dc:title><dc:creator>${xml(t(p.basics.name))}</dc:creator><dc:description>${xml(cvCatalog[p.settings.cvTemplate].en)}</dc:description></cp:coreProperties>`);
  return zip.generateAsync({type:'blob',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
export async function exportDOCX(profile:Profile){downloadBlob(await buildDOCX(profile),`${profile.settings.slug}-cv.docx`);}
