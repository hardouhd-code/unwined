import React, { useState, useEffect, useRef } from "react";
import { supa } from "./lib/supabase";
import { t } from "./lib/i18n";
import { C, GLOBAL_CSS, WINE_TYPES } from "./lib/constants";
import { haptic } from "./lib/helpers";
import { AuthScreen }   from "./components/AuthScreen";
import { Accueil }      from "./components/Accueil";
import { MaCave }       from "./components/MaCave";
import { SmartScanner } from "./components/SmartScanner";
import { Decouvrir }    from "./components/Decouvrir";
import { AddWineForm }  from "./components/AddWineForm";
import { WineDetail }   from "./components/WineDetail";

export default function UnwinedApp() {
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [db,setDb]=useState([]);
  const [userName,setUserName]=useState("");
  const [screen,setScreen]=useState("accueil");
  const [selected,setSelected]=useState(null);
  const [tab,setTab]=useState("accueil");
  const [syncing,setSyncing]=useState(false);
  const syncTimerRef=useRef(null);

  // Init: check session + rotate daily seed
  useEffect(()=>{
    (async()=>{
      const session = await supa.getSession();
      if(session){
        setUser(session.user);
        await loadUserData(session.user.id);
      }
      setAuthLoading(false);
    })();
    // Increment seed on each app open (for rotating suggestions)
    const seed = parseInt(localStorage.getItem("unwined_seed")||"0");
    localStorage.setItem("unwined_seed", String(seed+1));
  },[]);

  const loadUserData=async(userId)=>{
    // First: load from localStorage backup immediately (no flash)
    const nameBackup = localStorage.getItem("unwined_name_backup")||"";
    if(nameBackup) setUserName(nameBackup);

    // Then: load from Supabase (source of truth)
    const profile = await supa.loadProfile(userId);
    if(profile){
      if(profile.name){
        setUserName(profile.name);
        localStorage.setItem("unwined_name_backup", profile.name);
      }
      if(profile.cave){
        try{
          const parsed = JSON.parse(profile.cave);
          setDb(Array.isArray(parsed) ? parsed : []);
        }catch(e){ console.error("Cave parse error:", e); }
      } else {
        setDb([]);
      }
    } else if(!nameBackup) {
      // No profile, no backup — fresh user
      setDb([]);
    }
  };

  // Auto-sync on db/name change
  useEffect(()=>{
    if(!user) return;
    // Backup name to localStorage immediately
    if(userName) localStorage.setItem("unwined_name_backup", userName);
    const timer=setTimeout(async()=>{
      setSyncing(true);
      try{
        await supa.saveProfile(user.id, userName, db);
        console.log("✓ Synced to Supabase:", userName, db.length, "wines");
      }catch(e){
        console.error("Sync failed:", e.message);
      }
      setSyncing(false);
    }, 1500);
    return()=>clearTimeout(timer);
  },[db,userName,user]);

  const handleAuth=async(u)=>{
    setUser(u);
    await loadUserData(u.id);
  };

  const handleSignOut=async()=>{
    await supa.signOut();
    setUser(null); setDb([]); setUserName(""); setScreen("accueil"); setTab("accueil");
  };

  const addWine=async(wine)=>{
    const newDb=[wine,...db];
    setDb(newDb);
    setScreen("cave");setTab("cave");
    if(user){
      setSyncing(true);
      try{
        await supa.saveProfile(user.id, userName, newDb);
        console.log("✓ addWine saved, total:", newDb.length);
      }catch(e){
        console.error("✗ addWine save failed:", e.message);
        alert("Erreur sauvegarde: "+e.message);
      }
      setSyncing(false);
    }
  };
  const updateRating=(id,rating)=>{setDb(d=>d.map(w=>w.id===id?{...w,tasted:true,rating}:w));if(selected?.id===id)setSelected(s=>({...s,tasted:true,rating}));};
  const openWine=(wine)=>{setSelected(wine);setScreen("detail");};
  const deleteWine=async(id)=>{
    const newDb=db.filter(w=>w.id!==id);
    setDb(newDb);
    setScreen("cave");setTab("cave");
    if(user){
      setSyncing(true);
      try{
        await supa.saveProfile(user.id, userName, newDb);
        console.log("✓ deleteWine saved, total:", newDb.length);
      }catch(e){
        console.error("✗ deleteWine save failed:", e.message);
        alert("Erreur sauvegarde: "+e.message);
      }
      setSyncing(false);
    }
  };
  const updateWine=(id,patchOrFn)=>{
    setDb(currentDb=>{
      const newDb=currentDb.map(w=>{
        if(w.id!==id)return w;
        const patch=typeof patchOrFn==="function"?patchOrFn(w):patchOrFn;
        const updated={...w,...patch};
        setSelected(s=>s?.id===id?updated:s);
        return updated;
      });
      if(user){
        if(syncTimerRef.current)clearTimeout(syncTimerRef.current);
        setSyncing(true);
        syncTimerRef.current=setTimeout(async()=>{
          try{await supa.saveProfile(user.id,userName,newDb);}
          catch(e){console.error("Synchro err:",e.message);}
          setSyncing(false);
        },800);
      }
      return newDb;
    });
  };

  const TABS=[{id:"accueil",label:t("nav_home"),icon:"🏠"},{id:"cave",label:t("nav_cave"),icon:"🗄️"},{id:"scan",label:t("nav_scan"),icon:"📷"},{id:"decouvrir",label:t("nav_discover"),icon:"✦"}];

  // Auth loading
  if(authLoading) return(
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16,animation:"pulse 1.5s ease-in-out infinite",filter:"drop-shadow(0 4px 14px rgba(200,80,58,.7)) saturate(2) brightness(1.1)"}}>🍷</div><div style={{fontSize:14,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>Chargement…</div></div>
    </div>
  );

  // Not logged in
  if(!user) return <AuthScreen onAuth={handleAuth}/>;

  return(
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg,fontFamily:"Cormorant Garamond,Georgia,serif",display:"flex",flexDirection:"column",position:"relative"}}>
      <style dangerouslySetInnerHTML={{__html:GLOBAL_CSS}}/>

      {/* ── HEADER ÉDITORIAL ── */}
      {!["detail","add"].includes(screen)&&(
        <div style={{padding:"28px 20px 0",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div>
              <div style={{fontSize:10,color:C.gold,letterSpacing:".32em",textTransform:"uppercase",fontWeight:700,marginBottom:5,fontFamily:"Cormorant Garamond,serif"}}>
                Votre sommelier · {syncing?t("syncing"):t("connected")}
              </div>
              <h1 style={{fontSize:40,fontFamily:"Playfair Display,serif",fontWeight:700,lineHeight:1,margin:0}}>
                <span style={{color:C.cream}}>Unwine</span>
                <span style={{color:C.terra}}>-D</span>
              </h1>
            </div>
            <button onClick={handleSignOut} style={{fontSize:10,color:C.muted,background:"none",border:"1px solid rgba(139,90,60,.2)",borderRadius:20,padding:"6px 14px",letterSpacing:".1em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginTop:4}}>{t("logout")}</button>
          </div>
          <div style={{height:1,background:`linear-gradient(90deg,${C.terra}55 0%,transparent 100%)`}}/>
        </div>
      )}

      {/* ── SCREENS ── */}
      {screen==="add"&&<AddWineForm onSave={addWine} onCancel={()=>{setScreen("cave");setTab("cave");}}/>}
      {screen==="detail"&&selected&&<WineDetail wine={selected} onBack={()=>setScreen("cave")} onUpdateRating={updateRating} onDelete={deleteWine} onUpdateWine={updateWine}/>}
      {screen==="scan"&&<SmartScanner db={db} onResult={wine=>addWine(wine)} onBack={()=>setScreen("cave")}/>}

      {!["detail","add","scan"].includes(screen)&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {tab==="accueil"&&<Accueil db={db} userName={userName} onSetName={setUserName} onAdd={()=>setScreen("add")} onOpenWine={openWine}/>}
          {tab==="cave"&&<MaCave db={db} onOpenWine={openWine} onAdd={()=>setScreen("add")} onUpdateWine={updateWine}/>}
          {tab==="decouvrir"&&<Decouvrir db={db}/>}
        </div>
      )}

      {/* ── BOTTOM NAV FLOTTANTE ── */}
      {!["detail","add"].includes(screen)&&(
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",width:"92%",maxWidth:390,zIndex:100}}>
          <div style={{display:"flex",background:"rgba(255,252,248,.88)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(139,90,60,.15)",borderRadius:30,padding:"6px",boxShadow:"0 16px 40px rgba(139,90,60,.18)"}}>
            {TABS.map(tab_item=>{
              const isActive=tab_item.id==="scan"?screen==="scan":tab===tab_item.id;
              return(
                <button key={tab_item.id} onClick={()=>{haptic(30);if(tab_item.id==="scan"){setScreen("scan");setTab("scan");}else{setTab(tab_item.id);setScreen(tab_item.id);}}}
                  style={{flex:1,position:"relative",background:isActive?`linear-gradient(135deg,${C.terra},${C.terraD})`:"none",border:"none",borderRadius:24,padding:"11px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .25s"}}>
                  <span style={{fontSize:16,lineHeight:1}}>{tab_item.icon}</span>
                  <span style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",color:isActive?"#fff":C.muted,fontFamily:"Cormorant Garamond,serif",lineHeight:1}}>{tab_item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

