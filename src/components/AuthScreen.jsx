import React, { useState } from "react";
import { C } from "../lib/constants";
import { t } from "../lib/i18n";
import { supa } from "../lib/supabase";

const AuthScreen=({onAuth})=>{
  const [mode,setMode]=useState("login"); // login|signup
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");

  const handle=async()=>{
    if(!email||!password){setError("Email et mot de passe requis");return;}
    setLoading(true);setError("");setSuccess("");
    try{
      let data;
      if(mode==="signup"){
        data=await supa.signUp(email,password);
        if(!data.access_token){setSuccess(t("check_email"));setLoading(false);return;}
      } else {
        data=await supa.signIn(email,password);
      }
      supa.saveSession(data);
      onAuth(data.user);
    }catch(e){setError(e.message);}
    setLoading(false);
  };

  return(
    <div style={{position:"fixed",inset:0,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",fontFamily:"Cormorant Garamond,serif"}}>
      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:9,color:C.muted,letterSpacing:".38em",textTransform:"uppercase",marginBottom:12}}>Votre sommelier personnel</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,justifyContent:"center"}}>
          <span style={{fontSize:26,filter:"drop-shadow(0 4px 14px rgba(200,80,58,.7)) saturate(2) brightness(1.1)"}}>🍷</span>
          <h1 style={{fontSize:38,fontFamily:"Playfair Display,serif",fontWeight:600,letterSpacing:".03em",lineHeight:1}}>
            <span style={{color:C.cream}}>Unwine</span><span style={{color:C.terra}}>-D</span>
          </h1>
          <span style={{fontSize:26,filter:"drop-shadow(0 4px 14px rgba(200,80,58,.7)) saturate(2) brightness(1.1)"}}>🍷</span>
        </div>
        <p style={{fontSize:13,color:C.muted,fontStyle:"italic",marginTop:10,lineHeight:1.6}}>Votre cave à portée de main</p>
      </div>

      {/* Card */}
      <div style={{width:"100%",maxWidth:360,background:C.bgCard,borderRadius:24,padding:"28px 24px",boxShadow:"0 8px 32px rgba(139,90,60,.1)"}}>
        {/* Tabs */}
        <div style={{display:"flex",background:"rgba(139,90,60,.06)",borderRadius:14,padding:4,marginBottom:24,gap:4}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");setSuccess("");}} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:mode===m?`linear-gradient(135deg,${C.terra},${C.terraD})`:"transparent",color:mode===m?"#fff":C.muted,fontSize:13,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:mode===m?700:400}}>
              {m==="login"?t("login"):t("signup")}
            </button>
          ))}
        </div>

        {/* Google */}
        <button onClick={()=>supa.signInGoogle()} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#fff",border:"1px solid rgba(139,90,60,.2)",borderRadius:14,padding:"13px",marginBottom:16,fontSize:14,color:C.cream,fontFamily:"Cormorant Garamond,serif",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.58-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuer avec Google
        </button>

        {/* Divider */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{flex:1,height:1,background:"rgba(139,90,60,.12)"}}/>
          <span style={{fontSize:11,color:C.muted,letterSpacing:".15em",textTransform:"uppercase"}}>ou</span>
          <div style={{flex:1,height:1,background:"rgba(139,90,60,.12)"}}/>
        </div>

        {/* Email */}
        <div style={{marginBottom:12}}>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder={t("email")} style={{width:"100%",background:"rgba(139,90,60,.05)",border:"1px solid rgba(139,90,60,.18)",borderRadius:12,padding:"13px 15px",color:C.cream,fontSize:15,fontFamily:"Cormorant Garamond,serif",boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:20}}>
          <input value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} type="password" placeholder={t("password")} style={{width:"100%",background:"rgba(139,90,60,.05)",border:"1px solid rgba(139,90,60,.18)",borderRadius:12,padding:"13px 15px",color:C.cream,fontSize:15,fontFamily:"Cormorant Garamond,serif",boxSizing:"border-box"}}/>
        </div>

        {error&&<div style={{fontSize:13,color:C.terra,background:"rgba(200,80,58,.08)",border:"1px solid rgba(200,80,58,.2)",borderRadius:10,padding:"10px 14px",marginBottom:14,textAlign:"center"}}>{error}</div>}
        {success&&<div style={{fontSize:13,color:"#4a7c59",background:"rgba(74,124,89,.08)",border:"1px solid rgba(74,124,89,.2)",borderRadius:10,padding:"10px 14px",marginBottom:14,textAlign:"center"}}>{success}</div>}

        <button onClick={handle} disabled={loading} style={{width:"100%",padding:"15px",background:loading?"rgba(139,90,60,.2)":`linear-gradient(135deg,${C.terra},${C.terraD})`,color:"#fff",border:"none",borderRadius:14,fontSize:13,letterSpacing:".2em",textTransform:"uppercase",fontFamily:"Cormorant Garamond,serif",fontWeight:700,boxShadow:loading?"none":`0 6px 20px rgba(200,80,58,.3)`}}>
          {loading?"…":mode==="login"?t("sign_in"):t("create_account")}
        </button>
      </div>
    </div>
  );
};

   ROOT APP

export { AuthScreen };

