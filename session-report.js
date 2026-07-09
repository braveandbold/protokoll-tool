function goSessReport(id){activeSessId=id;renderSessReport()}
function changeSessStatusFromReport(val){
  const s=activeSess();if(!s)return;
  s.status=val;updSess(s);
  const active=document.getElementById('v-session-test').classList.contains('hidden');
  if(active)renderSessReport();else renderSessTest();
}
function renderSessReport(){
  const s=activeSess();if(!s){renderBatteries();return}
  const b=batteries.find(x=>x.id===s.batteryId);
  setNav([{label:'Usability Testing',action:'renderDashboard()'},{label:'Usability-Tests',action:'renderBatteries()'},{label:b?.name||'Studie',action:`goBattDetail('${s.batteryId}')`},{label:s.personName||'Session',action:`goSessTest('${s.id}')`},{label:'Bericht',action:''}]);
  show('session-report');
  const steps=b?.steps||[];
  const entries=s.entries||[];
  const orderedSteps=CHAPTERS.flatMap(ch=>steps.filter(st=>(st.chapter||1)===ch.id));
  const stepIndex=stepId=>orderedSteps.findIndex(st=>st.id===stepId);
  const stepLabel=step=>{
    if(!step)return 'Ohne Schritt';
    const idx=stepIndex(step.id);
    return `${idx>=0?idx+1:steps.indexOf(step)+1}. ${esc(step.title)}`;
  };
  const entrySortByGuide=(a,b)=>{
    const ai=stepIndex(a.stepId);
    const bi=stepIndex(b.stepId);
    if(ai!==bi)return ai-bi;
    return String(a.timestamp||'').localeCompare(String(b.timestamp||''));
  };
  const problems=entries.filter(e=>e.type==='Problem');
  const countType=t=>entries.filter(e=>e.type===t).length;
  const stats=[
    {val:entries.length,lbl:'Einträge gesamt',bg:'#f3f4f6',fg:'#374151'},
    {val:countType('Beobachtung'),lbl:'Beobachtungen',type:'Beobachtung',bg:T.bg.Beobachtung,fg:T.fg.Beobachtung},
    {val:problems.length,lbl:'Probleme',type:'Problem',bg:T.bg.Problem,fg:T.fg.Problem},
    {val:countType('Zitat'),lbl:'Zitate',type:'Zitat',bg:T.bg.Zitat,fg:T.fg.Zitat},
    {val:countType('Lob'),lbl:'Lob',type:'Lob',bg:T.bg.Lob,fg:T.fg.Lob},
    {val:countType('Notiz'),lbl:'Notizen',type:'Notiz',bg:T.bg.Notiz,fg:T.fg.Notiz},
  ];
  const colGroupWithSev = `<colgroup>
    <col style="width:68px"><col style="width:145px"><col style="width:145px"><col>
  </colgroup>`;
  const colGroupNoSev = `<colgroup>
    <col style="width:68px"><col style="width:145px"><col>
  </colgroup>`;

  const chapterCards = (() => {
    let html = '';
    CHAPTERS.forEach(ch => {
      const chEntries = entries
        .filter(e => { const step=steps.find(st=>st.id===e.stepId); return step&&(step.chapter||1)===ch.id; })
        .sort(entrySortByGuide);
      if(chEntries.length === 0) return;
      const noSev = ch.id === 1;
      const chRows = chEntries.map((e, i) => {
        const step = steps.find(st => st.id === e.stepId);
        const prevStep = i > 0 ? chEntries[i-1].stepId : null;
        const newStepGroup = i === 0 || e.stepId !== prevStep;
        const stepHeader = newStepGroup ? `<tr>
          <td colspan="${noSev?3:4}" style="background:var(--surface2);border-top:${i===0?'none':'1px solid var(--border)'};border-bottom:1px solid var(--border);padding:9px 14px;font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em">${stepLabel(step)}</td>
        </tr>` : '';
        return`${stepHeader}<tr>
          <td style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--text3);white-space:nowrap">${fmtTime(e.timestamp)}</td>
          <td>${typeBadge(e.type)}</td>
          ${noSev?'':`<td>${severityBadge(e.severity)}</td>`}
          <td>${esc(e.text)}</td>
        </tr>`;
      }).join('');
      html += `<div class="card" style="padding:0;overflow:hidden;margin-bottom:14px">
        <div style="padding:12px 20px;border-bottom:1px solid var(--border)">
          <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text2)">${ch.label}</span>
          <span style="font-size:12px;color:var(--text3);margin-left:10px">${chEntries.length} Einträge</span>
        </div>
        <div style="overflow-x:auto"><table class="tbl" style="table-layout:fixed;width:100%">${noSev?colGroupNoSev:colGroupWithSev}
          <thead><tr><th>Zeit</th><th>Typ</th>${noSev?'':'<th>Schweregrad</th>'}<th>Beobachtung</th></tr></thead>
          <tbody>${chRows}</tbody>
        </table></div>
      </div>`;
    });
    const genEntries = entries.filter(e => !e.stepId);
    if(genEntries.length > 0){
      const genRows = genEntries.map(e => `<tr>
        <td style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--text3);white-space:nowrap">${fmtTime(e.timestamp)}</td>
        <td>${typeBadge(e.type)}</td>
        <td>${severityBadge(e.severity)}</td>
        <td>${esc(e.text)}</td>
      </tr>`).join('');
      html += `<div class="card" style="padding:0;overflow:hidden;margin-bottom:14px">
        <div style="padding:12px 20px;border-bottom:1px solid var(--border)">
          <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text2)">Allgemein</span>
          <span style="font-size:12px;color:var(--text3);margin-left:10px">${genEntries.length} Einträge</span>
        </div>
        <div style="overflow-x:auto"><table class="tbl" style="table-layout:fixed;width:100%">${colGroupWithSev}
          <thead><tr><th>Zeit</th><th>Typ</th><th>Schweregrad</th><th>Beobachtung</th></tr></thead>
          <tbody>${genRows}</tbody>
        </table></div>
      </div>`;
    }
    if(!html) html = `<div class="empty">Keine Einträge vorhanden</div>`;
    return html;
  })();
  document.getElementById('v-session-report').innerHTML=`<div class="page">
    <div class="hdr" style="margin-bottom:22px">
      <div style="flex:1;min-width:0;max-width:620px">
        <div style="font-size:12px;color:var(--text3);margin-bottom:4px">${esc(b?.name||'')}</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;flex-wrap:wrap">
          <h2 style="margin-bottom:0">Bericht: ${esc(s.personName)||'Session'}${s.personCode?' <span style="font-size:14px;color:var(--text2)">('+esc(s.personCode)+')</span>':''}</h2>
          ${statusBadge(s.status)}
        </div>
        ${metaRow([
          metaItem('Notizen',s.personNotes),
          metaItem('Datum',s.date?fmtDate(s.date):''),
          metaItem('Protokollant',s.tester),
          metaItem('Einträge',entries.length)
        ],'margin-top:6px')}
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;align-self:flex-start;margin-left:auto;justify-content:flex-end">
        ${inlineIconButton('Excel',excelIcon(),'exportSessXLSX()')}
        ${inlineIconButton('PDF',pdfIcon(),'exportPDF()')}
        ${inlineIconButton('Bearbeiten',editIcon(),`goSessTest('${s.id}')`)}
      </div>
    </div>

    <h3 style="margin-bottom:12px">Zusammenfassung</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:12px;margin-bottom:22px">
      ${stats.map(statCard).join('')}
    </div>

    ${chapterCards}

  </div>`;
}
function exportSessXLSX(){
  const s=activeSess();if(!s)return;
  const b=batteries.find(x=>x.id===s.batteryId);
  const steps=b?.steps||[];
  const orderedSteps=CHAPTERS.flatMap(ch=>steps.filter(st=>(st.chapter||1)===ch.id));
  const stepIndex=stepId=>orderedSteps.findIndex(st=>st.id===stepId);
  if(typeof XLSX==='undefined'){alert('Bitte mit Internetverbindung öffnen für Excel-Export.');return}
  const wb=XLSX.utils.book_new();
  const meta=[['Feld','Wert'],['Studie',b?.name||''],['Produkt',b?.product||''],['Testperson',s.personName],['Code',s.personCode],['Datum',s.date],['Protokollant',s.tester],['Notizen',s.personNotes],['Einträge',(s.entries||[]).length]];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(meta),'Info');
  const hdr=['Zeit','Kapitel','Typ','Schweregrad','Schweregrad-Label','Schritt','Beobachtung'];
  const entrySort=(a,b)=>{
    const ai=a.stepId?stepIndex(a.stepId):Number.MAX_SAFE_INTEGER;
    const bi=b.stepId?stepIndex(b.stepId):Number.MAX_SAFE_INTEGER;
    if(ai!==bi)return ai-bi;
    return String(a.timestamp||'').localeCompare(String(b.timestamp||''));
  };
  const rows=[...(s.entries||[])].sort(entrySort).map(e=>{
    const step=steps.find(st=>st.id===e.stepId);
    const ch=step?CHAPTERS.find(c=>c.id===(step.chapter||1)):null;
    const idx=step?stepIndex(step.id):-1;
    return[fmtTime(e.timestamp),ch?ch.label:'',e.type,e.severity||'',e.severity?SEV.label[e.severity]:'',step?`${idx>=0?idx+1:steps.indexOf(step)+1}. ${step.title}`:'',e.text];
  });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([hdr,...rows]),'Protokoll');
  XLSX.writeFile(wb,`Protokoll_${(b?.name||'Studie').replace(/\s+/g,'_')}_${(s.personName||'Session').replace(/\s+/g,'_')}_${s.date||'export'}.xlsx`);
}

function exportPDF(){
  const s=activeSess();if(!s)return;
  if(typeof window.jspdf==='undefined'){alert('Bitte mit Internetverbindung öffnen für PDF-Export.');return}
  const b=batteries.find(x=>x.id===s.batteryId);
  const steps=b?.steps||[];
  const entries=s.entries||[];
  const orderedSteps=CHAPTERS.flatMap(ch=>steps.filter(st=>(st.chapter||1)===ch.id));
  const stepIndex=stepId=>orderedSteps.findIndex(st=>st.id===stepId);
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const pW=210,mg=14,cW=pW-mg*2;
  let y=mg;

  const T_PDF={
    'Beobachtung':{fill:[219,234,254],text:[30,58,138]},
    'Problem':{fill:[254,226,226],text:[127,29,29]},
    'Zitat':{fill:[237,233,254],text:[59,16,133]},
    'Lob':{fill:[220,252,231],text:[20,83,45]},
    'Notiz':{fill:[243,244,246],text:[55,65,81]}
  };
  const SEV_PDF={
    1:{fill:[187,247,208],text:[20,83,45]},2:{fill:[217,249,157],text:[54,83,20]},
    3:{fill:[254,240,138],text:[113,63,18]},4:{fill:[254,215,170],text:[124,45,18]},
    5:{fill:[254,202,202],text:[127,29,29]}
  };
  const countType=t=>entries.filter(e=>e.type===t).length;
  const stats=[
    {val:entries.length,lbl:'Einträge gesamt',fill:[243,244,246],text:[55,65,81]},
    {val:countType('Beobachtung'),lbl:'Beobachtungen',fill:T_PDF.Beobachtung.fill,text:T_PDF.Beobachtung.text},
    {val:countType('Problem'),lbl:'Probleme',fill:T_PDF.Problem.fill,text:T_PDF.Problem.text},
    {val:countType('Zitat'),lbl:'Zitate',fill:T_PDF.Zitat.fill,text:T_PDF.Zitat.text},
    {val:countType('Lob'),lbl:'Lob',fill:T_PDF.Lob.fill,text:T_PDF.Lob.text},
    {val:countType('Notiz'),lbl:'Notizen',fill:T_PDF.Notiz.fill,text:T_PDF.Notiz.text},
  ];
  const ensureSpace=h=>{if(y+h>282){doc.addPage();y=mg;}};
  const entrySort=(a,b)=>{
    const ai=stepIndex(a.stepId);
    const bi=stepIndex(b.stepId);
    if(ai!==bi)return ai-bi;
    return String(a.timestamp||'').localeCompare(String(b.timestamp||''));
  };
  const drawSectionHeader=(title,count)=>{
    ensureSpace(18);
    doc.setTextColor(107,104,96);
    doc.setFont('helvetica','bold');doc.setFontSize(9.5);
    doc.text(title,mg,y+4);
    doc.setFont('helvetica','normal');doc.setFontSize(8.5);
    doc.setTextColor(156,154,148);
    doc.text(`${count} Einträge`,mg+doc.getTextWidth(title)+4,y+4);
    y+=8;
  };
  const drawEntriesTable=(sectionEntries,{noSev=false,general=false}={})=>{
    const sorted=general?sectionEntries:[...sectionEntries].sort(entrySort);
    const body=[];
    let prevStepId=null;
    sorted.forEach(e=>{
      const step=steps.find(st=>st.id===e.stepId);
      if(!general&&(e.stepId!==prevStepId)){
        const idx=step?stepIndex(step.id):-1;
        body.push([{content:step?`${idx>=0?idx+1:steps.indexOf(step)+1}. ${step.title}`:'Ohne Schritt',colSpan:noSev?3:4,styles:{
          fillColor:[240,239,233],
          textColor:[107,104,96],
          fontStyle:'bold',
          fontSize:7.8,
          cellPadding:{top:2.6,right:2.6,bottom:2.6,left:2.6}
        }}]);
        prevStepId=e.stepId;
      }
      body.push(noSev
        ?[fmtTime(e.timestamp),e.type||'–',e.text||'']
        :[fmtTime(e.timestamp),e.type||'–',e.severity?SEV.label[e.severity]:'–',e.text||'']
      );
    });
    const head=noSev?[['Zeit','Typ','Beobachtung']]:[['Zeit','Typ','Schweregrad','Beobachtung']];
    const colNoSev={0:{cellWidth:16},1:{cellWidth:34},2:{cellWidth:'auto'}};
    const colSev={0:{cellWidth:16},1:{cellWidth:34},2:{cellWidth:34},3:{cellWidth:'auto'}};
    doc.autoTable({
      startY:y,head,body,
      margin:{left:mg,right:mg},
      styles:{fontSize:8,cellPadding:2.6,overflow:'linebreak',valign:'top'},
      headStyles:{fillColor:[240,239,233],textColor:[107,104,96],fontStyle:'bold',fontSize:8},
      columnStyles:noSev?colNoSev:colSev,
      didParseCell(data){
        if(data.section!=='body')return;
        if(data.column.index===1){
          const tc=T_PDF[data.cell.raw];
          if(tc){data.cell.styles.fillColor=tc.fill;data.cell.styles.textColor=tc.text;data.cell.styles.fontStyle='bold';}
        }
        if(!noSev&&data.column.index===2){
          const sevKey=Object.keys(SEV.label).find(k=>SEV.label[k]===data.cell.raw);
          const sc=SEV_PDF[sevKey];
          if(sc){data.cell.styles.fillColor=sc.fill;data.cell.styles.textColor=sc.text;data.cell.styles.fontStyle='bold';}
        }
      }
    });
    y=doc.lastAutoTable.finalY+7;
  };

  doc.setFillColor(45,42,138);
  doc.rect(mg,y,cW,24,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(13);doc.setFont('helvetica','bold');
  doc.text(b?.name||'Studie',mg+5,y+9);
  doc.setFontSize(10);doc.setFont('helvetica','normal');
  doc.text(`Bericht: ${s.personName||'Session'}${s.personCode?' ('+s.personCode+')':''}`,mg+5,y+16);
  const metaRight=[
    s.status==='done'?'Abgeschlossen':'Aktiv',
    s.date?'Datum: '+fmtDate(s.date):'',
    s.tester?'Protokollant: '+s.tester:'',
    `Einträge: ${entries.length}`
  ].filter(Boolean).join('   ');
  doc.setFontSize(9);doc.text(metaRight,pW-mg-3,y+16,{align:'right'});
  y+=28;

  doc.setTextColor(107,104,96);
  doc.setFont('helvetica','bold');doc.setFontSize(10);
  doc.text('Zusammenfassung',mg,y);
  y+=4;
  const gap=3;
  const bW=(cW-gap*2)/3;
  const bH=18;
  stats.forEach((st,i)=>{
    const col=i%3,row=Math.floor(i/3);
    const x=mg+col*(bW+gap);
    const yy=y+row*(bH+gap);
    doc.setFillColor(...st.fill);doc.roundedRect(x,yy,bW,bH,3,3,'F');
    doc.setTextColor(...st.text);
    doc.setFontSize(15);doc.setFont('helvetica','bold');
    doc.text(String(st.val),x+4,yy+8);
    doc.setFontSize(7.8);doc.setFont('helvetica','normal');
    doc.text(st.lbl,x+4,yy+14);
  });
  y+=bH*2+gap+11;

  CHAPTERS.forEach(ch=>{
    const chEntries=entries.filter(e=>{const step=steps.find(st=>st.id===e.stepId);return step&&(step.chapter||1)===ch.id;});
    if(chEntries.length===0)return;
    const noSev=ch.id===1;
    drawSectionHeader(ch.label,chEntries.length);
    drawEntriesTable(chEntries,{noSev});
  });

  const genEntries=entries.filter(e=>!e.stepId);
  if(genEntries.length>0){
    drawSectionHeader('Allgemein',genEntries.length);
    drawEntriesTable(genEntries,{general:true});
  }

  const pages=doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){
    doc.setPage(i);
    doc.setFontSize(8);doc.setTextColor(160,160,160);
    doc.text('Usability Protokoll-Tool',mg,294);
    doc.text(`Seite ${i} von ${pages}`,pW-mg,294,{align:'right'});
  }

  doc.save(`Protokoll_${(b?.name||'Studie').replace(/\s+/g,'_')}_${(s.personName||'Session').replace(/\s+/g,'_')}_${s.date||'export'}.pdf`);
}
