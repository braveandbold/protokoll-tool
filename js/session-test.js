let stepInputs = {};
function getSI(sid){ if(!stepInputs[sid])stepInputs[sid]={type:null,sev:3,text:''}; return stepInputs[sid]; }

function noTypeForSlot(sid){ return noSevForSlot(sid); }
function noSevForSlot(sid){
  if(!sid||sid==='general') return true;
  const s=activeSess(); if(!s) return false;
  const b=batteries.find(x=>x.id===s.batteryId); if(!b) return false;
  const step=(b.steps||[]).find(st=>st.id===sid);
  return step?(step.chapter||1)===1:false;
}

let editingEntryId = null;
let editEntry = {type:null, sev:3, text:''};

function renderEntryRows(entries){
  return entries.map(e=>{
    const noSev=noSevForSlot(e.stepId);
    const noType=noTypeForSlot(e.stepId);
    if(e.id===editingEntryId){
      const typeBtns=TYPES.map(t=>typeButton(t,t===editEntry.type,`setEditType('${t}')`,'edit-type-btn')).join('');
      const sevBtns=[1,2,3,4,5].map(n=>severityButton(n,n===editEntry.sev,`setEditSev(${n})`,'edit-sev-btn')).join('');
      return`<div class="entry-row" style="padding:12px 0;flex-direction:column;gap:10px;border-bottom:1px solid var(--border);background:#fafaf8">
        ${noType?'':`<div style="display:flex;gap:7px;flex-wrap:wrap">${typeBtns}</div>`}
        ${noSev?'':`<div id="edit-sev-row" style="${editEntry.type!=='Problem'?'display:none':''}">
          <div style="font-size:12px;color:var(--text2);font-weight:600;margin-bottom:6px" id="edit-sev-lbl">Schweregrad</div>
          <div style="display:flex;gap:8px;flex-wrap:nowrap;align-items:center;overflow-x:auto;padding-bottom:2px">${sevBtns}</div>
        </div>`}
        <textarea id="edit-txt-${e.id}" rows="3" style="width:100%">${esc(editEntry.text)}</textarea>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="cancelEditEntry()">Abbrechen</button>
          <button class="btn-primary" onclick="saveEditEntry('${e.id}')">Speichern</button>
        </div>
      </div>`;
    }
    return`<div class="entry-row" style="padding:9px 0">
      ${e.type?typeBadge(e.type,{label:false,iconSize:13,cls:'entry-icon entry-icon-only'}):``}
      <div style="flex:1;min-width:0">
        ${(!noSev&&e.severity)?`<div style="margin-bottom:3px">${severityBadge(e.severity)}</div>`:''}
        <div style="font-size:14px;line-height:1.5">${esc(e.text)}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:3px;font-family:'IBM Plex Mono',monospace">${fmtTime(e.timestamp)}</div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="btn-ghost btn-sm" onclick="startEditEntry('${e.id}')" style="font-size:13px;color:var(--text2);display:inline-flex;align-items:center;justify-content:center" title="Bearbeiten">${editIcon(14)}</button>
        <button class="btn-ghost btn-sm" onclick="delLiveEntry('${e.id}')" style="font-size:14px;color:var(--text3);display:inline-flex;align-items:center;justify-content:center" title="Löschen">${trashIcon(14)}</button>
      </div>
    </div>`;
  }).join('');
}

function goSessTest(id){ activeSessId=id; stepInputs={}; editingEntryId=null; renderSessTest(); }
function sessTestBack(battId){
  const hasUnsaved=Object.values(stepInputs).some(si=>(si.text||'').trim());
  if(hasUnsaved){
    ask('Du hast ungespeicherte Eingaben – diese gehen verloren. Trotzdem zurück?',()=>goBattDetail(battId),'Zurück ohne Speichern','');
  } else {
    goBattDetail(battId);
  }
}

function renderSessTest(){
  const s=activeSess(); if(!s){renderBatteries();return}
  const b=batteries.find(x=>x.id===s.batteryId);
  setNav([{label:'Usability Testing',action:'renderDashboard()'},{label:'Usability-Tests',action:'renderBatteries()'},{label:b?.name||'Studie',action:`goBattDetail('${s.batteryId}')`},{label:s.personName||'Session',action:''}]);
  show('session-test');
  const steps=b?.steps||[];
  const allEntries=s.entries||[];

  let slotCards='';
  let stepCounter=0;
  let chapterIdx=0;
  CHAPTERS.forEach(ch=>{
    const chSteps=steps.filter(s=>(s.chapter||1)===ch.id);
    if(chSteps.length===0)return;
    if(chapterIdx>0) slotCards+=`<hr style="border:none;border-top:1px solid var(--border);margin:32px 0 0">`;
    chapterIdx++;
    slotCards+=`<h3 style="margin:20px 0 10px">${ch.label}</h3>`;
    chSteps.forEach((st,idx)=>{
      const slot={id:st.id,title:st.title,desc:st.description,isStep:true};
      const globalIdx=stepCounter++;
      const slotEntries=allEntries.filter(e=>e.stepId===slot.id);
      const si=getSI(slot.id);
      const typeBtns=TYPES.map(t=>typeButton(t,t===si.type,`setSIType('${slot.id}','${t}')`)).join('');
      const sevBtns=[1,2,3,4,5].map(n=>severityButton(n,n===si.sev,`setSISev('${slot.id}',${n})`)).join('');
      const entryRows=renderEntryRows(slotEntries);
      const countBadge=slotEntries.length>0?`<span style="color:var(--text2);font-size:12px;font-weight:500;white-space:nowrap">${slotEntries.length} Eintr${slotEntries.length===1?'ag':'äge'}</span>`:'';
      slotCards+=`<div class="card" style="padding:0;overflow:hidden;margin-bottom:20px">
        <div style="background:var(--surface2);padding:13px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px">
          <div class="step-nr" style="flex-shrink:0">${globalIdx+1}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:15px">${esc(slot.title)}</div>
            ${slot.desc?`<div style="font-size:12px;color:var(--text2);margin-top:2px">${esc(slot.desc)}</div>`:''}
          </div>
          ${countBadge}
        </div>
        ${slotEntries.length>0?`<div style="padding:4px 20px;border-bottom:1px solid var(--border)">${entryRows}</div>`:''}
        <div style="padding:16px 20px">
          <textarea id="txt-${slot.id}" rows="2" placeholder="Beobachtung hinzufügen… (Cmd+Enter)"
              style="width:100%;margin-bottom:10px"
              onkeydown="if(event.metaKey&&event.key==='Enter'){event.preventDefault();addStepEntry('${slot.id}')}"
              oninput="getSI('${slot.id}').text=this.value">${esc(si.text)}</textarea>
          <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:8px">
            ${noTypeForSlot(slot.id)?'':` <div style="display:flex;gap:7px;flex-wrap:wrap;flex:1">${typeBtns}</div>`}
            <button class="" onclick="addStepEntry('${slot.id}')" style="padding:9px 18px;white-space:nowrap;flex-shrink:0;${noTypeForSlot(slot.id)?'margin-left:auto':''}">+ Hinzufügen</button>
          </div>
          <div id="sev-row-${slot.id}" style="${(si.type!=='Problem'||noSevForSlot(slot.id))?'display:none;':''}">
            <div style="font-size:12px;color:var(--text2);font-weight:600;margin-bottom:6px" id="sev-lbl-${slot.id}">Schweregrad</div>
            <div style="display:flex;gap:8px;flex-wrap:nowrap;align-items:center;overflow-x:auto;padding-bottom:2px">${sevBtns}</div>
          </div>
        </div>
      </div>`;
    });
  });
  const genEntries=allEntries.filter(e=>!e.stepId);
  const siGen=getSI('general');
  const genTypeBtns=TYPES.map(t=>typeButton(t,t===siGen.type,`setSIType('general','${t}')`)).join('');
  const genSevBtns=[1,2,3,4,5].map(n=>severityButton(n,n===siGen.sev,`setSISev('general',${n})`)).join('');
  const genEntryRows=renderEntryRows(genEntries);
  slotCards+=`<h3 style="margin:28px 0 10px">Allgemeine Beobachtungen</h3>
  <div class="card" style="padding:0;overflow:hidden;margin-bottom:20px">
    ${genEntries.length>0?`<div style="padding:4px 20px;border-bottom:1px solid var(--border)">${genEntryRows}</div>`:''}
    <div style="padding:16px 20px">
      <textarea id="txt-general" rows="2" placeholder="Allgemeine Beobachtung… (Cmd+Enter)"
          style="width:100%;margin-bottom:10px"
          onkeydown="if(event.metaKey&&event.key==='Enter'){event.preventDefault();addStepEntry('general')}"
          oninput="getSI('general').text=this.value">${esc(siGen.text)}</textarea>
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:8px">
        <div style="display:flex;gap:7px;flex-wrap:wrap;flex:1">${genTypeBtns}</div>
        <button class="" onclick="addStepEntry('general')" style="padding:9px 18px;white-space:nowrap;flex-shrink:0">+ Hinzufügen</button>
      </div>
      <div id="sev-row-general" style="display:none;">
        <div style="font-size:12px;color:var(--text2);font-weight:600;margin-bottom:6px" id="sev-lbl-general">Schweregrad</div>
        <div style="display:flex;gap:8px;flex-wrap:nowrap;align-items:center;overflow-x:auto;padding-bottom:2px">${genSevBtns}</div>
      </div>
    </div>
  </div>`;

  document.getElementById('v-session-test').innerHTML=`
    <div class="page">
      <div class="hdr" style="margin-bottom:24px">
        <div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:4px">${esc(b?.name||'')}</div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;flex-wrap:wrap">
            <h2 style="margin-bottom:0">${esc(s.personName)||'Session'}${s.personCode?' <span style="font-size:14px;font-weight:400;color:var(--text2)">('+esc(s.personCode)+')</span>':''}</h2>
            ${statusBadge(s.status)}
          </div>
          ${metaRow([
            metaItem('Notizen',s.personNotes),
            metaItem('Datum',s.date?fmtDate(s.date):''),
            metaItem('Protokollant',s.tester),
            metaItem('Einträge',allEntries.length)
          ],'margin-top:6px')}
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;align-self:flex-start">
          <button onclick="goSessReport('${s.id}')">Bericht anzeigen</button>
        </div>
      </div>
      ${slotCards}
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:14px">
        <button class="btn-ghost" onclick="sessTestBack('${s.batteryId}')" style="font-size:13px;color:var(--text2)">← Zurück zur Studie</button>
        <div style="display:flex;gap:10px">
        <button onclick="updSess(activeSess()).then(()=>goBattDetail('${s.batteryId}'))">Speichern</button>
        ${s.status==='done'
          ?`<button class="btn-primary" onclick="goSessReport('${s.id}')">Bericht anzeigen</button>`
          :`<button class="btn-primary" onclick="finishSession()">Test abschließen</button>`
        }
        </div>
      </div>
    </div>`;
}

function setSIType(sid,t){
  const si=getSI(sid);
  si.type = si.type===t ? null : t;
  const card=document.getElementById('txt-'+sid)?.closest('.card');
  if(card){
    card.querySelectorAll('.type-btn').forEach(b=>{
      const sel=b.dataset.type===si.type;
      b.classList.toggle('sel',sel);
      b.style.borderColor=sel?T.fg[b.dataset.type]:'transparent';
    });
    const row=document.getElementById('sev-row-'+sid);
    if(row)row.style.display=(si.type==='Problem'&&!noSevForSlot(sid))?'':'none';
  }
}
function setSISev(sid,n){
  getSI(sid).sev=n;
  const card=document.getElementById('txt-'+sid)?.closest('.card');
  if(card){
    card.querySelectorAll('.audit-sev-btn').forEach(b=>{
      const sel=Number(b.dataset.sev)===n;
      b.style.borderColor=sel?SEV.fg[n]:'transparent';
      b.style.opacity=sel?1:.4;
    });
    const lbl=document.getElementById('sev-lbl-'+sid);
    if(lbl)lbl.textContent='Schweregrad';
  }
}
function addStepEntry(sid){
  const s=activeSess(); if(!s)return;
  const si=getSI(sid);
  const txtEl=document.getElementById('txt-'+sid);
  const txt=(txtEl?.value||si.text||'').trim();
  if(!txt)return;
  const entry={id:genId(),timestamp:ts(),type:si.type,text:txt,
    severity:(si.type==='Problem'&&!noSevForSlot(sid))?si.sev:null,
    stepId:sid==='general'?null:sid};
  s.entries=[...(s.entries||[]),entry];
  updSess(s);
  si.text='';
  renderSessTest();
  setTimeout(()=>{const el=document.getElementById('txt-'+sid);if(el)el.focus();},20);
}
function startEditEntry(id){
  const s=activeSess(); if(!s)return;
  const e=(s.entries||[]).find(x=>x.id===id); if(!e)return;
  editingEntryId=id;
  editEntry={type:e.type, sev:e.severity||3, text:e.text};
  renderSessTest();
  setTimeout(()=>{const el=document.getElementById('edit-txt-'+id);if(el)el.focus();},20);
}
function setEditType(t){
  editEntry.type = editEntry.type===t ? null : t;
  document.querySelectorAll('.edit-type-btn').forEach(b=>{
    const sel=b.dataset.type===editEntry.type;
    b.classList.toggle('sel',sel);
    b.style.borderColor=sel?T.fg[b.dataset.type]:'transparent';
  });
  const row=document.getElementById('edit-sev-row');
  if(row)row.style.display=editEntry.type==='Problem'?'':'none';
}
function setEditSev(n){
  editEntry.sev=n;
  document.querySelectorAll('.edit-sev-btn').forEach(b=>{
    const sel=Number(b.dataset.sev)===n;
    b.style.borderColor=sel?SEV.fg[n]:'transparent';
    b.style.opacity=sel?1:.4;
  });
  const lbl=document.getElementById('edit-sev-lbl');
  if(lbl)lbl.textContent='Schweregrad';
}
function saveEditEntry(id){
  const s=activeSess(); if(!s)return;
  const txtEl=document.getElementById('edit-txt-'+id);
  const txt=(txtEl?.value||editEntry.text||'').trim();
  if(!txt)return;
  s.entries=(s.entries||[]).map(e=>e.id===id?{...e,type:editEntry.type,text:txt,severity:(editEntry.type==='Problem'&&!noSevForSlot(e.stepId))?editEntry.sev:null}:e);
  updSess(s); editingEntryId=null; renderSessTest();
}
function cancelEditEntry(){
  editingEntryId=null; renderSessTest();
}
function delLiveEntry(id){
  ask('Eintrag löschen?', ()=>{
    const s=activeSess(); if(!s)return;
    s.entries=(s.entries||[]).filter(e=>e.id!==id);updSess(s);renderSessTest();
  });
}
function finishSession(){
  ask('Test als abgeschlossen markieren?', ()=>{
    const s=activeSess();if(!s)return;
    s.status='done';updSess(s);goSessReport(s.id);
  }, 'Abschließen', 'btn-primary');
}
