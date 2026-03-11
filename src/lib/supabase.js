const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || "https://xvjhodhgiiygrnmggvaz.supabase.co";
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_agi3sVWygsRiUkBX8GmjGw_fmHUix6k";

const supa = {
  async req(path, opts={}) {
    const token = supa._token;
    const res = await fetch(`${SUPA_URL}${path}`, {
      ...opts,
      headers: {
        "apikey": SUPA_KEY,
        "Content-Type": "application/json",
        ...(token ? {"Authorization": `Bearer ${token}`} : {}),
        ...(opts.headers||{})
      }
    });
    if(!res.ok) { const e = await res.json().catch(()=>({message:res.statusText})); throw new Error(e.message||e.error_description||"Erreur"); }
    return res.status===204 ? null : res.json();
  },
  _token: null,
  _user: null,

  // Auth
  async signUp(email, password) {
    const d = await supa.req("/auth/v1/signup", {method:"POST", body:JSON.stringify({email,password})});
    supa._token = d.access_token; supa._user = d.user;
    if(d.access_token) supa.saveSession(d);
    return d;
  },
  async signIn(email, password) {
    const d = await supa.req("/auth/v1/token?grant_type=password", {method:"POST", body:JSON.stringify({email,password})});
    supa._token = d.access_token; supa._user = d.user;
    supa.saveSession(d);
    return d;
  },
  async signInGoogle() {
    window.location.href = `${SUPA_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}&access_type=offline&prompt=consent`;
  },
  async signOut() {
    try { await supa.req("/auth/v1/logout", {method:"POST"}); } catch {}
    supa._token = null; supa._user = null;
    localStorage.removeItem("unwined_session");
  },
  async getSession() {
    try {
      // Check URL hash for OAuth callback
      const hash = window.location.hash;
      if(hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.slice(1));
        const token = params.get("access_token");
        const refresh = params.get("refresh_token");
        if(token) {
          supa._token = token;
          const user = await supa.req("/auth/v1/user");
          supa._user = user;
          const session = {access_token:token, refresh_token:refresh||null, user};
          localStorage.setItem("unwined_session", JSON.stringify(session));
          window.history.replaceState({}, document.title, window.location.pathname);
          return session;
        }
      }
      // Check saved session
      const saved = localStorage.getItem("unwined_session");
      if(saved) {
        const s = JSON.parse(saved);
        supa._token = s.access_token; supa._user = s.user;
        try {
          // Verify token still valid
          const user = await supa.req("/auth/v1/user");
          supa._user = user;
          return {...s, user};
        } catch {
          // Token expired — try refresh
          if(s.refresh_token) {
            try {
              const r = await supa.req("/auth/v1/token?grant_type=refresh_token", {
                method:"POST",
                body: JSON.stringify({refresh_token: s.refresh_token})
              });
              supa._token = r.access_token;
              supa._user = r.user;
              const newSession = {access_token:r.access_token, refresh_token:r.refresh_token||s.refresh_token, user:r.user};
              localStorage.setItem("unwined_session", JSON.stringify(newSession));
              return newSession;
            } catch(refreshErr) {
              console.warn("Refresh failed:", refreshErr.message);
              if(refreshErr.message?.includes("invalid")||refreshErr.message?.includes("expired")) {
                localStorage.removeItem("unwined_session");
                supa._token=null; supa._user=null;
                return null;
              }
              return s; // network error — keep session
            }
          }
          // No refresh token — keep user if we have data
          if(s.user) return s;
          localStorage.removeItem("unwined_session");
          supa._token=null; supa._user=null;
        }
      }
    } catch(e) { console.warn("getSession error:", e.message); }
    return null;
  },
  saveSession(data) {
    localStorage.setItem("unwined_session", JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token||null,
      user: data.user
    }));
  },

  // Data
  async loadProfile(userId) {
    try {
      const rows = await supa.req(`/rest/v1/profiles?user_id=eq.${userId}&select=*`);
      return rows?.[0] || null;
    } catch { return null; }
  },
  async saveProfile(userId, name, cave) {
    const payload = {user_id:userId, name, cave:JSON.stringify(cave), updated_at:new Date().toISOString()};
    const res = await fetch(`${SUPA_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "apikey": SUPA_KEY,
        "Authorization": `Bearer ${supa._token}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(payload)
    });
    if(!res.ok) {
      const err = await res.json().catch(()=>({message:res.statusText}));
      throw new Error(err.message||err.error||"Upsert failed");
    }
    console.log("✓ Upsert ok");
  },
};


export { supa };

