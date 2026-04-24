"use client";

import React, { useState, useEffect } from 'react';
import { usePi } from "../components/pi-provider";
import { authenticateSovereignWallet } from "@/core/finance/pi-auth";

/**
 * AMRIKYY LAB :: SOVEREIGN MARKETPLACE
 * DESIGN: CAIRO CYBERPUNK | ASSET FORMAT: .AIX
 */
export default function SovereignStore() {
  const { user, setUser } = usePi();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/marketplace')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAssets(data.assets);
        setLoading(false);
      });
  }, []);

  const handleAcquire = async (asset: any) => {
    let currentUser = user;
    if (!currentUser) {
      const auth = await authenticateSovereignWallet();
      if (auth) {
        currentUser = { username: auth.username, uid: auth.uid };
        setUser(currentUser);
      } else return;
    }

    setProcessingId(asset.id);

    // Safe extraction of name and price depending on whether it's AIXAsset or AixPackage format
    const price = asset.price_pi || (asset.dna && asset.dna.basePrice) || 0;
    const assetName = asset.name || (asset.header && asset.header.name) || "AIX Asset";

    if (typeof window !== "undefined" && (window as any).Pi) {
      (window as any).Pi.createPayment({
        amount: price,
        memo: `Acquire Sovereign Asset: ${assetName}`,
        metadata: { assetId: asset.id }
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("[Pi SDK] AIX Asset Payment ready for approval:", paymentId);
          try {
            const res = await fetch('/api/marketplace/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, assetId: asset.id, type: 'aix' })
            });
            if (!res.ok) throw new Error("Backend rejected asset payment approval.");
            console.log("[Pi SDK] AIX price verified! Awaiting user signature...");
          } catch (err) {
            console.error("[Pi SDK] ❌ Security Halt:", err);
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log(`[Pi SDK] AIX Asset Payment approved! TXID: ${txid}`);
          try {
            const res = await fetch('/api/marketplace/purchase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                assetId: asset.id,
                buyerWallet: currentUser!.uid,
                txId: txid
              })
            });

            const data = await res.json();
            if (res.ok && data.success) {
              console.log("[Pi SDK] 👑 AIX Asset natively verified and acquired!");
              setAssets(assets.map(a => a.id === asset.id ? { ...a, status: 'owned' } : a));
            } else {
              console.error("[Pi SDK] ❌ Verification failed:", data.error);
            }
          } catch (error) {
            console.error("[Pi SDK] ❌ Network error during AIX purchase:", error);
          } finally {
            setProcessingId(null);
          }
        },
        onCancel: (paymentId: string) => {
          console.warn("[Pi SDK] ⚠️ AIX Payment cancelled:", paymentId);
          setProcessingId(null);
        },
        onError: (error: any, payment?: any) => {
          console.error("[Pi SDK] ❌ AIX Payment error:", error);
          setProcessingId(null);
        }
      });
    } else {
      console.warn("[Pi SDK] Not detected. Executing fallback or rejecting.");
      setProcessingId(null);
    }
  };

  return (
    <div style={{
      backgroundColor: '#050505',
      color: '#ffffff',
      minHeight: '100vh',
      fontFamily: '"Outfit", sans-serif',
      padding: '40px',
      backgroundImage: 'radial-gradient(circle at bottom left, #0a0a0a, #050505)'
    }}>

      {/* Header */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #39FF14', paddingBottom: '20px', marginBottom: '50px'
      }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '2px' }}>
            AIX <span style={{ color: '#39FF14' }}>SOVEREIGN FOUNDRY</span>
          </h1>
          <p style={{ opacity: 0.6, fontSize: '0.8rem', textTransform: 'uppercase' }}>Manufacturing Tradable Digital Lifeforms</p>
        </div>
        <div style={{ textAlign: 'right', border: '1px solid #F7B733', padding: '10px 20px', borderRadius: '10px' }}>
          <span style={{ color: '#F7B733', fontSize: '0.7rem' }}>TREASURY_GATEWAY</span>
          <div style={{ fontWeight: 'bold' }}>{user ? `@${user.username}` : "LOCKED"}</div>
        </div>
      </header>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>

        {loading ? (
          <div style={{ color: '#39FF14' }}>SCANNING MARKETPLACE...</div>
        ) : assets.length === 0 ? (
          <div style={{ color: '#555', gridColumn: 'span 3', textAlign: 'center', padding: '100px' }}>
            NO AIX ASSETS COMPILED YET. INITIATING FOUNDRY LOOP...
          </div>
        ) : assets.map((asset, i) => (
          <div key={i} style={{
            background: '#111',
            border: '1px solid #222',
            borderRadius: '20px',
            padding: '30px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#39FF14'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#222'}
          >
            {/* Status Badge */}
            <div style={{
              position: 'absolute', top: '10px', right: '10px',
              fontSize: '0.6rem', background: asset.status === 'owned' ? '#008080' : '#39FF14', color: '#000',
              padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold'
            }}>
              {asset.status === 'owned' ? 'ACQUIRED' : '.AIX READY'}
            </div>

            <h3 style={{ color: '#39FF14', fontSize: '1.2rem', marginBottom: '10px' }}>{asset.name || asset.header?.name}</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, height: '40px' }}>{asset.did?.did || asset.header?.architect}</p>

            <div style={{ margin: '20px 0', borderTop: '1px solid #222', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '0.7rem', color: '#555' }}>SPECIALIZATION</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{asset.name?.split(' - ')[1] || asset.dna?.specialization || 'General'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.7rem', color: '#555' }}>AIX_VERSION</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{asset.header?.version || '1.0.0'}</span>
              </div>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: '30px', background: '#1a1a1a', padding: '15px', borderRadius: '12px'
            }}>
              <div>
                <div style={{ fontSize: '0.6rem', color: '#F7B733' }}>PRICE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#F7B733' }}>{asset.price_pi || asset.dna?.basePrice || 0} <span style={{ fontSize: '0.8rem' }}>Pi</span></div>
              </div>
              <button
                onClick={() => handleAcquire(asset)}
                disabled={processingId === asset.id || asset.status === 'owned'}
                style={{
                  background: processingId === asset.id ? '#555' : asset.status === 'owned' ? '#008080' : '#39FF14', color: '#000', border: 'none',
                  padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold',
                  cursor: (processingId === asset.id || asset.status === 'owned') ? 'not-allowed' : 'pointer'
                }}>
                {processingId === asset.id ? 'PROCESSING...' : asset.status === 'owned' ? 'OWNED' : 'ACQUIRE'}
              </button>
            </div>
          </div>
        ))}

      </div>

      {/* Footer */}
      <footer style={{ marginTop: '80px', textAlign: 'center', opacity: 0.3, fontSize: '0.7rem', letterSpacing: '2px' }}>
        AMRIKYY LAB // AIX STANDARD // TRADABLE SOVEREIGN INTELLIGENCE
      </footer>
    </div>
  );
}
