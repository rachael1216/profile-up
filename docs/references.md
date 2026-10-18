# Classification and typography references

Checked: 2026-10-16.

CV layouts are original style presets, not official university or disciplinary CV templates. They are organized by visual and typographic style. Word and TeX badges describe layout conventions; they do not imply that browser-generated PDFs were compiled by Microsoft Word or XeLaTeX.

## Research area references

- MOE Graduate Education Discipline Catalogue (2022): https://www.moe.gov.cn/srcsite/A22/moe_833/202209/t20220914_660828.html
- Accessible government-affiliated reproduction: https://yz.chsi.com.cn/kyzx/jybzc/202209/20220913/2293267493.html
- MOE adjustment correspondence notice (2025): https://www.moe.gov.cn/srcsite/A22/s7065/202506/t20250611_1193766.html
- GB/T 13745-2009 official status and amendments: https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=4C13F521FD6ECB6E5EC026FCD779986E
- ACM Computing Classification System (2012): https://www.acm.org/publications/class-2012

The app currently includes 40 selected MOE discipline entries, with original Chinese codes and labels and product-maintained English translations. It includes selected ACM CCS name paths, with product-maintained Chinese translations. Excerpts are labeled, with source links; this is not a complete or continuously synchronized taxonomy. The MOE education catalogue and GB/T research discipline classification are distinct systems. GB/T is linked as a reference and is not silently substituted with the MOE dataset. Conference-specific submission areas vary by venue and year; no invented editorial topic list is presented as a conference's official taxonomy.

## Fonts

TeX Gyre Termes / Pagella / Heros and Latin Modern Roman were sourced from TeX Live's original distribution; GUST licenses are included. EB Garamond uses the included SIL OFL license. Noto Sans SC and Noto Serif SC were sourced from Google Fonts, with the included SIL OFL licenses. Regular static instances were produced from the variable sources with fontTools. For PDF reader compatibility, TrueType derivatives of the five Latin OTF fonts are also included, renamed with a Profile Up prefix; scripts/prepare-pdf-fonts.py records the conversion. Original OTFs are retained for browser and TeX use, with their licenses.

Original Noto sources:

- https://github.com/google/fonts/tree/main/ofl/notosanssc
- https://github.com/google/fonts/tree/main/ofl/notoserifsc

DOCX references Times New Roman, Palatino Linotype, Arial or the selected open font by name, without embedding proprietary system fonts. Reader fallback depends on installed fonts. PDF and TeX embed or package the named redistributable alternatives.

## Interface scope (v0.5)

The current editor does not offer discipline selection or an ACM-specific taxonomy. Research interests are free text. The official catalogue link is an optional writing reference. Earlier taxonomy references in project history do not determine website or CV templates.
