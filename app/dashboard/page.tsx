"use client";

import React, { useState, useEffect } from 'react';
import { OmniTerminal } from '../components/omni-terminal';
import { MarketHub } from '../components/market-hub';
import { RobotViewport } from '../components/robot-viewport';

/**
 * AMRIKYY LAB :: SOVEREIGN DASHBOARD V2
 * THEME: QUANTUM CYBERPUNK (CARBON & NEON)
 * STATUS: LIVE DATA SYNC ACTIVE
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
          setData(json);
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
      <div style={{ backgroundColor: '#0a0a0a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39FF14' }}>
        <div style={{ letterSpacing: '5px', fontWeight: 'bold' }}>INITIALIZING QUANTUM BRIDGE...</div>
      </div>
    );
  }

  const treasury = data?.treasury || { reserve: 0, status: "OFFLINE" };
  const fleet = data?.fleet || { count: 0, active: 0, ready: 0 };
  const logs = data?.logs || [];

  return (
    <div style={{
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      minHeight: '100vh',
      fontFamily: '"Outfit", "Inter", sans-serif',
      padding: '2rem',
      backgroundImage: 'linear-gradient(135deg, #0a0a0a 0%, #111111 100%)',
      overflowX: 'hidden'
    }}>
      
      {/* Background Carbon Grid Effect */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundSize: '30px 30px',
        backgroundImage: 'linear-gradient(to right, #151515 1px, transparent 1px), linear-gradient(to bottom, #151515 1px, transparent 1px)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header - Apple Minimalist x Cyberpunk */}
        <header style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', 
          borderBottom: '1px solid #222', paddingBottom: '2rem', marginBottom: '3rem' 
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-1px',
              textShadow: '0 0 20px rgba(57, 255, 20, 0.2)'
            }}>
              AMRIKYY<span style={{ color: '#39FF14' }}>LAB</span>
            </h1>
            <p style={{ opacity: 0.5, fontSize: '0.9rem', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Sovereign Agent Economy OS // Level 5
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase' }}>System Heartbeat</div>
            <div style={{ color: '#39FF14', fontWeight: 'bold' }}>● OPERATIONAL</div>
          </div>
        </header>

        {/* Main Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
          
          {/* Treasury - The Golden Vault */}
          <div style={{ 
            gridColumn: 'span 4', background: '#111', border: '1px solid #222', borderRadius: '24px', padding: '2rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#F7B733', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '1px' }}>
              National Reserve
            </div>
            <div style={{ fontSize: '4.5rem', fontWeight: 900, color: '#F7B733', lineHeight: 1 }}>
              {treasury.reserve.toFixed(2)}<span style={{ fontSize: '1.5rem', opacity: 0.5, marginLeft: '0.5rem' }}>π</span>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#39FF14' }} />
              <span style={{ fontSize: '0.9rem', color: '#39FF14', textTransform: 'uppercase', fontWeight: 600 }}>{treasury.status}</span>
            </div>
          </div>

          {/* Fleet Status */}
          <div style={{ 
            gridColumn: 'span 4', background: '#111', border: '1px solid #222', borderRadius: '24px', padding: '2rem',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Agent Fleet
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <div style={{ fontSize: '4.5rem', fontWeight: 900, color: '#ffffff' }}>{fleet.count}</div>
              <div style={{ fontSize: '1.2rem', opacity: 0.5 }}>Units Active</div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ flex: 1, background: '#181818', padding: '0.75rem', borderRadius: '12px', border: '1px solid #222' }}>
                <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>ACTIVE</div>
                <div style={{ fontWeight: 'bold', color: '#39FF14' }}>{fleet.active}</div>
              </div>
              <div style={{ flex: 1, background: '#181818', padding: '0.75rem', borderRadius: '12px', border: '1px solid #222' }}>
                <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>READY</div>
                <div style={{ fontWeight: 'bold' }}>{fleet.ready}</div>
              </div>
            </div>
          </div>

          {/* Omni-Command Terminal - The Steerability Bridge */}
          <div style={{ 
            gridColumn: 'span 4', background: '#070707', border: '1px solid #333', borderRadius: '24px', padding: '1.5rem',
            position: 'relative', overflow: 'hidden', height: '400px', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#39FF14', boxShadow: '0 0 10px #39FF14' }} />
            <div style={{ marginBottom: '1rem', color: '#39FF14', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px' }}>OMNI_COMMAND_TERMINAL v2.0 :: STEERABILITY_LINK</div>
            <OmniTerminal />
          </div>

          {/* Sovereign Agent Roster */}
          <div style={{ 
            gridColumn: 'span 6', background: '#111', border: '1px solid #222', borderRadius: '24px', padding: '2rem',
            marginTop: '1rem', height: '600px', overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.2rem', fontWeight: 700 }}>SOVEREIGN_AGENT_ROSTER</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', textAlign: 'left', color: '#555', fontSize: '0.8rem' }}>
                  <th style={{ padding: '1rem' }}>AGENT_ID</th>
                  <th style={{ padding: '1rem' }}>STATUS</th>
                  <th style={{ padding: '1rem' }}>RESERVE</th>
                </tr>
              </thead>
              <tbody>
                {fleet.agents?.map((agent: any) => (
                  <tr key={agent.agentId} style={{ borderBottom: '1px solid #181818' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#39FF14' }}>{agent.agentId}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold',
                        background: agent.status === 'READY' ? 'rgba(57, 255, 20, 0.1)' : 'rgba(247, 183, 51, 0.1)',
                        color: agent.status === 'READY' ? '#39FF14' : '#F7B733',
                        border: `1px solid ${agent.status === 'READY' ? 'rgba(57, 255, 20, 0.2)' : 'rgba(247, 183, 51, 0.2)'}`
                      }}>
                        {agent.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{agent.reserve.toFixed(2)} π</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Robot Viewport - Physical Intelligence Link */}
          <div style={{ 
            gridColumn: 'span 3', marginTop: '1rem', height: '600px'
          }}>
            <RobotViewport />
          </div>

          {/* AIX Sovereign Marketplace */}
          <div style={{ 
            gridColumn: 'span 3', marginTop: '1rem', height: '600px'
          }}>
            <MarketHub />
          </div>

        </div>

        <footer style={{ marginTop: '4rem', textAlign: 'center', opacity: 0.2, fontSize: '0.7rem', letterSpacing: '4px' }}>
          AMRIKYY LAB // SOVEREIGN ENGINE // ALL RIGHTS RESERVED
        </footer>
      </main>

      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
        body { margin: 0; background-color: #0a0a0a; }
      `}</style>
    </div>
  );
}
