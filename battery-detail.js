function goBattDetail(id){activeBattId=id;renderBattDetail()}
function renderBattDetail(){
  const b=activeBatt();if(!b){renderBatteries();return}
  setNav([{label:'Usability Testing',action:'renderDashboard()'},{label:'Usability-Tests',action:'renderBatteries()'},{label:b.name||'Studie',action:`goBattDetail('${b.id}')`}]);
  show('battery-detail');
  const slist=battSessions(b.id);
  const stepsList=(()=>{
    const steps=b.steps||[];
    if(steps.length===0) return`<div style="color:var(--text3);font-size:13px;padding:6px 0">Keine Schritte definiert – <button class="btn-ghost btn-sm" style="padding:0;display:inline-flex;align-items:center;gap:5px" onclick="goBattEdit('${b.id}')">${editIcon(14)}Leitfaden bearbeiten</button></div>`;
    let html='';let globalIdx=0;
    CHAPTERS.forEach(ch=>{
      const chSteps=steps.filter(s=>(s.chapter||1)===ch.id);
      if(chSteps.length===0)return;
      html+=`<h3 style="margin:18px 0 8px">${ch.label}</h3>`;
      chSteps.forEach(s=>{globalIdx++;html+=`<div class="step-item"><div class="step-nr" style="flex-shrink:0">${globalIdx}</div><div><div style="font-weight:500;font-size:14px">${esc(s.title)}</div>${s.description?`<div style="font-size:13px;color:var(--text2);margin-top:3px">${esc(s.description)}</div>`:''}</div></div>`;});
    });
    return html;
  })();
  const renderSessRow=(s,i,showReport=true)=>{
      const cnt=(s.entries||[]).length;
      return`<div class="sess-row" onclick="openSession('${s.id}')">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">
            <span style="font-weight:500">${esc(s.personName)||'Person '+(i+1)}</span>
            ${statusBadge(s.status)}
          </div>
          ${metaRow([
            metaItem('Code',s.personCode,{mono:true}),
            metaItem('Datum',s.date?fmtDate(s.date):''),
            metaItem('Protokollant',s.tester),
            metaItem('Einträge',cnt)
          ],'font-size:12px;color:var(--text3);margin-top:3px;gap:5px 12px')}
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-shrink:0" onclick="event.stopPropagation()">
          ${showReport?`<button class="btn-sm" onclick="goSessReport('${s.id}')" style="display:inline-flex;align-items:center;gap:6px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>Bericht</button>`:''}
          <button class="btn-sm" onclick="goSessSetup('${s.id}')" style="display:inline-flex;align-items:center;gap:6px">${editIcon(14)}Bearbeiten</button>
        </div>
      </div>`;
  };
  const activeSessList=slist.filter(s=>s.status!=='done');
  const doneSessList=slist.filter(s=>s.status==='done');
  const activeRows=activeSessList.length===0
    ?`<div class="empty" style="padding:32px">Noch keine aktiven Sessions</div>`
    :activeSessList.map((s,i)=>renderSessRow(s,i,false)).join('');
  const doneRows=doneSessList.length===0
    ?`<div class="empty" style="padding:32px">Noch keine abgeschlossenen Sessions</div>`
    :doneSessList.map((s,i)=>renderSessRow(s,i,true)).join('');
  document.getElementById('v-battery-detail').innerHTML=`<div class="page">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:14px;flex-wrap:wrap">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">
          <h2 style="margin-bottom:0">${esc(b.name)||'(Ohne Name)'}</h2>
          ${statusBadge(b.status)}
        </div>
        ${metaRow([
          metaItem('Produkt',b.product),
          metaItem('Link',b.link?`<a href="${esc(b.link)}" target="_blank" style="color:var(--accent)">${esc(b.link)}</a>`:'',{raw:true}),
          metaItem('Ziel',b.description,{wide:true})
        ],'font-size:14px')}
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap">
        ${inlineIconButton('Bearbeiten',editIcon(),`goBattEdit('${b.id}')`)}
      </div>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="toggleLeitfaden()">
        <h3 style="margin:0">Leitfaden</h3>
        <div style="display:flex;align-items:center;gap:6px">
          <span id="leitfaden-chevron" style="display:inline-flex;transition:transform .2s;transform:rotate(0deg)"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </div>
      </div>
      <div id="leitfaden-body" style="display:none;margin-top:14px">${stepsList}</div>
    </div>
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <h2 style="margin:0">Sessions · ${slist.length}</h2>
      </div>
      <h3 style="margin-bottom:8px">Aktiv</h3>
      <div class="card" style="padding:0;overflow:hidden;margin-bottom:20px">${activeRows}</div>
      <h3 style="margin-bottom:8px">Abgeschlossen</h3>
      <div class="card" style="padding:0;overflow:hidden">${doneRows}</div>
      <div style="display:flex;justify-content:flex-end;margin-top:10px">
        <button class="btn-primary btn-action-sm" onclick="newSession('${b.id}')">+ Neue Session</button>
      </div>
    </div>
  </div>`;
}
function toggleLeitfaden(){
  const body=document.getElementById('leitfaden-body');
  const chevron=document.getElementById('leitfaden-chevron');
  if(!body)return;
  const open=body.style.display==='none';
  body.style.display=open?'':'none';
  if(chevron)chevron.style.transform=open?'rotate(-180deg)':'rotate(0deg)';
}
function toggleSessStatus(id, done){
  const s=sessions.find(x=>x.id===id);if(!s)return;
  s.status=done?'done':'active';updSess(s);renderBattDetail();
}
function openSession(id){
  const s=sessions.find(x=>x.id===id);if(!s)return;
  goSessTest(id);
}
async function newSession(battId){
  const s={id:genId(),batteryId:battId,personName:'',personCode:'',personNotes:'',date:new Date().toISOString().slice(0,10),tester:'',status:'active',entries:[],createdAt:ts()};
  sessions=[...sessions,s];
  try{
    await saveSessToDb(s);
    goSessSetup(s.id);
  } catch(err){
    sessions=sessions.filter(x=>x.id!==s.id);
    reportSaveError(err);
  }
}
function delSess(id){
  ask('Session löschen?', async ()=>{
    try{
      await deleteSessFromDb(id);
      sessions=sessions.filter(s=>s.id!==id);
      renderBattDetail();
    } catch(err){
      reportSaveError(err);
    }
  });
}
