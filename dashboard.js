function renderDashboard(){
  setNav([{label:'Dashboard', action:'renderDashboard()'}]);
  show('dashboard');
  document.getElementById('v-dashboard').innerHTML=`
    <div class="page" style="max-width:760px">
      <h1 style="font-size:22px;font-weight:600;margin-bottom:24px">Was möchtest du tun?</h1>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">

        <div class="card" style="cursor:pointer;transition:box-shadow .15s,border-color .15s;padding:28px 28px 24px" onclick="renderBatteries()" onmouseover="this.style.boxShadow='0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';this.style.borderColor='var(--border2)'" onmouseout="this.style.boxShadow='';this.style.borderColor='var(--border)'">
          <div style="width:44px;height:44px;border-radius:12px;background:var(--accent-bg);display:flex;align-items:center;justify-content:center;margin-bottom:18px">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div style="font-size:17px;font-weight:600;margin-bottom:8px">Usability Testing</div>
          <div style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:20px">Studien anlegen, Sessions durchführen und Beobachtungen protokollieren.</div>
          <button class="btn-primary btn-sm" onclick="event.stopPropagation();renderBatteries()">Öffnen</button>
        </div>

        <div class="card" style="cursor:pointer;transition:box-shadow .15s,border-color .15s;padding:28px 28px 24px" onclick="renderAudit()" onmouseover="this.style.boxShadow='0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';this.style.borderColor='var(--border2)'" onmouseout="this.style.boxShadow='';this.style.borderColor='var(--border)'">
          <div style="width:44px;height:44px;border-radius:12px;background:#fdf2f8;display:flex;align-items:center;justify-content:center;margin-bottom:18px">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#86198f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div style="font-size:17px;font-weight:600;margin-bottom:8px">UX Audit</div>
          <div style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:20px">Heuristische Evaluationen durchführen und Findings dokumentieren.</div>
          <button class="btn-primary btn-sm" style="background:#86198f;border-color:#86198f" onclick="event.stopPropagation();renderAudit()">Öffnen</button>
        </div>

      </div>
    </div>`;
}
