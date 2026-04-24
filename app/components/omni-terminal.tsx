"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Cpu, Zap, Database, Send, Mic } from 'lucide-react';
import { useAetherVoice } from '@/app/hooks/useAetherVoice';

interface ExecutionPhase {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'complete';
  timestamp?: string;
}

interface TelemetryEntry {
  id: string;
  timestamp: string;
  type: 'input' | 'process' | 'output';
  message: string;
}

export function OmniTerminal() {
  const [input, setInput] = useState('');
  const voice = useAetherVoice();
  const [executionPhases, setExecutionPhases] = useState<ExecutionPhase[]>([
    { id: '1', name: 'Prompt', icon: <Brain size={18} />, status: 'pending' },
    { id: '2', name: 'Plan', icon: <Cpu size={18} />, status: 'pending' },
    { id: '3', name: 'Action', icon: <Zap size={18} />, status: 'pending' },
    { id: '4', name: 'Settlement', icon: <Database size={18} />, status: 'pending' },
  ]);
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>([
    {
      id: '0',
      timestamp: new Date().toLocaleTimeString(),
      type: 'output',
      message: '> OMNI-TERMINAL v2.0 INITIALIZED',
    },
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'output',
      message: '> Awaiting sovereign command...',
    },
  ]);
  const telemetryRef = useRef<HTMLDivElement>(null);

  // Auto-scroll telemetry
  useEffect(() => {
    if (telemetryRef.current) {
      telemetryRef.current.scrollTop = telemetryRef.current.scrollHeight;
    }
  }, [telemetry]);

  const handleExecute = async () => {
    if (!input.trim()) return;

    // Add user input to telemetry
    const newEntry: TelemetryEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'input',
      message: `> ${input}`,
    };
    setTelemetry((prev) => [...prev, newEntry]);

    // Simulate execution phases
    const phases = [...executionPhases];
    for (let i = 0; i < phases.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mark current as active, previous as complete
      phases.forEach((p, idx) => {
        if (idx < i) p.status = 'complete';
        else if (idx === i) p.status = 'active';
        else p.status = 'pending';
      });
      setExecutionPhases([...phases]);

      // Add telemetry for this phase
      const phaseEntry: TelemetryEntry = {
        id: `${i}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'process',
        message: `[${phases[i].name.toUpperCase()}] Processing...`,
      };
      setTelemetry((prev) => [...prev, phaseEntry]);
    }

    // Final output
    const resultEntry: TelemetryEntry = {
      id: `result-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'output',
      message: `✓ Command executed. Awaiting next directive.`,
    };
    setTelemetry((prev) => [...prev, resultEntry]);

    // Reset phases
    setExecutionPhases(
      executionPhases.map((p) => ({ ...p, status: 'pending' }))
    );
    setInput('');
  };

  return (
    <div className="space-y-6">
      {/* Command Input - Cryptographic Terminal Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="frosted-glass rounded-lg p-4 border border-green-500/30 shadow-lg"
        style={{
          boxShadow:
            '0 0 20px rgba(57, 255, 20, 0.3), inset 0 0 20px rgba(57, 255, 20, 0.05)',
        }}
      >
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          Sovereign Command Interface
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500/60 text-sm font-mono">
              $
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
              placeholder="Enter command..."
              className="w-full bg-black/40 border border-green-500/20 rounded px-3 py-2 pl-6 text-white font-mono text-sm focus:outline-none focus:border-green-500/50 focus:shadow-lg focus:shadow-green-500/20 transition-all"
            />
          </div>
          
          {/* Voice Command Button - Aether Voice Scaffold */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => voice.startListening()}
            className={`border rounded px-3 py-2 font-bold uppercase text-xs transition-all flex items-center gap-2 ${
              voice.state.isListening
                ? 'bg-purple-500/20 border-purple-500/60 text-purple-500'
                : 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/60'
            }`}
            style={{
              boxShadow: voice.state.isListening
                ? 'inset 0 0 10px rgba(168, 85, 247, 0.2), 0 0 15px rgba(168, 85, 247, 0.3)'
                : 'inset 0 0 10px rgba(168, 85, 247, 0.1)',
            }}
            title="Aether Voice Command Interface"
          >
            {voice.state.isListening ? (
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                <Mic size={16} />
              </motion.div>
            ) : (
              <Mic size={16} />
            )}
            {voice.state.isListening ? 'LISTENING' : 'VOICE'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExecute}
            className="bg-green-500/10 border border-green-500/40 rounded px-4 py-2 text-green-500 font-bold uppercase text-xs hover:bg-green-500/20 hover:border-green-500/60 transition-all flex items-center gap-2"
            style={{
              boxShadow: 'inset 0 0 10px rgba(57, 255, 20, 0.1)',
            }}
          >
            <Send size={16} />
            Execute
          </motion.button>
        </div>
      </motion.div>

      {/* Execution Timeline - Animated Glowing Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="frosted-glass rounded-lg p-6 border border-cyan-500/30"
        style={{
          boxShadow:
            '0 0 20px rgba(0, 229, 255, 0.2), inset 0 0 20px rgba(0, 229, 255, 0.03)',
        }}
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-6">
          Execution Pipeline
        </h3>
        <div className="relative">
          {/* Animated connecting line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/20 via-cyan-500/40 to-cyan-500/20" />

          <div className="flex justify-between relative z-10">
            {executionPhases.map((phase, idx) => (
              <motion.div
                key={phase.id}
                className="flex flex-col items-center gap-2"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                {/* Icon Circle */}
                <motion.div
                  animate={
                    phase.status === 'active'
                      ? {
                          boxShadow: [
                            '0 0 0 0 rgba(0, 229, 255, 0.4)',
                            '0 0 0 8px rgba(0, 229, 255, 0)',
                          ],
                        }
                      : {}
                  }
                  transition={
                    phase.status === 'active'
                      ? { duration: 1.5, repeat: Infinity }
                      : {}
                  }
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    phase.status === 'complete'
                      ? 'bg-green-500/20 border-green-500 text-green-500'
                      : phase.status === 'active'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-500'
                        : 'bg-gray-500/10 border-gray-500/30 text-gray-500'
                  }`}
                  style={
                    phase.status === 'complete'
                      ? {
                          boxShadow: '0 0 12px rgba(57, 255, 20, 0.4)',
                        }
                      : phase.status === 'active'
                        ? {
                            boxShadow:
                              '0 0 20px rgba(0, 229, 255, 0.6), inset 0 0 10px rgba(0, 229, 255, 0.2)',
                          }
                        : {}
                  }
                >
                  {phase.icon}
                </motion.div>

                {/* Label */}
                <span className="text-xs font-bold uppercase tracking-wider">
                  {phase.name}
                </span>

                {/* Status indicator */}
                {phase.status === 'active' && (
                  <motion.span
                    animate={{ opacity: [0.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-[10px] text-cyan-400"
                  >
                    processing
                  </motion.span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Telemetry Matrix - Live Data Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="frosted-glass rounded-lg border border-yellow-500/30 overflow-hidden"
        style={{
          boxShadow:
            '0 0 20px rgba(247, 183, 51, 0.2), inset 0 0 20px rgba(247, 183, 51, 0.03)',
        }}
      >
        <div className="bg-black/30 border-b border-yellow-500/20 px-4 py-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-500">
            Telemetry Matrix
          </h3>
        </div>

        <div
          ref={telemetryRef}
          className="terminal-scroll h-64 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-black/20"
        >
          <AnimatePresence>
            {telemetry.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`flex gap-2 ${
                  entry.type === 'input'
                    ? 'text-green-500'
                    : entry.type === 'process'
                      ? 'text-cyan-500'
                      : 'text-yellow-500'
                }`}
              >
                <span className="text-gray-500 shrink-0">[{entry.timestamp}]</span>
                <span className="break-words">{entry.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="text-green-500 animate-pulse">_</div>
        </div>
      </motion.div>
    </div>
  );
}
