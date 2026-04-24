"use client";

import { motion } from "framer-motion";
import { Bot, Zap, Shield, Eye, Database } from "lucide-react";

const ROBOTS = [
  { id: "pi-r1-alpha", model: "π0.7 Humanoid", battery: 88, status: "Active", task: "Kitchen Prep" },
  { id: "pi-r2-beta", model: "π0.7 Cobot", battery: 45, status: "Charging", task: "Inventory Scan" },
  { id: "pi-r3-gamma", model: "π0.7 Mobile", battery: 92, status: "Active", task: "Visual Audit" },
];

export const RoboticFleetStatus = () => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
        <Bot size={14} className="text-neon-green" /> π0.7 Robotic Fleet
      </h2>

      <div className="flex flex-col gap-3">
        {ROBOTS.map((robot) => (
          <div key={robot.id} className="p-3 border border-white/5 bg-white/5 rounded-lg flex flex-col gap-2 hover:border-neon-green/30 transition-colors group relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase">{robot.id}</span>
                <span className="text-[8px] text-white/40">{robot.model}</span>
              </div>
              <div className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase ${
                robot.status === "Active" ? "bg-neon-green/20 text-neon-green" : "bg-pi-gold/20 text-pi-gold"
              }`}>
                {robot.status}
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] font-mono">
              <div className="flex items-center gap-2">
                <Zap size={10} className={robot.battery < 50 ? "text-pi-gold" : "text-neon-green"} />
                <span className="text-white/60">{robot.battery}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Database size={10} className="text-white/40" />
                <span className="text-white/60 truncate max-w-[100px]">{robot.task}</span>
              </div>
            </div>

            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${robot.battery}%` }}
                className={`h-full ${robot.battery < 50 ? "bg-pi-gold" : "bg-neon-green"}`}
              />
            </div>

            <div className="flex gap-2 mt-1">
              <div className="flex items-center gap-1 text-[7px] text-neon-green opacity-40 group-hover:opacity-100 transition-opacity">
                <Eye size={8} /> VLA_LINK_ACTIVE
              </div>
              <div className="flex items-center gap-1 text-[7px] text-pi-gold opacity-40 group-hover:opacity-100 transition-opacity">
                <Shield size={8} /> PoPW_ENFORCED
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
