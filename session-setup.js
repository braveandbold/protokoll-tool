function goSessSetup(id){activeSessId=id;renderSessSetup()}
function renderSessSetup(){
  const s=activeSess();if(!s){renderBatteries();return}
  _editSnapshot=JSON.stringify(s);
  _editDirty=false;
  const b=batteries.find(x=>x.id===s.batteryId);
  setNav([{label:'Usability Testing',action:'renderDashboard()'},{label:'Usability-Tests',action:'renderBatteries()'},{label:b?.name||'Studie',action:`goBattDetail('${s.batteryId}')`},{label:s.personName||'Neue Session',action:''}]);
  show('session-setup');
  document.getElementById('v-session-setup').innerHTML=`<div class="page-narrow">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap">
      <h2 style="margin-bottom:0">${esc(s.personName)||'Neue Testsession'}</h2>
      ${statusBadge(s.status)}
    </div>

    <div class="card">
      <h3>Testperson</h3>
      <div class="grid2">
        <div class="field"><label class="lbl">Name der Testperson</label>
          <input type="text" id="ss-name" value="${esc(s.personName)}" placeholder="Name oder Pseudonym"></div>
        <div class="field"><label class="lbl">Code / ID (optional)</label>
          <input type="text" id="ss-code" value="${esc(s.personCode)}" placeholder="z.B. TP-03"></div>
      </div>
      <div class="field"><label class="lbl">Notizen zur Person</label>
        <textarea id="ss-notes" rows="2" placeholder="Alter, Erfahrung, Besonderheiten…">${esc(s.personNotes)}</textarea></div>
    </div>

    <div class="card">
      <h3>Session-Details</h3>
      <div class="grid2">
        <div class="field"><label class="lbl">Datum</label>
          <input type="date" id="ss-date" value="${s.date||''}"></div>
        <div class="field"><label class="lbl">Protokollant:in</label>
          <input type="text" id="ss-tester" value="${esc(s.tester)}" placeholder="Name"></div>
      </div>
      <div class="field"><label class="lbl">Status</label>
        <select id="ss-status" onchange="setSessStatus(this.value)">
          <option value="active"${s.status==='active'?' selected':''}>Aktiv</option>
          <option value="done"${s.status==='done'?' selected':''}>Abgeschlossen</option>
        </select>
      </div>
    </div>

    <div style="display:flex;gap:10px;justify-content:space-between;margin-top:8px">
      ${inlineIconButton('Session löschen',trashIcon(),`delSess('${s.id}')`,{cls:'btn-danger'})}
      <div style="display:flex;gap:10px">
        <button onclick="sessSetupAbbrechen('${s.batteryId}')">Abbrechen</button>
        <button class="btn-primary" onclick="saveSessSetup().then(()=>{_editDirty=false;goBattDetail('${s.batteryId}')})">Speichern</button>
      </div>
    </div>
  </div>`;

  ['ss-name','ss-code','ss-notes','ss-date','ss-tester','ss-status'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.addEventListener('input',()=>{_editDirty=true;});
  });
}
function sessSetupAbbrechen(battId){
  if(!_editDirty){const snap=JSON.parse(_editSnapshot);sessions=sessions.map(s=>s.id===snap.id?snap:s);goBattDetail(battId);return;}
  ask('Änderungen verwerfen?', ()=>{const snap=JSON.parse(_editSnapshot);sessions=sessions.map(s=>s.id===snap.id?snap:s);goBattDetail(battId);}, 'Verwerfen', '');
}
function sessSetupBack(battId){
  if(!_editDirty){goBattDetail(battId);return;}
  askSave(()=>{saveSessSetup().then(()=>goBattDetail(battId));},()=>{const snap=JSON.parse(_editSnapshot);sessions=sessions.map(s=>s.id===snap.id?snap:s);goBattDetail(battId);});
}
function saveSessSetupAuto(){
  const s=activeSess();if(!s)return;
  s.personName=document.getElementById('ss-name')?.value||'';
  s.personCode=document.getElementById('ss-code')?.value||'';
  s.personNotes=document.getElementById('ss-notes')?.value||'';
  s.date=document.getElementById('ss-date')?.value||'';
  s.tester=document.getElementById('ss-tester')?.value||'';
  s.status=document.getElementById('ss-status')?.value||'active';
  sessions=sessions.map(x=>x.id===s.id?s:x);
  const h=document.querySelector('#v-session-setup h2');
  if(h)h.textContent=s.personName||'Neue Testsession';
}
async function saveSessSetup(){
  saveSessSetupAuto();
  try{
    await saveSessToDb(activeSess());
  } catch(err){
    reportSaveError(err);
    throw err;
  }
}
function setSessStatus(val){
  const s=activeSess();if(!s)return;
  s.status=val;
  _editDirty=true;
  sessions=sessions.map(x=>x.id===s.id?s:x);
  const badge=document.querySelector('#v-session-setup .badge');
  if(badge) badge.outerHTML=statusBadge(val);
}
function startSession(){
  const s=activeSess();if(!s)return;
  s.status='active';updSess(s);goSessTest(s.id);
}
