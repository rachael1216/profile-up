"""Convert redistributable CFF outlines to TrueType for PDF reader compatibility.
Keep the original OTF files for browser/TeX typography; licenses are in public/fonts.
Requires fontTools with cu2qu support. Generated TTF files are tracked so this is
not required for installation or building the application.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen

root = Path(__file__).resolve().parents[1] / 'public' / 'fonts'
for path in root.glob('*-Regular.otf'):
    font = TTFont(path)
    glyph_set = font.getGlyphSet()
    glyphs = {}
    for name in font.getGlyphOrder():
        pen = TTGlyphPen(glyph_set)
        glyph_set[name].draw(Cu2QuPen(pen, max_err=1.0, reverse_direction=True))
        glyphs[name] = pen.glyph()
    fb = FontBuilder(font['head'].unitsPerEm, isTTF=True)
    fb.setupGlyphOrder(font.getGlyphOrder())
    fb.setupCharacterMap(font.getBestCmap())
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(font['hmtx'].metrics)
    fb.setupHorizontalHeader(ascent=font['hhea'].ascent, descent=font['hhea'].descent, lineGap=font['hhea'].lineGap)
    family = 'Profile Up ' + path.stem.replace('-Regular', '')
    fb.setupNameTable({'familyName': family, 'styleName': 'Regular', 'uniqueFontIdentifier': family + ' Regular', 'fullName': family + ' Regular', 'psName': family.replace(' ', '') + '-Regular', 'version': 'Version 1.0'})
    os2=font['OS/2']
    fb.setupOS2(sTypoAscender=os2.sTypoAscender,sTypoDescender=os2.sTypoDescender,sTypoLineGap=os2.sTypoLineGap,usWinAscent=os2.usWinAscent,usWinDescent=os2.usWinDescent)
    fb.setupPost()
    for table in ['GPOS','GSUB','GDEF']:
        if table in font: fb.font[table] = font[table]
    fb.save(path.with_suffix('.ttf'))
    print(path.with_suffix('.ttf').name)
