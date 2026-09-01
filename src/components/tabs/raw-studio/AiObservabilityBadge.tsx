"use client";

import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, ChevronDown } from 'lucide-react';
import { getClientAuthHeaders } from '@/lib/auth/client-auth';

interface GatewayInfo {
  configured_provider: string;
  resolved_provider: string;
  mock_fallback: boolean;
  model: string;
  gateway?: {
    configuredProvider: string;
    routes: Record<string, string[]>;
    providers: Array<{
      provider: string;
      available: boolean;
      model?: string | null;
      error?: string;
    }>;
  };
}

export function AiObservabilityBadge() {
  const [info, setInfo] = useState<GatewayInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const headers = await getClientAuthHeaders();
      const res = await fetch('/api/ai/status', { headers });
      if (res.ok) {
        const data = await res.json();
        setInfo(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const isLive = info && !info.mock_fallback && info.resolved_provider !== 'mock';
  const providerLabel = info?.resolved_provider 
    ? info.resolved_provider.toUpperCase() 
    : 'AI GATEWAY';

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger Pill */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: isLive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
          border: `1px solid ${isLive ? 'rgba(34, 197, 94, 0.35)' : 'rgba(234, 179, 8, 0.35)'}`,
          color: isLive ? '#4ade80' : '#facc15',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        title="Click to view AI Gateway & Provider Status"
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: isLive ? '#22c55e' : '#eab308',
            boxShadow: isLive ? '0 0 8px #22c55e' : '0 0 6px #eab308'
          }}
        />
        <span>AI: {providerLabel} {isLive ? '🟢 LIVE' : '🟡 FALLBACK'}</span>
        <ChevronDown size={12} opacity={0.7} />
      </button>

      {/* Popover Drawer */}
      {open && (
        <div
          className="card animate-fade-in"
          style={{
            position: 'absolute',
            top: '42px',
            right: 0,
            width: '340px',
            background: 'var(--bg-main, #0f172a)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
            borderRadius: '12px',
            boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.5)',
            padding: '1.25rem',
            zIndex: 200,
            color: 'var(--text-main, #f8fafc)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="var(--accent-primary, #6366f1)" />
              <strong style={{ fontSize: '0.92rem' }}>AI Gateway Status</strong>
            </div>
            <button
              type="button"
              onClick={fetchStatus}
              disabled={loading}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Active Provider Info */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Active Provider:</span>
              <strong style={{ color: isLive ? '#4ade80' : '#facc15' }}>
                {info?.resolved_provider?.toUpperCase() || 'MOCK'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Primary Engine:</span>
              <span>Google Gemini 1.5 Flash</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Degraded Fallback:</span>
              <span>{info?.mock_fallback ? 'Active (Deterministic Engine)' : 'Standby (Zero Failure)'}</span>
            </div>
          </div>

          {/* Providers Health Table */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Provider Fallback Chain
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <span>1. Google Gemini</span>
                <span style={{ color: info?.resolved_provider === 'gemini' ? '#4ade80' : '#94a3b8' }}>
                  {info?.resolved_provider === 'gemini' ? '● Connected' : '○ Standby / Key Required'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <span>2. OpenAI / Azure</span>
                <span style={{ color: info?.resolved_provider === 'openai' ? '#4ade80' : '#94a3b8' }}>
                  {info?.resolved_provider === 'openai' ? '● Connected' : '○ Standby'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <span>3. Ollama (Local LLM)</span>
                <span style={{ color: info?.resolved_provider === 'ollama' ? '#4ade80' : '#94a3b8' }}>
                  {info?.resolved_provider === 'ollama' ? '● Connected' : '○ Standby'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <span>4. Deterministic Mock Engine</span>
                <span style={{ color: '#4ade80' }}>● Always Ready (100% Offline)</span>
              </div>
            </div>
          </div>

          {/* Quick Key Activation Box */}
          <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a5b4fc' }}>Quick Connect Live Gemini AI</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="password"
                placeholder="Paste Gemini API Key..."
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  color: '#fff',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={async () => {
                  if (!customKey.trim()) return;
                  setLoading(true);
                  try {
                    const headers = await getClientAuthHeaders();
                    const res = await fetch('/api/ai/status', {
                      method: 'POST',
                      headers,
                      body: JSON.stringify({ apiKey: customKey.trim(), provider: 'gemini' })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setInfo(data);
                      setSaveStatus('Connected!');
                      setTimeout(() => setSaveStatus(null), 3000);
                    }
                  } catch {
                    setSaveStatus('Failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !customKey.trim()}
                style={{
                  background: 'var(--accent-primary, #6366f1)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {saveStatus || 'Connect'}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
            Or configure <code style={{ color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '2px 4px', borderRadius: '3px' }}>GEMINI_API_KEY</code> in <code style={{ color: '#818cf8' }}>.env.local</code>.
          </div>
        </div>
      )}
    </div>
  );
}
