import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadZmanAuthoring } from './zman-authoring.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const require = createRequire(import.meta.url);
const HEBREW_RE = /[\u0590-\u05ff]/;
const STRONG_LTR_RE = /[\p{L}\p{N}]/u;
const RTL_TRAILING_PUNCTUATION_RE = /^(.+?)([.,!?;:…]+)$/u;
const PDF_CONTROL_RE = /[\u0000\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
function pdfSafeText(value) {
  return String(value ?? '').replace(PDF_CONTROL_RE, '');
}
function pdfTextOptions(value, base = {}) {
  return HEBREW_RE.test(String(value || '')) ? { ...base, features: [] } : base;
}
const LETTER = [612, 792];
const LANDSCAPE = [792, 612];


async function findFont(packageName, subset, weight) {
  const root = dirname(require.resolve(packageName + '/package.json'));
  const files = await readdir(join(root, 'files'));
  const stem = subset + '-' + weight + '-normal';
  const file = files.find(name => name.endsWith(stem + '.woff')) || files.find(name => name.endsWith(stem + '.woff2'));
  if (!file) throw new Error('Missing font ' + packageName + ' ' + stem);
  return join(root, 'files', file);
}

async function loadFonts() {
  return {
    noto: await findFont('@fontsource/noto-sans', 'latin', 400),
    notoBold: await findFont('@fontsource/noto-sans', 'latin', 700),
    hebrew: await findFont('@fontsource/noto-sans-hebrew', 'hebrew', 400),
    dejavu: await findFont('@fontsource/dejavu-sans', 'latin', 400),
    dejavuBold: await findFont('@fontsource/dejavu-sans', 'latin', 700)
  };
}

function registerFonts(doc, fonts) {
  doc.registerFont('Noto', fonts.noto);
  doc.registerFont('NotoBold', fonts.notoBold);
  doc.registerFont('Hebrew', fonts.hebrew);
  doc.registerFont('DejaVu', fonts.dejavu);
  doc.registerFont('DejaVuBold', fonts.dejavuBold);
}

function fontFor(text, { family = 'noto', bold = false } = {}) {
  if (HEBREW_RE.test(String(text || ''))) return 'Hebrew';
  if (family === 'dejavu') return bold ? 'DejaVuBold' : 'DejaVu';
  return bold ? 'NotoBold' : 'Noto';
}

function setFont(doc, text, options = {}) {
  doc.font(fontFor(text, options)).fontSize(options.size || 10);
}

function splitPdfFontRuns(value) {
  const safe = pdfSafeText(value);
  if (!safe) return [];
  const runs = [];
  let current = '';
  let hebrew = null;
  for (const ch of safe) {
    const nextHebrew = HEBREW_RE.test(ch);
    if (current && nextHebrew !== hebrew) {
      runs.push({ text: current, hebrew });
      current = '';
    }
    current += ch;
    hebrew = nextHebrew;
  }
  if (current) runs.push({ text: current, hebrew });
  return runs;
}

function pdfStrongDirection(value) {
  for (const ch of pdfSafeText(value)) {
    if (HEBREW_RE.test(ch)) return 'rtl';
    if (STRONG_LTR_RE.test(ch)) return 'ltr';
  }
  return 'neutral';
}

function reorderRtlWordGroups(words) {
  const visual = [];
  for (let index = 0; index < words.length;) {
    if (pdfStrongDirection(words[index]) !== 'rtl') {
      visual.push(words[index]);
      index += 1;
      continue;
    }
    let end = index + 1;
    while (end < words.length && pdfStrongDirection(words[end]) === 'rtl') end += 1;
    const group = words.slice(index, end);
    const trailing = group[group.length - 1].match(RTL_TRAILING_PUNCTUATION_RE);
    if (trailing && HEBREW_RE.test(trailing[1])) {
      group[group.length - 1] = trailing[1];
      group[0] += trailing[2];
    }
    for (let cursor = group.length - 1; cursor >= 0; cursor -= 1) visual.push(group[cursor]);
    index = end;
  }
  return visual;
}

function wordWidth(doc, word, options = {}) {
  let width = 0;
  for (const run of splitPdfFontRuns(word)) {
    setFont(doc, run.text, options);
    width += doc.widthOfString(run.text, pdfTextOptions(run.text));
  }
  return width;
}

function phraseWidth(doc, value, options = {}) {
  const parts = String(value ?? '').match(/\s+|[^\s]+/g) || [];
  const space = wordWidth(doc, ' ', options);
  return parts.reduce((total, part) => total + (/^\s+$/.test(part) ? space * part.length : wordWidth(doc, part, options)), 0);
}

function drawPdfToken(doc, token, x, y, options = {}, color = '#000000') {
  const runs = splitPdfFontRuns(token);
  if (!runs.length) return x;
  const widths = runs.map(run => {
    setFont(doc, run.text, options);
    return doc.widthOfString(run.text, pdfTextOptions(run.text));
  });

  const neutralSuffixOnly = runs[0]?.hebrew && runs.slice(1).every(run => pdfStrongDirection(run.text) === 'neutral');
  if (pdfStrongDirection(token) === 'rtl' && runs.length > 1 && !neutralSuffixOnly) {
    const total = widths.reduce((sum, width) => sum + width, 0);
    let right = x + total;
    runs.forEach((run, index) => {
      right -= widths[index];
      setFont(doc, run.text, options);
      doc.fillColor(color).text(run.text, right, y, pdfTextOptions(run.text, { lineBreak:false }));
    });
    return x + total;
  }

  let cursor = x;
  runs.forEach((run, index) => {
    setFont(doc, run.text, options);
    doc.fillColor(color).text(run.text, cursor, y, pdfTextOptions(run.text, { lineBreak:false }));
    cursor += widths[index];
  });
  return cursor;
}

function drawPdfPhrase(doc, value, x, y, options = {}, color = '#000000') {
  const text = String(value ?? '');
  const space = wordWidth(doc, ' ', options);
  if (!text.trim()) return x + text.length * space;
  const leading = text.match(/^\s+/)?.[0].length || 0;
  const trailing = text.match(/\s+$/)?.[0].length || 0;
  const words = reorderRtlWordGroups(text.trim().split(/\s+/).filter(Boolean));
  let cursor = x + leading * space;
  words.forEach((word, index) => {
    cursor = drawPdfToken(doc, word, cursor, y, options, color);
    if (index < words.length - 1) cursor += space;
  });
  return cursor + trailing * space;
}

function wrapMixed(doc, text, { width, size = 10, bold = false, family = 'noto' } = {}) {
  const words = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (!words.length) return [[]];
  const lines = [];
  let line = [];
  let used = 0;
  const space = wordWidth(doc, ' ', { size, bold, family });
  for (const word of words) {
    const w = wordWidth(doc, word, { size: HEBREW_RE.test(word) && family === 'noto' ? size + 1 : size, bold, family });
    const candidate = line.length ? used + space + w : w;
    if (line.length && candidate > width + 0.01) {
      lines.push(line);
      line = [word];
      used = w;
    } else {
      line.push(word);
      used = candidate;
    }
  }
  if (line.length) lines.push(line);
  return lines;
}

function drawMixedLine(doc, words, x, y, { size = 10, bold = false, family = 'noto', color = '#000000' } = {}) {
  let cursor = x;
  const space = wordWidth(doc, ' ', { size, bold, family });
  const visualWords = reorderRtlWordGroups(words);
  visualWords.forEach((word, index) => {
    const tokenSize = HEBREW_RE.test(word) && family === 'noto' ? size + 1 : size;
    cursor = drawPdfToken(doc, word, cursor, y, { size: tokenSize, bold, family }, color);
    if (index < visualWords.length - 1) cursor += space;
  });
  return cursor;
}

function drawMixedParagraph(doc, text, x, y, options = {}) {
  const lines = wrapMixed(doc, text, { ...options, width: options.width });
  const leading = options.leading || (options.size || 10) * 1.45;
  lines.forEach((line, index) => drawMixedLine(doc, line, x, y + index * leading, options));
  return { lines, height: lines.length * leading, bottom: y + lines.length * leading };
}

function drawRunsLine(doc, runs, x, y, size = 10, color = '#000000') {
  let cursor = x;
  for (const run of runs) {
    const family = run.family || 'noto';
    const bold = !!run.bold;
    const tokenSize = HEBREW_RE.test(run.text) && family === 'noto' ? size + 1 : size;
    cursor = drawPdfPhrase(doc, run.text || '', cursor, y, { size: tokenSize, bold, family }, color);
  }
  return cursor;
}

async function writePdf(path, title, fonts, options, render, footer) {
  await mkdir(dirname(path), { recursive: true });
  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: options.size || 'LETTER',
      layout: options.layout,
      margin: 0,
      bufferPages: true,
      info: { Title: title, Author: 'SCP Study' }
    });
    registerFonts(doc, fonts);
    const stream = createWriteStream(path);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.on('error', reject);
    doc.pipe(stream);
    render(doc);
    if (footer) footer(doc);
    doc.end();
  });
}

async function readZmanContent(zmanId = null) {
  const { registry, packages } = await loadZmanAuthoring();
  const resolvedId = String(zmanId || registry.defaultZmanId);
  const pkg = packages.find((candidate) => candidate.id === resolvedId);
  if (!pkg) throw new Error('Could not load Zman ' + resolvedId);
  return {
    id: resolvedId,
    assessmentTitle: pkg.manifest.assessmentTitle,
    questions: pkg.questions,
    essays: pkg.essays,
    glossary: pkg.glossary,
    coverageAudit: pkg.coverageAudit,
  };
}

function addPageFooter(doc, family = 'noto', prefix = 'Page ') {
  const range = doc.bufferedPageRange();
  for (let page = range.start; page < range.start + range.count; page++) {
    doc.switchToPage(page);
    const label = prefix === 'Page ' ? 'Page ' + (page - range.start + 1) : prefix + (page - range.start + 1);
    doc.font(family === 'dejavu' ? 'DejaVu' : 'Noto').fontSize(family === 'dejavu' ? 8.5 : 8).fillColor(family === 'dejavu' ? '#6d7888' : '#000000');
    if (family === 'dejavu') {
      doc.text(label, 49, 764.5, { width: 514, align: 'right', lineBreak: false });
    } else {
      doc.text(label, 0, doc.page.height - 49.5, { width: doc.page.width, align: 'center', lineBreak: false });
    }
  }
}

function drawAssessmentHeading(doc, assessmentTitle, suffix, y, suffixSize) {
  const title = pdfSafeText(assessmentTitle);
  const titleParts = title.split(/(\s+&\s+)/).filter(Boolean);
  const separator = ' - ';
  const titleWidth = titleParts.reduce((total, part) => total + phraseWidth(doc, part, { size:11, family:'noto' }), 0);
  const separatorWidth = phraseWidth(doc, separator, { size:11, family:'noto' });
  const suffixWidth = phraseWidth(doc, suffix, { size:suffixSize, bold:true, family:'noto' });
  let x = (doc.page.width - titleWidth - separatorWidth - suffixWidth) / 2;
  for (const part of titleParts) x = drawPdfPhrase(doc, part, x, y, { size:11, family:'noto' }, '#000000');
  x = drawPdfPhrase(doc, separator, x, y, { size:11, family:'noto' }, '#000000');
  drawPdfPhrase(doc, suffix, x, y, { size:suffixSize, bold:true, family:'noto' }, '#000000');
}

function renderTest(doc, questions, assessmentTitle) {
  const left = 44.75;
  const right = 564;
  const promptWidth = right - left;
  const choicePrefixX = 47.65;
  const choiceTextX = 62.05;
  const choiceWidth = right - choiceTextX;
  const bottom = 730.5;
  let pageNo = 1;
  let y = 121.5;

  const addPage = () => {
    doc.addPage({ size: 'LETTER', margin: 0 });
    pageNo += 1;
    y = 41.8;
  };
  const line = (words, x, size, bold, leading, family = 'noto') => {
    if (y + leading > bottom) addPage();
    drawMixedLine(doc, words, x, y, { size, bold, family, color: '#000000' });
    y += leading;
  };

  drawAssessmentHeading(doc, assessmentTitle, 'Cumulative Test', 41.0, 17);
  doc.font('NotoBold').fontSize(12).fillColor('#000000').text('Student Test', 0, 67.0, { width: 612, align: 'center', lineBreak: false });

  // Instructions use the original two-line measure.
  doc.font('NotoBold').fontSize(10).text('Instructions:', left, 86.0, { lineBreak:false });
  const prefixW = doc.widthOfString('Instructions: ');
  const instruction = 'Choose the best answer for each multiple-choice question. For questions marked “Select all that apply,” choose every correct answer. For True/False questions, mark True or False.';
  const instrLines = wrapMixed(doc, instruction, { width: promptWidth - prefixW, size:10 });
  if (instrLines[0]) drawMixedLine(doc, instrLines[0], left + prefixW, 86.0, { size:10 });
  const firstText = instrLines[0]?.join(' ') || '';
  let remaining = instruction.slice(firstText.length).trim();
  if (remaining) {
    const later = wrapMixed(doc, remaining, { width: promptWidth, size:10 });
    later.forEach((words, idx) => drawMixedLine(doc, words, left, 100.05 + idx * 14.05, { size:10 }));
  }

  for (const q of questions) {
    const promptLines = wrapMixed(doc, q.id + '. ' + q.prompt, { width: promptWidth, size: 10.5, bold: true });
    for (const words of promptLines) line(words, left, 10.5, true, 14.7);
    y += 3.45;

    for (let ci = 0; ci < (q.choices || []).length; ci++) {
      const choice = q.choices[ci];
      const wordsLines = wrapMixed(doc, choice, { width: choiceWidth, size:10 });
      for (let li = 0; li < wordsLines.length; li++) {
        if (y + 15.65 > bottom) addPage();
        if (li === 0) {
          doc.font('Noto').fontSize(10).fillColor('#000000').text(String.fromCharCode(65 + ci) + '.', choicePrefixX, y, { lineBreak:false });
        }
        drawMixedLine(doc, wordsLines[li], choiceTextX, y, { size:10, color:'#000000' });
        y += 15.65;
      }
      y += 1.0;
    }
    y += 5.7;
  }
}

function wrapCell(doc, text, width, size, bold = false) {
  return wrapMixed(doc, String(text ?? ''), { width, size, bold, family:'noto' });
}

function drawTableHeader(doc, y, columns, fill) {
  const x0 = 34.6;
  const total = 722.8;
  const colW = total / columns.length;
  doc.save().fillColor(fill).rect(x0, y, total, 21.4).fill().restore();
  doc.save().strokeColor('#000000').lineWidth(0.5).rect(x0, y, total, 21.4).stroke().restore();
  for (let c = 1; c < columns.length; c++) {
    const x = x0 + c * colW;
    doc.moveTo(x, y).lineTo(x, y + 21.4).strokeColor('#000000').lineWidth(0.5).stroke();
  }
  columns.forEach((label, c) => drawMixedLine(doc, wrapMixed(doc, label, { width: colW - 7.2, size:8.5, bold:true })[0], x0 + c*colW + 3.6, y + 4.0, { size:8.5, bold:true }));
  return { x0, colW, y: y + 21.4 };
}

function drawQuestionKeyTable(doc, questions) {
  const headers = ['#','Answer','Tested highlighted concept','Brief explanation'];
  const x0 = 34.6;
  const total = 722.8;
  const colW = total / 4;
  const inner = colW - 7.2;
  const lineH = 10.2;
  const bottom = 557.2;
  let firstPage = true;
  let y = 75.7;

  const newPage = () => {
    if (!firstPage) doc.addPage({ size: LANDSCAPE, margin:0 });
    firstPage = false;
    y = firstPage ? 75.7 : 34.6;
  };

  const header = () => {
    const res=drawTableHeader(doc, y, headers, '#d9eaf7');
    y=res.y;
  };

  header();
  firstPage = false;

  for (const q of questions) {
    const cells = [
      String(q.id),
      (q.answer || []).join(', '),
      q.testedConcept || q.category || '',
      q.explanation || ''
    ].map((value, i) => wrapCell(doc, value, inner, 7.5, false));
    let offsets=[0,0,0,0];

    while (offsets.some((off,i)=>off<cells[i].length)) {
      const maxRemaining=Math.max(...cells.map((lines,i)=>lines.length-offsets[i]));
      const available=bottom-y;
      const maxLines=Math.floor((available-12.3)/lineH);
      if(maxLines<=0){
        doc.addPage({ size: LANDSCAPE, margin:0 });
        y=34.6;
        header();
        continue;
      }
      const take=Math.min(maxRemaining,maxLines);
      const rowH=take*lineH+12.3;
      doc.moveTo(x0,y).lineTo(x0+total,y).strokeColor('#000000').lineWidth(0.5).stroke();
      for(let c=0;c<=4;c++){
        const x=x0+c*colW;
        doc.moveTo(x,y).lineTo(x,y+rowH).strokeColor('#000000').lineWidth(0.5).stroke();
      }
      for(let c=0;c<4;c++){
        const remaining=cells[c].slice(offsets[c], offsets[c]+take);
        remaining.forEach((words,li)=>drawMixedLine(doc,words,x0+c*colW+3.6,y+3.7+li*lineH,{size:7.5}));
        offsets[c]+=remaining.length;
      }
      y+=rowH;
      doc.moveTo(x0,y).lineTo(x0+total,y).strokeColor('#000000').lineWidth(0.5).stroke();

      if(offsets.some((off,i)=>off<cells[i].length)){
        doc.addPage({ size: LANDSCAPE, margin:0 });
        y=34.6;
        header();
      }
    }
  }
}

function compactQuestionIds(ids) {
  const values = [...ids].map(Number).sort((a, b) => a - b);
  const parts = [];
  for (let index = 0; index < values.length;) {
    let end = index;
    while (end + 1 < values.length && values[end + 1] === values[end] + 1) end += 1;
    parts.push(end > index ? `${values[index]}-${values[end]}` : String(values[index]));
    index = end + 1;
  }
  return parts.join(', ');
}

function drawCoverageAudit(doc, coverageAudit) {
  doc.addPage({ size: LANDSCAPE, margin:0 });
  let y=34.6;
  doc.font('NotoBold').fontSize(13).fillColor('#000000').text('Coverage Audit',34.7,y,{lineBreak:false});
  y=54.8;

  const headers=['Highlighted topic/concept','Question number(s)'];
  const x0=34.6,total=722.8,colW=total/2,inner=colW-7.2,lineH=10.9,bottom=557.2;
  const header=()=>{
    const res=drawTableHeader(doc,y,headers,'#e2f0d9');
    y=res.y;
  };
  header();

  for(const row of coverageAudit.topics){
    const cells=[wrapCell(doc,row.topic,inner,8),wrapCell(doc,compactQuestionIds(row.questions),inner,8)];
    let offsets=[0,0];
    while(offsets.some((off,i)=>off<cells[i].length)){
      const maxRemaining=Math.max(...cells.map((lines,i)=>lines.length-offsets[i]));
      const maxLines=Math.floor(((bottom-y)-7.8)/lineH);
      if(maxLines<=0){
        doc.addPage({size:LANDSCAPE,margin:0}); y=34.6; header(); continue;
      }
      const take=Math.min(maxRemaining,maxLines);
      const rowH=take*lineH+7.8;
      doc.moveTo(x0,y).lineTo(x0+total,y).strokeColor('#000').lineWidth(.5).stroke();
      for(let c=0;c<=2;c++){const x=x0+c*colW;doc.moveTo(x,y).lineTo(x,y+rowH).strokeColor('#000').lineWidth(.5).stroke();}
      for(let c=0;c<2;c++){
        const part=cells[c].slice(offsets[c],offsets[c]+take);
        part.forEach((words,li)=>drawMixedLine(doc,words,x0+c*colW+3.6,y+3.4+li*lineH,{size:8}));
        offsets[c]+=part.length;
      }
      y+=rowH;
      doc.moveTo(x0,y).lineTo(x0+total,y).strokeColor('#000').lineWidth(.5).stroke();
      if(offsets.some((off,i)=>off<cells[i].length)){doc.addPage({size:LANDSCAPE,margin:0});y=34.6;header();}
    }
  }

  if(y+62>bottom){doc.addPage({size:LANDSCAPE,margin:0});y=34.6;}
  y+=10;
  doc.font('NotoBold').fontSize(13).fillColor('#000').text('Scope Check',34.7,y,{lineBreak:false});
  y+=20.2;
  drawMixedParagraph(doc,
    coverageAudit.scopeCheck,
    34.7,y,{width:707.8,size:9,leading:12.4,color:'#000'});
}

function renderAnswerKey(doc, questions, assessmentTitle, coverageAudit) {
  drawAssessmentHeading(doc, assessmentTitle, 'Instructor Key', 34.0, 16);
  doc.font('NotoBold').fontSize(10.5).text('Answer Key, Coverage Audit, and Scope Check',0,58.5,{width:792,align:'center',lineBreak:false});
  drawQuestionKeyTable(doc,questions);
  drawCoverageAudit(doc, coverageAudit);
}

function dejuvuTokenOptions(text,bold,size){
  return {family: HEBREW_RE.test(text) ? 'noto' : 'dejavu', bold, size};
}
function wrapEssay(doc,text,width,size,bold=false){
  const words=String(text??'').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);
  const lines=[];let line=[],used=0;
  const space=wordWidth(doc,' ',{family:'dejavu',bold,size});
  for(const word of words){
    const opts=dejuvuTokenOptions(word,bold,size);
    const tokenSize=HEBREW_RE.test(word)?size+.15:size;
    const w=wordWidth(doc,word,{...opts,size:tokenSize});
    const cand=line.length?used+space+w:w;
    if(line.length&&cand>width){lines.push(line);line=[word];used=w;}else{line.push(word);used=cand;}
  }
  if(line.length)lines.push(line);
  return lines;
}
function drawEssayLine(doc,words,x,y,size,bold,color){
  let cursor=x;
  const space=wordWidth(doc,' ',{family:'dejavu',bold,size});
  const visualWords=reorderRtlWordGroups(words);
  visualWords.forEach((word,index)=>{
    const family=HEBREW_RE.test(word)?'noto':'dejavu';
    const tokenSize=HEBREW_RE.test(word)?size+.15:size;
    cursor=drawPdfToken(doc,word,cursor,y,{family,bold,size:tokenSize},color);
    if(index<visualWords.length-1)cursor+=space;
  });
}
function drawEssayParagraph(doc,text,x,y,width,size,bold,color,leading){
  const lines=wrapEssay(doc,text,width,size,bold);
  lines.forEach((words,i)=>drawEssayLine(doc,words,x,y+i*leading,size,bold,color));
  return {lines,height:lines.length*leading,bottom:y+lines.length*leading};
}

function drawEssayBlock(doc, essay, index, y) {
  const x=49,width=514;
  const titleColor='#173a72', promptColor='#263a59', bodyColor='#34445a', labelColor='#5f6f86';
  doc.font('DejaVuBold').fontSize(8.3).fillColor('#3260a8').text('ESSAY '+(index+1),x,y,{lineBreak:false});
  y+=13.4;
  let r=drawEssayParagraph(doc,essay.title,x,y,width,13.2,true,titleColor,16.45); y=r.bottom+8.5;
  doc.font('DejaVuBold').fontSize(8).fillColor(labelColor).text('QUESTION',x,y,{lineBreak:false}); y+=14.95;
  r=drawEssayParagraph(doc,essay.prompt,x,y,width,10.2,true,promptColor,14.79); y=r.bottom+7.25;
  doc.font('DejaVuBold').fontSize(8).fillColor(labelColor).text('SAMPLE ANSWER',x,y,{lineBreak:false}); y+=14.95;
  r=drawEssayParagraph(doc,essay.modelAnswer,x,y,width,10.2,false,bodyColor,14.79); y=r.bottom;
  return y;
}

function renderEssays(doc, essays) {
  const groups=[[0,1],[2,3,4],[5,6,7],[8,9,10],[11,12,13]];
  const pageFooter=(page)=>'SCP Study | '+page;
  for(let gi=0;gi<groups.length;gi++){
    if(gi>0)doc.addPage({size:'LETTER',margin:0});
    let y;
    if(gi===0){
      const x=49,width=514;
      drawEssayParagraph(doc,'SCP Study - Essay Questions & Sample Answers',x,50.0,width,22,true,'#16376e',26.4);
      doc.font('DejaVu').fontSize(10).fillColor('#5f6f86').text('Review sheet for the essay portion of the course exam',x,108.0,{lineBreak:false});
      doc.moveTo(49,151.8).lineTo(563,151.8).strokeColor('#d9e4f4').lineWidth(1.5).stroke();
      doc.roundedRect(49,165.8,514,46.5,5).fillAndStroke('#f5f8fd','#d9e4f4');
      drawEssayParagraph(doc,
        'These sample answers summarize the course material used by Essay Practice. The goal is to recall the named authorities, their held positions, and the important qualifications quickly and accurately.',
        60.7,176.5,490,9.3,false,'#4b5d75',13.7);
      y=229.5;
    }else{
      y=59.6;
    }
    for(let k=0;k<groups[gi].length;k++){
      const idx=groups[gi][k];
      const bottom=drawEssayBlock(doc,essays[idx],idx,y);
      if(k<groups[gi].length-1){
        const sep=bottom+13.2;
        doc.moveTo(49,sep).lineTo(563,sep).strokeColor('#dde6f2').lineWidth(1).stroke();
        y=sep+28.8;
      }
    }
  }
}

function renderGlossary(doc, glossary) {
  const left = 49;
  const width = 514;
  const bottom = 730;
  let y = 48;

  const addPage = () => {
    doc.addPage({ size:'LETTER', margin:0 });
    y = 48;
  };

  drawMixedParagraph(doc, 'SCP Study - Course Glossary', left, y, {
    width, size:22, bold:true, color:'#16376e', leading:27
  });
  y += 38;
  drawMixedParagraph(doc, 'Key Hebrew and halachic terms used throughout the course.', left, y, {
    width, size:9.5, color:'#5f6f86', leading:14
  });
  y += 30;
  doc.moveTo(left, y).lineTo(left + width, y).strokeColor('#d9e4f4').lineWidth(1.2).stroke();
  y += 18;

  glossary.forEach((entry, index) => {
    const termLines = wrapMixed(doc, entry.term || '', { width:width - 22, size:12, bold:true });
    const pronunciationLines = wrapMixed(doc, entry.pronunciation || '', { width:width - 22, size:8.4 });
    const definitionLines = wrapMixed(doc, entry.definition || '', { width:width - 22, size:9.2 });
    const height = Math.max(70,
      11 + termLines.length * 17 + pronunciationLines.length * 12 + definitionLines.length * 13.5 + 15
    );
    if (y + height > bottom) addPage();

    doc.roundedRect(left, y, width, height - 7, 6).fillAndStroke(index % 2 ? '#fbfcfe' : '#f7faff', '#dce6f2');
    let cy = y + 10;
    termLines.forEach((line, lineIndex) => {
      drawMixedLine(doc, line, left + 11, cy + lineIndex * 17, { size:12, bold:true, color:'#173d84' });
    });
    cy += termLines.length * 17 + 1;
    pronunciationLines.forEach((line, lineIndex) => {
      drawMixedLine(doc, line, left + 11, cy + lineIndex * 12, { size:8.4, color:'#66758b' });
    });
    cy += pronunciationLines.length * 12 + 4;
    definitionLines.forEach((line, lineIndex) => {
      drawMixedLine(doc, line, left + 11, cy + lineIndex * 13.5, { size:9.2, color:'#33425b' });
    });
    y += height;
  });
}

export async function generatePdfs(outputDir = join(ROOT, 'public'), zmanId = null, configuredDocuments = null) {
  const [fonts, content] = await Promise.all([loadFonts(), readZmanContent(zmanId)]);
  const { assessmentTitle, questions, essays, glossary, coverageAudit } = content;
  const documents = join(outputDir, 'documents');
  await mkdir(documents, { recursive:true });
  const files = configuredDocuments || {
    cumulativeTest: 'SCP-Study-Cumulative-Test.pdf',
    cumulativeAnswerKey: 'SCP-Study-Cumulative-Test-Answer-Key.pdf',
    essayQuestionsAndAnswers: 'SCP-Study-Essay-Questions-and-Sample-Answers.pdf',
    glossary: 'SCP-Study-Course-Glossary.pdf',
  };

  await writePdf(join(documents,files.cumulativeTest),`${assessmentTitle} - Cumulative Test`,fonts,{size:'LETTER'},doc=>renderTest(doc,questions,assessmentTitle),doc=>addPageFooter(doc,'noto','Page '));
  await writePdf(join(documents,files.cumulativeAnswerKey),`${assessmentTitle} - Cumulative Test Answer Key`,fonts,{size:LANDSCAPE},doc=>renderAnswerKey(doc,questions,assessmentTitle,coverageAudit),doc=>addPageFooter(doc,'noto','Page '));
  await writePdf(join(documents,files.essayQuestionsAndAnswers),'SCP Study - Essay Questions & Sample Answers',fonts,{size:'LETTER'},doc=>renderEssays(doc,essays),doc=>addPageFooter(doc,'dejavu','SCP Study | '));
  await writePdf(join(documents,files.glossary),'SCP Study - Course Glossary',fonts,{size:'LETTER'},doc=>renderGlossary(doc,glossary),doc=>addPageFooter(doc,'noto','Page '));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generatePdfs(process.argv[2] || join(ROOT, 'public'));
  console.log('Generated SCP Study question, answer-key, essay, and glossary PDF assets.');
}
