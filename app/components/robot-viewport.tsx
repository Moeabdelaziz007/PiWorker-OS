"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Battery, Zap, Activity } from "lucide-react";

interface RobotState {
  id: string;
  battery: number;
  temperature: number;
  joint_angles: number[];
  status: "idle" | "executing" | "offline";
  current_task: string;
}

export const RobotViewport = () => {
  const [state, setState] = useState<RobotState>({
    id: "PI-BOT-01",
    battery: 85,
    temperature: 42.5,
    joint_angles: [0, 45, -30, 0, 90, 0],
    status: "idle",
    current_task: "READY_FOR_GOAL"
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Simulate live telemetry
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        joint_angles: prev.joint_angles.map(a => a + (Math.random() - 0.5) * 2),
        temperature: 42 + Math.random()
      }));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-black/60 backdrop-blur-2xl border border-blue-500/30 rounded-3xl p-6 h-full flex flex-col relative overflow-hidden group">
      {/* Scanning Line Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <motion.div 
          animate={{ y: ["0%", "100%", "0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-full h-1 bg-blue-400 shadow-[0_0_20px_#60a5fa]"
        />
      </div>

      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <h2 className="text-blue-400 text-lg font-bold flex items-center gap-2 tracking-tighter">
            <Activity className="w-5 h-5" />
            ROBOT_VIEWPORT :: π0.7_LINK
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest">
              Live Kinematic Stream
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-white/20 text-[10px] font-mono block">UNIT_ID</span>
          <span className="text-white font-bold font-mono tracking-tighter">{state.id}</span>
        </div>
      </div>

      {/* Main Visualizer (Simplified Schematic) */}
      <div className="flex-1 flex items-center justify-center relative py-10">
        <div className="w-48 h-48 rounded-full border-2 border-dashed border-blue-500/20 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-3xl" />
          
          {/* Mock Joint Visualizers */}
          {state.joint_angles.map((angle, i) => (
            <motion.div
              key={i}
              animate={{ rotate: angle }}
              style={{ 
                height: `${80 - i * 10}px`, 
                width: '2px', 
                backgroundColor: i === 0 ? '#60a5fa' : 'rgba(96, 165, 250, 0.3)',
                position: 'absolute',
                transformOrigin: 'bottom center',
                bottom: '50%'
              }}
            />
          ))}
          
          <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_#3b82f6] relative z-20" />
        </div>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-white/40">
            <Battery className="w-3 h-3" />
            <span className="text-[9px] uppercase font-bold">Battery</span>
          </div>
          <p className="text-blue-400 font-mono font-bold">{state.battery}%</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-white/40">
            <Zap className="w-3 h-3" />
            <span className="text-[9px] uppercase font-bold">Thermal</span>
          </div>
          <p className="text-orange-400 font-mono font-bold">{state.temperature.toFixed(1)}°C</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-white/40">
            <Cpu className="w-3 h-3" />
            <span className="text-[9px] uppercase font-bold">Status</span>
          </div>
          <p className="text-white font-mono font-bold text-[10px] uppercase truncate">{state.status}</p>
        </div>
      </div>

      <div className="mt-4 bg-white/5 rounded-lg p-3 border border-white/10">
        <p className="text-[9px] text-white/30 uppercase mb-1 font-bold tracking-widest">Active Objective</p>
        <p className="text-[11px] text-blue-300 font-mono italic truncate">
          {">"} {state.current_task}
        </p>
      </div>
    </div>
  );
};
