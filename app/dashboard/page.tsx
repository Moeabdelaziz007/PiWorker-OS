"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OmniTerminal } from '@/app/components/omni-terminal';
import { Cpu, AlertCircle } from 'lucide-react';

/**
 * AMRIKYY LAB :: SOVEREIGN DASHBOARD V3
 * THEME: QUANTUM CYBERPUNK TACTICAL COMMAND CENTER
 * LAYOUT: 3-COLUMN TACTICAL SYSTEM
 * STATUS: ELITE SOVEREIGN CONTROL PLANE ACTIVE
 */
export default function SovereignDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Live Data Polling (Every 5 seconds)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sovereign-state');
        const json = await res.json();
        if (json.success) {
          setData(json.state);
        }
      } catch (err) {
        console.error("Dashboard sync error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-screen flex items-center justify-center bg-black"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="mx-auto mb-4"
          >
            <Cpu size={40} className="text-green-500" />
          </motion.div>
          <div className="text-green-500 font-mono text-lg tracking-widest">
            INITIALIZING QUANTUM BRIDGE...
          </div>
        </div>
      </motion.div>
    );
  }

  const treasury = data?.treasury || { reserves: 0, status: 'OFFLINE' };
  const fleet = data?.fleet || { count: 0, active: 0, ready: 0, agents: [] };
  const logs = data?.logs || [];

  return (
    <div className="min-h-screen bg-black text-white overflow-auto">
      {/* Background Carbon Grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #151515 1px, transparent 1px), linear-gradient(to bottom, #151515 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          zIndex: 0,
        }}
      />

      <main className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 border-b border-gray-700/50 pb-6"
        >
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-5xl font-black -tracking-1">
                AMRIKYY<span className="text-green-500">LAB</span>
              </h1>
              <p className="text-xs uppercase tracking-widest text-gray-500 mt-2">
                Sovereign Agent Economy OS // Tactical Command v3.0
              </p>
            </div>
            <motion.div
              animate={{ opacity: [0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-right"
            >
              <div className="text-xs uppercase tracking-wider text-gray-600">
                System Heartbeat
              </div>
              <div className="text-lg font-bold text-green-500 flex items-center justify-end gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                OPERATIONAL
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* 3-Column Tactical Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT COLUMN: Fleet Status */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="col-span-3 space-y-6"
          >
            {/* Active Agents */}
            <div
              className="frosted-glass rounded-lg p-6 border border-cyan-500/30 min-h-72"
              style={{
                boxShadow:
                  '0 0 20px rgba(0, 229, 255, 0.2), inset 0 0 20px rgba(0, 229, 255, 0.03)',
              }}
            >
              <h3 className="text-xs uppercase tracking-widest font-bold text-cyan-400 mb-6">
                Fleet Status
              </h3>

              <div className="space-y-6">
                {/* Total Units */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Total Units
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl font-black text-cyan-400"
                  >
                    {fleet.count}
                  </motion.div>
                </div>

                {/* Active / Ready Split */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 border border-green-500/30 rounded-lg p-4 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-green-500 font-bold mb-1">
                      Active
                    </div>
                    <div className="text-3xl font-black text-green-400">
                      {fleet.active}
                    </div>
                  </div>
                  <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold mb-1">
                      Ready
                    </div>
                    <div className="text-3xl font-black text-yellow-400">
                      {fleet.ready}
                    </div>
                  </div>
                </div>

                {/* Neural Load */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs uppercase tracking-wider text-gray-500">
                      Neural Load
                    </span>
                    <span className="text-xs font-bold text-cyan-400">72%</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-cyan-500/20">
                    <motion.div
                      initial={{ width: '60%' }}
                      animate={{ width: '72%' }}
                      transition={{ duration: 1 }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
                      style={{
                        boxShadow: '0 0 10px rgba(0, 229, 255, 0.6)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Performance */}
            <div
              className="frosted-glass rounded-lg p-6 border border-purple-500/30"
              style={{
                boxShadow:
                  '0 0 20px rgba(168, 85, 247, 0.1), inset 0 0 20px rgba(168, 85, 247, 0.02)',
              }}
            >
              <h3 className="text-xs uppercase tracking-widest font-bold text-purple-400 mb-4">
                Agent Performance
              </h3>
              <div className="space-y-2">
                {fleet.agents?.slice(0, 3).map((agent: any) => (
                  <div key={agent.agentId} className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">{agent.agentId}</span>
                      <span className="text-green-400 font-bold">98%</span>
                    </div>
                    <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500/50 w-[98%]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* CENTER COLUMN: Omni-Terminal Command Center */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="col-span-6"
          >
            <OmniTerminal />
          </motion.div>

          {/* RIGHT COLUMN: Profit Vortex / Treasury */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="col-span-3 space-y-6"
          >
            {/* Profit Vortex - Big Golden Numbers */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="frosted-glass rounded-lg p-8 border border-yellow-500/40 min-h-72 flex flex-col justify-center items-center text-center"
              style={{
                boxShadow:
                  '0 0 30px rgba(247, 183, 51, 0.3), inset 0 0 30px rgba(247, 183, 51, 0.05)',
              }}
            >
              <h3 className="text-xs uppercase tracking-widest font-bold text-yellow-500 mb-4">
                National Reserve
              </h3>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8 }}
                className="mb-4"
              >
                <div className="text-6xl font-black text-yellow-400">
                  {treasury.reserves.toFixed(0)}
                </div>
                <div className="text-2xl text-yellow-500 font-bold mt-2">π</div>
              </motion.div>

              <div className="flex items-center justify-center gap-2 mt-6">
                <div
                  className="w-3 h-3 rounded-full bg-green-500"
                  style={{
                    boxShadow: '0 0 8px rgba(57, 255, 20, 0.8)',
                  }}
                />
                <span className="text-xs uppercase tracking-wider font-bold text-green-500">
                  {treasury.status}
                </span>
              </div>
            </motion.div>

            {/* Escrow Status */}
            <div
              className="frosted-glass rounded-lg p-6 border border-red-500/20"
              style={{
                boxShadow:
                  '0 0 15px rgba(239, 68, 68, 0.1), inset 0 0 15px rgba(239, 68, 68, 0.02)',
              }}
            >
              <h3 className="text-xs uppercase tracking-widest font-bold text-red-400 mb-4">
                Escrow Holdings
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">Locked Reserve</span>
                    <span className="text-xs font-bold text-red-400">
                      {(treasury.reserves * 0.15).toFixed(0)} π
                    </span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full w-[15%] bg-red-500/50" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">Pending Release</span>
                    <span className="text-xs font-bold text-orange-400">
                      {(treasury.reserves * 0.08).toFixed(0)} π
                    </span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full w-[8%] bg-orange-500/50" />
                  </div>
                </div>
              </div>
            </div>

            {/* System Alerts */}
            <div
              className="frosted-glass rounded-lg p-4 border border-blue-500/20"
              style={{
                boxShadow:
                  '0 0 15px rgba(59, 130, 246, 0.1), inset 0 0 15px rgba(59, 130, 246, 0.02)',
              }}
            >
              <h3 className="text-xs uppercase tracking-widest font-bold text-blue-400 mb-3">
                System Alerts
              </h3>
              <div className="space-y-2">
                <motion.div
                  initial={{ x: -10 }}
                  animate={{ x: 0 }}
                  className="flex items-start gap-2 text-xs p-2 bg-blue-500/10 rounded border border-blue-500/20"
                >
                  <AlertCircle size={14} className="text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-blue-300">
                    Neural sync: {fleet.active}/{fleet.count} agents online
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center text-xs opacity-20 tracking-widest uppercase"
        >
          AMRIKYY LAB // SOVEREIGN ENGINE // ELITE COMMAND TIER // ALL RIGHTS RESERVED
        </motion.footer>
      </main>
    </div>
  );
}
