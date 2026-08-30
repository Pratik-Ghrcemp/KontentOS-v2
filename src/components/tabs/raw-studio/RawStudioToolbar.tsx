import React from 'react';
import { Edit2, Smartphone, Undo, Redo, Play, Pause, Download, HelpCircle, Bell } from 'lucide-react';
import { AutosaveStatus } from './types';
import { useRawStudio } from './RawStudioContext';

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
  const { dispatch, togglePlay, isPlaying } = useRawStudio();
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-main)', height: '70px' }}>
      
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
        </div>
      </div>
      
      {/* Right Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        
        {/* Undo/Redo Pill */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '4px', gap: '2px' }}>
          <button onClick={() => dispatch({ type: 'UNDO' })} style={{ background: 'none', border: 'none', padding: '6px 12px', cursor: 'pointer', color: 'var(--text-main)', transition: 'color 0.2s' }} title="Undo (Ctrl+Z)"><Undo size={16}/></button>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />
            <button onClick={() => dispatch({ type: 'REDO' })} style={{ background: 'none', border: 'none', padding: '6px 12px', cursor: 'pointer', color: 'var(--text-main)', transition: 'color 0.2s' }} title="Redo (Ctrl+Y)"><Redo size={16}/></button>
        </div>

        {/* Action Buttons */}
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '20px', padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }} onClick={togglePlay}>
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />} {isPlaying ? 'Pause' : 'Preview'}
        </button>

        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '20px', padding: '0.5rem 1.5rem', fontWeight: 600 }} onClick={() => { setActiveTool(''); setExportModal(true); }}>
          <Download size={16} /> Export
        </button>

        {/* Utility Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '20px', padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <HelpCircle size={16} /> Help Center
          </button>
          
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', cursor: 'pointer' }}>
            <Bell size={18} />
          </button>
        </div>

      </div>
    </header>
  );
}
