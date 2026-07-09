async function initApp(){
  try{
    if(typeof supabase==='undefined'){
      throw new Error('Supabase konnte nicht geladen werden. Bitte Internetverbindung pruefen.');
    }
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const {data:{session}} = await db.auth.getSession();
    if(session){
      currentUser = session.user;
      await load();
      navigateFromHash();
    } else {
      renderLogin();
    }
  } catch(e){
    console.error('App konnte nicht gestartet werden:',e);
    alert(e.message||'App konnte nicht gestartet werden.');
  }
}

initApp();
