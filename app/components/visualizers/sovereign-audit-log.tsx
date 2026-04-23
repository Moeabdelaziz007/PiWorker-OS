"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Link as LinkIcon, Fingerprint } from "lucide-react";
import { useEffect, useState } from "react";

interface LedgerEntry {
  timestamp: string;
  agentId: string;
  action: string;
  inputHash: string;
  outputHash: string;
  signature: string;
  causalLink: string;
}

export const SovereignAuditLog = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await fetch("/api/ledger");
        const data = await res.json();
        if (Array.isArray(data)) setEntries(data.reverse());
      } catch (err) {
        console.error("Ledger connection failed");
      }
    };

    fetchLedger();
    const interval = setInterval(fetchLedger, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
        <ShieldCheck size={14} className="text-neon-green" /> Sovereign Audit Ledger
      </h2>
      
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 terminal-scroll">
        {entries.length === 0 ? (
          <div className="text-[10px] text-white/20 italic p-4 border border-white/5 bg-white/5 rounded">
            Waiting for causal traces...
          </div>
        ) : (
          entries.map((entry, i) => (
            <motion.div
              key={entry.timestamp + i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 border border-neon-green/10 bg-neon-green/5 rounded-lg flex flex-col gap-1 hover:bg-neon-green/10 transition-colors group"
            >
              <div className="flex justify-between items-center text-[8px] font-black uppercase text-neon-green">
                <div className="flex items-center gap-1">
                  <Fingerprint size={10} />
                  <span>{entry.action}</span>
                </div>
                <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
              </div>
              
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between text-[7px] text-white/40 font-mono">
                  <span>AGENT_ID</span>
                  <span className="text-white/80">{entry.agentId}</span>
                </div>
                <div className="flex justify-between text-[7px] text-white/40 font-mono">
                  <span>INPUT_HASH</span>
                  <span className="text-white/60">{entry.inputHash.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between text-[7px] text-white/40 font-mono">
                  <span>CAUSAL_LINK</span>
                  <div className="flex items-center gap-1 text-pi-gold">
                    <LinkIcon size={8} />
                    <span>{entry.causalLink.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-1 pt-1 border-t border-white/5 flex justify-between items-center">
                <span className="text-[6px] text-white/20 uppercase tracking-widest">Shard-Verified</span>
                <span className="text-[7px] text-neon-green font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {entry.signature.slice(0, 16)}...
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
