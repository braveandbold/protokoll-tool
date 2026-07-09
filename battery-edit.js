function goBattEdit(id){activeBattId=id;renderBattEdit()}
function renderBattEdit(){
  const b=activeBatt();if(!b){renderBatteries();return}
  setNav([{label:'Usability Testing',action:'renderDashboard()'},{label:'Usability-Tests',action:'renderBatteries()'},{label:b.name||'Neue Studie',action:`goBattDetail('${b.id}')`},{label:'Bearbeiten',action:''}]);
  show('battery-edit');
  _editSnapshot=JSON.stringify(b);
  _editDirty=false;
  const steps=b.steps||[];

  const chapterCards=CHAPTERS.map(ch=>{
    const chSteps=steps.filter(s=>(s.chapter||1)===ch.id);
    const stepRows=chSteps.map((s,i)=>`
      <div class="step-item" id="step-${s.id}">
        <div class="step-nr" style="flex-shrink:0">${i+1}</div>
        <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <input type="text" value="${esc(s.title)}" placeholder="Frage oder Aufgabe" oninput="updateStep('${s.id}','title',this.value)">
          <input type="text" value="${esc(s.description)}" placeholder="Beschreibung (optional)" oninput="updateStep('${s.id}','description',this.value)">
        </div>
        <button class="btn-ghost btn-sm" onclick="removeStep('${s.id}')" title="Schritt löschen" style="flex-shrink:0;color:var(--text3);display:inline-flex;align-items:center;justify-content:center">${trashIcon(14)}</button>
      </div>`).join('');

    return`<div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${chSteps.length>0?'14px':'12px'}">
        <h3 style="margin-bottom:0">${ch.label}</h3>
        <button class="btn-sm" onclick="addStep(${ch.id})">+ Schritt</button>
      </div>
      ${chSteps.length>0?`<div>${stepRows}</div>`:`<div style="font-size:13px;color:var(--text3);padding:4px 0">Noch keine Schritte in diesem Kapitel.</div>`}
    </div>`;
  }).join('');

  document.getElementById('v-battery-edit').innerHTML=`<div class="page-narrow">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap">
      <h2 style="margin-bottom:0">${esc(b.name)||'Neue Studie'}</h2>
      ${statusBadge(b.status)}
    </div>

    <div class="card">
      <h3>Allgemeine Informationen</h3>
      <div class="field"><label class="lbl">Name der Studie</label>
        <input type="text" id="be-name" value="${esc(b.name)}" placeholder="z.B. Checkout-Flow Test Q2 2025"></div>
      <div class="grid2">
        <div class="field"><label class="lbl">Produkt / System</label>
          <input type="text" id="be-product" value="${esc(b.product)}" placeholder="z.B. Shop-App v2.1"></div>
        <div class="field"><label class="lbl">Link / URL</label>
          <input type="text" id="be-link" value="${esc(b.link)}" placeholder="https://..."></div>
      </div>
      <div class="field"><label class="lbl">Beschreibung / Ziel</label>
        <textarea id="be-desc" rows="3" placeholder="Was soll dieser Test herausfinden?">${esc(b.description)}</textarea></div>
      <div class="field"><label class="lbl">Status</label>
        <select id="be-status" onchange="setBattStatus(this.value)">
          <option value="active"${(b.status||'active')==='active'?' selected':''}>Aktiv</option>
          <option value="done"${b.status==='done'?' selected':''}>Abgeschlossen</option>
        </select>
      </div>
    </div>

    <h3 style="margin-bottom:14px">Leitfaden</h3>
    ${chapterCards}

    <div style="display:flex;gap:10px;justify-content:space-between;margin-top:8px">
      ${inlineIconButton('Studie löschen',trashIcon(),`delBatt('${b.id}')`,{cls:'btn-danger'})}
      <div style="display:flex;gap:10px">
        <button onclick="battEditBack('${b.id}')">Abbrechen</button>
        <button class="btn-primary" onclick="saveBattEdit().then(()=>{_editDirty=false;goBattDetail('${b.id}')})">Speichern</button>
      </div>
    </div>
  </div>`;

  ['be-name','be-product','be-link','be-desc'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.addEventListener('input',()=>{_editDirty=true;});
  });
}
function battEditBack(id){
  if(!_editDirty){goBattDetail(id);return;}
  askSave(()=>{saveBattEdit().then(()=>goBattDetail(id));},()=>{const snap=JSON.parse(_editSnapshot);batteries=batteries.map(b=>b.id===snap.id?snap:b);goBattDetail(id);});
}
function saveBattEditAuto(){
  const b=activeBatt();if(!b)return;
  b.name=document.getElementById('be-name')?.value||'';
  b.product=document.getElementById('be-product')?.value||'';
  b.link=document.getElementById('be-link')?.value||'';
  b.description=document.getElementById('be-desc')?.value||'';
  b.status=document.getElementById('be-status')?.value||'active';
  batteries=batteries.map(x=>x.id===b.id?b:x);
  const h=document.querySelector('#v-battery-edit h2');
  if(h)h.textContent=b.name||'Neue Studie';
}
async function saveBattEdit(){
  saveBattEditAuto();
  try{
    await saveBattToDb(activeBatt());
  } catch(err){
    reportSaveError(err);
    throw err;
  }
}
function addStep(chapterId){
  const b=activeBatt();if(!b)return;
  saveBattEditAuto();
  const newStep={id:genId(),title:'',description:'',chapter:chapterId||1};
  b.steps=[...(b.steps||[]),newStep];
  updBatt(b);renderBattEdit();
  setTimeout(()=>{const el=document.getElementById('step-'+newStep.id);if(el){const inp=el.querySelector('input');if(inp)inp.focus();}},50);
}
function setBattStatus(val){
  const b=activeBatt();if(!b)return;
  b.status=val;
  _editDirty=true;
  batteries=batteries.map(x=>x.id===b.id?b:x);
  const badge=document.querySelector('#v-battery-edit .badge');
  if(badge) badge.outerHTML=statusBadge(val);
}
function removeStep(stepId){
  const b=activeBatt();if(!b)return;
  saveBattEditAuto();
  b.steps=(b.steps||[]).filter(s=>s.id!==stepId);
  updBatt(b);renderBattEdit();
}
function updateStep(stepId,field,val){
  const b=activeBatt();if(!b)return;
  _editDirty=true;
  b.steps=(b.steps||[]).map(s=>s.id===stepId?{...s,[field]:val}:s);
  batteries=batteries.map(x=>x.id===b.id?b:x);
}
