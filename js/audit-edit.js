function renderAuditEdit(){
  const a=activeAudit()||{id:null,name:'',subject:'',auditor:'',date:'',heuristicSets:[],status:'active',createdAt:null};
  const isNew=!a.id;
  const auditDate=isNew?{from:new Date().toISOString().slice(0,10),to:''}:parseAuditDate(a.date);
  setNav([
    {label:'UX Audit',action:'renderDashboard()'},
    {label:'Audits',action:'renderAuditList()'},
    ...(isNew?[]:[{label:a.name||'Audit',action:`goAuditDetail('${a.id}')`}]),
    {label:isNew?'Neuer Audit':'Bearbeiten',action:''}
  ]);
  show('audit-edit');
  const el=document.getElementById('v-audit-edit');

  const setCheckboxes=Object.keys(AUDIT_HEURISTIC_SETS).map(key=>{
    const s=AUDIT_HEURISTIC_SETS[key];
    const checked=(a.heuristicSets||[]).includes(key)?'checked':'';
    const criteria=s.criteria.map(c=>`
      <li style="font-size:13px;color:var(--text2);line-height:1.45;margin-bottom:5px">${esc(c.label)}</li>
    `).join('');
    return`<div style="border:1px solid var(--border);border-radius:var(--r);margin-bottom:8px;background:var(--surface);overflow:hidden">
      <div style="display:flex;align-items:center;gap:12px;padding:12px 16px">
        <input type="checkbox" id="hs-${key}" ${checked} style="width:16px;height:16px;cursor:pointer;flex-shrink:0">
        <button type="button" onclick="toggleCriteriaAccordion('${key}')" style="flex:1;display:flex;align-items:center;justify-content:space-between;gap:12px;border:none;background:transparent;padding:0;text-align:left;font-family:'IBM Plex Sans',sans-serif;white-space:normal">
          <span>
            <span style="display:block;font-weight:500;font-size:14px;color:var(--text)">${esc(s.label)}</span>
            <span style="display:block;font-size:12px;color:var(--text2);margin-top:2px">${s.criteria.length} Kriterien</span>
          </span>
          <span id="hs-chev-${key}" style="width:28px;height:28px;border-radius:var(--r);display:inline-flex;align-items:center;justify-content:center;color:var(--text2);background:var(--surface2);transition:transform .15s,background .12s,color .12s;flex-shrink:0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>
      </div>
      <div id="hs-panel-${key}" style="display:none;border-top:1px solid var(--border);background:var(--surface2);padding:12px 18px 12px 42px">
        <ul style="margin:0;padding-left:18px">${criteria}</ul>
      </div>
    </div>`;
  }).join('');

  el.innerHTML=`<div class="page-narrow">
    <h2 style="margin-bottom:24px">${isNew?'Neuer Audit':'Audit bearbeiten'}</h2>
    <div class="card">
      <h3>Audit-Details</h3>
      <div class="field"><label class="lbl">Name / Produkt</label>
        <input type="text" id="ae-name" value="${esc(a.name)}" placeholder="z. B. Shop-Relaunch 2025"></div>
      <div class="field"><label class="lbl">Prüfgegenstand</label>
        <input type="text" id="ae-subject" value="${esc(a.subject)}" placeholder="z. B. Checkout-Flow"></div>
      <div class="field"><label class="lbl">Prüfer</label>
        <input type="text" id="ae-auditor" value="${esc(a.auditor)}" placeholder="Name oder Kürzel"></div>
      <div class="field"><label class="lbl">Zeitraum</label>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="date" id="ae-date-from" value="${auditDate.from}" style="flex:1">
          <span style="color:var(--text3);font-size:13px;flex-shrink:0">bis</span>
          <input type="date" id="ae-date-to" value="${auditDate.to}" style="flex:1">
        </div>
      </div>
      ${!isNew?`<div class="field" style="margin-bottom:0"><label class="lbl">Status</label>
        <select id="ae-status">
          <option value="active"${a.status==='active'?' selected':''}>Aktiv</option>
          <option value="done"${a.status==='done'?' selected':''}>Abgeschlossen</option>
        </select></div>`:''}
    </div>
    <div class="card">
      <h3>Prüfkriterien</h3>
      ${setCheckboxes}
    </div>
    <div style="display:flex;gap:10px;justify-content:space-between;margin-top:8px">
      ${!isNew?inlineIconButton('Gesamten Audit löschen',trashIcon(),`deleteAuditConfirm('${a.id}')`,{cls:'btn-danger'}):`<div></div>`}
      <div style="display:flex;gap:10px">
        <button onclick="${isNew?'renderAuditList()':` goAuditDetail('${a.id}')`}">Abbrechen</button>
        <button class="btn-primary" style="background:${AUDIT_COLOR};border-color:${AUDIT_COLOR}" onclick="saveAuditEdit('${isNew?'':a.id}')">Speichern</button>
      </div>
    </div>
  </div>`;
}

function toggleCriteriaAccordion(key){
  const panel=document.getElementById('hs-panel-'+key);
  const chev=document.getElementById('hs-chev-'+key);
  if(!panel)return;
  const open=panel.style.display==='none';
  panel.style.display=open?'':'none';
  if(chev)chev.style.transform=open?'rotate(-180deg)':'rotate(0deg)';
}

async function saveAuditEdit(existingId){
  const name=document.getElementById('ae-name').value.trim();
  const subject=document.getElementById('ae-subject').value.trim();
  const auditor=document.getElementById('ae-auditor').value.trim();
  const date=serializeAuditDate(
    document.getElementById('ae-date-from').value,
    document.getElementById('ae-date-to').value
  );
  const status=document.getElementById('ae-status')?.value||'active';
  const heuristicSets=Object.keys(AUDIT_HEURISTIC_SETS).filter(k=>document.getElementById('hs-'+k)?.checked);
  const existing=existingId?activeAudit():null;
  const a={
    id:existingId||genId(), name, subject, auditor, date,
    heuristicSets, status, createdAt:existing?.createdAt||ts()
  };
  try{
    if(existingId){
      await updAudit(a);
    } else {
      auditList=[a,...auditList];
      await saveAuditToDb(a);
    }
  } catch(err){
    alert('Fehler beim Speichern:\n'+err.message);
    return;
  }
  activeAuditId=a.id;
  renderAuditDetail();
}

async function deleteAuditConfirm(id){
  ask('Audit wirklich löschen? Alle Findings werden ebenfalls gelöscht.',async()=>{
    try{
      await deleteAuditFromDb(id);
      auditList=auditList.filter(a=>a.id!==id);
      auditFindings=auditFindings.filter(f=>f.auditId!==id);
      activeAuditId=null;
      renderAuditList();
    } catch(err){
      reportSaveError(err);
    }
  });
}
