let _findingSev=null;
let _findingCriteria=[];
let _findingMode='view'; // 'view' | 'edit' — read by router for hash
let _findingEditSnapshot=null;
let _auditLightboxImageId=null;
const AUDIT_IMAGE_BUCKET='audit-finding-images';
const AUDIT_IMAGE_MAX_BYTES=5*1024*1024;
const AUDIT_IMAGE_MAX_EDGE=1600;
const AUDIT_IMAGE_QUALITY=0.82;

function auditImageSizeLabel(bytes){
  if(!bytes)return '';
  if(bytes<1024*1024)return `${Math.round(bytes/1024)} KB`;
  return `${(bytes/1024/1024).toFixed(1).replace('.',',')} MB`;
}

function renderAuditImageGallery(findingId,{editable=false}={}){
  const imgs=imagesForFinding(findingId);
  if(!editable&&!imgs.length)return '';
  const empty=editable?`<div class="audit-img-empty">Noch keine Bilder hinzugefügt.</div>`:'';
  const items=imgs.map(img=>`<div class="audit-img-card">
    <button type="button" class="audit-img-frame" onclick="openAuditImageLightbox('${img.id}')">
      <img class="audit-img-thumb" data-img-id="${esc(img.id)}" data-path="${esc(img.storagePath)}" alt="${esc(img.fileName)||'Finding-Bild'}">
    </button>
    <div class="audit-img-meta">
      <span>${esc(img.fileName)||'Bild'}</span>
      ${img.sizeBytes?`<span>${auditImageSizeLabel(img.sizeBytes)}</span>`:''}
    </div>
    ${editable?`<button class="btn-ghost btn-sm audit-img-delete" onclick="deleteAuditImage('${img.id}')" title="Bild löschen">${trashIcon(14)}Löschen</button>`:''}
  </div>`).join('');
  return `<div id="af-image-gallery" class="audit-img-grid">${items||empty}</div>`;
}

async function hydrateAuditImageThumbs(){
  const thumbs=[...document.querySelectorAll('.audit-img-thumb[data-path]')];
  await Promise.all(thumbs.map(async img=>{
    const path=img.dataset.path;
    if(!path||img.dataset.loaded)return;
    const {data,error}=await db.storage.from(AUDIT_IMAGE_BUCKET).createSignedUrl(path,60*60);
    if(error){
      img.closest('.audit-img-card')?.classList.add('audit-img-error');
      return;
    }
    img.src=data.signedUrl;
    img.dataset.loaded='1';
  }));
}

function ensureAuditImageLightbox(){
  let lb=document.getElementById('audit-image-lightbox');
  if(lb)return lb;
  lb=document.createElement('div');
  lb.id='audit-image-lightbox';
  lb.className='audit-lightbox hidden';
  lb.innerHTML=`<button type="button" class="audit-lightbox-backdrop" onclick="closeAuditImageLightbox()" aria-label="Bild schließen"></button>
    <div class="audit-lightbox-panel">
      <button type="button" class="audit-lightbox-close" onclick="closeAuditImageLightbox()" aria-label="Schließen">×</button>
      <button type="button" class="audit-lightbox-nav audit-lightbox-prev" onclick="showAdjacentAuditImage(-1)" aria-label="Vorheriges Bild">‹</button>
      <img id="audit-lightbox-img" class="audit-lightbox-img" alt="">
      <button type="button" class="audit-lightbox-nav audit-lightbox-next" onclick="showAdjacentAuditImage(1)" aria-label="Nächstes Bild">›</button>
      <div id="audit-lightbox-caption" class="audit-lightbox-caption"></div>
    </div>`;
  document.body.appendChild(lb);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')closeAuditImageLightbox();
    if(event.key==='ArrowLeft')showAdjacentAuditImage(-1);
    if(event.key==='ArrowRight')showAdjacentAuditImage(1);
  });
  return lb;
}

async function openAuditImageLightbox(id){
  const img=auditFindingImages.find(x=>x.id===id);
  if(!img)return;
  _auditLightboxImageId=id;
  const lb=ensureAuditImageLightbox();
  const imageEl=document.getElementById('audit-lightbox-img');
  const cap=document.getElementById('audit-lightbox-caption');
  imageEl.removeAttribute('src');
  imageEl.alt=img.fileName||'Finding-Bild';
  cap.textContent=img.caption||img.fileName||'';
  lb.classList.remove('hidden');
  const thumb=[...document.querySelectorAll('.audit-img-thumb[data-img-id]')].find(el=>el.dataset.imgId===id);
  if(thumb?.src){
    imageEl.src=thumb.src;
    return;
  }
  const {data,error}=await db.storage.from(AUDIT_IMAGE_BUCKET).createSignedUrl(img.storagePath,60*60);
  if(error){
    cap.textContent='Bild konnte nicht geladen werden.';
    return;
  }
  imageEl.src=data.signedUrl;
}

function showAdjacentAuditImage(dir){
  const lb=document.getElementById('audit-image-lightbox');
  if(!lb||lb.classList.contains('hidden')||!_auditLightboxImageId)return;
  const current=auditFindingImages.find(x=>x.id===_auditLightboxImageId);
  if(!current)return;
  const imgs=imagesForFinding(current.findingId);
  if(imgs.length<2)return;
  const idx=imgs.findIndex(x=>x.id===_auditLightboxImageId);
  const next=imgs[(idx+dir+imgs.length)%imgs.length];
  if(next)openAuditImageLightbox(next.id);
}

function closeAuditImageLightbox(){
  const lb=document.getElementById('audit-image-lightbox');
  if(!lb)return;
  lb.classList.add('hidden');
  _auditLightboxImageId=null;
  document.getElementById('audit-lightbox-img')?.removeAttribute('src');
}

function refreshAuditImageGallery(findingId){
  const wrap=document.getElementById('af-image-gallery');
  if(!wrap)return;
  const html=renderAuditImageGallery(findingId,{editable:true});
  const tmp=document.createElement('div');
  tmp.innerHTML=html;
  wrap.replaceWith(tmp.firstElementChild);
  hydrateAuditImageThumbs();
}

function loadImageForCompression(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Bild konnte nicht gelesen werden.'));};
    img.src=url;
  });
}

function canvasToBlob(canvas,type,quality){
  return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
}

async function compressAuditImage(file){
  if(!file.type.startsWith('image/'))throw new Error(`${file.name}: keine Bilddatei.`);
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error(`${file.name}: nur PNG, JPEG oder WebP sind erlaubt.`);
  const img=await loadImageForCompression(file);
  const scale=Math.min(1,AUDIT_IMAGE_MAX_EDGE/Math.max(img.naturalWidth,img.naturalHeight));
  const w=Math.max(1,Math.round(img.naturalWidth*scale));
  const h=Math.max(1,Math.round(img.naturalHeight*scale));
  const canvas=document.createElement('canvas');
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(img,0,0,w,h);
  let blob=await canvasToBlob(canvas,'image/webp',AUDIT_IMAGE_QUALITY);
  let mime='image/webp',ext='webp';
  if(!blob){
    blob=await canvasToBlob(canvas,'image/jpeg',AUDIT_IMAGE_QUALITY);
    mime='image/jpeg';ext='jpg';
  }
  if(!blob)throw new Error(`${file.name}: Bild konnte nicht komprimiert werden.`);
  if(blob.size>AUDIT_IMAGE_MAX_BYTES)throw new Error(`${file.name}: Bild ist nach Komprimierung größer als 5 MB.`);
  return {blob,mime,ext,width:w,height:h};
}

async function uploadAuditFindingImages(findingId,auditId,fileList){
  const files=[...fileList];
  const input=document.getElementById('af-image-input');
  const status=document.getElementById('af-image-upload-status');
  if(input)input.value='';
  if(!files.length)return;
  if(!currentUser?.id){alert('Bitte neu anmelden, damit Bilder hochgeladen werden können.');return;}
  const existing=imagesForFinding(findingId);
  if(existing.length+files.length>5){alert('Bitte maximal 5 Bilder pro Finding hinzufügen.');return;}
  if(status)status.textContent='Bilder werden vorbereitet…';
  try{
    for(const file of files){
      const imgId=genId();
      const converted=await compressAuditImage(file);
      const path=`${currentUser.id}/${auditId}/${findingId}/${imgId}.${converted.ext}`;
      const {error:uploadError}=await db.storage.from(AUDIT_IMAGE_BUCKET).upload(path,converted.blob,{contentType:converted.mime});
      throwDbError('Bild hochladen',uploadError);
      const img={
        id:imgId,auditId,findingId,storagePath:path,
        fileName:file.name,mimeType:converted.mime,sizeBytes:converted.blob.size,
        caption:'',sortOrder:imagesForFinding(findingId).length,createdAt:ts()
      };
      try{
        await saveAuditFindingImageToDb(img);
      } catch(err){
        await db.storage.from(AUDIT_IMAGE_BUCKET).remove([path]);
        throw err;
      }
      auditFindingImages=[...auditFindingImages,img];
    }
    refreshAuditImageGallery(findingId);
    if(status)status.textContent='Upload abgeschlossen.';
  } catch(err){
    console.error(err);
    if(status)status.textContent='';
    alert('Bild-Upload fehlgeschlagen.\n\n'+(err?.message||err));
  }
}

function setAuditImageDropActive(on){
  const dz=document.getElementById('af-image-dropzone');
  if(dz)dz.classList.toggle('is-dragover',!!on);
}

function handleAuditImageDrag(event,on){
  event.preventDefault();
  event.stopPropagation();
  setAuditImageDropActive(on);
}

function handleAuditImageDrop(event,findingId,auditId){
  event.preventDefault();
  event.stopPropagation();
  setAuditImageDropActive(false);
  const files=event.dataTransfer?.files;
  if(files?.length)uploadAuditFindingImages(findingId,auditId,files);
}

function deleteAuditImage(id){
  const img=auditFindingImages.find(x=>x.id===id);
  if(!img)return;
  ask('Bild wirklich löschen?',async()=>{
    try{
      await deleteAuditFindingImageFromDb(img);
      auditFindingImages=auditFindingImages.filter(x=>x.id!==id);
      refreshAuditImageGallery(img.findingId);
    } catch(err){
      reportSaveError(err);
    }
  });
}

function getFindingEditDraft(){
  if(_findingMode!=='edit')return null;
  const a=activeAudit();if(!a)return null;
  const freeText=document.getElementById('af-criterion-text');
  const criterion=freeText
    ?freeText.value.trim()
    :JSON.stringify([..._findingCriteria].sort());
  return {
    title:document.getElementById('af-title')?.value?.trim()||'',
    description:document.getElementById('af-description')?.value||'',
    recommendation:document.getElementById('af-recommendation')?.value||'',
    severity:_findingSev,
    criterion
  };
}

function hasUnsavedFindingEdit(){
  if(_findingMode!=='edit'||!_findingEditSnapshot)return false;
  const draft=getFindingEditDraft();
  return !!draft && JSON.stringify(draft)!==_findingEditSnapshot;
}

function renderAuditFindingView(){
  const a=activeAudit();if(!a){renderAuditList();return;}
  const f=activeFinding();if(!f){renderAuditDetail();return;}
  const byDate=[...findingsForAudit(a.id)].sort((x,y)=>new Date(x.createdAt)-new Date(y.createdAt));
  const num=byDate.findIndex(x=>x.id===f.id)+1;

  // Navigation order mirrors the current list sort
  const allSorted=[...findingsForAudit(a.id)].sort((x,y)=>{
    let cmp=_auditSortBy==='severity'?x.severity-y.severity:new Date(x.createdAt)-new Date(y.createdAt);
    return _auditSortDir==='asc'?cmp:-cmp;
  });
  const idx=allSorted.findIndex(x=>x.id===f.id);
  const prev=idx>0?allSorted[idx-1]:null;
  const next=idx<allSorted.length-1?allSorted[idx+1]:null;

  setNav([
    {label:'UX Audit',action:'renderDashboard()'},
    {label:'Audits',action:'renderAuditList()'},
    {label:a.name||'Audit',action:`goAuditDetail('${a.id}')`},
    {label:`#${num} ${f.title||'Finding'}`,action:''}
  ]);
  _findingMode='view';
  _findingEditSnapshot=null;
  show('audit-finding');
  const el=document.getElementById('v-audit-finding');

  const criteria=parseCriteria(f.criterion);
  const hasSets=(a.heuristicSets||[]).length>0;
  let criteriaDisplay='';
  if(hasSets){
    if(criteria.length===0){
      criteriaDisplay=`<span style="color:var(--text3);font-size:14px">–</span>`;
    } else {
      let groups='';
      (a.heuristicSets||[]).forEach(setKey=>{
        const set=AUDIT_HEURISTIC_SETS[setKey];if(!set)return;
        const matching=set.criteria.filter(c=>criteria.includes(c.id));
        if(!matching.length)return;
        const chips=matching.map(c=>`<span style="padding:5px 12px;border-radius:var(--r);font-size:12px;font-weight:500;line-height:1.2;border:1.5px solid ${AUDIT_COLOR};background:${AUDIT_BG};color:${AUDIT_COLOR};white-space:nowrap;display:inline-flex;align-items:center;vertical-align:middle">${esc(c.label)}</span>`).join('');
        groups+=`<div style="margin-bottom:12px">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:6px">${esc(set.label)}</div>
          <div style="display:flex;flex-direction:column;align-items:flex-start;gap:5px">${chips}</div>
        </div>`;
      });
      criteriaDisplay=groups;
    }
  } else {
    criteriaDisplay=`<span style="font-size:14px">${esc(f.criterion)||'–'}</span>`;
  }

  const prevBtn=prev
    ?`<button onclick="goAuditFinding('${prev.id}')" style="display:flex;align-items:center;gap:6px">← Vorheriges</button>`
    :`<button disabled style="opacity:.3;cursor:default">← Vorheriges</button>`;
  const nextBtn=next
    ?`<button onclick="goAuditFinding('${next.id}')" style="display:flex;align-items:center;gap:6px">Nächstes →</button>`
    :`<button disabled style="opacity:.3;cursor:default">Nächstes →</button>`;
  const imageGallery=renderAuditImageGallery(f.id);

  el.innerHTML=`<div class="page" style="max-width:1040px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;gap:10px">
      <button onclick="goAuditDetail('${a.id}')">← Zur Liste</button>
      ${inlineIconButton('Bearbeiten',editIcon(),'renderAuditFinding()')}
    </div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:32px;align-items:start">
      <div>
        <div class="card">
          <div style="margin-bottom:24px">
            <div style="font-size:12px;font-weight:600;color:var(--text3);margin-bottom:4px">#${num}</div>
            <h2 style="margin-bottom:0">${esc(f.title)||'(Ohne Titel)'}</h2>
          </div>
          ${f.description?`<div style="margin-bottom:24px">
            <div class="lbl" style="display:block;font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px;letter-spacing:.03em">Beschreibung</div>
            <div style="font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(f.description)}</div>
          </div>`:''}
          ${f.recommendation?`<div style="margin-bottom:0">
            <div class="lbl" style="display:block;font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px;letter-spacing:.03em">Empfehlung</div>
            <div style="font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(f.recommendation)}</div>
          </div>`:''}
        </div>
        ${imageGallery?`<div class="card">
          <h3>Bilder</h3>
          ${imageGallery}
        </div>`:''}
      </div>
      <div>
        <div class="card">
          <h3>Einordnung</h3>
          <div style="margin-bottom:20px">
            <div class="lbl" style="display:block;font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px;letter-spacing:.03em">Schweregrad</div>
            ${severityBadge(f.severity)}
          </div>
          ${criteriaDisplay?`<div class="lbl" style="display:block;font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px;letter-spacing:.03em">Kriterium</div>${criteriaDisplay}`:''}
        </div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-top:24px">${prevBtn}${nextBtn}</div>
  </div>`;
  hydrateAuditImageThumbs();
}

function renderAuditFinding(){
  const a=activeAudit();if(!a){renderAuditList();return;}
  const f=activeFinding()||{id:null,auditId:a.id,criterion:'',title:'',description:'',severity:null,recommendation:'',createdAt:null};
  const isNew=!f.id;
  _findingSev=f.severity??null;
  _findingCriteria=parseCriteria(f.criterion);
  setNav([
    {label:'UX Audit',action:'renderDashboard()'},
    {label:'Audits',action:'renderAuditList()'},
    {label:a.name||'Audit',action:`goAuditDetail('${a.id}')`},
    {label:isNew?'Neues Finding':f.title||'Finding',action:''}
  ]);
  _findingMode='edit';
  show('audit-finding');
  const el=document.getElementById('v-audit-finding');

  const hasSets=(a.heuristicSets||[]).length>0;
  let criterionField='';
  if(hasSets){
    let groups='';
    (a.heuristicSets||[]).forEach(setKey=>{
      const set=AUDIT_HEURISTIC_SETS[setKey];if(!set)return;
      const chips=set.criteria.map(c=>{
        const sel=_findingCriteria.includes(c.id);
        return`<button type="button" id="crit-${c.id}" class="crit-chip"
          style="padding:7px 12px;border-radius:var(--r);font-size:12px;font-weight:500;line-height:1.2;cursor:pointer;white-space:nowrap;text-align:left;border:1.5px solid ${sel?AUDIT_COLOR:'var(--border)'};background:${sel?AUDIT_BG:'var(--surface)'};color:${sel?AUDIT_COLOR:'var(--text2)'};display:inline-flex;align-items:center;vertical-align:middle"
          onclick="toggleCriterion('${c.id}')">${esc(c.label)}</button>`;
      }).join('');
      groups+=`<div style="margin-bottom:12px">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:6px">${esc(set.label)}</div>
        <div style="display:flex;flex-direction:column;align-items:flex-start;gap:5px">${chips}</div>
      </div>`;
    });
    criterionField=groups;
  } else {
    criterionField=`<input type="text" id="af-criterion-text" value="${esc(f.criterion)}" placeholder="Kein Kriteriensatz konfiguriert – Freitext">`;
  }

  const sevBtns=[1,2,3,4,5].map(n=>severityButton(n,n===_findingSev,`setAfSev(${n})`)).join('');

  const rightCol=hasSets
    ?criterionField
    :`<div class="field"><label class="lbl">Kriterium</label>${criterionField}</div>`;
  const imageControls=isNew
    ?`<div class="audit-img-empty">Bilder können nach dem ersten Speichern hinzugefügt werden.</div>`
    :`<div class="field" style="margin-bottom:12px">
        <label class="lbl">Bilder hinzufügen</label>
        <input type="file" id="af-image-input" class="audit-img-input" accept="image/png,image/jpeg,image/webp" multiple onchange="uploadAuditFindingImages('${f.id}','${a.id}',this.files)">
        <button type="button" id="af-image-dropzone" class="audit-img-dropzone"
          onclick="document.getElementById('af-image-input')?.click()"
          ondragover="handleAuditImageDrag(event,true)"
          ondragenter="handleAuditImageDrag(event,true)"
          ondragleave="handleAuditImageDrag(event,false)"
          ondrop="handleAuditImageDrop(event,'${f.id}','${a.id}')">
          <span class="audit-img-drop-title">Bilder hier ablegen</span>
          <span class="audit-img-drop-sub">oder klicken zum Auswählen · PNG, JPEG, WebP · max. 5 Bilder</span>
        </button>
        <div id="af-image-upload-status" style="font-size:12px;color:var(--text3);margin-top:6px"></div>
      </div>
      ${renderAuditImageGallery(f.id,{editable:true})}`;
  const cancelAction=isNew
    ?`confirmLeaveIfDirty(()=>goAuditDetail('${a.id}'))`
    :`confirmLeaveIfDirty(()=>renderAuditFindingView())`;

  el.innerHTML=`<div class="page" style="max-width:1040px">
    <h2 style="margin-bottom:24px">${isNew?'Neues Finding':'Finding bearbeiten'}</h2>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:32px;align-items:start">
      <div>
        <div class="card">
          <h3>Finding-Details</h3>
          <div class="field"><label class="lbl">Titel</label>
            <input type="text" id="af-title" value="${esc(f.title)}" placeholder="Kurze Beschreibung des Problems"></div>
          <div class="field">
            <label class="lbl">Schweregrad</label>
            <div style="display:flex;gap:8px;flex-wrap:nowrap;align-items:center;overflow-x:auto;padding-bottom:2px">${sevBtns}</div>
          </div>
          <div class="field"><label class="lbl">Beschreibung</label>
            <textarea id="af-description" rows="14" placeholder="Was wurde beobachtet? Wo tritt das Problem auf?">${esc(f.description)}</textarea></div>
          <div class="field" style="margin-bottom:0"><label class="lbl">Empfehlung</label>
            <textarea id="af-recommendation" rows="8" placeholder="Welche Maßnahme wird empfohlen?">${esc(f.recommendation)}</textarea></div>
        </div>
        <div class="card">
          <h3>Bilder</h3>
          ${imageControls}
        </div>
        <div style="display:flex;gap:10px;justify-content:space-between;margin-top:8px">
          ${!isNew?inlineIconButton('Finding löschen',trashIcon(),`deleteAuditFindingConfirm('${f.id}','${a.id}')`,{cls:'btn-danger'}):`<div></div>`}
          <div style="display:flex;gap:10px">
            <button onclick="${cancelAction}">Abbrechen</button>
            <button class="btn-primary" style="background:${AUDIT_COLOR};border-color:${AUDIT_COLOR}" onclick="saveAuditFinding('${isNew?'':f.id}','${a.id}')">Speichern</button>
          </div>
        </div>
      </div>
      <div>
        <div class="card">
          <h3>Kriterium${hasSets?' (mehrere möglich)':''}</h3>
          <div style="margin-top:2px">${rightCol}</div>
        </div>
      </div>
    </div>
  </div>`;
  _findingEditSnapshot=JSON.stringify(getFindingEditDraft());
  hydrateAuditImageThumbs();
}

function toggleCriterion(id){
  if(_findingCriteria.includes(id)){
    _findingCriteria=_findingCriteria.filter(x=>x!==id);
  } else {
    _findingCriteria=[..._findingCriteria,id];
  }
  const btn=document.getElementById('crit-'+id);
  if(!btn)return;
  const sel=_findingCriteria.includes(id);
  btn.style.border=`1.5px solid ${sel?AUDIT_COLOR:'var(--border)'}`;
  btn.style.background=sel?AUDIT_BG:'var(--surface)';
  btn.style.color=sel?AUDIT_COLOR:'var(--text2)';
}

function setAfSev(n){
  _findingSev=n;
  document.querySelectorAll('#v-audit-finding .audit-sev-btn').forEach(btn=>{
    const i=Number(btn.dataset.sev);
    btn.style.border=`2px solid ${i===n?SEV.fg[i]:'transparent'}`;
    btn.style.opacity=i===n?'1':'0.4';
  });
}

async function saveAuditFinding(existingId,auditId){
  const title=document.getElementById('af-title').value.trim();
  const description=document.getElementById('af-description').value.trim();
  const recommendation=document.getElementById('af-recommendation').value.trim();
  const freeText=document.getElementById('af-criterion-text');
  const criterion=freeText?freeText.value.trim():serializeCriteria(_findingCriteria);
  if(!title){alert('Bitte einen Titel eingeben.');return;}
  if(!_findingSev){alert('Bitte einen Schweregrad auswählen.');return;}
  const existing=existingId?activeFinding():null;
  const f={
    id:existingId||genId(), auditId,
    criterion, title, description, severity:_findingSev, recommendation,
    createdAt:existing?.createdAt||ts()
  };
  try{
    if(existingId){
      await updAuditFinding(f);
    } else {
      auditFindings=[...auditFindings,f];
      await saveAuditFindingToDb(f);
    }
  } catch(err){
    alert('Fehler beim Speichern:\n'+err.message);
    return;
  }
  activeAuditFindingId=f.id;
  _findingEditSnapshot=null;
  if(existingId) renderAuditFindingView();
  else goAuditDetail(auditId);
}

async function deleteAuditFindingConfirm(id,auditId){
  ask('Finding wirklich löschen?',async()=>{
    try{
      const imgs=imagesForFinding(id);
      if(imgs.length){
        const {error:storageError}=await db.storage.from(AUDIT_IMAGE_BUCKET).remove(imgs.map(img=>img.storagePath));
        throwDbError('Bilddateien loeschen',storageError);
      }
      await deleteAuditFindingFromDb(id);
      auditFindings=auditFindings.filter(f=>f.id!==id);
      auditFindingImages=auditFindingImages.filter(img=>img.findingId!==id);
      activeAuditFindingId=null;
      goAuditDetail(auditId);
    } catch(err){
      reportSaveError(err);
    }
  });
}
