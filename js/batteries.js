function renderBatteries(){
  setNav([{label:'Usability Testing',action:'renderDashboard()'},{label:'Usability-Tests',action:'renderBatteries()'}]);
  show('batteries');
  const el=document.getElementById('v-batteries');
  const renderBattRow=b=>{
    const slist=battSessions(b.id);
    const done=slist.filter(s=>s.status==='done').length;
    const active=slist.filter(s=>s.status!=='done').length;
    return`<div class="batt-card" onclick="goBattDetail('${b.id}')">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
            <span style="font-weight:600;font-size:17px">${esc(b.name)||'(Ohne Name)'}</span>
            ${statusBadge(b.status)}
          </div>
          ${metaRow([
            metaItem('Produkt/System',b.product),
            metaItem('Sessions',`${slist.length} (${done} abgeschlossen${active>0?', '+active+' aktiv':''})`),
            metaItem('Erstellt',fmtDate(b.createdAt?.slice(0,10)))
          ])}
          ${b.description?metaRow([metaItem('Ziel',b.description,{wide:true})],'margin-top:8px;line-height:1.5'):''}
        </div>
      </div>
    </div>`;
  };
  const renderSection=(title,items)=>items.length?`
    <div style="margin-bottom:26px">
      <h3 style="margin-bottom:10px">${title}</h3>
      ${items.map(renderBattRow).join('')}
    </div>`:'';
  const activeBatts=batteries.filter(b=>b.status!=='done');
  const doneBatts=batteries.filter(b=>b.status==='done');
  const rows=batteries.length===0
    ?`<div class="empty"><div style="font-size:38px;margin-bottom:14px">◫</div><div>Noch keine Studien – erstelle deine erste</div></div>`
    :renderSection('Aktiv',activeBatts)+renderSection('Abgeschlossen',doneBatts);
  el.innerHTML=`<div class="page">
    <div class="hdr">
      <div><h1>Usability-Tests</h1></div>
      <div style="display:flex;align-items:center;gap:10px">
        <button class="btn-primary" onclick="newBattery()">+ Neue Studie</button>
      </div>
    </div>
    ${rows}
  </div>`;
}
async function newBattery(){
  const b={id:genId(),name:'',product:'',link:'',description:'',status:'active',steps:[],createdAt:ts()};
  batteries=[b,...batteries];
  try{
    await saveBattToDb(b);
    goBattEdit(b.id);
  } catch(err){
    batteries=batteries.filter(x=>x.id!==b.id);
    reportSaveError(err);
  }
}
function delBatt(id){
  ask('Studie und alle zugehörigen Sessions löschen?', async ()=>{
    try{
      await deleteBattFromDb(id);
      batteries=batteries.filter(b=>b.id!==id);
      sessions=sessions.filter(s=>s.batteryId!==id);
      renderBatteries();
    } catch(err){
      reportSaveError(err);
    }
  });
}
