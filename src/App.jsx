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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [notifStatus, setNotifStatus] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const syncTimerRef=useRef(null);
  const saveInFlightRef=useRef(false);

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

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

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
      if (saveInFlightRef.current) return;
      saveInFlightRef.current=true;
      setSyncing(true);
      try{
        await supa.saveProfile(user.id, userName, db);
        console.log("✓ Synced to Supabase:", userName, db.length, "wines");
      }catch(e){
        console.error("Sync failed:", e.message);
      }
      saveInFlightRef.current=false;
      setSyncing(false);
    }, 1500);
    return()=>clearTimeout(timer);
  },[db,userName,user]);

  const handleAuth=async(u)=>{
    setUser(u);
    await loadUserData(u.id);
    try {
      const k = `unwined_onboarding_done_${u.id}`;
      setShowOnboarding(localStorage.getItem(k) !== "1");
      setOnboardingStep(0);
    } catch {
      setShowOnboarding(true);
    }
  };

  const handleSignOut=async()=>{
    await supa.signOut();
    setUser(null); setDb([]); setUserName(""); setScreen("accueil"); setTab("accueil");
  };

  useEffect(() => {
    if (!user) return;
    try {
      const k = `unwined_onboarding_done_${user.id}`;
      if (localStorage.getItem(k) !== "1") {
        setShowOnboarding(true);
        setOnboardingStep(0);
      }
    } catch {
      setShowOnboarding(true);
    }
  }, [user]);

  useEffect(() => {
    if (!user || typeof window === "undefined" || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    const day = new Date().toISOString().slice(0, 10);
    const onceKey = `unwined_low_stock_notified_${user.id}_${day}`;
    if (localStorage.getItem(onceKey) === "1") return;
    const lowStock = db
      .filter((w) => !w.tasted && Number(w.quantity ?? 0) <= Number(w.lowStockThreshold ?? 1))
      .slice(0, 3);
    if (!lowStock.length) return;
    const label = lowStock.map((w) => w.producer || w.name || "Vin").join(", ");
    try {
      new Notification("Unwine-D: Stock bas", {
        body: `${lowStock.length} vin(s) a racheter: ${label}`,
      });
      localStorage.setItem(onceKey, "1");
    } catch {}
  }, [db, user]);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const permission = await Notification.requestPermission();
      setNotifStatus(permission);
    } catch {
      setNotifStatus("denied");
    }
  };

  const addWine=(wine)=>{
    const newDb=[wine,...db];
    setDb(newDb);
    setScreen("cave");setTab("cave");
  };
  const updateRating=(id,rating)=>{setDb(d=>d.map(w=>w.id===id?{...w,tasted:true,rating}:w));if(selected?.id===id)setSelected(s=>({...s,tasted:true,rating}));};
  const openWine=(wine)=>{setSelected(wine);setScreen("detail");};
  const deleteWine=(id)=>{
    const newDb=db.filter(w=>w.id!==id);
    setDb(newDb);
    setScreen("cave");setTab("cave");
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
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg,fontFamily:"Manrope, sans-serif",display:"flex",flexDirection:"column",position:"relative"}}>
      <style dangerouslySetInnerHTML={{__html:GLOBAL_CSS}}/>

      {/* ── HEADER ÉDITORIAL ── */}
      {!["detail","add"].includes(screen)&&(
        <div style={{padding:"28px 20px 0",flexShrink:0,background:"rgba(25,18,13,.7)",backdropFilter:"blur(10px)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div>
              <div style={{fontSize:10,color:C.gold,letterSpacing:".32em",textTransform:"uppercase",fontWeight:700,marginBottom:5,fontFamily:"Manrope,sans-serif"}}>
                Votre sommelier · {syncing?t("syncing"):t("connected")}
              </div>
              <h1 style={{fontSize:32,fontFamily:"Noto Serif,serif",fontWeight:400,lineHeight:1,margin:0,color:C.gold,letterSpacing:".2em",textTransform:"uppercase"}}>
                La Selection
              </h1>
            </div>
            <button onClick={handleSignOut} style={{fontSize:10,color:C.gold,background:"none",border:"1px solid rgba(197,160,89,.25)",borderRadius:20,padding:"6px 14px",letterSpacing:".1em",textTransform:"uppercase",fontFamily:"Manrope,sans-serif",marginTop:4}}>{t("logout")}</button>
          </div>
          <div style={{height:1,background:`linear-gradient(90deg,rgba(197,160,89,.55) 0%,transparent 100%)`}}/>
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
          <div style={{display:"flex",background:"rgba(25,18,13,.7)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(197,160,89,.15)",borderRadius:18,padding:"6px",boxShadow:"0 16px 40px rgba(37,22,14,.3)"}}>
            {TABS.map(tab_item=>{
              const isActive=tab_item.id==="scan"?screen==="scan":tab===tab_item.id;
              return(
                <button key={tab_item.id} onClick={()=>{haptic(30);if(tab_item.id==="scan"){setScreen("scan");setTab("scan");}else{setTab(tab_item.id);setScreen(tab_item.id);}}}
                  style={{flex:1,position:"relative",background:isActive?"rgba(197,160,89,.15)":"none",border:"none",borderRadius:14,padding:"11px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .25s"}}>
                  <span style={{fontSize:16,lineHeight:1}}>{tab_item.icon}</span>
                  <span style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",color:isActive?C.gold:C.muted,fontFamily:"Manrope,sans-serif",lineHeight:1}}>{tab_item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {showOnboarding && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{width:"100%",maxWidth:360,background:"#211a15",border:"1px solid rgba(197,160,89,.25)",borderRadius:16,padding:16}}>
            <div style={{fontSize:11,color:C.gold,letterSpacing:".16em",textTransform:"uppercase",marginBottom:10}}>
              Onboarding premium
            </div>
            {onboardingStep === 0 && (
              <div>
                <div style={{fontSize:20,color:C.cream,fontFamily:"Noto Serif, serif",marginBottom:8}}>Bienvenue dans Unwine-D</div>
                <div style={{fontSize:13,color:C.subtext,marginBottom:14}}>Scanner une etiquette, ajoute le vin, puis note-le pour personnaliser ta selection.</div>
              </div>
            )}
            {onboardingStep === 1 && (
              <div>
                <div style={{fontSize:20,color:C.cream,fontFamily:"Noto Serif, serif",marginBottom:8}}>Ton flux ideal</div>
                <div style={{fontSize:13,color:C.subtext,marginBottom:14}}>1) `Scan IA` pour identifier. 2) `Ma Cave` pour suivre le stock. 3) `Decouvrir` pour acheter selon tes gouts.</div>
              </div>
            )}
            {onboardingStep === 2 && (
              <div>
                <div style={{fontSize:20,color:C.cream,fontFamily:"Noto Serif, serif",marginBottom:8}}>Pret pour la release</div>
                <div style={{fontSize:13,color:C.subtext,marginBottom:14}}>Active les favoris et les alertes stock bas pour un rachat en 1 clic.</div>
                <button
                  onClick={enableNotifications}
                  style={{background:"transparent",border:"1px solid rgba(197,160,89,.3)",borderRadius:14,padding:"6px 10px",color:C.gold,marginBottom:10}}
                >
                  {notifStatus === "granted" ? "Notifications actives" : "Activer notifications"}
                </button>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button
                onClick={() => {
                  if (onboardingStep === 0) return setShowOnboarding(false);
                  setOnboardingStep((s) => Math.max(0, s - 1));
                }}
                style={{background:"transparent",border:"1px solid rgba(197,160,89,.25)",color:C.muted,borderRadius:16,padding:"6px 10px"}}
              >
                {onboardingStep === 0 ? "Passer" : "Retour"}
              </button>
              <button
                onClick={() => {
                  if (onboardingStep < 2) return setOnboardingStep((s) => s + 1);
                  try { localStorage.setItem(`unwined_onboarding_done_${user.id}`, "1"); } catch {}
                  setShowOnboarding(false);
                }}
                style={{background:"rgba(233,193,118,.2)",border:"1px solid rgba(233,193,118,.45)",color:C.gold,borderRadius:16,padding:"6px 12px"}}
              >
                {onboardingStep < 2 ? "Suivant" : "Commencer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

