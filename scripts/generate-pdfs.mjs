import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const HERE=dirname(fileURLToPath(import.meta.url));
const ROOT=dirname(HERE);
const require=createRequire(import.meta.url);
const HEBREW=/[\u0590-\u05ff]/;
const MARGIN=48;

async function findFont(pkg,subset,weight){
  const root=dirname(require.resolve(pkg+'/package.json'));
  const dir=join(root,'files');
  const names=await readdir(dir);
  const stem=subset+'-'+weight+'-normal';
  const name=names.find(n=>n.endsWith(stem+'.woff'))||names.find(n=>n.endsWith(stem+'.woff2'));
  if(!name)throw new Error('Missing font '+pkg+' '+stem);
  return join(dir,name);
}
async function loadFonts(){
  return {
    latin:await findFont('@fontsource/noto-sans','latin',400),
    latinBold:await findFont('@fontsource/noto-sans','latin',700),
    hebrew:await findFont('@fontsource/noto-sans-hebrew','hebrew',400),
    hebrewBold:await findFont('@fontsource/noto-sans-hebrew','hebrew',700)
  };
}
function visualToken(raw){return HEBREW.test(raw)?Array.from(raw).reverse().join(''):raw}
function fontName(raw,bold){return HEBREW.test(raw)?(bold?'HebrewBold':'Hebrew'):(bold?'LatinBold':'Latin')}
function register(doc,f){
  doc.registerFont('Latin',f.latin);doc.registerFont('LatinBold',f.latinBold);
  doc.registerFont('Hebrew',f.hebrew);doc.registerFont('HebrewBold',f.hebrewBold);
}
function ensureRoom(doc,height=18){if(doc.y+height>doc.page.height-54){doc.addPage();doc.y=MARGIN}}
function drawWords(doc,f,value,options={}){
  const size=Number(options.size)||10,bold=!!options.bold,indent=Number(options.indent)||0;
  const gap=options.gap==null?5:Number(options.gap),lineHeight=Number(options.lineHeight)||size*1.35;
  const left=MARGIN+indent,right=doc.page.width-MARGIN;
  const list=String(value??'').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);
  if(!list.length){doc.y+=gap||3;return}
  let x=left,y=doc.y;ensureRoom(doc,lineHeight);y=doc.y;
  doc.font('Latin').fontSize(size);const space=doc.widthOfString(' ')||size*.28;
  for(const raw of list){
    const token=visualToken(raw);doc.font(fontName(raw,bold)).fontSize(size);const width=doc.widthOfString(token);
    if(x>left&&x+width>right){y+=lineHeight;doc.y=y;ensureRoom(doc,lineHeight);y=doc.y;x=left}
    doc.fillColor(options.color||'#17213b').text(token,x,y,{lineBreak:false});x+=width+space;
  }
  doc.y=y+lineHeight+gap;
}
function heading(doc,f,text,size=16){ensureRoom(doc,size*2.2);drawWords(doc,f,text,{size,bold:true,gap:7,lineHeight:size*1.25,color:'#14265c'})}
function label(doc,f,text){drawWords(doc,f,text,{size:9,bold:true,gap:3,color:'#3156a3'})}
function numberPages(doc){
  const range=doc.bufferedPageRange();
  for(let i=range.start;i<range.start+range.count;i++){
    doc.switchToPage(i);doc.font('Latin').fontSize(7.5).fillColor('#7a8497')
      .text('SCP Study  |  '+(i-range.start+1),MARGIN,doc.page.height-35,{width:doc.page.width-MARGIN*2,align:'center',lineBreak:false});
  }
}
async function writePdf(path,title,f,render){
  await mkdir(dirname(path),{recursive:true});
  await new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:'LETTER',margins:{top:MARGIN,bottom:54,left:MARGIN,right:MARGIN},bufferPages:true,info:{Title:title,Author:'SCP Study'}});
    register(doc,f);const out=createWriteStream(path);out.on('finish',resolve);out.on('error',reject);doc.on('error',reject);doc.pipe(out);
    doc.y=MARGIN;render(doc);numberPages(doc);doc.end();
  });
}
async function readQuestions(){
  const source=await readFile(join(ROOT,'public-src','questions.js'),'utf8');const box={};
  runInNewContext(source+'\n;globalThis.__QUESTIONS=QUESTIONS;',box);
  if(!Array.isArray(box.__QUESTIONS))throw new Error('Could not load question bank');return box.__QUESTIONS;
}
async function readEssays(){
  const source=await readFile(join(ROOT,'public-src','essay-practice.js'),'utf8');const box={window:{}};
  runInNewContext(source,box);const essays=box.window.ESSAY_PRACTICE_DATA;
  if(!Array.isArray(essays))throw new Error('Could not load essay bank');return essays;
}
function essayName(fact){return fact?.tokens?.[0]?.[1]||fact?.label||''}
function essayPosition(fact){return fact?.tokens?.[1]?.[1]||''}

function renderTest(doc,f,questions){
  heading(doc,f,'SCP Study - Cumulative Test',20);
  drawWords(doc,f,'58 questions. Choose the best answer unless the question says Select all that apply.',{size:10,gap:12});
  questions.forEach(q=>{
    ensureRoom(doc,78);label(doc,f,'Question '+q.id+'  |  '+q.category);drawWords(doc,f,q.prompt,{size:10.4,bold:true,gap:4});
    (q.choices||[]).forEach((choice,i)=>drawWords(doc,f,String.fromCharCode(65+i)+'. '+choice,{size:9.2,indent:12,gap:2,lineHeight:11.6}));
    doc.y+=5;
  });
}
function renderKey(doc,f,questions){
  heading(doc,f,'SCP Study - Cumulative Test Answer Key',20);
  drawWords(doc,f,'Answer key generated from the same source-controlled question bank used by the app.',{size:10,gap:12});
  const counts=new Map();questions.forEach(q=>counts.set(q.category,(counts.get(q.category)||0)+1));label(doc,f,'Coverage by topic');
  for(const [category,count] of counts)drawWords(doc,f,category+': '+count+' question'+(count===1?'':'s'),{size:9,indent:10,gap:1.5});
  doc.y+=8;
  questions.forEach(q=>{
    ensureRoom(doc,62);label(doc,f,'Question '+q.id+'  |  Answer: '+(q.answer||[]).join(', '));drawWords(doc,f,q.prompt,{size:9.8,bold:true,gap:3});
    if(q.explanation)drawWords(doc,f,q.explanation,{size:8.8,indent:10,gap:8,lineHeight:11.3});
  });
}
function renderEssays(doc,f,essays){
  heading(doc,f,'SCP Study - Essay Questions & Sample Answers',20);
  drawWords(doc,f,'Essay prompts, required name/concept-to-position pairings, and model answers generated from the app essay bank.',{size:10,gap:12});
  essays.forEach((essay,index)=>{
    if(index){doc.addPage();doc.y=MARGIN}
    heading(doc,f,'Essay '+(index+1)+': '+essay.title,15);label(doc,f,'Prompt');drawWords(doc,f,essay.prompt,{size:10,gap:9});label(doc,f,'Required pairings');
    (essay.facts||[]).forEach(fact=>drawWords(doc,f,essayName(fact)+' -> '+essayPosition(fact),{size:8.8,indent:10,gap:2,lineHeight:11.2}));
    doc.y+=5;label(doc,f,'Sample answer');drawWords(doc,f,essay.modelAnswer,{size:9.4,gap:6,lineHeight:12.2});
  });
}
export async function generatePdfs(outputDir=join(ROOT,'public')){
  const [f,questions,essays]=await Promise.all([loadFonts(),readQuestions(),readEssays()]);
  const documents=join(outputDir,'documents');await mkdir(documents,{recursive:true});
  await writePdf(join(documents,'SCP-Study-Cumulative-Test.pdf'),'SCP Study - Cumulative Test',f,doc=>renderTest(doc,f,questions));
  await writePdf(join(documents,'SCP-Study-Cumulative-Test-Answer-Key.pdf'),'SCP Study - Cumulative Test Answer Key',f,doc=>renderKey(doc,f,questions));
  await writePdf(join(documents,'SCP-Study-Essay-Questions-and-Sample-Answers.pdf'),'SCP Study - Essay Questions & Sample Answers',f,doc=>renderEssays(doc,f,essays));
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  await generatePdfs(process.argv[2]||join(ROOT,'public'));
  console.log('Generated SCP Study PDF assets.');
}
