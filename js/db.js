function throwDbError(action,error){
  if(error) throw new Error(`${action}: ${error.message||error}`);
}

async function expectDb(action,request){
  const {error}=await request;
  throwDbError(action,error);
}

function enqueueSave(queue,key,saveFn){
  const prev=queue.get(key)||Promise.resolve();
  const next=prev.catch(()=>{}).then(saveFn);
  const tracked=next.finally(()=>{if(queue.get(key)===tracked)queue.delete(key);});
  queue.set(key,tracked);
  return tracked;
}

const battSaveQueue=new Map();
const sessSaveQueue=new Map();

async function load(){
  showLoadingOverlay(true);
  try {
    const {data:studyRows,error:e1}=await db.from('studies').select('*').order('created_at',{ascending:false});
    if(e1)throw e1;
    const {data:stepRows,error:e2}=await db.from('steps').select('*').order('sort_order');
    if(e2)throw e2;
    const {data:sessRows,error:e3}=await db.from('sessions').select('*').order('created_at',{ascending:false});
    if(e3)throw e3;
    const {data:entryRows,error:e4}=await db.from('entries').select('*').order('timestamp');
    if(e4)throw e4;
    const {data:auditRows,error:e5}=await db.from('audits').select('*').order('created_at',{ascending:false});
    if(e5)throw e5;
    const {data:findingRows,error:e6}=await db.from('audit_findings').select('*').order('created_at',{ascending:true});
    if(e6)throw e6;
    const {data:findingImageRows,error:e7}=await db.from('audit_finding_images').select('*').order('sort_order',{ascending:true});
    if(e7)throw e7;

    batteries=(studyRows||[]).map(r=>({
      id:r.id, name:r.name||'', product:r.product||'', link:r.link||'', description:r.description||'',
      status:r.status||'active', createdAt:r.created_at,
      steps:(stepRows||[]).filter(s=>s.study_id===r.id)
        .map(s=>({id:s.id,title:s.title||'',description:s.description||'',chapter:s.chapter||1,sort_order:s.sort_order||0}))
    }));
    sessions=(sessRows||[]).map(r=>({
      id:r.id, batteryId:r.study_id, personName:r.person_name||'', personCode:r.person_code||'',
      personNotes:r.person_notes||'', tester:r.tester||'', date:r.date||'',
      status:r.status||'active', createdAt:r.created_at,
      entries:(entryRows||[]).filter(e=>e.session_id===r.id)
        .map(e=>({id:e.id,timestamp:e.timestamp,type:e.type,severity:e.severity,text:e.text||'',stepId:e.step_id||null}))
    }));
    auditList=(auditRows||[]).map(r=>({
      id:r.id, name:r.name||'', subject:r.subject||'', auditor:r.auditor||'',
      date:r.date||'', heuristicSets:r.heuristic_sets||[], status:r.status||'active',
      createdAt:r.created_at
    }));
    auditFindings=(findingRows||[]).map(r=>({
      id:r.id, auditId:r.audit_id, criterion:r.criterion||'',
      title:r.title||'', description:r.description||'',
      severity:r.severity||3, recommendation:r.recommendation||'',
      createdAt:r.created_at
    }));
    auditFindingImages=(findingImageRows||[]).map(r=>({
      id:r.id, auditId:r.audit_id, findingId:r.finding_id,
      storagePath:r.storage_path||'', fileName:r.file_name||'',
      mimeType:r.mime_type||'', sizeBytes:r.size_bytes||0,
      caption:r.caption||'', sortOrder:r.sort_order||0,
      createdAt:r.created_at
    }));
  } catch(err){
    console.error('Fehler beim Laden:',err);
    alert('Verbindung zu Supabase fehlgeschlagen.\n\n'+err.message);
  }
  showLoadingOverlay(false);
}

async function saveBattToDb(b){
  return enqueueSave(battSaveQueue,b.id,()=>saveBattToDbNow(b));
}

async function saveBattToDbNow(b){
  await expectDb('Studie speichern', db.from('studies').upsert({
    id:b.id, name:b.name||'', product:b.product||'',
    link:b.link||'', description:b.description||'',
    status:b.status||'active', created_at:b.createdAt||ts(), user_id:currentUser?.id
  }));
  await expectDb('Leitfaden-Schritte ersetzen', db.from('steps').delete().eq('study_id',b.id));
  if((b.steps||[]).length>0){
    await expectDb('Leitfaden-Schritte speichern', db.from('steps').insert((b.steps||[]).map((s,i)=>({
      id:s.id, study_id:b.id, title:s.title||'', description:s.description||'',
      chapter:s.chapter||1, sort_order:i
    }))));
  }
}

async function saveSessToDb(s){
  return enqueueSave(sessSaveQueue,s.id,()=>saveSessToDbNow(s));
}

async function saveSessToDbNow(s){
  await expectDb('Session speichern', db.from('sessions').upsert({
    id:s.id, study_id:s.batteryId, person_name:s.personName||'', person_code:s.personCode||'',
    person_notes:s.personNotes||'', tester:s.tester||'',
    date:s.date||null, status:s.status||'active',
    created_at:s.createdAt||ts(), user_id:currentUser?.id
  }));
  await expectDb('Session-Eintraege ersetzen', db.from('entries').delete().eq('session_id',s.id));
  if((s.entries||[]).length>0){
    await expectDb('Session-Eintraege speichern', db.from('entries').insert((s.entries||[]).map(e=>({
      id:e.id, session_id:s.id, step_id:e.stepId||null,
      type:e.type||null, severity:e.severity||null,
      text:e.text||'', timestamp:e.timestamp||ts()
    }))));
  }
}

async function deleteBattFromDb(id){await expectDb('Studie loeschen', db.from('studies').delete().eq('id',id));}
async function deleteSessFromDb(id){await expectDb('Session loeschen', db.from('sessions').delete().eq('id',id));}

async function saveAuditToDb(a){
  await expectDb('Audit speichern', db.from('audits').upsert({
    id:a.id, name:a.name||'', subject:a.subject||'', auditor:a.auditor||'',
    date:a.date||'', heuristic_sets:a.heuristicSets||[],
    status:a.status||'active', created_at:a.createdAt||ts(),
    user_id:currentUser?.id
  }));
}
async function saveAuditFindingToDb(f){
  await expectDb('Finding speichern', db.from('audit_findings').upsert({
    id:f.id, audit_id:f.auditId, criterion:f.criterion||'',
    title:f.title||'', description:f.description||'',
    severity:f.severity||3, recommendation:f.recommendation||'',
    created_at:f.createdAt||ts(), user_id:currentUser?.id
  }));
}
async function saveAuditFindingImageToDb(img){
  await expectDb('Bild speichern', db.from('audit_finding_images').upsert({
    id:img.id, audit_id:img.auditId, finding_id:img.findingId,
    storage_path:img.storagePath, file_name:img.fileName||'',
    mime_type:img.mimeType||'', size_bytes:img.sizeBytes||0,
    caption:img.caption||'', sort_order:img.sortOrder||0,
    created_at:img.createdAt||ts(), user_id:currentUser?.id
  }));
}
async function deleteAuditFromDb(id){await expectDb('Audit loeschen', db.from('audits').delete().eq('id',id));}
async function deleteAuditFindingFromDb(id){await expectDb('Finding loeschen', db.from('audit_findings').delete().eq('id',id));}
async function deleteAuditFindingImageFromDb(img){
  if(img?.storagePath){
    const {error:storageError}=await db.storage.from('audit-finding-images').remove([img.storagePath]);
    throwDbError('Bilddatei loeschen',storageError);
  }
  await expectDb('Bild-Metadaten loeschen', db.from('audit_finding_images').delete().eq('id',img.id));
}
