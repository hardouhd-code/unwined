import React, { useEffect, useState, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { supa } from "./lib/supabase";
import { t } from "./lib/i18n";
import { C } from "./lib/constants";
import { haptic } from "./lib/helpers";

import { AuthScreen } from "./components/AuthScreen";
import { PageSkeleton } from "./components/UI";
import { AnimatePresence, motion } from "framer-motion";
import { ChatSommelier } from "./components/ChatSommelier";

const Accueil = React.lazy(() => import("./components/Accueil").then(m => ({ default: m.Accueil })));
const MaCave = React.lazy(() => import("./components/MaCave").then(m => ({ default: m.MaCave })));
const SmartScanner = React.lazy(() => import("./components/SmartScanner").then(m => ({ default: m.SmartScanner })));
const Decouvrir = React.lazy(() => import("./components/Decouvrir").then(m => ({ default: m.Decouvrir })));
const AddWineForm = React.lazy(() => import("./components/AddWineForm").then(m => ({ default: m.AddWineForm })));
const WineDetail = React.lazy(() => import("./components/WineDetail").then(m => ({ default: m.WineDetail })));
import { useStore } from "./store/useStore";

export default function UnwinedApp() {
  const [authLoading, setAuthLoading] = useState(true);
  const { user, setUser, loadProfile } = useStore();
  const [syncing, setSyncing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [notifStatus, setNotifStatus] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      const session = await supa.getSession();
      if (session) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }
      setAuthLoading(false);
    })();
    const seed = parseInt(localStorage.getItem("unwined_seed") || "0");
    localStorage.setItem("unwined_seed", String(seed + 1));
  }, []);

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

  const handleAuth = async (u: any) => {
    setUser(u);
    await loadProfile(u.id);
    navigate("/");
  };

  const handleSignOut = async () => {
    await supa.signOut();
    setUser(null);
    useStore.setState({ db: [], userName: "" });
    navigate("/");
  };

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const permission = await Notification.requestPermission();
      setNotifStatus(permission);
    } catch {
      setNotifStatus("denied");
    }
  };

  const TABS = [
    { id: "/", label: t("nav_home"), icon: "🏠" },
    { id: "/cave", label: t("nav_cave"), icon: "🗄️" },
    { id: "/scan", label: t("nav_scan"), icon: "📷" },
    { id: "/decouvrir", label: t("nav_discover"), icon: "✦" },
  ];

  if (authLoading) return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-[pulse_1.5s_ease-in-out_infinite] [filter:drop-shadow(0_4px_14px_rgba(200,80,58,.7))_saturate(2)_brightness(1.1)]">🍷</div>
        <div className="text-sm text-[var(--color-muted-text)] italic font-['Cormorant_Garamond',serif]">Chargement…</div>
      </div>
    </div>
  );

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  // /scan garde la navbar — seuls /vin/:id et /add la masquent
  const isDetailOrAdd = location.pathname.startsWith("/vin/") || location.pathname === "/add";
  const isScan = location.pathname === "/scan";

  return (
    <div className="app-shell flex flex-col font-['Manrope',sans-serif]">
      {!isDetailOrAdd && !isScan && (
        <div className="android-glass px-5 pt-7 shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[10px] text-[var(--color-gold)] font-bold mb-1 uppercase tracking-[.32em] font-['Manrope',sans-serif]">
                {t("personal_sommelier")} · {syncing ? t("syncing") : t("connected")}
              </div>
              <h1 className="text-[30px] font-medium leading-[1.05] m-0 text-[var(--color-gold)] uppercase tracking-[.14em] font-['Noto_Serif',serif]">
                La Selection
              </h1>
            </div>
            <button onClick={handleSignOut} className="text-[10px] text-[var(--color-gold)] bg-transparent border border-[var(--color-border-subtle)] rounded-full px-3.5 py-1.5 uppercase tracking-[.1em] mt-1 font-['Manrope',sans-serif]">
              {t("logout")}
            </button>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-[rgba(197,160,89,.55)] to-transparent" />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Suspense fallback={<PageSkeleton />}><PageTransition><Accueil /></PageTransition></Suspense>} />
            <Route path="/cave" element={<Suspense fallback={<PageSkeleton />}><PageTransition><MaCave /></PageTransition></Suspense>} />
            <Route path="/decouvrir" element={<Suspense fallback={<PageSkeleton />}><PageTransition><Decouvrir /></PageTransition></Suspense>} />
            <Route path="/scan" element={<Suspense fallback={<PageSkeleton />}><PageTransition><SmartScanner /></PageTransition></Suspense>} />
            <Route path="/add" element={<Suspense fallback={<PageSkeleton />}><PageTransition><AddWineForm /></PageTransition></Suspense>} />
            <Route path="/vin/:id" element={<Suspense fallback={<PageSkeleton />}><PageTransition><WineDetail /></PageTransition></Suspense>} />
          </Routes>
        </AnimatePresence>
      </div>

      {/* Navbar fixée en bas */}
      {!isDetailOrAdd && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(94vw,430px)] z-50">
          <div className="android-glass flex rounded-[18px] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,.35)]">
            {TABS.map(tab_item => {
              const isActive = location.pathname === tab_item.id;
              return (
                <button key={tab_item.id} onClick={() => { haptic(30); navigate(tab_item.id); }}
                  className={`flex-1 relative border-none rounded-xl pt-3 pb-2.5 px-1 flex flex-col items-center gap-1 ${isActive ? "bg-[rgba(197,160,89,.18)]" : "bg-transparent"}`}>
                  <span className="text-lg leading-none">{tab_item.icon}</span>
                  <span className={`text-[10px] uppercase tracking-[.06em] font-['Manrope',sans-serif] leading-[1.1] ${isActive ? "text-[var(--color-gold)] font-bold" : "text-[var(--color-muted-text)] font-semibold"}`}>{tab_item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showOnboarding && (
        <div className="fixed inset-0 bg-black/55 z-[300] flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] bg-[#211a15] border border-[rgba(197,160,89,.25)] rounded-2xl p-4">
            <div className="text-[11px] text-[var(--color-gold)] uppercase tracking-[.16em] mb-2.5">
              Onboarding premium
            </div>
            {onboardingStep === 0 && (
              <div>
                <div className="text-xl text-[var(--color-cream)] font-['Noto_Serif',serif] mb-2">Bienvenue dans Unwine-D</div>
                <div className="text-[13px] text-[var(--color-subtext)] mb-3.5">Scanner une etiquette, ajoute le vin, puis note-le pour personnaliser ta selection.</div>
              </div>
            )}
            {onboardingStep === 1 && (
              <div>
                <div className="text-xl text-[var(--color-cream)] font-['Noto_Serif',serif] mb-2">Ton flux ideal</div>
                <div className="text-[13px] text-[var(--color-subtext)] mb-3.5">1) `Scan IA` pour identifier. 2) `Ma Cave` pour suivre le stock. 3) `Decouvrir` pour acheter selon tes gouts.</div>
              </div>
            )}
            {onboardingStep === 2 && (
              <div>
                <div className="text-xl text-[var(--color-cream)] font-['Noto_Serif',serif] mb-2">Pret pour la release</div>
                <div className="text-[13px] text-[var(--color-subtext)] mb-3.5">Active les favoris et les alertes stock bas pour un rachat en 1 clic.</div>
                <button
                  onClick={enableNotifications}
                  className="bg-transparent border border-[var(--color-gold)]/30 rounded-xl px-2.5 py-1.5 text-[var(--color-gold)] mb-2.5"
                >
                  {notifStatus === "granted" ? "Notifications actives" : "Activer notifications"}
                </button>
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={() => {
                  if (onboardingStep === 0) return setShowOnboarding(false);
                  setOnboardingStep((s) => Math.max(0, s - 1));
                }}
                className="bg-transparent border border-[var(--color-gold)]/25 text-[var(--color-muted-text)] rounded-2xl px-2.5 py-1.5 min-h-0"
              >
                {onboardingStep === 0 ? "Passer" : "Retour"}
              </button>
              <button
                onClick={() => {
                  if (onboardingStep < 2) return setOnboardingStep((s) => s + 1);
                  try { localStorage.setItem(`unwined_onboarding_done_${user?.id}`, "1"); } catch { /* ignore */ }
                  setShowOnboarding(false);
                }}
                className="bg-[#e9c17633] border border-[#e9c17673] text-[var(--color-gold)] rounded-2xl px-3 py-1.5 min-h-0"
              >
                {onboardingStep < 2 ? "Suivant" : "Commencer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sommelier IA Modal */}
      <ChatSommelier isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* FAB: Bouton flottant Sommelier IA */}
      {!isDetailOrAdd && !isChatOpen && (
        <button
          onClick={() => { haptic(30); setIsChatOpen(true); }}
          className="fixed bottom-[96px] right-[max(16px,calc(50vw-200px))] w-[56px] h-[56px] rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[#8b5a3c] text-white flex items-center justify-center text-2xl shadow-[0_8px_24px_rgba(139,90,60,.4)] border-none cursor-pointer z-[100] active:scale-95 transition-transform"
        >
          🤖
        </button>
      )}
    </div>
  );
}

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className="h-full w-full flex flex-col"
  >
    {children}
  </motion.div>
);
