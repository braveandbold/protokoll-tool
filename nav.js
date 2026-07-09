function setNav(crumbs){
  const nav=document.getElementById('app-nav');
  if(!crumbs||crumbs.length===0){
    nav.classList.add('hidden');
    document.body.classList.remove('nav-visible','nav-no-crumbs');
    return;
  }
  nav.classList.remove('hidden');
  document.body.classList.add('nav-visible');

  document.body.classList.remove('nav-no-crumbs');

  const moduleName=crumbs[0]?.label||'';
  const subCrumbs=crumbs.slice(1);
  const crumbHtml=subCrumbs.map((c,i)=>{
    const isLast=i===subCrumbs.length-1;
    const sep=i>0?`<span class="nav-sep">›</span>`:'';
    if(isLast) return`${sep}<span class="nav-crumb-cur">${esc(c.label)}</span>`;
    return`${sep}<button class="nav-crumb-btn" data-action="${esc(c.action)}" onclick="runNavAction(this.dataset.action)">${esc(c.label)}</button>`;
  }).join('');

  nav.innerHTML=`
    <div class="nav-top">
      <div class="nav-inner">
        <div class="nav-logo" onclick="runNavAction('renderDashboard()')">UXRSuite</div>
        ${moduleName?`<span class="nav-module">${esc(moduleName)}</span>`:''}
        <div class="nav-right">
          <span class="nav-email">${esc(currentUser?.email||'')}</span>
          <button class="btn-ghost btn-sm" onclick="runNavAction('logout()')">Abmelden</button>
        </div>
      </div>
    </div>
    <div class="nav-crumb-bar"><div class="nav-inner"><div class="nav-crumbs">${crumbHtml}</div></div></div>`;
}
