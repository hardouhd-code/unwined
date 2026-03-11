/**
 * UNWINE-D V4 — App Root
 * Modular architecture: lib/ + components/
 */
import React, { useState, useEffect } from "react";

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
  const updateWine=(id,patch)=>{setDb(d=>d.map(w=>w.id===id?{...w,...patch}:w));setSelected(s=>s?.id===id?{...s,...patch}:s);};

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

      {/* ── HEADER ── */}
      {!["detail","add"].includes(screen)&&(
        <div style={{padding:"20px 16px 0",flexShrink:0}}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,padding:"0 4px"}}>
              <div style={{fontSize:11,color:C.muted,fontFamily:"Cormorant Garamond,serif",fontStyle:"italic"}}>
                {syncing?t("syncing"):t("connected")}
              </div>
              <button onClick={handleSignOut} style={{fontSize:11,color:C.muted,background:"none",border:"1px solid rgba(139,90,60,.2)",borderRadius:10,padding:"3px 10px",fontFamily:"Cormorant Garamond,serif"}}>{t("logout")}</button>
            </div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:".38em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",marginBottom:8}}>Votre sommelier personnel</div>
            {/* Logo Unwine-D centré avec tiret stylisé */}
            <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
              <span style={{fontSize:24,animation:"pulse 3s ease-in-out infinite",filter:"drop-shadow(0 4px 14px rgba(200,80,58,.7)) saturate(2) brightness(1.1)"}}>🍷</span>
              <h1 style={{fontSize:36,fontFamily:"Playfair Display,serif",fontWeight:600,letterSpacing:".03em",lineHeight:1}}>
                <span style={{color:C.cream}}>Unwine</span>
                <span style={{color:C.terra}}>-D</span>
              </h1>
              <span style={{fontSize:24,animation:"pulse 3s ease-in-out infinite",filter:"drop-shadow(0 4px 14px rgba(200,80,58,.7)) saturate(2) brightness(1.1)",transform:"scaleX(-1)",display:"inline-block"}}>🍷</span>
            </div>
          </div>
          <div style={{height:1,background:`linear-gradient(90deg,transparent 0%,${C.terra}88 30%,${C.terra}88 70%,transparent 100%)`}}/>
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

      {/* ── BOTTOM NAV ── */}
      {!["detail","add"].includes(screen)&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:100,background:`linear-gradient(transparent,${C.bg} 35%)`,padding:"8px 14px 22px"}}>
          <div style={{display:"flex",background:"rgba(255,252,248,.95)",border:`1px solid rgba(139,90,60,.18)`,borderRadius:22,padding:"4px",gap:2,boxShadow:`0 -4px 20px rgba(139,90,60,.1)`}}>
            {TABS.map(t=>{
              const isActive=t.id==="scan"?screen==="scan":tab===t.id;
              return(
                <button key={t.id} onClick={()=>{haptic(30);if(t.id==="scan"){setScreen("scan");setTab("scan");}else{setTab(t.id);setScreen(t.id);}}} style={{flex:1,background:isActive?`linear-gradient(135deg,${C.terra},${C.terraD})`:"transparent",border:"none",borderRadius:18,padding:"11px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .25s"}}>
                  <span style={{fontSize:t.id==="add"?20:15,lineHeight:1}}>{t.icon}</span>
                  <span style={{fontSize:10,letterSpacing:".06em",textTransform:"uppercase",color:isActive?"#fff":C.muted,fontFamily:"Cormorant Garamond,serif",lineHeight:1}}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
