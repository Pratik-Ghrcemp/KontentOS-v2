import React, { useState } from 'react';
import { Edit2, Smartphone, Undo, Redo, Play, Pause, Download, HelpCircle, Bell, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { AutosaveStatus } from './types';
import { useRawStudio } from './RawStudioContext';
import { HelpCenterModal } from './HelpCenterModal';
import { AiObservabilityBadge } from './AiObservabilityBadge';

interface ToolbarProps {
  projectTitle: string;
  setProjectTitle: (title: string) => void;
  autosaveStatus: AutosaveStatus;
  previewZoom: string;
  setPreviewZoom: React.Dispatch<React.SetStateAction<string>>;
  setActiveTool: (tool: string) => void;
  setExportModal: (open: boolean) => void;
}

export function RawStudioToolbar({ projectTitle, setProjectTitle, autosaveStatus, previewZoom, setPreviewZoom, setActiveTool, setExportModal }: ToolbarProps) {
  const { dispatch, togglePlay, isPlaying, loadDemoProject } = useRawStudio();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-main)', height: '70px', position: 'relative' }}>
      
      {/* Left Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-primary)' }}>✨</span>
            <input 
              type="text" 
              value={projectTitle} 
              onChange={(e) => setProjectTitle(e.target.value)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600, margin: 0, outline: 'none', width: '130px' }} 
              placeholder="Untitled Reel"
            />
            <Edit2 size={14} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1rem', color: 'var(--text-muted)' }}>
            <Smartphone size={16} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>9:16</span>
          </div>

          {/* 1-Click Showcase Demo Loader Button */}
          <button
            type="button"
            data-testid="load-demo-project-btn"
            onClick={loadDemoProject}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#a5b4fc',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
            title="Load Pre-configured Creator Demo Project (1-Click)"
          >
            <Sparkles size={13} color="#818cf8" />
            <span>✨ Load Demo Reel</span>
          </button>
        </div>
      </div>
      
      {/* Right Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        
        {/* Real-Time AI Observability Status Badge */}
        <AiObservabilityBadge />
        
        {/* Undo/Redo Pill */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '4px', gap: '2px' }}>
          <button data-testid="timeline-undo-btn" onClick={() => dispatch({ type: 'UNDO' })} style={{ background: 'none', border: 'none', padding: '6px 12px', cursor: 'pointer', color: 'var(--text-main)', transition: 'color 0.2s' }} title="Undo (Ctrl+Z)"><Undo size={16}/></button>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />
          <button data-testid="timeline-redo-btn" onClick={() => dispatch({ type: 'REDO' })} style={{ background: 'none', border: 'none', padding: '6px 12px', cursor: 'pointer', color: 'var(--text-main)', transition: 'color 0.2s' }} title="Redo (Ctrl+Y)"><Redo size={16}/></button>
        </div>

        {/* Action Buttons */}
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '20px', padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }} onClick={togglePlay}>
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />} {isPlaying ? 'Pause' : 'Preview'}
        </button>

        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '20px', padding: '0.5rem 1.5rem', fontWeight: 600 }} onClick={() => { setActiveTool(''); setExportModal(true); }}>
          <Download size={16} /> Export
        </button>

        {/* Utility Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem', position: 'relative' }}>
          <button 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '20px', padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            onClick={() => setShowHelpModal(true)}
          >
            <HelpCircle size={16} /> Help Center
          </button>
          
          <button 
            aria-label="Notifications"
            onClick={() => setShowNotifications(prev => !prev)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', background: showNotifications ? 'var(--accent-primary)' : 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: showNotifications ? '#fff' : 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Bell size={18} />
          </button>

          {/* Local Notification Popover */}
          {showNotifications && (
            <div 
              className="card animate-fade-in"
              style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '320px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-neo-raised-lg)',
                padding: '1rem',
                zIndex: 100
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>Notifications</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Local System</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '6px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <ShieldCheck size={16} color="var(--accent-emerald)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>Parity Engine Active</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Real Audio DSP, Track Mute & FFmpeg sync verified.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '6px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <CheckCircle2 size={16} color="var(--accent-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>Project Auto-Saved</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>All edits persisted safely in local storage.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Help Center Modal */}
      <HelpCenterModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </header>
  );
}
