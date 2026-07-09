var db = null;
var currentUser = null;
let batteries = [], sessions = [];
let auditList = [], auditFindings = [], auditFindingImages = [];
let _editSnapshot = null, _editDirty = false;
let activeBattId = null, activeSessId = null;
let activeAuditId = null, activeAuditFindingId = null;
const genId = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const ts = () => new Date().toISOString();
const fmtTime = iso => iso?new Date(iso).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}):'';
const fmtDate = d => d?new Date(d+'T12:00:00').toLocaleDateString('de-DE'):'–';
function esc(s){if(s===undefined||s===null)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function activeBatt(){return batteries.find(b=>b.id===activeBattId)||null}
function activeSess(){return sessions.find(s=>s.id===activeSessId)||null}
function battSessions(battId){return sessions.filter(s=>s.batteryId===battId)}
function activeAudit(){return auditList.find(a=>a.id===activeAuditId)||null}
function activeFinding(){return auditFindings.find(f=>f.id===activeAuditFindingId)||null}
function findingsForAudit(id){return auditFindings.filter(f=>f.auditId===id)}
function imagesForFinding(id){return auditFindingImages.filter(img=>img.findingId===id).sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0)||new Date(a.createdAt)-new Date(b.createdAt))}
function reportSaveError(err){
  console.error('Speichern fehlgeschlagen:',err);
  alert('Speichern fehlgeschlagen.\n\n'+(err?.message||err));
}
async function updBatt(b){
  const prev=batteries;
  batteries=batteries.map(x=>x.id===b.id?b:x);
  try{await saveBattToDb(b);}catch(err){batteries=prev;reportSaveError(err);throw err;}
}
async function updSess(s){
  const prev=sessions;
  sessions=sessions.map(x=>x.id===s.id?s:x);
  try{await saveSessToDb(s);}catch(err){sessions=prev;reportSaveError(err);throw err;}
}
async function updAudit(a){
  const prev=auditList;
  auditList=auditList.map(x=>x.id===a.id?a:x);
  try{await saveAuditToDb(a);}catch(err){auditList=prev;reportSaveError(err);throw err;}
}
async function updAuditFinding(f){
  const prev=auditFindings;
  auditFindings=auditFindings.map(x=>x.id===f.id?f:x);
  try{await saveAuditFindingToDb(f);}catch(err){auditFindings=prev;reportSaveError(err);throw err;}
}
function show(v){['login','dashboard','batteries','battery-detail','battery-edit','session-setup','session-test','session-report','audit','audit-detail','audit-edit','audit-finding'].forEach(n=>document.getElementById('v-'+n).classList.toggle('hidden',n!==v));updateHash(v);}

function showLoadingOverlay(on){
  let el=document.getElementById('loading-overlay');
  if(!el){
    el=document.createElement('div');
    el.id='loading-overlay';
    el.style.cssText='position:fixed;inset:0;background:rgba(245,244,240,.85);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:IBM Plex Sans,sans-serif';
    el.innerHTML='<div style="width:36px;height:36px;border:3px solid #e0ddd6;border-top-color:#2d2a8a;border-radius:50%;animation:spin 0.7s linear infinite"></div><div style="font-size:14px;color:#6b6860">Daten werden geladen…</div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
    document.body.appendChild(el);
  }
  el.style.display=on?'flex':'none';
}
