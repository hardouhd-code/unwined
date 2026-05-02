import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";
import { askSommelier } from "../lib/claude";
import { haptic } from "../lib/helpers";

interface ChatSommelierProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const ChatSommelier: React.FC<ChatSommelierProps> = ({ isOpen, onClose }) => {
  const { db, userName } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `Bonjour ${userName || ""} ! Je suis votre sommelier personnel. Que puis-je faire pour vous aujourd'hui ? (Ex: "Quel vin ouvrir avec un poulet rôti ?")` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    haptic(20);

    try {
      const apiHistory = messages.map(m => ({ role: m.role, content: m.content }));
      apiHistory.push({ role: "user", content: userMsg });

      const reply = await askSommelier(apiHistory, db, userName);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      haptic(50);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, je rencontre des difficultés à me connecter à la cave pour le moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[900] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[85dvh] max-h-[800px] bg-[#211a15] rounded-t-[24px] z-[910] flex flex-col border-t border-[rgba(197,160,89,.25)] shadow-[0_-10px_40px_rgba(0,0,0,.5)] font-['Manrope',sans-serif]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-[rgba(197,160,89,.15)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[radial-gradient(circle_at_35%_35%,var(--color-terra-light),var(--color-terra-dark))] flex items-center justify-center text-xl shadow-[0_0_15px_rgba(200,80,58,.3)]">🤖</div>
                <div>
                  <div className="text-[15px] font-['Playfair_Display',serif] text-[var(--color-cream)] font-bold">Sommelier IA</div>
                  <div className="text-[10px] text-[var(--color-gold)] uppercase tracking-[.1em] font-bold">En ligne</div>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#302822] text-[var(--color-muted-text)] flex items-center justify-center border-none cursor-pointer">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[85%] ${m.role === "user" ? "self-end" : "self-start"}`}>
                  <div className={`p-3.5 rounded-[18px] text-[14px] leading-[1.5] ${m.role === "user" ? "bg-[var(--color-gold)] text-[#412d00] rounded-br-sm" : "bg-[#302822] text-[var(--color-cream)] border border-[rgba(197,160,89,.15)] rounded-bl-sm"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="self-start bg-[#302822] text-[var(--color-cream)] border border-[rgba(197,160,89,.15)] rounded-[18px] rounded-bl-sm p-3 text-[14px] flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full animate-bounce" style={{animationDelay: "0ms"}}></span>
                  <span className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full animate-bounce" style={{animationDelay: "150ms"}}></span>
                  <span className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full animate-bounce" style={{animationDelay: "300ms"}}></span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-[#1a1410] border-t border-[rgba(197,160,89,.15)] pwa-safe-bottom">
              <div className="flex items-end gap-2 bg-[#2a221d] rounded-[22px] border border-[rgba(197,160,89,.2)] p-1.5 focus-within:border-[var(--color-gold)] transition-colors">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Ex: Un vin pour des pâtes à la truffe ?"
                  className="flex-1 max-h-[100px] min-h-[44px] bg-transparent border-none text-[var(--color-cream)] px-3 py-2.5 text-[14px] outline-none resize-none font-['Manrope',sans-serif]"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className={`w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 border-none transition-colors cursor-pointer ${input.trim() && !loading ? "bg-gradient-to-br from-[var(--color-gold)] to-[#8b5a3c] text-[#fff]" : "bg-[#3a302a] text-[var(--color-muted-text)]"}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
