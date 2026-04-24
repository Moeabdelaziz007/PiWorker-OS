"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Zap, ShieldCheck, Cpu, Code, Search, ArrowRight } from "lucide-react";
import { useState } from "react";
import { PiLogo } from "@/app/components/ui/pi-logo";
import { usePi } from "../components/pi-provider";
import { authenticateSovereignWallet } from "@/core/finance/pi-auth";
import { ingestSaaSOrder } from "@/core/engine/order-ingestion";

const AGENT_PRODUCTS = [
  {
    id: "agt-ui-gen",
    name: "React/Next.js UI Generator",
    description: "High-fidelity component architecture & design systems.",
    price: 2,
    executor: "Market Sniper",
    dna: "98% Match",
    icon: <Code className="text-neon-green" />
  },
  {
    id: "agt-audit",
    name: "Smart Contract Auditor",
    description: "Deep-tissue security analysis for Solidity & Rust.",
    price: 5,
    executor: "CEO Orchestrator",
    dna: "99% Match",
    icon: <ShieldCheck className="text-pi-gold" />
  },
  {
    id: "agt-content",
    name: "AI Content Architect",
    description: "SEO-optimized technical documentation & marketing DNA.",
    price: 1.5,
    executor: "SaaS Factory",
    dna: "82% Match",
    icon: <Search className="text-blue-400" />
  }
];

export default function SovereignMarketplace() {
  const { user, setUser } = usePi();
  const [cart, setCart] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleHire = async (agentId: string) => {
    Codebase, understand the current status of our Go language and how we can elaborate it, and about the payment system also, and how we are going to connect everything together.Go take a look and come back and let me know!     let currentUser = user;
    if (!currentUser) {
      const auth = await authenticateSovereignWallet();
      if (auth) {
        currentUser = { username: auth.username, uid: auth.uid };
        setUser(currentUser);
      }
      else return;
    }

    setIsProcessing(true);
    const agent = AGENT_PRODUCTS.find(a => a.id === agentId);
    if (agent) {
      const order = await ingestSaaSOrder(currentUser.uid, agentId, agent.price);
      setCart([...cart, order.orderId]);
    }
    setIsProcessing(false);
  };

  return (
    <main className="min-h-screen bg-sovereign-black text-white font-mono relative overflow-hidden">
      <div className="scanline" />

      {/* Header */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 frosted-glass z-20">
        <div className="flex items-center gap-4">
          <PiLogo />
          <div className="flex flex-col">
            <span className="text-[10px] text-neon-green font-black uppercase">Amrikyy Lab</span>
            <span className="text-lg font-black tracking-tighter">SOVEREIGN MARKETPLACE</span>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <div className="text-right">
            <div className="text-[10px] text-white/40 uppercase">Sovereign Identity</div>
            <div className="text-neon-green text-sm">{user ? `@${user.username}` : "UNAUTHORIZED"}</div>
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="relative">
            <ShoppingCart className="text-pi-gold" size={24} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl"
        >
          <h1 className="text-5xl font-black italic tracking-tighter mb-4 text-gradient">
            HIRE SOVEREIGN AGENTS.<br />SCALE YOUR REVENUE.
          </h1>
          <p className="text-white/60 max-w-2xl text-sm leading-relaxed mb-8">
            Access specialized Micro-SaaS execution directly from the Amrikyy Lab workforce.
            All tasks are secured by the Quantum Mirror and settled via Pi Network Escrow.
          </p>
        </motion.div>

        {/* Marketplace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AGENT_PRODUCTS.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 border border-white/10 bg-white/5 rounded-2xl hover:border-neon-green/50 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Cpu size={80} />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-neon-green/30">
                  {agent.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{agent.name}</h3>
                  <span className="text-[10px] text-neon-green font-black uppercase">{agent.dna} FIT</span>
                </div>
              </div>

              <p className="text-xs text-white/50 mb-6 h-10 line-clamp-2">
                {agent.description}
              </p>

              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/30 uppercase">Task Price</span>
                  <span className="text-pi-gold font-black text-xl">{agent.price} Pi</span>
                </div>
                <button
                  onClick={() => handleHire(agent.id)}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-neon-green text-black font-black text-xs uppercase italic tracking-tighter hover:bg-white transition-colors flex items-center gap-2"
                >
                  Hire Agent <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Action Feed */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-black border-t border-white/5 flex items-center px-8 z-30">
        <div className="flex items-center gap-2 text-neon-green animate-pulse">
          <Zap size={14} />
          <span className="text-[10px] font-black uppercase">Live Order Stream:</span>
        </div>
        <div className="flex-1 px-4 overflow-hidden">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex gap-12 whitespace-nowrap text-[10px] text-white/40 font-mono"
          >
            {[...Array(5)].map((_, i) => (
              <span key={i}>
                [ORDER_INC] :: Agent {AGENT_PRODUCTS[i % 3].executor} started task #{Math.random().toString(36).slice(2, 8).toUpperCase()} ...
              </span>
            ))}
          </motion.div>
        </div>
      </footer>
    </main>
  );
}
