function ask(msg, onOk, okLabel='Löschen', okCls='btn-danger'){
  document.getElementById('confirm-msg').textContent=msg;
  const ok=document.getElementById('confirm-ok');
  const discard=document.getElementById('confirm-discard');
  ok.innerHTML=okLabel==='Löschen'?`${trashIcon()}${esc(okLabel)}`:esc(okLabel);
  ok.className=okCls;
  ok.style.display='inline-flex';
  ok.style.alignItems='center';
  ok.style.gap='7px';
  discard.style.display='none';
  document.getElementById('confirm-overlay').classList.remove('hidden');
  const cleanup=()=>document.getElementById('confirm-overlay').classList.add('hidden');
  ok.onclick=()=>{cleanup();onOk();};
  document.getElementById('confirm-cancel').onclick=cleanup;
}
function askSave(onSave, onDiscard){
  document.getElementById('confirm-msg').textContent='Möchtest du die Änderungen speichern?';
  const ok=document.getElementById('confirm-ok');
  const discard=document.getElementById('confirm-discard');
  ok.textContent='Speichern'; ok.className='btn-primary';
  discard.style.display=''; discard.textContent='Verwerfen';
  document.getElementById('confirm-overlay').classList.remove('hidden');
  const cleanup=()=>{document.getElementById('confirm-overlay').classList.add('hidden');discard.style.display='none';};
  ok.onclick=()=>{cleanup();onSave();};
  discard.onclick=()=>{cleanup();onDiscard();};
  document.getElementById('confirm-cancel').onclick=cleanup;
}

function statusBadge(status){
  const done=status==='done';
  return `<span class="badge ${done?'badge-done':'badge-active'}">${done?'Abgeschlossen':'Aktiv'}</span>`;
}

function metaItem(label,value,{raw=false,wide=false,mono=false}={}){
  if(value===undefined||value===null||value==='')return '';
  const body=raw?value:esc(value);
  return `<span${wide?' style="width:100%"':''}><span style="font-weight:600;color:var(--text)">${esc(label)}:</span> <span${mono?` style="font-family:'IBM Plex Mono',monospace"`:''}>${body}</span></span>`;
}

function metaRow(items,style=''){
  const html=items.filter(Boolean).join('');
  return html?`<div style="font-size:13px;color:var(--text2);display:flex;flex-wrap:wrap;gap:5px 14px;align-items:center;${style}">${html}</div>`:'';
}

function inlineIconButton(label,icon,action,{cls='',style=''}={}){
  return `<button ${cls?`class="${cls}"`:''} onclick="${action}" style="display:inline-flex;align-items:center;gap:7px;${style}">${icon}${esc(label)}</button>`;
}

function severityBadge(severity){
  if(!severity)return '–';
  return `<span class="sev-pill sev-pill-audit" style="background:${SEV.bg[severity]};color:${SEV.fg[severity]}">${SEV.label[severity]}</span>`;
}

function severityButton(n,selected,action,extraClass=''){
  return `<button type="button" class="audit-sev-btn${extraClass?` ${extraClass}`:''}" data-sev="${n}"
    style="padding:7px 16px;border:2px solid ${selected?SEV.fg[n]:'transparent'};background:${SEV.bg[n]};color:${SEV.fg[n]};font-size:13px;opacity:${selected?1:.4};white-space:nowrap"
    onclick="${action}">${SEV.label[n]}</button>`;
}

function typeButton(type,selected,action,extraClass=''){
  return `<button class="type-btn${extraClass?` ${extraClass}`:''}${selected?' sel':''}" data-type="${type}" style="background:${T.bg[type]};color:${T.fg[type]}" onclick="${action}">${typeIcon(type,14)}${type}</button>`;
}

function typeBadge(type,{label=true,iconSize=14,cls='report-pill'}={}){
  if(!type)return '–';
  return `<span class="${cls}" style="background:${T.bg[type]};color:${T.fg[type]}" title="${esc(type)}" aria-label="${esc(type)}">${typeIcon(type,iconSize)}${label?esc(type):''}</span>`;
}

function statCard(st){
  return `<div class="stat-card" style="background:${st.bg};color:${st.fg}">${st.type?`<div class="stat-icon">${summaryTypeIcon(st.type,26)}</div>`:''}<div class="stat-val">${st.val}</div><div class="stat-label">${esc(st.lbl)}</div></div>`;
}

function hasUnsavedEdits(){
  return typeof hasUnsavedFindingEdit==='function' && hasUnsavedFindingEdit();
}

function confirmLeaveIfDirty(onLeave){
  if(!hasUnsavedEdits()){onLeave();return;}
  ask('Du hast ungespeicherte Änderungen. Möchtest du diese verwerfen?', onLeave, 'Verwerfen', '');
}

function runNavAction(action){
  confirmLeaveIfDirty(()=>{new Function(action)();});
}
