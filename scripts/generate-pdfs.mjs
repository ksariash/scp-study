import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const require = createRequire(import.meta.url);
const HEBREW_RE = /[\u0590-\u05ff]/;
const PDF_CONTROL_RE = /[\u0000\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
function pdfSafeText(value) {
  return String(value ?? '').replace(PDF_CONTROL_RE, '');
}
function pdfTextOptions(value, base = {}) {
  return HEBREW_RE.test(String(value || '')) ? { ...base, features: [] } : base;
}
const LETTER = [612, 792];
const LANDSCAPE = [792, 612];

const QUESTION_CONCEPTS = {"1":"Core נ״ט בר נ״ט; Shmuel; Tosfos; limit of the leniency","2":"Ben-yomo food already cooked; S”A/Rama; before vs. after mixing","3":"Eino-ben-yomo food already made","4":"Deliberately creating נ״ט בר נ״ט in a ben-yomo vessel","5":"Deliberate use of an eino-ben-yomo opposite pot","6":"Dry solid on opposite plate; two weakened tastes","7":"Food → food → vessel dispute","8":"Ongoing cooking connection","9":"דבר חריף; ben-yomo/eino-ben-yomo","10":"Direct hot-pot-lid contact vs. foil","11":"Sous-vide sequential use","12":"Canned vegetables; inherently forbidden taste","13":"Fish/meat in one oven; ריחא","14":"Separation between fish and meat","15":"Fish and meat at one table","16":"Fish cooked in chicken soup","17":"Bitul of a fish/meat סכנה mixture with ששים","18":"No ששים; possible tzirufim","19":"Simultaneous clean ben-yomo meat/dairy vessels in hot water","20":"One vessel eino-ben-yomo","21":"Sequential ben-yomo vessels","22":"Opposite ben-yomo ladle in parve soup","23":"Dirty opposite dishes in כלי שני","24":"עירוי כלי ראשון","25":"Continuous hot liquid stream into cold opposite bowl","26":"Hot solid removed from a vessel","27":"Clogged sink","28":"Hot faucet/pipes","29":"Opposite spoon found later","30":"פגום agent and timing","31":"Dishwasher analysis","32":"Accidental opposite fork in dishwasher","33":"Coffee-shop application","34":"Milk beside salt intended for meat","35":"Baseline status of יין נסך, סתם יינם, מגע עכו״ם","36":"Beit Yosef, Ran, Rashba - reason for benefit prohibition","37":"Modern benefit: Rashi/Geonim, Rosh, Rambam","38":"Benefit applications; S”A/Rama","39":"Proceeds/change from prohibited wine","40":"Illness and סתם יינם","41":"Life danger and יין נסך","42":"מבושל before touch vs. after prohibition","43":"Non-Jew-owned kosher mevushal wine","44":"Changed wine identity vs. distinct wine component","45":"Sherry-cask quantity/bitul","46":"Sherry-cask flavor reasoning","47":"Sherry color; אין מבטלין איסור לכתחילה","48":"Before המשכה","49":"Brandy and grappa","50":"Beer and the non-Jewish-establishment decree","51":"Business drink in a non-Jewish bar","52":"Muslim, Shabbat desecrator, hostile violator, benefit","53":"Four conditions for full touch prohibition","54":"Pouring vs. shaking an open bottle","55":"Practical wine-contact cases","56":"נצוק; great loss; מבושל","57":"Unattended wine: idolater, Muslim, fixed schedule","58":"יוצא ונכנס; open vs. closed; protective measures"};
const COVERAGE_AUDIT = [["Core נ״ט בר נ״ט rule; Shmuel/Tosfos; limits of the leniency","1, 6, 12"],["Ben-yomo food already made; S”A/Rama; before vs. after mixing","2"],["Eino-ben-yomo food already made","3"],["Deliberately cooking in a ben-yomo vessel for the opposite type","4"],["Deliberate use of an eino-ben-yomo opposite vessel; Ashkenazic dispute","5"],["Dry solid on opposite plate; Rav Moshe/Pri Megadim; two weak tastes","6"],["Food → food → vessel","7"],["Transfer during an ongoing cooking connection","8, 10"],["דבר חריף","9"],["Direct pot-lid contact vs. foil","10"],["Sous-vide","11"],["Canned vegetables/shared processing water","12"],["Fish and meat in one oven; ריחא","13"],["Separation between fish and meat","14"],["Fish and meat at the same table","15"],["Fish cooked in meat soup; rinsing","16"],["Fish/meat mixture with ששים","17"],["Accidental fish/meat mixture without ששים; tzirufim","18"],["Simultaneous clean ben-yomo vessels in hot water","19"],["One vessel eino-ben-yomo","20"],["Sequential ben-yomo vessels","21"],["Opposite ben-yomo ladle","22"],["Dirty opposite dishes in כלי שני","23"],["עירוי כלי ראשון","24"],["Continuous liquid stream vs. removed hot solid","25-26"],["Clogged sink; faucet pipes; spoon found later","27-29"],["Ash/פגום timing","30"],["Dishwasher framework and outcome-changing factors","31"],["Accidental opposite fork in dishwasher","32"],["Coffee-shop washing-system application","33"],["Open milk beside salt intended for meat","34"],["יין נסך / סתם יינם / מגע עכו״ם baseline categories","35"],["Reasons for the benefit prohibition: Beit Yosef/Ran/Rashba","36"],["Benefit today: Rashi/Geonim, Rosh, Rambam","37"],["S”A/Rama framework for benefit applications","38"],["Cash change/proceeds at a wine store","39"],["Illness and סתם יינם","40"],["Life danger and יין נסך","41"],["מבושל before touch vs. cooking after prohibition","42"],["Non-Jew-owned kosher mevushal wine","43"],["Wine mixed/frozen vs. wine remaining distinct","44"],["Sherry-cask quantity","45"],["Sherry-cask flavor reasoning","46"],["Sherry color and אין מבטלין איסור לכתחילה","47"],["Wine before המשכה","48"],["Brandy and grappa","49"],["Social beer/non-Jewish establishment","50"],["Business drink; איבה","51"],["Muslim/nonreligious/hostile toucher distinctions","52"],["Four conditions for full wine-touch prohibition","53"],["Pouring, shaking, accidental contact, closed bottle, clinking","54-55"],["נצוק; great loss; מבושל source","56"],["Unattended wine: idolater vs. Muslim; known schedule","57"],["יוצא ונכנס; open vs. closed wine; seals/monitoring/screw cap","58"]];

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

function wordWidth(doc, word, options = {}) {
  const safe = pdfSafeText(word);
  setFont(doc, safe, options);
  return doc.widthOfString(safe, pdfTextOptions(safe));
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
  for (const word of words) {
    const tokenSize = HEBREW_RE.test(word) && family === 'noto' ? size + 1 : size;
    setFont(doc, word, { size: tokenSize, bold, family });
    const safeWord = pdfSafeText(word);
    doc.fillColor(color).text(safeWord, cursor, y, pdfTextOptions(safeWord, { lineBreak: false }));
    cursor += doc.widthOfString(safeWord, pdfTextOptions(safeWord)) + space;
  }
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
    const words = String(run.text || '').split(/(\s+)/).filter(Boolean);
    for (const word of words) {
      if (/^\s+$/.test(word)) {
        cursor += wordWidth(doc, ' ', { size, bold, family }) * word.length;
        continue;
      }
      const tokenSize = HEBREW_RE.test(word) && family === 'noto' ? size + 1 : size;
      setFont(doc, word, { size: tokenSize, bold, family });
      const safeWord = pdfSafeText(word);
      doc.fillColor(color).text(safeWord, cursor, y, pdfTextOptions(safeWord, { lineBreak: false }));
      cursor += doc.widthOfString(safeWord, pdfTextOptions(safeWord));
    }
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

async function readQuestions() {
  const source = await readFile(join(ROOT, 'public-src', 'questions.js'), 'utf8');
  const sandbox = {};
  runInNewContext(source + '\n;globalThis.__QUESTIONS = QUESTIONS;', sandbox);
  if (!Array.isArray(sandbox.__QUESTIONS)) throw new Error('Could not load question bank');
  return sandbox.__QUESTIONS;
}

async function readEssays() {
  const source = await readFile(join(ROOT, 'public-src', 'essay-practice.js'), 'utf8');
  const sandbox = { window: {} };
  runInNewContext(source, sandbox);
  if (!Array.isArray(sandbox.window.ESSAY_PRACTICE_DATA)) throw new Error('Could not load essay bank');
  return sandbox.window.ESSAY_PRACTICE_DATA;
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

function renderTest(doc, questions) {
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

  // Title.
  const titleRuns = [
    { text: 'סתם יינם', family: 'noto' },
    { text: ' & ', family: 'noto' },
    { text: 'נ״ט בר נ״ט', family: 'noto' },
    { text: ' - Cumulative Test', family: 'noto', bold: true }
  ];
  const widths = titleRuns.map(run => {
    const tokenSize = HEBREW_RE.test(run.text) ? 11 : (run.bold ? 17 : 11);
    setFont(doc, run.text, { size: tokenSize, bold: run.bold, family: 'noto' });
    return doc.widthOfString(run.text);
  });
  const titleWidth = widths.reduce((a,b) => a+b, 0);
  let tx = (612 - titleWidth) / 2;
  titleRuns.forEach((run, idx) => {
    const tokenSize = HEBREW_RE.test(run.text) ? 11 : (run.bold ? 17 : 11);
    setFont(doc, run.text, { size: tokenSize, bold: run.bold, family: 'noto' });
    doc.fillColor('#000000').text(run.text, tx, 41.0, { lineBreak: false });
    tx += widths[idx];
  });
  doc.font('NotoBold').fontSize(12).fillColor('#000000').text('Student Test', 0, 67.0, { width: 612, align: 'center', lineBreak: false });

  // Instructions use the original two-line measure.
  doc.font('NotoBold').fontSize(10).text('Instructions:', left, 86.0, { lineBreak:false });
  const prefixW = doc.widthOfString('Instructions: ');
  const instruction = 'Choose the best answer for each multiple-choice question. For questions marked “Select all that apply,” choose every correct answer. For True/False questions, mark True or False.';
  const instrLines = wrapMixed(doc, instruction, { width: promptWidth - prefixW, size:10 });
  if (instrLines[0]) drawMixedLine(doc, instrLines[0], left + prefixW, 86.0, { size:10 });
  const consumed = instrLines[0]?.join(' ').length || 0;
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
      QUESTION_CONCEPTS[q.id] || q.category || '',
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

function drawCoverageAudit(doc) {
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

  for(const row of COVERAGE_AUDIT){
    const cells=[wrapCell(doc,row[0],inner,8),wrapCell(doc,row[1],inner,8)];
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
    'None. After question-by-question review, no test question relies on an unhighlighted rule, exception, authority, qualification, factual distinction, or practical application from the full notes. The highlighted compact review is the closed universe of testable knowledge; the full notes were used only for verification and clarification.',
    34.7,y,{width:707.8,size:9,leading:12.4,color:'#000'});
}

function renderAnswerKey(doc, questions) {
  // First-page title.
  const runs=[
    {text:'סתם יינם',family:'noto'},
    {text:' & ',family:'noto'},
    {text:'נ״ט בר נ״ט',family:'noto'},
    {text:' - Instructor Key',family:'noto',bold:true}
  ];
  const widths=runs.map(run=>{
    const size=HEBREW_RE.test(run.text)?11:(run.bold?16:11);
    setFont(doc,run.text,{size,bold:run.bold});return doc.widthOfString(run.text);
  });
  let x=(792-widths.reduce((a,b)=>a+b,0))/2;
  runs.forEach((run,i)=>{const size=HEBREW_RE.test(run.text)?11:(run.bold?16:11);setFont(doc,run.text,{size,bold:run.bold});doc.fillColor('#000').text(run.text,x,34.0,{lineBreak:false});x+=widths[i];});
  doc.font('NotoBold').fontSize(10.5).text('Answer Key, Coverage Audit, and Scope Check',0,58.5,{width:792,align:'center',lineBreak:false});
  drawQuestionKeyTable(doc,questions);
  drawCoverageAudit(doc);
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
  for(const word of words){
    const family=HEBREW_RE.test(word)?'noto':'dejavu';
    const tokenSize=HEBREW_RE.test(word)?size+.15:size;
    setFont(doc,word,{family,bold,size:tokenSize});
    const safeWord=pdfSafeText(word);
    doc.fillColor(color).text(safeWord,cursor,y,pdfTextOptions(safeWord,{lineBreak:false}));
    cursor+=doc.widthOfString(safeWord,pdfTextOptions(safeWord))+space;
  }
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

export async function generatePdfs(outputDir = join(ROOT, 'public')) {
  const [fonts, questions, essays] = await Promise.all([loadFonts(), readQuestions(), readEssays()]);
  const documents = join(outputDir, 'documents');
  await mkdir(documents, { recursive:true });

  await writePdf(join(documents,'SCP-Study-Cumulative-Test.pdf'),'SCP Study - Cumulative Test',fonts,{size:'LETTER'},doc=>renderTest(doc,questions),doc=>addPageFooter(doc,'noto','Page '));
  await writePdf(join(documents,'SCP-Study-Cumulative-Test-Answer-Key.pdf'),'SCP Study - Cumulative Test Answer Key',fonts,{size:LANDSCAPE},doc=>renderAnswerKey(doc,questions),doc=>addPageFooter(doc,'noto','Page '));
  await writePdf(join(documents,'SCP-Study-Essay-Questions-and-Sample-Answers.pdf'),'SCP Study - Essay Questions & Sample Answers',fonts,{size:'LETTER'},doc=>renderEssays(doc,essays),doc=>addPageFooter(doc,'dejavu','SCP Study | '));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generatePdfs(process.argv[2] || join(ROOT, 'public'));
  console.log('Generated SCP Study question, answer-key, and essay PDF assets.');
}
