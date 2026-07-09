let _auditSortBy='number';
let _auditSortDir='asc';

function setAuditSort(by){
  if(_auditSortBy===by){
    _auditSortDir=_auditSortDir==='asc'?'desc':'asc';
  } else {
    _auditSortBy=by;
    _auditSortDir=by==='severity'?'desc':'asc';
  }
  renderAuditDetail();
}

function auditFindingNumber(f,allSortedByDate){
  return allSortedByDate.findIndex(x=>x.id===f.id)+1;
}

function renderAuditDetail(){
  const a=activeAudit();if(!a){renderAuditList();return;}
  setNav([
    {label:'UX Audit',action:'renderDashboard()'},
    {label:'Audits',action:'renderAuditList()'},
    {label:a.name||'Audit',action:`goAuditDetail('${a.id}')`}
  ]);
  show('audit-detail');
  const el=document.getElementById('v-audit-detail');
  const findings=findingsForAudit(a.id);
  const sets=(a.heuristicSets||[]).map(s=>AUDIT_HEURISTIC_SETS[s]?.label||s).join(' · ');

  // Stable number = position in creation-date order
  const byDate=[...findings].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));

  const sevCounts={1:0,2:0,3:0,4:0,5:0};
  findings.forEach(f=>{sevCounts[f.severity]=(sevCounts[f.severity]||0)+1;});
  const stats=[
    {val:findings.length,lbl:'Findings gesamt',bg:'#f3f4f6',fg:'#374151'},
    ...[5,4,3,2,1].map(n=>({val:sevCounts[n],lbl:SEV.label[n],bg:SEV.bg[n],fg:SEV.fg[n]})),
  ];

  const sorted=[...findings].sort((a,b)=>{
    let cmp=_auditSortBy==='severity'?a.severity-b.severity:new Date(a.createdAt)-new Date(b.createdAt);
    return _auditSortDir==='asc'?cmp:-cmp;
  });

  function sortIcon(col){
    const active=_auditSortBy===col;
    const color=active?AUDIT_COLOR:'var(--text3)';
    const opacity=active?1:.75;
    if(!active)return`<span style="display:inline-flex;margin-left:4px;color:${color};opacity:${opacity};line-height:1">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M3.5 2.5L6 0.75L8.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 1V5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M8.5 9.5L6 11.25L3.5 9.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 11V7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    </span>`;
    const asc=_auditSortDir==='asc';
    return`<span style="display:inline-flex;margin-left:4px;color:${color};opacity:${opacity};line-height:1">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        ${asc
          ?`<path d="M3 4.25L6 1.25L9 4.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 1.5V10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`
          :`<path d="M3 7.75L6 10.75L9 7.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10.5V1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`}
      </svg>
    </span>`;
  }

  const tableHeader=`<div style="display:flex;align-items:center;gap:20px;padding:9px 22px;border-bottom:1px solid var(--border);background:var(--surface2);">
    <div onclick="setAuditSort('number')" style="width:36px;flex-shrink:0;font-size:11px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;cursor:pointer;user-select:none;display:flex;align-items:center">Nr.${sortIcon('number')}</div>
    <div onclick="setAuditSort('severity')" style="width:116px;flex-shrink:0;font-size:11px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;cursor:pointer;user-select:none;display:flex;align-items:center">Schweregrad${sortIcon('severity')}</div>
    <div style="flex:1;font-size:11px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.06em">Titel</div>
    <div style="width:64px;flex-shrink:0;font-size:11px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;text-align:right">Bilder</div>
  </div>`;

  const findingsHtml=findings.length===0
    ?`<div class="empty" style="padding:40px 20px">Noch keine Findings – füge das erste Finding hinzu</div>`
    :tableHeader+sorted.map(f=>{
      const num=auditFindingNumber(f,byDate);
      const imgCount=imagesForFinding(f.id).length;
      return`<div class="sess-row" onclick="goAuditFinding('${f.id}')" style="gap:20px">
        <span style="font-size:12px;font-weight:600;color:var(--text3);flex-shrink:0;width:36px">#${num}</span>
        <div style="width:116px;flex-shrink:0;display:flex;align-items:center">
          ${severityBadge(f.severity)}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:500;font-size:14px">${esc(f.title)||'(Ohne Titel)'}</div>
          ${f.description?`<div style="font-size:13px;color:var(--text2);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.description)}</div>`:''}
        </div>
        <div style="width:64px;flex-shrink:0;display:flex;justify-content:flex-end">
          ${imgCount?`<span class="audit-img-count" title="${imgCount} Bild${imgCount===1?'':'er'}">${imageIcon(15)}${imgCount}</span>`:''}
        </div>
      </div>`;
    }).join('');

  el.innerHTML=`<div class="page">
    <div class="hdr">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">
          <h1 style="margin-bottom:0">${esc(a.name)||'(Ohne Name)'}</h1>
          ${statusBadge(a.status)}
        </div>
        ${metaRow([
          metaItem('Prüfgegenstand',a.subject),
          metaItem('Prüfer',a.auditor),
          metaItem('Zeitraum',a.date?fmtAuditDate(a.date):''),
          metaItem('Kriterien',sets)
        ])}
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap">
        <button onclick="generateAuditPdf()">PDF-Bericht</button>
        ${inlineIconButton('Bearbeiten',editIcon(),`goAuditEditExisting('${a.id}')`)}
      </div>
    </div>

    ${findings.length>0?`<h3 style="margin-bottom:12px">Zusammenfassung</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:12px;margin-bottom:24px">
      ${stats.map(statCard).join('')}
    </div>`:''}

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <h3 style="margin-bottom:0">Findings</h3>
      <button class="btn-primary btn-action-sm" style="background:${AUDIT_COLOR};border-color:${AUDIT_COLOR}" onclick="goAuditFindingNew()">+ Neues Finding</button>
    </div>
    <div class="card" style="padding:0;overflow:hidden">${findingsHtml}</div>
    <div style="margin-top:12px;display:flex;justify-content:flex-end">
      <button class="btn-primary btn-action-sm" style="background:${AUDIT_COLOR};border-color:${AUDIT_COLOR}" onclick="goAuditFindingNew()">+ Neues Finding</button>
    </div>
  </div>`;
}

function goAuditEditExisting(id){activeAuditId=id;renderAuditEdit();}
function goAuditFinding(fid){activeAuditFindingId=fid;renderAuditFindingView();}
function goAuditFindingNew(){activeAuditFindingId=null;renderAuditFinding();}

function generateAuditPdf(){
  const a=activeAudit();if(!a)return;
  if(typeof window.jspdf==='undefined'){alert('Bitte mit Internetverbindung öffnen für PDF-Export.');return;}
  const findings=findingsForAudit(a.id);
  const byDate=[...findings].sort((x,y)=>new Date(x.createdAt)-new Date(y.createdAt));
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});

  doc.setFont('helvetica','bold');
  doc.setFontSize(18);
  doc.text(a.name||'UX Audit',14,20);
  doc.setFont('helvetica','normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  let y=30;
  if(a.subject){doc.text(`Prüfgegenstand: ${a.subject}`,14,y);y+=6;}
  if(a.auditor){doc.text(`Prüfer: ${a.auditor}`,14,y);y+=6;}
  if(a.date){doc.text(`Zeitraum: ${fmtAuditDate(a.date)}`,14,y);y+=6;}
  const sets=(a.heuristicSets||[]).map(s=>AUDIT_HEURISTIC_SETS[s]?.label||s).join(', ');
  if(sets){doc.text(`Kriterien: ${sets}`,14,y);y+=6;}
  y+=4;
  doc.setTextColor(0);

  doc.setFont('helvetica','bold');
  doc.setFontSize(12);
  doc.text('Zusammenfassung',14,y);y+=6;
  const sevRows=[5,4,3,2,1].map(n=>({n,cnt:findings.filter(f=>f.severity===n).length})).filter(r=>r.cnt>0);
  doc.autoTable({
    startY:y,
    head:[['Schweregrad','Anzahl']],
    body:sevRows.map(r=>[SEV.label[r.n],String(r.cnt)]),
    styles:{fontSize:9},
    headStyles:{fillColor:[134,25,143]},
    margin:{left:14,right:14},
    tableWidth:'wrap',
  });
  y=doc.lastAutoTable.finalY+10;

  if(findings.length>0){
    doc.setFont('helvetica','bold');
    doc.setFontSize(12);
    doc.text('Findings',14,y);y+=2;
    const sortedForPdf=[...findings].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
    doc.autoTable({
      startY:y,
      head:[['#','Schweregrad','Kriterium','Titel','Beschreibung','Empfehlung']],
      body:sortedForPdf.map((f,i)=>[
        String(i+1),
        SEV.label[f.severity]||'',
        parseCriteria(f.criterion).map(id=>getCriterionLabel(id)).join(', ')||'',
        f.title||'',
        f.description||'',
        f.recommendation||''
      ]),
      styles:{fontSize:8,cellPadding:3,overflow:'linebreak'},
      headStyles:{fillColor:[134,25,143]},
      columnStyles:{0:{cellWidth:8},1:{cellWidth:24},2:{cellWidth:36},3:{cellWidth:30},4:{cellWidth:44},5:{cellWidth:38}},
      margin:{left:14,right:14},
    });
  }
  doc.save(`${(a.name||'audit').replace(/\s+/g,'-').toLowerCase()}-bericht.pdf`);
}
