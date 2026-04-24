"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ShieldCheck, Cpu, Globe, ArrowUpRight } from "lucide-react";

interface AxiomDID {
  did: string;
  reputation: number;
  network: string;
}

interface AIXAsset {
  id: string;
  name: string;
  did: AxiomDID;
  price_pi: number;
  status: string;
}

export const MarketHub = () => {
  const [assets, setAssets] = useState<AIXAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/marketplace");
      const data = await res.json();
      setAssets(data);
    } catch (err) {
      console.error("Failed to fetch assets", err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-[#39FF14]/20 rounded-2xl p-6 h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[#39FF14] text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            AIX SOVEREIGN MARKETPLACE
          </h2>
          <p className="text-[#39FF14]/50 text-xs uppercase tracking-widest mt-1">
            Institutional-Grade Agent Assets // AxiomID Protocol
          </p>
        </div>
        <div className="bg-[#39FF14]/10 px-3 py-1 rounded-full border border-[#39FF14]/30">
          <span className="text-[#39FF14] text-[10px] font-mono">NETWORK: AXIOMID.APP</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#39FF14]"></div>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-20 opacity-30">
            <Cpu className="w-12 h-12 mx-auto mb-4" />
            <p className="text-sm">NO ASSETS MINTED IN FOUNDRY</p>
          </div>
        ) : (
          <AnimatePresence>
            {assets.map((asset) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="group bg-white/5 border border-white/10 hover:border-[#39FF14]/50 p-4 rounded-xl transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium">{asset.name}</h3>
                      <ShieldCheck className="w-4 h-4 text-[#39FF14] fill-[#39FF14]/20" />
                    </div>
                    <p className="text-[10px] font-mono text-white/40 truncate w-64">
                      {asset.did.did}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[#39FF14] font-bold text-lg">{asset.price_pi}π</span>
                    <p className="text-[10px] text-white/30 uppercase">Per Call</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 opacity-60">
                      <Globe className="w-3 h-3" />
                      <span className="text-[10px] font-mono uppercase">{asset.did.network}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#39FF14]">
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="text-[10px] font-mono">REP: {asset.did.reputation}%</span>
                    </div>
                  </div>
                  <button className="bg-[#39FF14] text-black text-[10px] font-bold px-4 py-1.5 rounded uppercase hover:bg-white transition-colors">
                    Acquire Skill
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
