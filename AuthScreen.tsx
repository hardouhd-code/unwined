import React, { useState } from "react";
import { C } from "../lib/constants";
import { t } from "../lib/i18n";
import { supa } from "../lib/supabase";

interface AuthScreenProps {
  onAuth: (user: any) => void;
}

const AuthScreen = ({ onAuth }: AuthScreenProps) => {
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
    <div className="fixed inset-0 bg-[var(--color-bg)] flex flex-col items-center justify-center px-6 py-8 font-['Cormorant_Garamond',serif]">
      {}
      <div className="text-center mb-10">
        <div className="text-[9px] text-[var(--color-muted-text)] tracking-[.38em] uppercase mb-3">Votre sommelier personnel</div>
        <div className="inline-flex items-center gap-2 justify-center">
          <span className="text-[26px] drop-shadow-[0_4px_14px_rgba(200,80,58,.7)] saturate-200 brightness-110">🍷</span>
          <h1 className="text-[38px] font-['Playfair_Display',serif] font-semibold tracking-[.03em] leading-none">
            <span className="text-[var(--color-cream)]">Unwine</span><span className="text-[var(--color-terra)]">-D</span>
          </h1>
          <span className="text-[26px] drop-shadow-[0_4px_14px_rgba(200,80,58,.7)] saturate-200 brightness-110">🍷</span>
        </div>
        <p className="text-[13px] text-[var(--color-muted-text)] italic mt-2.5 leading-[1.6]">Votre cave à portée de main</p>
      </div>

      {}
      <div className="w-full max-w-[360px] bg-[var(--color-bg-card)] rounded-[24px] px-6 py-7 shadow-[0_8px_32px_rgba(139,90,60,.1)]">
        {}
        <div className="flex bg-[#8b5a3c0f] rounded-xl p-1 mb-6 gap-1">
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");setSuccess("");}} 
                    className={`flex-1 p-2.5 rounded-lg border-none text-[13px] tracking-[.1em] uppercase font-['Cormorant_Garamond',serif] transition-colors ${mode === m ? "bg-gradient-to-br from-[var(--color-terra)] to-[var(--color-terra-dark)] text-white font-bold" : "bg-transparent text-[var(--color-muted-text)] font-normal"}`}>
              {m==="login"?t("login"):t("signup")}
            </button>
          ))}
        </div>

        {}
        <button onClick={()=>supa.signInGoogle()} className="w-full flex items-center justify-center gap-2.5 bg-white border border-[#8b5a3c33] rounded-xl p-[13px] mb-4 text-[14px] text-[var(--color-cream)] font-['Cormorant_Garamond',serif] shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.58-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          <span className="text-black">Continuer avec Google</span>
        </button>

        {}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex-1 h-[1px] bg-[#8b5a3c1f]"/>
          <span className="text-[11px] text-[var(--color-muted-text)] tracking-[.15em] uppercase">ou</span>
          <div className="flex-1 h-[1px] bg-[#8b5a3c1f]"/>
        </div>

        {}
        <div className="mb-3">
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder={t("email")} 
                 className="w-full bg-[#8b5a3c0d] border border-[#8b5a3c2e] rounded-xl px-[15px] py-[13px] text-[var(--color-cream)] text-[15px] font-['Cormorant_Garamond',serif] outline-none focus:border-[var(--color-terra)] transition-colors"/>
        </div>
        <div className="mb-5">
          <input value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} type="password" placeholder={t("password")} 
                 className="w-full bg-[#8b5a3c0d] border border-[#8b5a3c2e] rounded-xl px-[15px] py-[13px] text-[var(--color-cream)] text-[15px] font-['Cormorant_Garamond',serif] outline-none focus:border-[var(--color-terra)] transition-colors"/>
        </div>

        {error&&<div className="text-[13px] text-[var(--color-terra)] bg-[#c8503a14] border border-[#c8503a33] rounded-lg px-3.5 py-2.5 mb-3.5 text-center">{error}</div>}
        {success&&<div className="text-[13px] text-[#4a7c59] bg-[#4a7c5914] border border-[#4a7c5933] rounded-lg px-3.5 py-2.5 mb-3.5 text-center">{success}</div>}

        <button onClick={handle} disabled={loading} 
                className={`w-full p-[15px] border-none rounded-xl text-[13px] tracking-[.2em] uppercase font-['Cormorant_Garamond',serif] font-bold text-white transition-all ${loading ? "bg-[#8b5a3c33] shadow-none" : "bg-gradient-to-br from-[var(--color-terra)] to-[var(--color-terra-dark)] shadow-[0_6px_20px_rgba(200,80,58,.3)]"}`}>
          {loading?"…":mode==="login"?t("sign_in"):t("create_account")}
        </button>
      </div>
    </div>
  );
};

export { AuthScreen };
