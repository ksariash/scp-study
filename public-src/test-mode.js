(() => {
  'use strict';
  const el=id=>document.getElementById(id), Q=typeof QUESTIONS!=='undefined'&&Array.isArray(QUESTIONS)?QUESTIONS:[], E=Array.isArray(window.ESSAY_PRACTICE_DATA)?window.ESSAY_PRACTICE_DATA:[];
  const zman=window.SCP_ZMAN_CONFIG||window.SCP_COHORT_CONFIG||window.SCP_ACTIVE_ZMAN||window.SCP_ACTIVE_COHORT||{}, zid=String(zman.id||'default'), analyticsZman=String(zman.analyticsKey||zid);
  const MAIN='courseReviewSpacedRepetition.v1', SUP=`scpStudy.testSupplement.v2:${zid}`, PENDING=`scpStudy.pendingCombinedTestResult.v2:${zid}`, RESP=`scpStudy.testEssayResponses.v1:${zid}`, SYNC='scpStudy.sync.v1', SYNCQ='scpStudy.syncQueue.v1', DURATION=3*60*60*1000;
  const qMap=new Map(Q.map(q=>[Number(q.id),q])), eMap=new Map(E.map(e=>[String(e.id),e]));
  const json=(s,f=null)=>{try{return JSON.parse(s)}catch{return f}}, uid=()=>crypto?.randomUUID?.()||`t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  function stored(){
    const raw=json(localStorage.getItem(MAIN),null); if(!raw)return {env:{scopeVersion:1,cohorts:{}},state:null};
    if(raw.scopeVersion===1&&raw.cohorts&&typeof raw.cohorts==='object'){
      let state=raw.cohorts[zid]||null; if(!state&&Array.isArray(zman.legacyIds))for(const id of zman.legacyIds){if(raw.cohorts[id]){state=raw.cohorts[id];break}}
      return {env:raw,state};
    }
    return {env:{scopeVersion:1,cohorts:{[zid]:raw}},state:raw};
  }
  function read(){return stored().state}
  function write(state){const {env}=stored();env.scopeVersion=1;env.cohorts||={};env.cohorts[zid]=state;localStorage.setItem(MAIN,JSON.stringify(env))}
  function readSup(){const x=json(localStorage.getItem(SUP),null);return x&&typeof x==='object'?x:null}
  function saveSup(x){localStorage.setItem(SUP,JSON.stringify(x))}
  function baseSup(test){return {v:2,testId:String(test.id),phase:'questions',flags:[],essayOrder:E.map(e=>String(e.id)),essayIndex:0,essayResponses:{}}}
  function normSup(test){
    let s=readSup(); if(!s||String(s.testId)!==String(test.id))s=baseSup(test);
    s.phase=s.phase==='essays'?'essays':'questions'; s.flags=[...new Set((s.flags||[]).map(Number).filter(id=>qMap.has(id)))];
    const ids=E.map(e=>String(e.id)), order=Array.isArray(s.essayOrder)?s.essayOrder.map(String).filter(id=>eMap.has(id)):[]; s.essayOrder=order.length===ids.length&&ids.every(id=>order.includes(id))?order:ids;
    s.essayIndex=Math.min(Math.max(0,Number(s.essayIndex)||0),Math.max(0,s.essayOrder.length-1)); s.essayResponses=s.essayResponses&&typeof s.essayResponses==='object'?s.essayResponses:{}; saveSup(s); return s;
  }
  function active(){
    const state=read(),test=state?.activeTest;if(!test?.id){document.body.classList.remove('ui-test-active','ui-test-essays');return null}
    const end=(Number(test.startedAt)||Date.now())+DURATION;if(!Number(test.endTime)||Number(test.endTime)<end){test.endTime=end;write(state)}
    const sup=normSup(test);document.body.classList.add('ui-test-active');document.body.classList.toggle('ui-test-essays',sup.phase==='essays');return {state,test,sup};
  }
  function copy(){
    const d=el('categoriesDialogDescription');if(d&&!document.body.classList.contains('essay-mode-active'))d.textContent='Choose which categories may be selected in Question study. The practice test always uses the full question bank.';
    const intro=el('testIntroDialog');if(!intro)return;const p=intro.querySelector('.modal-head p'),c=intro.querySelector('.callout p');
    if(p)p.textContent=`All ${Q.length} questions plus ${E.length} essay${E.length===1?'':'s'}, with one 3-hour countdown. Multiple-choice timing and results continue to feed study scheduling.`;
    if(c)c.textContent=`Question answers are locked and graded when submitted. After all ${Q.length} questions, continue to the essay section and write your responses without study aids. The test ends when you finish the essays, exit, or the timer reaches zero.`;
    if(el('startTestBtn'))el('startTestBtn').textContent='Start 3-hour test';
  }
  function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function start(ev){
    ev?.preventDefault();ev?.stopImmediatePropagation();if(!Q.length)return;const state=read()||{version:75,stats:{},filters:[],study:{history:[],index:-1,sessionElapsedMs:0},tests:[]},now=Date.now(),order=shuffle(Q.map(q=>Number(q.id))),items={};
    order.forEach(id=>items[id]={viewed:false,selected:[],answered:false,result:null,credit:0,elapsedMs:0,studyAidUsed:false});state.activeTest={id:`test-${now}`,order,index:0,startedAt:now,endTime:now+DURATION,items};state.tests=Array.isArray(state.tests)?state.tests:[];write(state);saveSup(baseSup(state.activeTest));location.reload();
  }
  function currentId(test){const id=Number(el('questionNumber')?.value);return qMap.has(id)?id:Number(test.order?.[Number(test.index)||0])}
  function followButton(){
    const host=document.querySelector('.question-top-actions');if(!host)return null;let b=el('testFollowUpBtn');if(b)return b;
    b=document.createElement('button');b.id='testFollowUpBtn';b.type='button';b.className='test-followup-btn hidden';b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h10v15l-5-3-5 3z"/></svg>';host.insertBefore(b,host.firstChild);
    b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();const a=active();if(!a||a.sup.phase!=='questions')return;const id=currentId(a.test),set=new Set(a.sup.flags);set.has(id)?set.delete(id):set.add(id);a.sup.flags=[...set];saveSup(a.sup);decorate(a)});return b;
  }
  function status(test,s,id){const item=test.items?.[id]||test.items?.[String(id)]||{};return {answered:!!item.answered,flagged:s.flags.includes(Number(id))}}
  function decorate(a=active()){
    if(!a||a.sup.phase!=='questions')return;const id=currentId(a.test),st=status(a.test,a.sup,id),b=followButton();
    if(b){b.classList.remove('hidden');b.classList.toggle('active',st.flagged);b.setAttribute('aria-pressed',st.flagged?'true':'false');b.setAttribute('aria-label',st.flagged?'Remove follow-up marker':'Mark question for follow-up');b.title=st.flagged?'Remove follow-up marker':'Mark for follow-up'}
    const select=el('questionNumber');if(select)[...select.options].forEach(o=>{const n=Number(o.value),x=status(a.test,a.sup,n);o.textContent=`${x.flagged?'★ ':''}${x.answered?'✓':'○'} Question ${n}`});
    el('questionNumberMenu')?.querySelectorAll('[data-question-number]').forEach(btn=>{const n=Number(btn.dataset.questionNumber),x=status(a.test,a.sup,n);btn.classList.toggle('test-answered',x.answered);btn.classList.toggle('test-unanswered',!x.answered);btn.classList.toggle('test-flagged',x.flagged);btn.textContent=`${x.flagged?'★':''}${x.answered?'✓':'○'} ${n}`;btn.setAttribute('aria-label',`Question ${n}, ${x.answered?'answered':'unanswered'}${x.flagged?', marked for follow-up':''}`)});
    const trigger=el('questionNumberTrigger');if(trigger){trigger.textContent=`Question ${id}${st.flagged?' ★':st.answered?' ✓':''}`;trigger.setAttribute('aria-label',`Question ${id}, ${st.answered?'answered':'unanswered'}${st.flagged?', marked for follow-up':''}. Choose another question.`)}
    const answered=a.test.order.filter(q=>a.test.items?.[q]?.answered).length;if(answered===a.test.order.length&&a.sup.essayOrder.length&&el('nextBtn'))el('nextBtn').textContent='Continue to essays →';
  }
  const allAnswered=t=>!!t.order?.length&&t.order.every(id=>t.items?.[id]?.answered);
  function toEssays(){const a=active();if(!a||!allAnswered(a.test)||!a.sup.essayOrder.length)return false;a.sup.phase='essays';saveSup(a.sup);renderEssay(a);scrollTo({top:0,behavior:'auto'});return true}
  function essayHost(){const host=el('essayPracticeMain');if(!host)return null;let s=host.querySelector('.test-essay-surface');if(!s){s=document.createElement('section');s.className='test-essay-surface';host.append(s)}return s}
  const response=(s,id)=>String(s.essayResponses?.[String(id)]||''), essayAnswered=s=>s.essayOrder.filter(id=>response(s,id).trim()).length;
  function progress(a){const total=a.sup.essayOrder.length,done=essayAnswered(a.sup);if(el('testQuestionCount'))el('testQuestionCount').textContent=`Essay ${a.sup.essayIndex+1}/${total}`;if(el('testAnsweredCount'))el('testAnsweredCount').textContent=`${done}/${total} essays answered`;if(el('testProgressFill'))el('testProgressFill').style.width=`${((a.test.order.length+a.sup.essayIndex+1)/(a.test.order.length+total))*100}%`}
  function renderEssay(a=active()){
    if(!a||a.sup.phase!=='essays')return;document.body.classList.add('ui-test-active','ui-test-essays');el('questionCard')?.classList.add('ui-test-section-hidden');el('saveNote')?.classList.add('ui-test-section-hidden');el('essayPracticeMain')?.classList.remove('hidden');followButton()?.classList.add('hidden');
    const host=essayHost(),ids=a.sup.essayOrder;if(!host||!ids.length){finish('completed');return}const essay=eMap.get(ids[a.sup.essayIndex]);if(!essay)return;const renderKey=`${a.test.id}:${a.sup.essayIndex}`;if(host.dataset.testEssayKey===renderKey){progress(a);return}host.dataset.testEssayKey=renderKey;host.innerHTML='';
    const h=document.createElement('header');h.className='test-essay-head';const eye=document.createElement('span');eye.className='eyebrow';eye.textContent=`Essay ${a.sup.essayIndex+1} of ${ids.length}`;const title=document.createElement('h2');title.textContent=essay.title||'Essay';const prompt=document.createElement('p');prompt.className='test-essay-prompt';prompt.textContent=essay.prompt||'';h.append(eye,title,prompt);
    const label=document.createElement('label');label.className='test-essay-response-field';const cap=document.createElement('span');cap.textContent='Your answer';const ta=document.createElement('textarea');ta.rows=12;ta.maxLength=12000;ta.placeholder='Write your essay response here…';ta.value=response(a.sup,essay.id);const count=document.createElement('small');count.className='test-essay-word-count';const wc=()=>{const n=ta.value.trim()?ta.value.trim().split(/\s+/).length:0;count.textContent=`${n} word${n===1?'':'s'} · saved automatically`};wc();ta.addEventListener('input',()=>{const cur=active();if(!cur)return;cur.sup.essayResponses[String(essay.id)]=ta.value;saveSup(cur.sup);wc();progress(cur)});label.append(cap,ta,count);
    const nav=document.createElement('div');nav.className='test-essay-nav';const prev=document.createElement('button');prev.type='button';prev.className='secondary';prev.textContent='← Previous essay';prev.disabled=a.sup.essayIndex===0;prev.onclick=()=>moveEssay(-1);const next=document.createElement('button');next.type='button';next.className='primary';next.textContent=a.sup.essayIndex===ids.length-1?'Finish test':'Next essay →';next.onclick=()=>a.sup.essayIndex===ids.length-1?requestFinish():moveEssay(1);nav.append(prev,next);host.append(h,label,nav);progress(a);
  }
  function moveEssay(d){const a=active();if(!a)return;a.sup.essayIndex=Math.min(Math.max(0,a.sup.essayIndex+d),a.sup.essayOrder.length-1);saveSup(a.sup);renderEssay(a);scrollTo({top:0,behavior:'auto'})}
  function requestFinish(){const a=active();if(!a)return;const n=a.sup.essayOrder.length-essayAnswered(a.sup);if(n&& !confirm(`Finish the practice test with ${n} unanswered essay${n===1?'':'s'}?`))return;finish('completed')}
  function resultFor(test,sup,reason){
    const per={},cats=[...new Set(Q.map(q=>q.category))];cats.forEach(c=>per[c]={total:0,correct:0,partial:0,incorrect:0,unanswered:0,points:0,timeMs:0,answered:0});let correct=0,partial=0,incorrect=0,unanswered=0,points=0,time=0,count=0;
    test.order.forEach(id=>{const q=qMap.get(Number(id)),x=test.items?.[id]||{},c=per[q.category];c.total++;if(!x.answered){unanswered++;c.unanswered++;return}count++;time+=Number(x.elapsedMs)||0;c.answered++;c.timeMs+=Number(x.elapsedMs)||0;points+=Number(x.credit)||0;c.points+=Number(x.credit)||0;if(x.result==='correct'){correct++;c.correct++}else if(x.result==='partial'){partial++;c.partial++}else{incorrect++;c.incorrect++}});
    const essays=sup.essayOrder.map(id=>{const e=eMap.get(String(id)),text=response(sup,id);return {essayId:String(id),title:e?.title||'Essay',prompt:e?.prompt||'',response:text,answered:!!text.trim()}}),date=Date.now();
    return {summary:{id:String(test.id),date,reason,completed:reason==='completed',scorePct:Q.length?points/Q.length*100:0,points,correct,partial,incorrect,unanswered,answeredCount:count,avgAnswerTimeMs:count?time/count:0,totalTimeMs:Math.min(DURATION,Math.max(0,date-(Number(test.startedAt)||date))),perCategory:per,essayTotal:essays.length,essayAnswered:essays.filter(x=>x.answered).length,essayUnanswered:essays.filter(x=>!x.answered).length,followUpQuestionIds:[...sup.flags],testFormat:'questions-plus-essays-v1'},essays};
  }
  function saveResponses(id,responses){const h=json(localStorage.getItem(RESP),{})||{};h[String(id)]={savedAt:Date.now(),responses};const rows=Object.entries(h).sort((a,b)=>Number(b[1]?.savedAt||0)-Number(a[1]?.savedAt||0)).slice(0,30);localStorage.setItem(RESP,JSON.stringify(Object.fromEntries(rows)))}
  function queueSync(test){const cfg=json(localStorage.getItem(SYNC),null);if(!cfg?.enabled||!cfg?.deviceToken)return;const q=json(localStorage.getItem(SYNCQ),[])||[];q.push({opId:uid(),zman:analyticsZman,generation:Math.max(0,Number(cfg.generations?.[analyticsZman])||0),kind:'test_complete',payload:{test},clientTs:new Date().toISOString()});localStorage.setItem(SYNCQ,JSON.stringify(q.slice(-1500)))}
  function finish(reason){const state=read(),test=state?.activeTest;if(!test)return;const sup=normSup(test),built=resultFor(test,sup,reason),r=built.summary;saveResponses(r.id,built.essays);state.tests=Array.isArray(state.tests)?state.tests:[];if(!state.tests.some(x=>String(x?.id)===r.id))state.tests.push(r);state.tests=state.tests.slice(-30);state.activeTest=null;write(state);queueSync(r);localStorage.setItem(PENDING,JSON.stringify({id:r.id}));localStorage.removeItem(SUP);location.reload()}
  function exit(ev){const a=active();if(!a)return;ev.preventDefault();ev.stopImmediatePropagation();const q=a.test.order.filter(id=>a.test.items?.[id]?.answered).length,e=essayAnswered(a.sup);if(confirm(`Exit the practice test now? ${q}/${a.test.order.length} questions and ${e}/${a.sup.essayOrder.length} essays are answered. This attempt will be saved as incomplete.`))finish('exited')}
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function showResult(){
    const p=json(localStorage.getItem(PENDING),null);if(!p?.id)return;const r=(read()?.tests||[]).find(x=>String(x?.id)===String(p.id)),dialog=el('testResultDialog'),content=el('testResultContent');if(!r||!dialog||!content)return;const sub=el('testResultSubtitle');if(sub)sub.textContent=r.completed?`Completed ${new Date(r.date).toLocaleString()}`:r.reason==='time'?`Time expired — ${new Date(r.date).toLocaleString()}`:`Exited early — ${new Date(r.date).toLocaleString()}`;
    const hist=json(localStorage.getItem(RESP),{})||{},rows=hist[String(r.id)]?.responses||[];content.innerHTML=`<div class="stat-grid test-combined-stats"><div class="stat-card"><div class="label">M/C score</div><div class="value">${Number(r.scorePct||0).toFixed(1)}%</div></div><div class="stat-card"><div class="label">Correct</div><div class="value">${r.correct||0}</div></div><div class="stat-card"><div class="label">Partial</div><div class="value">${r.partial||0}</div></div><div class="stat-card"><div class="label">Incorrect</div><div class="value">${r.incorrect||0}</div></div><div class="stat-card"><div class="label">Essays answered</div><div class="value">${r.essayAnswered||0}/${r.essayTotal||0}</div></div></div>${rows.length?`<div class="stat-section"><h3>Essay responses</h3><p class="small-muted">Essay responses are for self-review and are not automatically graded.</p>${rows.map((x,i)=>{const e=eMap.get(String(x.essayId));return `<details class="test-result-essay"><summary>Essay ${i+1}: ${esc(x.title)} · ${x.answered?'Answered':'Unanswered'}</summary><div class="test-result-essay-body"><strong>Prompt</strong><p>${esc(x.prompt)}</p><strong>Your response</strong><p class="test-result-response">${x.answered?esc(x.response):'No response submitted.'}</p>${e?.modelAnswer?`<strong>Model answer</strong><p>${esc(e.modelAnswer)}</p>`:''}</div></details>`}).join('')}</div>`:''}`;localStorage.removeItem(PENDING);dialog.showModal();
  }
  function sync(){const a=active();if(!a){followButton()?.classList.add('hidden');document.body.classList.remove('ui-test-essays');el('questionCard')?.classList.remove('ui-test-section-hidden');el('saveNote')?.classList.remove('ui-test-section-hidden');return}a.sup.phase==='essays'?renderEssay(a):(document.body.classList.remove('ui-test-essays'),el('questionCard')?.classList.remove('ui-test-section-hidden'),el('saveNote')?.classList.remove('ui-test-section-hidden'),decorate(a));if(Number(a.test.endTime)<=Date.now())finish('time')}
  el('startTestBtn')?.addEventListener('click',start,true);el('exitTestBtn')?.addEventListener('click',exit,true);el('nextBtn')?.addEventListener('click',ev=>{const a=active();if(a?.sup.phase==='questions'&&allAnswered(a.test)&&a.sup.essayOrder.length){ev.preventDefault();ev.stopImmediatePropagation();toEssays()}},true);
  document.addEventListener('keydown',ev=>{if(ev.key!=='ArrowRight'||ev.defaultPrevented||ev.altKey||ev.ctrlKey||ev.metaKey||ev.target?.closest?.('button,a,input,textarea,select,[contenteditable="true"]')||document.querySelector('dialog[open]'))return;const a=active();if(a?.sup.phase==='questions'&&allAnswered(a.test)&&a.sup.essayOrder.length){ev.preventDefault();ev.stopImmediatePropagation();toEssays()}},true);
  el('categoriesBtn')?.addEventListener('click',()=>setTimeout(copy,0),true);copy();followButton();active();setTimeout(()=>{copy();sync();showResult();setInterval(sync,400)},0);
})();