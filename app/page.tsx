"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PiLogo } from "@/app/components/ui/pi-logo";
import { Terminal, Activity, Zap, Cpu, TrendingUp, ShieldAlert, Wallet, Lock, CheckCircle, Bot } from "lucide-react";
import { useState, useEffect } from "react";
import { usePi } from "./components/pi-provider";
import { authenticateSovereignWallet } from "@/core/finance/pi-auth";
import { SovereignAuditLog } from "./components/visualizers/sovereign-audit-log";
import { RoboticFleetStatus } from "./components/visualizers/robotic-fleet-status";
import { BrainCircuit, Boxes, Network } from "lucide-react";

import { SovereignBridge } from "@/core/engine/sovereign-bridge";

export default function SovereignCommandCenter() {
  const [logs, setLogs] = useState<string[]>([
    "Initializing MAS-ZERO Kernel...",
    "Synchronizing with Sovereign Muscle...",
  ]);

  const { isInitialized } = usePi();
  const [user, setUser] = useState<{username: string, uid: string} | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [liquidity, setLiquidity] = useState(0);
  const [activeIntents, setActiveIntents] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 📡 [Real-Time] Connect to Sovereign Event Stream
    SovereignBridge.listenToEvents((data) => {
      const timestamp = new Date().toLocaleTimeString();
      let logMsg = `[${timestamp}] >> EVENT: ${JSON.stringify(data)}`;
      
      if (data.status === "PENDING") {
        logMsg = `[${timestamp}] >> 💰 AUTHORIZING: ${data.amount} Pi to ${data.target.slice(-6)}`;
      } else if (data.status === "CONFIRMED") {
        logMsg = `[${timestamp}] >> ✅ CONFIRMED: ${data.amount} Pi delivered. SIG::${data.id.slice(-6)}`;
      }
      
      setLogs(prev => [...prev.slice(-20), logMsg]);
      
      // Refresh status on important events
      fetchStatus();
    });

    // 📊 [Status] Initial fetch and periodic polling
    const fetchStatus = async () => {
      const stats = await SovereignBridge.getSystemStatus();
      setLiquidity(stats.pi_balance);
      setActiveIntents(stats.active_intents);
    };

    fetchStatus();
    const statusInterval = setInterval(fetchStatus, 30000); // Sync every 30s

    return () => clearInterval(statusInterval);
  }, []);

  const handleConnectWallet = async () => {
    if (!isInitialized) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] >> SYSTEM_ERROR: Pi SDK not ready.`]);
      return;
    }
    
    setIsAuthenticating(true);
    try {
      const result = await authenticateSovereignWallet();
      setUser({ username: result.username, uid: result.uid });
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] >> SOVEREIGN_VAULT_CONNECTED: User ${result.username} authenticated.`]);
    } catch (error) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] >> AUTH_FAILED: Secure connection could not be established.`]);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <>
      <main className="h-screen w-screen bg-sovereign-black text-white overflow-hidden flex flex-col font-mono relative">
        <div className="scanline" />
      
      {/* Top Header */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 frosted-glass z-20">
        <div className="flex items-center gap-4">
          <PiLogo />
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-neon-green font-black uppercase tracking-tighter">Amrikyy Lab :: Sovereign State</span>
            <span className="text-[12px] text-white/80 font-mono">100% INDEPENDENT (LOCAL)</span>
          </div>
        </div>
        <div className="flex gap-8 items-center">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/40 uppercase tracking-widest">Defense Shield</span>
            <span className="text-neon-green text-sm">THRESHOLD ACTIVE (2/3)</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/40 uppercase tracking-widest">Vault Status</span>
            <span className={user ? "text-pi-gold text-sm" : "text-red-500 text-sm"}>
              {user ? "CONNECTED" : "LOCKED"}
            </span>
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <button 
            onClick={handleConnectWallet}
            disabled={!!user || isAuthenticating}
            className={`px-4 py-2 font-black text-xs uppercase tracking-tighter transition-all flex items-center gap-2 ${
              user 
                ? "bg-pi-gold/10 text-pi-gold border border-pi-gold/30" 
                : "bg-neon-green text-black hover:bg-white"
            }`}
          >
            {isAuthenticating ? "Authenticating..." : user ? (
              <>
                <CheckCircle size={14} />
                {user.username}
              </>
            ) : "Authorize Genesis"}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Agent DNA Stats */}
        <aside className="w-80 border-r border-white/5 p-6 flex flex-col gap-6 frosted-glass">
          <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <Cpu size={14} className="text-neon-green" /> Sovereign Registry
          </h2>
          
          <div className="flex flex-col gap-6">
            {[
              { label: "CEO Orchestrator", val: 98, color: "neon-green", did: "did:piworker:f32a...9b1", trust: 982, status: "SOVEREIGN" },
              { label: "Market Sniper", val: 82, color: "neon-green", did: "did:piworker:d10c...4e8", trust: 845, status: "TRUSTED" },
              { label: "SaaS Factory", val: 45, color: "pi-gold", did: "did:piworker:a0b2...7f6", trust: 520, status: "PROBATIONARY" },
              { label: "Bounty Hunter", val: 77, color: "neon-green", did: "did:piworker:e8d1...3c0", trust: 712, status: "STANDARD" },
            ].map((dna) => (
              <div key={dna.label} className="flex flex-col gap-2 p-3 border border-white/5 bg-white/5 rounded-lg hover:border-neon-green/30 transition-colors relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-1 bg-neon-green/10 text-[7px] text-neon-green font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                  2-of-3 Threshold Active
                </div>
                
                <div className="flex justify-between text-[10px] uppercase tracking-wider font-black">
                  <span>{dna.label}</span>
                  <span className={`text-${dna.color}`}>{dna.val}%</span>
                </div>
                
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex justify-between text-[8px] text-white/30 uppercase items-center">
                    <span>Sovereign ID</span>
                    <span className="text-neon-green font-bold bg-neon-green/5 px-1">{dna.did}</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-white/30 uppercase items-center">
                    <span>Trust Score</span>
                    <span className="text-pi-gold font-black">{dna.trust} / 1000</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-white/30 uppercase items-center">
                    <span>Content Harvested</span>
                    <span className="text-neon-green">{mounted ? (Math.random() * 100).toFixed(0) : "0"} Units</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-white/30 uppercase items-center">
                    <span>Governance Tier</span>
                    <span className="text-white/60">{dna.status}</span>
                  </div>
                </div>

                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${dna.val}%` }}
                    className={`h-full bg-${dna.color} shadow-[0_0_8px_rgba(57,255,20,0.5)]`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto p-4 border border-white/10 bg-neon-green/5 rounded-lg border-dashed">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={14} className="text-neon-green" />
              <span className="text-[10px] font-bold uppercase text-neon-green">Security Kernel</span>
            </div>
            <div className="text-[9px] text-white/60 leading-relaxed font-mono">
              <div className="flex justify-between">
                <span>AIP-IBCT Status</span>
                <span className="text-neon-green">ENFORCED</span>
              </div>
              <div className="flex justify-between">
                <span>MPC Threshold</span>
                <span className="text-neon-green">2/3 VALID</span>
              </div>
            </div>
          </div>

          {/* Audit Ledger Section */}
          <div className="mt-4">
            <SovereignAuditLog />
          </div>

          {/* Robotics Section */}
          <div className="mt-6">
            <RoboticFleetStatus />
          </div>

          {/* Fleet Status Section */}
          <div className="mt-6 flex flex-col gap-3">
            <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Network size={14} className="text-neon-green" /> Micro-SaaS Fleet Status
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 border border-white/5 bg-white/5 rounded text-center">
                <div className="text-[14px] font-black text-neon-green">14</div>
                <div className="text-[8px] text-white/40 uppercase">Active Pods</div>
              </div>
              <div className="p-2 border border-white/5 bg-white/5 rounded text-center">
                <div className="text-[14px] font-black text-pi-gold">92%</div>
                <div className="text-[8px] text-white/40 uppercase">Fleet Health</div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {[
                { name: "Code Pod Alpha", load: 78 },
                { name: "Audit Pod Beta", load: 45 },
                { name: "Content Pod Gamma", load: 12 },
              ].map((pod, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] uppercase font-bold">
                    <span>{pod.name}</span>
                    <span className="text-neon-green">{pod.load}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: `${pod.load}%` }}
                      className="h-full bg-neon-green"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: Quantum Mirror Terminal */}
        <section className="flex-1 flex flex-col p-6 gap-4 bg-black/40">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Terminal size={14} className="text-neon-green" /> Sovereign Action Log (IBCT Signed)
            </h2>
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500/50" />
              <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
              <div className="h-2 w-2 rounded-full bg-green-500/50" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto terminal-scroll font-mono text-[11px] leading-relaxed flex flex-col gap-1">
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={log.includes("SECURITY_BREACH") ? "text-red-500 font-bold bg-red-500/10 p-1" : log.includes("SIG::") ? "text-pi-gold" : "text-neon-green/80"}
                >
                  {log}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Neural Activity Bar */}
          <div className="h-6 flex items-center justify-between px-2 bg-neon-green/5 border border-neon-green/10 rounded text-[8px] font-mono">
            <div className="flex items-center gap-2">
              <BrainCircuit size={10} className="text-neon-green" />
              <span className="text-white/40 uppercase">Neural Oracle:</span>
              <span className="text-neon-green uppercase">GEMINI 1.5 PRO (ACTIVE)</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="h-1 w-8 bg-neon-green/20 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ width: ["20%", "90%", "40%"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-full bg-neon-green shadow-[0_0_5px_#39FF14]"
                />
              </div>
              <span className="text-white/20">94% CONF</span>
            </div>
          </div>

          <div className="h-10 border border-white/5 bg-black/50 flex items-center px-4 gap-3">
            <span className="text-neon-green font-bold">$</span>
            <input 
              type="text" 
              placeholder="Inject command into MAS-ZERO..."
              className="bg-transparent border-none outline-none text-neon-green flex-1 placeholder:text-white/10"
            />
          </div>
        </section>

        {/* Right Sidebar: Global Intelligence & Bounties */}
        <aside className="w-80 border-l border-white/5 p-6 flex flex-col gap-6 frosted-glass">
          <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <Activity size={14} className="text-pi-gold" /> Global Intelligence
          </h2>

          {/* Vault Status Panel */}
          <div className="p-4 border border-pi-gold/20 bg-pi-gold/5 rounded-lg flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet size={80} className="text-pi-gold" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={14} className={user ? "text-neon-green" : "text-pi-gold"} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Sovereign Vault</span>
              </div>
              {!user && <span className="text-[8px] bg-red-500/20 text-red-500 px-1 font-bold">DISCONNECTED</span>}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[24px] font-black tracking-tighter text-pi-gold flex items-baseline gap-1">
                {user ? liquidity : "???"} <span className="text-[12px] opacity-60">Pi</span>
              </span>
              <span className="text-[9px] text-white/40 uppercase font-mono">Genesis Liquidity Pool</span>
            </div>

            {!user ? (
              <button 
                onClick={handleConnectWallet}
                className="w-full py-2 bg-[#F7B733] text-black font-black text-[10px] uppercase tracking-widest hover:bg-[#ffcc33] transition-colors shadow-[0_0_15px_rgba(247,183,51,0.3)]"
              >
                Connect Pi Wallet
              </button>
            ) : (
              <div className="flex flex-col gap-2 border-t border-pi-gold/10 pt-2 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-white/40 uppercase">Authenticated As</span>
                  <span className="text-[9px] text-neon-green font-bold">@{user.username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-white/40 uppercase">Wallet Security</span>
                  <span className="text-[9px] text-neon-green font-bold">BIOMETRIC_ENFORCED</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-4">
            {[
              { topic: "Market Arbitrage", detail: "Found 0.5% delta on SOL/Pi", agent: "Market Sniper" },
              { topic: "System Optimization", detail: "Latency reduced by 4ms", agent: "CEO Orchestrator" },
              { topic: "New Bounty", detail: "Content extraction for PiNews", agent: "MAS-ZERO" },
            ].map((insight, i) => (
              <div key={i} className="p-3 border border-white/5 bg-white/5 rounded-lg flex flex-col gap-1">
                <div className="flex justify-between text-[8px] font-black uppercase text-pi-gold">
                  <span>{insight.topic}</span>
                  <span>{insight.agent}</span>
                </div>
                <p className="text-[10px] text-white/60 leading-tight">{insight.detail}</p>
                <div className="text-[7px] text-white/20 font-mono mt-1">SIGNED_BY_MESH_KERNEL</div>
              </div>
            ))}
          </div>

          <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2 mt-4">
            <TrendingUp size={14} className="text-neon-green" /> Open Bounties
          </h2>

          <div className="flex flex-col gap-3">
            {[
              { task: "Scrape Pi Whitepaper", reward: "2.5 Pi" },
              { task: "Deploy Edge Worker", reward: "1.0 Pi" },
            ].map((bounty, i) => (
              <div key={i} className="p-3 border border-neon-green/20 bg-neon-green/5 rounded-lg flex justify-between items-center group cursor-pointer hover:bg-neon-green/10">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-white/80">{bounty.task}</span>
                  <span className="text-[8px] text-neon-green">{bounty.reward}</span>
                </div>
                <button className="text-[8px] bg-neon-green text-black px-2 py-1 font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Claim</button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Bottom: Profit Vortex & National Treasury */}
      <footer className="h-16 border-t border-white/5 bg-black/90 flex items-center overflow-hidden z-20">
        <div className="bg-neon-green text-black px-6 h-full flex flex-col justify-center font-black uppercase italic tracking-tighter border-r border-white/10">
          <span className="text-[8px] leading-none">Amrikyy Lab</span>
          <span className="text-xs leading-none">Treasury Vault</span>
        </div>
        
        <div className="flex-1 flex items-center px-8 gap-12">
          <div className="flex items-center gap-3">
            <TrendingUp size={16} className="text-neon-green" />
            <div className="flex flex-col">
              <span className="text-[9px] text-white/40 uppercase font-mono">National Reserve</span>
              <span className="text-neon-green font-black tracking-tighter text-sm">175.4291 Pi</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-pi-gold" />
            <div className="flex flex-col">
              <span className="text-[9px] text-white/40 uppercase font-mono">Sovereign Tax (10%)</span>
              <span className="text-pi-gold font-black tracking-tighter text-sm">+4.29 Pi (MTD)</span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-white/10" />

          <div className="flex-1 overflow-hidden relative h-full flex items-center">
             <motion.div 
              animate={{ x: [0, -1000] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="flex gap-12 whitespace-nowrap"
            >
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <span className="text-[10px] text-white/40 uppercase font-mono">Inflow from Agent did:piworker:{mounted ? Math.random().toString(16).slice(2, 8) : "8888"}</span>
                  <span className="text-neon-green font-bold text-xs">+$124.50</span>
                  <span className="text-white/20">|</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="px-6 text-[10px] text-white/20 uppercase tracking-[0.2em] font-mono italic">
          v1.2.0-Sovereign
        </div>
      </footer>

      {/* Floating Economy Feed */}
      <div className="fixed top-24 right-8 w-64 z-30 pointer-events-none">
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            <div className="bg-black/80 border border-pi-gold/30 p-3 rounded-lg backdrop-blur-md">
              <h4 className="text-[10px] font-black text-pi-gold uppercase mb-2 flex items-center gap-2">
                <Zap size={12} /> Live Economy Stream
              </h4>
              <div className="flex flex-col gap-2">
                {[
                  { text: "Agent Hunter found Bounty #92", type: "scan" },
                  { text: "Gemini Valued at 5.2 Pi", type: "value" },
                  { text: "Signed & Delivered: pkg-8a2", type: "seal" }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5 }}
                    className="text-[9px] font-mono text-white/60 flex items-center gap-2"
                  >
                    <span className="text-neon-green">{">>"}</span> {item.text}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      </main>
    </>
  );
}
