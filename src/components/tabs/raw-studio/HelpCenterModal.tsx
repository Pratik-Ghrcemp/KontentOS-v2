import React from 'react';
import { X, BookOpen, Keyboard, Sparkles, Volume2, Film, Layers, CheckCircle2 } from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'var(--bg-main)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: 'var(--shadow-neo-raised-lg)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Studio Hub Knowledge Base</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Professional Viral Video Production Guide & Shortcuts</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Non-Destructive AI Architecture */}
          <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '12px', padding: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <Sparkles size={16} color="#818cf8" /> Non-Destructive AI Architecture Principle
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0', lineHeight: 1.5 }}>
              Studio Hub follows a strict non-destructive AI collaboration model. The AI never mutates your canonical timeline directly.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.74rem', fontWeight: 600, color: '#e2e8f0', overflowX: 'auto', gap: '8px' }}>
              <span>AI Gateway</span>
              <span>→</span>
              <span style={{ color: '#facc15' }}>Proposal Pool (Sandbox)</span>
              <span>→</span>
              <span style={{ color: '#38bdf8' }}>Ghost Preview</span>
              <span>→</span>
              <span style={{ color: '#4ade80' }}>Creator Approval</span>
              <span>→</span>
              <span>Atomic Reducer</span>
              <span>→</span>
              <span>FFmpeg Export</span>
            </div>
          </div>

          {/* Workflow Overview */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <Film size={16} color="var(--accent-primary)" /> End-to-End Production Workflow
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '4px' }}>1. Ingest & Timeline</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload MP4/MOV footage, arrange clips, trim in/out points, and set transitions.</div>
              </div>
              <div style={{ padding: '0.85rem', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '4px' }}>2. AI Captions & Audio</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Transcribe speech, edit timestamps, select Hormozi/Neon presets, and enable auto-ducking.</div>
              </div>
              <div style={{ padding: '0.85rem', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '4px' }}>3. Brand & Render</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Add custom brand logos, templates, freehand drawings, and compile via FFmpeg export.</div>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <Keyboard size={16} color="var(--accent-cyan)" /> Timeline Keyboard Shortcuts
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Play / Pause</span>
                <kbd style={{ background: 'var(--bg-surface-lowest)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>Space</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Split Clip at Playhead</span>
                <kbd style={{ background: 'var(--bg-surface-lowest)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>S</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Add Timeline Marker</span>
                <kbd style={{ background: 'var(--bg-surface-lowest)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>M</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Delete Selected Clip</span>
                <kbd style={{ background: 'var(--bg-surface-lowest)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>Del / Backspace</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Undo Action</span>
                <kbd style={{ background: 'var(--bg-surface-lowest)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>Ctrl + Z</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Redo Action</span>
                <kbd style={{ background: 'var(--bg-surface-lowest)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>Ctrl + Y</kbd>
              </div>
            </div>
          </div>

          {/* Key Features & Parity */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <Sparkles size={16} color="var(--accent-amber)" /> Certified WYSIWYG Parity Engines
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li><strong>Audio DSP:</strong> Real-time Web Audio API filter graph (80Hz Highpass + 3kHz Peaking + Dynamics Compressor) matches 1:1 with FFmpeg export filters.</li>
              <li><strong>Captions:</strong> Dynamic word boundaries, Alex Hormozi gold styling, and neon glow box rendering burn with exact timestamps.</li>
              <li><strong>Freehand Drawings:</strong> Normalized 0–1000 coordinate vectors ensure responsive scaling across 9:16 mobile and 16:9 widescreen formats.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ padding: '0.5rem 1.5rem', fontWeight: 600 }}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
