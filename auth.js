async function login(email,password){
  const {data,error}=await db.auth.signInWithPassword({email,password});
  if(error){document.getElementById('login-error').textContent='E-Mail oder Passwort falsch.';return;}
  currentUser=data.user;
  await load();
  renderDashboard();
}
async function logout(){
  await db.auth.signOut();
  currentUser=null; batteries=[]; sessions=[];
  setNav([]);
  renderLogin();
}
function renderLogin(){
  show('login');
  document.getElementById('v-login').innerHTML=`
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg)">
      <div style="width:100%;max-width:380px;padding:0 24px">
        <div style="text-align:center;margin-bottom:32px">
          <div class="eyebrow" style="margin-bottom:8px">Usability Testing</div>
          <h1 style="font-size:24px">Protokoll-Tool</h1>
        </div>
        <div class="card">
          <div class="field"><label class="lbl">E-Mail</label>
            <input type="text" id="login-email" placeholder="name@example.com" autocomplete="email" style="display:block;width:100%;padding:9px 12px;font-family:'IBM Plex Sans',sans-serif;font-size:14px;border:1px solid var(--border);border-radius:var(--r);background:var(--surface);color:var(--text);outline:none;box-sizing:border-box"></div>
          <div class="field"><label class="lbl">Passwort</label>
            <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password" style="display:block;width:100%;padding:9px 12px;font-family:'IBM Plex Sans',sans-serif;font-size:14px;border:1px solid var(--border);border-radius:var(--r);background:var(--surface);color:var(--text);outline:none;box-sizing:border-box"
              onkeydown="if(event.key==='Enter')doLogin()"></div>
          <div id="login-error" style="color:#c0392b;font-size:13px;margin-bottom:12px;min-height:18px"></div>
          <button class="btn-primary" style="width:100%;padding:11px" onclick="doLogin()">Einloggen</button>
        </div>
      </div>
    </div>`;
  setTimeout(()=>document.getElementById('login-email')?.focus(),50);
}
function doLogin(){
  const email=document.getElementById('login-email')?.value?.trim();
  const password=document.getElementById('login-password')?.value;
  if(!email||!password){document.getElementById('login-error').textContent='Bitte E-Mail und Passwort eingeben.';return;}
  document.getElementById('login-error').textContent='';
  login(email,password);
}
