function viewToHash(v){
  switch(v){
    case 'batteries':      return '#batteries';
    case 'battery-detail': return `#battery/${activeBattId}`;
    case 'battery-edit':   return `#battery/${activeBattId}/edit`;
    case 'session-setup':  return `#session/${activeSessId}/setup`;
    case 'session-test':   return `#session/${activeSessId}`;
    case 'session-report': return `#session/${activeSessId}/report`;
    case 'audit':          return '#audit';
    case 'audit-detail':   return `#audit/${activeAuditId}`;
    case 'audit-edit':     return activeAuditId?`#audit/${activeAuditId}/edit`:'#audit/new';
    case 'audit-finding':  return activeAuditFindingId&&_findingMode==='view'
      ?`#audit/${activeAuditId}/finding/${activeAuditFindingId}`
      :`#audit/${activeAuditId}/finding/${activeAuditFindingId||'new'}/edit`;
    default:               return '#dashboard';
  }
}

function updateHash(v){
  if(v==='login') return;
  const hash=viewToHash(v);
  if(location.hash!==hash) history.pushState(null,'',hash);
}

function navigateFromHash(){
  if(!currentUser){renderLogin();return;}
  const hash=location.hash.slice(1)||'dashboard';
  const p=hash.split('/');
  switch(p[0]){
    case 'batteries': renderBatteries(); break;
    case 'battery':
      if(!p[1]){renderBatteries();break;}
      activeBattId=p[1];
      p[2]==='edit'?renderBattEdit():renderBattDetail();
      break;
    case 'session':
      if(!p[1]){renderBatteries();break;}
      activeSessId=p[1];
      if(p[2]==='setup') renderSessSetup();
      else if(p[2]==='report') renderSessReport();
      else renderSessTest();
      break;
    case 'audit':
      if(!p[1]){renderAuditList();break;}
      if(p[1]==='new'){activeAuditId=null;renderAuditEdit();break;}
      activeAuditId=p[1];
      if(p[2]==='edit'){renderAuditEdit();break;}
      if(p[2]==='finding'){
        activeAuditFindingId=p[3]||null;
        if(p[4]==='edit'||p[3]==='new') renderAuditFinding();
        else renderAuditFindingView();
        break;
      }
      renderAuditDetail();
      break;
    default: renderDashboard(); break;
  }
}

window.addEventListener('popstate', navigateFromHash);
