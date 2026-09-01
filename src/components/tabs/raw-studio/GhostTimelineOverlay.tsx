import React from 'react';
import { AiProposal } from '@/lib/ai/proposal-types';
import { StoryboardPlan } from '@/lib/ai/storyboard-types';
import { AudioProposalPool } from '@/lib/ai/audio/types';
import { VisualAssetProposal } from '@/lib/ai/visual/types';
import { Sparkles, Zap, Scissors, Type, Maximize2, Clapperboard, Mic, Music, Volume2, Film, Image as ImageIcon, LayoutTemplate } from 'lucide-react';

interface GhostTimelineOverlayProps {
  proposals?: AiProposal[];
  selectedIds?: Set<string>;
  storyboardPlan?: StoryboardPlan | null;
  selectedBeatIds?: Set<string>;
  audioProposals?: AudioProposalPool;
  selectedAudioIds?: Set<string>;
  visualProposals?: VisualAssetProposal[];
  selectedVisualIds?: Set<string>;
  timelineDuration: number;
  onSeek: (time: number) => void;
}

export function GhostTimelineOverlay({
  proposals = [],
  selectedIds = new Set(),
  storyboardPlan = null,
  selectedBeatIds = new Set(),
  audioProposals,
  selectedAudioIds = new Set(),
  visualProposals = [],
  selectedVisualIds = new Set(),
  timelineDuration,
  onSeek
}: GhostTimelineOverlayProps) {
  const hasProposals = proposals.length > 0 && selectedIds.size > 0;
  const hasStoryboard = storyboardPlan && storyboardPlan.beats.length > 0 && selectedBeatIds.size > 0;
  
  const activeAudioAssets = audioProposals 
    ? [...audioProposals.voiceovers, ...audioProposals.sfx, ...audioProposals.bgm].filter(a => selectedAudioIds.has(a.id))
    : [];
  const hasAudioProposals = activeAudioAssets.length > 0;

  const activeVisualAssets = visualProposals.filter(v => selectedVisualIds.has(v.id));
  const hasVisualProposals = activeVisualAssets.length > 0;

  if ((!hasProposals && !hasStoryboard && !hasAudioProposals && !hasVisualProposals) || timelineDuration <= 0) {
    return null;
  }

  const selectedProposals = proposals.filter(p => selectedIds.has(p.id));
  const selectedBeats = (storyboardPlan?.beats || []).filter(b => selectedBeatIds.has(b.id));

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'zoom': return <Maximize2 size={10} />;
      case 'cut': return <Scissors size={10} />;
      case 'headline': return <Type size={10} />;
      default: return <Sparkles size={10} />;
    }
  };

  const getKindColor = (kind: string) => {
    switch (kind) {
      case 'zoom': return '#06b6d4'; // Cyan
      case 'cut': return '#f43f5e'; // Rose
      case 'headline': return '#f59e0b'; // Amber
      default: return '#8b5cf6'; // Purple
    }
  };

  const getBeatRoleColor = (role: string) => {
    switch (role) {
      case 'hook': return '#f59e0b'; // Amber
      case 'problem': return '#f43f5e'; // Rose
      case 'solution': return '#10b981'; // Emerald
      case 'proof': return '#0ea5e9'; // Sky
      case 'call_to_action': return '#a855f7'; // Purple
      default: return '#6366f1'; // Indigo
    }
  };

  return (
    <div 
      className="ghost-timeline-overlay-layer"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 25
      }}
    >
      {/* 1. Smart Edit Proposal Overlays */}
      {selectedProposals.map(proposal => {
        const leftPercent = (proposal.startTime / timelineDuration) * 100;
        const widthPercent = Math.max(((proposal.endTime - proposal.startTime) / timelineDuration) * 100, 1.0);
        const color = getKindColor(proposal.kind);

        return (
          <div
            key={`ghost-prop-${proposal.id}`}
            style={{
              position: 'absolute',
              top: '2px',
              bottom: '2px',
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              border: `2px dashed ${color}`,
              backgroundColor: `${color}22`,
              borderRadius: '4px',
              padding: '2px 4px',
              fontSize: '0.65rem',
              fontWeight: 600,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              pointerEvents: 'auto',
              cursor: 'pointer',
              boxShadow: `0 0 8px ${color}44`,
              transition: 'all 0.15s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(proposal.startTime);
            }}
            title={`Ghost Proposal: ${proposal.title} (${proposal.startTime.toFixed(2)}s - ${proposal.endTime.toFixed(2)}s). Click to seek.`}
          >
            <span style={{ color }}>{getKindIcon(proposal.kind)}</span>
            <span style={{ opacity: 0.9 }}>👻 {proposal.title}</span>
          </div>
        );
      })}

      {/* 2. Storyboard Beat Overlays */}
      {selectedBeats.map(beat => {
        const effectiveDuration = Math.max(timelineDuration, storyboardPlan?.estimatedTotalDuration || 30);
        const leftPercent = (beat.estimatedStartTime / effectiveDuration) * 100;
        const widthPercent = Math.max((beat.estimatedDuration / effectiveDuration) * 100, 2.0);
        const color = getBeatRoleColor(beat.role);

        return (
          <div
            key={`ghost-beat-${beat.id}`}
            style={{
              position: 'absolute',
              top: '2px',
              bottom: '2px',
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              border: `2px dashed ${color}`,
              backgroundColor: `${color}28`,
              borderRadius: '6px',
              padding: '2px 6px',
              fontSize: '0.65rem',
              fontWeight: 600,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              pointerEvents: 'auto',
              cursor: 'pointer',
              boxShadow: `0 0 10px ${color}55`,
              transition: 'all 0.15s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(beat.estimatedStartTime);
            }}
            title={`Ghost Storyboard: [${beat.role.toUpperCase()}] ${beat.title} (${beat.estimatedStartTime.toFixed(1)}s - ${(beat.estimatedStartTime + beat.estimatedDuration).toFixed(1)}s). Click to seek.`}
          >
            <Clapperboard size={11} style={{ color }} />
            <span style={{ opacity: 0.95, textTransform: 'capitalize' }}>
              👻 {beat.role}: {beat.title}
            </span>
          </div>
        );
      })}

      {/* 3. Generative Audio Proposal Waveform Overlays */}
      {activeAudioAssets.map((audio, index) => {
        const audioDuration = Math.max(0.5, audio.duration);
        // Cascade audio previews across timeline if multiple
        const startTime = index * 2.0;
        const leftPercent = Math.min((startTime / timelineDuration) * 100, 95);
        const widthPercent = Math.max((audioDuration / timelineDuration) * 100, 4.0);
        const color = audio.type === 'voiceover' ? '#ec4899' : audio.type === 'sfx' ? '#06b6d4' : '#8b5cf6';

        return (
          <div
            key={`ghost-audio-${audio.id}`}
            style={{
              position: 'absolute',
              top: '2px',
              bottom: '2px',
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              border: `2px dashed ${color}`,
              backgroundColor: `${color}25`,
              borderRadius: '6px',
              padding: '2px 6px',
              fontSize: '0.65rem',
              fontWeight: 600,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              pointerEvents: 'auto',
              cursor: 'pointer',
              boxShadow: `0 0 10px ${color}55`,
              transition: 'all 0.15s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(startTime);
            }}
            title={`Ghost Audio: [${audio.type.toUpperCase()}] ${audio.title} (${audio.duration.toFixed(1)}s). Click to seek.`}
          >
            {audio.type === 'voiceover' ? <Mic size={11} style={{ color }} /> : audio.type === 'sfx' ? <Zap size={11} style={{ color }} /> : <Music size={11} style={{ color }} />}
            <span style={{ opacity: 0.95, fontWeight: 700 }}>
              👻 {audio.type.toUpperCase()}: {audio.title}
            </span>

            {/* Embedded Mini Waveform Bars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px', height: '14px', marginLeft: 'auto', opacity: 0.75 }}>
              {audio.waveformPeaks.slice(0, 16).map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '2px',
                    height: `${Math.round(p * 100)}%`,
                    backgroundColor: color,
                    borderRadius: '1px'
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* 4. Generative Visual & B-Roll Asset Proposal Overlays */}
      {activeVisualAssets.map(visual => {
        const startTime = visual.suggestedStartTime || 0;
        const duration = visual.suggestedDuration || 4.0;
        const leftPercent = (startTime / timelineDuration) * 100;
        const widthPercent = Math.max((duration / timelineDuration) * 100, 1.0);

        const getColor = (t: string) => {
          switch (t) {
            case 'b_roll': return '#a855f7'; // Purple
            case 'kinetic_title': return '#06b6d4'; // Cyan
            case 'ai_image': return '#ec4899'; // Pink
            case 'gradient_backdrop': return '#3b82f6'; // Blue
            default: return '#8b5cf6';
          }
        };

        const color = getColor(visual.type);

        return (
          <div
            key={`ghost-visual-${visual.id}`}
            style={{
              position: 'absolute',
              top: '2px',
              bottom: '2px',
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              border: `2px dashed ${color}`,
              backgroundColor: `${color}25`,
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '0.65rem',
              fontWeight: 600,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              pointerEvents: 'auto',
              cursor: 'pointer',
              boxShadow: `0 0 10px ${color}55`,
              transition: 'all 0.15s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(startTime);
            }}
            title={`Ghost Visual: [${visual.type.toUpperCase()}] ${visual.title} (${duration.toFixed(1)}s, ${visual.aspectRatio}). Click to seek.`}
          >
            {visual.type === 'b_roll' ? (
              <Film size={11} style={{ color }} />
            ) : visual.type === 'kinetic_title' ? (
              <Type size={11} style={{ color }} />
            ) : (
              <ImageIcon size={11} style={{ color }} />
            )}
            <span style={{ opacity: 0.95, fontWeight: 700 }}>
              👻 {visual.title}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '0.6rem', opacity: 0.85, background: `${color}44`, padding: '1px 4px', borderRadius: '4px' }}>
              {(visual.relevanceScore * 100).toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
