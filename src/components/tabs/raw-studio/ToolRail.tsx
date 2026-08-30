import React from 'react';
import { FileVideo, LayoutTemplate, Captions, Type, Wand2, Music2, Paintbrush, Settings2 } from 'lucide-react';

interface ToolRailProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
}

export const ToolRail: React.FC<ToolRailProps> = ({ activeTool, setActiveTool }) => {
  const tools = [
    { id: 'assets', icon: <FileVideo size={20} />, label: 'Assets' },
    { id: 'templates', icon: <LayoutTemplate size={20} />, label: 'Templates' },
    { id: 'captions', icon: <Captions size={20} />, label: 'Captions' },
    { id: 'text', icon: <Type size={20} />, label: 'Text' },
    { id: 'effects', icon: <Wand2 size={20} />, label: 'Effects' },
    { id: 'audio', icon: <Music2 size={20} />, label: 'Audio' },
    { id: 'brand', icon: <Paintbrush size={20} />, label: 'Brand Kit' },
    { id: 'settings', icon: <Settings2 size={20} />, label: 'Settings' }
  ];

  return (
    <div className="studio-sidebar animate-fade-in" style={{ width: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0', gap: '1rem', borderRight: '1px solid var(--border-subtle)' }}>
      {tools.map(t => (
        <button
          key={t.id}
          onClick={() => setActiveTool(t.id)}
          className={`studio-tool-btn ${activeTool === t.id ? 'active' : ''}`}
          title={t.label}
        >
          {t.icon}
          <span style={{ fontSize: '0.65rem', marginTop: '4px', opacity: activeTool === t.id ? 1 : 0.7 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
};

