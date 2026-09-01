"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Volume2, Mic, Music, Sparkles, Play, Pause, Square, CheckSquare, 
  RefreshCw, Sliders, Zap, ShieldCheck, Check, Radio, Disc, ArrowDownToLine
} from 'lucide-react';
import { useRawStudio } from './RawStudioContext';
import { GeneratedAudioAsset, SfxCueType, BgmMoodType } from '@/lib/ai/audio/types';
import { compileApprovedAudioAssets } from '@/lib/editing/audio-compiler';

export function GenerativeAudioDeck() {
  const {
    editState,
    dispatch,
    audioProposals,
    setAudioProposals,
    selectedAudioIds,
    setSelectedAudioIds,
    playingAudioId,
    setPlayingAudioId,
    storyboardPlan,
    showToast
  } = useRawStudio();

  const [activeTab, setActiveTab] = useState<'voiceover' | 'sfx' | 'bgm'>('voiceover');
  const [enableDucking, setEnableDucking] = useState<boolean>(true);
  
  // Voiceover Form State
  const [ttsText, setTtsText] = useState(
    'Stop wasting hours on manual editing! KontentOS automates your entire creator workflow in seconds.'
  );
  const [voiceStyle, setVoiceStyle] = useState<'natural' | 'punchy' | 'calm' | 'dramatic' | 'fast'>('punchy');
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);

  // SFX Form State
  const [selectedCue, setSelectedCue] = useState<SfxCueType>('whoosh');
  const [sfxIntensity, setSfxIntensity] = useState<number>(0.9);
  const [sfxDuration, setSfxDuration] = useState<number>(1.0);
  const [isGeneratingSfx, setIsGeneratingSfx] = useState(false);

  // BGM Form State
  const [bgmMood, setBgmMood] = useState<BgmMoodType>('energetic');
  const [bgmDuration, setBgmDuration] = useState<number>(15.0);
  const [isGeneratingBgm, setIsGeneratingBgm] = useState(false);

  // In-Browser Audio Auditioning Reference
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const handleTogglePlay = (asset: GeneratedAudioAsset) => {
    if (playingAudioId === asset.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const player = new Audio(asset.audioUrl);
      audioPlayerRef.current = player;
      setPlayingAudioId(asset.id);
      player.play().catch(() => {});
      player.onended = () => {
        setPlayingAudioId(null);
      };
    }
  };

  const toggleSelectAudio = (id: string) => {
    setSelectedAudioIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const all = [
      ...audioProposals.voiceovers,
      ...audioProposals.sfx,
      ...audioProposals.bgm
    ].map(a => a.id);
    setSelectedAudioIds(new Set(all));
    showToast(`Selected all ${all.length} audio proposals for ghost preview.`);
  };

  const handleDeselectAll = () => {
    setSelectedAudioIds(new Set());
    showToast('Cleared all audio ghost previews.');
  };

  // Explicit Atomic Assembly to Timeline
  const handleApplyAudioToTimeline = () => {
    const allProposals = [
      ...audioProposals.voiceovers,
      ...audioProposals.sfx,
      ...audioProposals.bgm
    ];
    const approvedAssets = allProposals.filter(a => selectedAudioIds.has(a.id));

    if (approvedAssets.length === 0) {
      showToast('No audio proposals selected for insertion.');
      return;
    }

    const compiled = compileApprovedAudioAssets(approvedAssets, editState, {
      enableDucking,
      targetTrackId: 'track-audio-1'
    });

    dispatch({
      type: 'APPLY_AUDIO_ASSETS',
      payload: { newItems: compiled.newItems }
    });

    const approvedIds = new Set(approvedAssets.map(a => a.id));
    setAudioProposals(prev => ({
      voiceovers: prev.voiceovers.filter(a => !approvedIds.has(a.id)),
      sfx: prev.sfx.filter(a => !approvedIds.has(a.id)),
      bgm: prev.bgm.filter(a => !approvedIds.has(a.id))
    }));
    setSelectedAudioIds(new Set());

    showToast(`Inserted ${compiled.newItems.length} audio items to timeline (1-step Undo ready).`);
  };

  // 1. Generate Voiceover
  const handleGenerateVoiceover = async () => {
    if (!ttsText.trim()) {
      showToast('Please enter text for voiceover synthesis.');
      return;
    }

    setIsGeneratingTts(true);
    showToast('Synthesizing AI Voiceover & Waveform...');

    try {
      const res = await fetch('/api/ai/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'voiceover',
          ttsPayload: {
            text: ttsText.trim(),
            style: voiceStyle,
            speed: ttsSpeed,
            pitch: ttsPitch,
            wordsPerMinute: 150
          }
        })
      });

      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const data = await res.json();

      if (data.asset) {
        setAudioProposals(prev => ({
          ...prev,
          voiceovers: [data.asset, ...prev.voiceovers]
        }));
        setSelectedAudioIds(prev => new Set(prev).add(data.asset.id));
        showToast(`Generated Voiceover: "${data.asset.title}" (${data.asset.duration}s)`);
      }
    } catch (err: any) {
      showToast(`Voiceover synthesis failed: ${err.message}`);
    } finally {
      setIsGeneratingTts(false);
    }
  };

  // 2. Generate SFX
  const handleGenerateSfx = async () => {
    setIsGeneratingSfx(true);
    showToast(`Generating ${selectedCue.toUpperCase()} Sound Effect...`);

    try {
      const res = await fetch('/api/ai/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sfx',
          sfxPayload: {
            cue: selectedCue,
            duration: sfxDuration,
            intensity: sfxIntensity
          }
        })
      });

      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const data = await res.json();

      if (data.asset) {
        setAudioProposals(prev => ({
          ...prev,
          sfx: [data.asset, ...prev.sfx]
        }));
        setSelectedAudioIds(prev => new Set(prev).add(data.asset.id));
        showToast(`Generated SFX: "${data.asset.title}"`);
      }
    } catch (err: any) {
      showToast(`SFX generation failed: ${err.message}`);
    } finally {
      setIsGeneratingSfx(false);
    }
  };

  // 3. Generate BGM
  const handleGenerateBgm = async () => {
    setIsGeneratingBgm(true);
    showToast(`Composing ${bgmMood.toUpperCase()} Background Music...`);

    try {
      const res = await fetch('/api/ai/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bgm',
          bgmPayload: {
            mood: bgmMood,
            targetDuration: bgmDuration
          }
        })
      });

      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const data = await res.json();

      if (data.asset) {
        setAudioProposals(prev => ({
          ...prev,
          bgm: [data.asset, ...prev.bgm]
        }));
        setSelectedAudioIds(prev => new Set(prev).add(data.asset.id));
        showToast(`Composed BGM: "${data.asset.title}" (${data.asset.duration}s)`);
      }
    } catch (err: any) {
      showToast(`BGM composition failed: ${err.message}`);
    } finally {
      setIsGeneratingBgm(false);
    }
  };

  const totalProposalsCount = 
    audioProposals.voiceovers.length + 
    audioProposals.sfx.length + 
    audioProposals.bgm.length;

  return (
    <div className="generative-audio-deck-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0.25rem', height: '100%', overflowY: 'auto' }}>
      
      {/* Deck Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(168, 85, 247, 0.15))', color: '#ec4899' }}>
            <Volume2 size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Generative Audio Studio
            </h3>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              AI Voiceover • Sound Effects • BGM Loops
            </span>
          </div>
        </div>

        <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', fontWeight: 600, border: '1px solid rgba(236, 72, 153, 0.25)' }}>
          {totalProposalsCount} Assets
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('voiceover')}
          style={{
            flex: 1,
            padding: '6px 4px',
            fontSize: '0.74rem',
            fontWeight: activeTab === 'voiceover' ? 600 : 500,
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'voiceover' ? 'var(--bg-base)' : 'transparent',
            color: activeTab === 'voiceover' ? '#ec4899' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Mic size={14} /> Voiceover ({audioProposals.voiceovers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sfx')}
          style={{
            flex: 1,
            padding: '6px 4px',
            fontSize: '0.74rem',
            fontWeight: activeTab === 'sfx' ? 600 : 500,
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'sfx' ? 'var(--bg-base)' : 'transparent',
            color: activeTab === 'sfx' ? '#06b6d4' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Zap size={14} /> SFX ({audioProposals.sfx.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bgm')}
          style={{
            flex: 1,
            padding: '6px 4px',
            fontSize: '0.74rem',
            fontWeight: activeTab === 'bgm' ? 600 : 500,
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'bgm' ? 'var(--bg-base)' : 'transparent',
            color: activeTab === 'bgm' ? '#8b5cf6' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Music size={14} /> BGM ({audioProposals.bgm.length})
        </button>
      </div>

      {/* Tab 1: Voiceover Studio */}
      {activeTab === 'voiceover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Speech Script Text
              </label>
              {storyboardPlan && (
                <button
                  type="button"
                  onClick={() => {
                    const text = storyboardPlan.beats.map(b => b.spokenText).filter(Boolean).join(' ');
                    if (text) {
                      setTtsText(text);
                      showToast('Loaded voiceover script from active Storyboard beats.');
                    }
                  }}
                  style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  ⚡ Pull from Storyboard
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              placeholder="Enter spoken voiceover script..."
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.75rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Voice Style & Speed */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                Voice Style
              </label>
              <select
                value={voiceStyle}
                onChange={(e: any) => setVoiceStyle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.72rem'
                }}
              >
                <option value="punchy">⚡ Punchy & High-Energy</option>
                <option value="natural">🎙️ Natural Conversational</option>
                <option value="calm">☕ Calm & Educational</option>
                <option value="dramatic">🎬 Dramatic & Cinematic</option>
                <option value="fast">🚀 Fast-Paced Viral</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Speed</span>
                <span style={{ fontFamily: 'monospace' }}>{ttsSpeed.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min={0.8}
                max={1.5}
                step={0.1}
                value={ttsSpeed}
                onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateVoiceover}
            disabled={isGeneratingTts}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ec4899, #d946ef)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: isGeneratingTts ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {isGeneratingTts ? <RefreshCw size={14} className="animate-spin" /> : <Mic size={14} />}
            {isGeneratingTts ? 'Synthesizing...' : 'Generate AI Voiceover Track'}
          </button>
        </div>
      )}

      {/* Tab 2: SFX Deck */}
      {activeTab === 'sfx' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              Select Sound Effect Cue
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
              {(['whoosh', 'impact', 'glitch', 'sub_drop', 'riser', 'bell', 'notification'] as SfxCueType[]).map(cue => {
                const isSelected = selectedCue === cue;
                return (
                  <button
                    key={cue}
                    type="button"
                    onClick={() => setSelectedCue(cue)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? '#06b6d4' : 'var(--border-subtle)'}`,
                      color: isSelected ? '#06b6d4' : 'var(--text-main)',
                      fontSize: '0.7rem',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                      textTransform: 'capitalize'
                    }}
                  >
                    ⚡ {cue.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateSfx}
            disabled={isGeneratingSfx}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: isGeneratingSfx ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {isGeneratingSfx ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            {isGeneratingSfx ? 'Synthesizing...' : `Generate "${selectedCue.toUpperCase()}" SFX`}
          </button>
        </div>
      )}

      {/* Tab 3: BGM Selector */}
      {activeTab === 'bgm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              Select Musical Mood
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
              {(['energetic', 'cinematic', 'chill', 'corporate', 'dramatic'] as BgmMoodType[]).map(mood => {
                const isSelected = bgmMood === mood;
                return (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setBgmMood(mood)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? '#8b5cf6' : 'var(--border-subtle)'}`,
                      color: isSelected ? '#8b5cf6' : 'var(--text-main)',
                      fontSize: '0.7rem',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                      textTransform: 'capitalize'
                    }}
                  >
                    🎵 {mood}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Target Duration</span>
              <span style={{ fontFamily: 'monospace' }}>{bgmDuration.toFixed(0)}s</span>
            </label>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={bgmDuration}
              onChange={(e) => setBgmDuration(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateBgm}
            disabled={isGeneratingBgm}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: isGeneratingBgm ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {isGeneratingBgm ? <RefreshCw size={14} className="animate-spin" /> : <Disc size={14} />}
            {isGeneratingBgm ? 'Composing...' : `Compose "${bgmMood.toUpperCase()}" BGM`}
          </button>
        </div>
      )}

      {/* Proposal Pool Header & Batch Actions */}
      {totalProposalsCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Generated Proposals Pool ({selectedAudioIds.size}/{totalProposalsCount} Active Ghosts)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{ fontSize: '0.65rem', background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0 }}
              >
                Select All
              </button>
              <span style={{ color: 'var(--border-subtle)' }}>•</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                style={{ fontSize: '0.65rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              ...audioProposals.voiceovers,
              ...audioProposals.sfx,
              ...audioProposals.bgm
            ].map(asset => {
              const isSelected = selectedAudioIds.has(asset.id);
              const isPlaying = playingAudioId === asset.id;

              return (
                <div
                  key={asset.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1.5px solid ${isSelected ? (asset.type === 'voiceover' ? '#ec4899' : asset.type === 'sfx' ? '#06b6d4' : '#8b5cf6') : 'var(--border-subtle)'}`,
                    borderRadius: '8px',
                    padding: '0.65rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => toggleSelectAudio(asset.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                      >
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>

                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          background: asset.type === 'voiceover' ? 'rgba(236, 72, 153, 0.15)' : asset.type === 'sfx' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                          color: asset.type === 'voiceover' ? '#ec4899' : asset.type === 'sfx' ? '#06b6d4' : '#8b5cf6'
                        }}
                      >
                        {asset.type}
                      </span>

                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {asset.title}
                      </span>
                    </div>

                    {/* Audition Button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePlay(asset)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: isPlaying ? '#10b981' : 'var(--bg-base)',
                        color: isPlaying ? '#ffffff' : 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                      {isPlaying ? 'Pause' : 'Audition'}
                    </button>
                  </div>

                  {/* Waveform Visualization Bars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '24px', background: 'var(--bg-base)', padding: '2px 4px', borderRadius: '4px' }}>
                    {asset.waveformPeaks.map((peak, idx) => (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          height: `${Math.round(peak * 100)}%`,
                          background: isPlaying ? (asset.type === 'voiceover' ? '#ec4899' : asset.type === 'sfx' ? '#06b6d4' : '#8b5cf6') : 'var(--text-muted)',
                          opacity: isPlaying ? 0.9 : 0.4,
                          borderRadius: '1px',
                          transition: 'height 0.1s ease'
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>⏱️ Duration: {asset.duration.toFixed(1)}s</span>
                    <span>Format: {asset.metadata.format.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explicit Approval & Insertion Panel */}
      {selectedAudioIds.size > 0 && (
        <div style={{ background: 'var(--bg-surface-low)', border: '1.5px solid var(--accent-primary)', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
              ⚡ Ready to Assemble ({selectedAudioIds.size} Audio Items)
            </span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-main)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={enableDucking}
              onChange={(e) => setEnableDucking(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
            <span>Enable Speech-Reactive Sidechain Ducking (-14dB BGM curve)</span>
          </label>

          <button
            type="button"
            onClick={handleApplyAudioToTimeline}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <ArrowDownToLine size={15} />
            Insert Selected Audio ({selectedAudioIds.size}) to Timeline
          </button>
        </div>
      )}

      {/* Safety Boundary Callout */}
      <div style={{ background: 'rgba(236, 72, 153, 0.06)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#ec4899' }}>
          <ShieldCheck size={16} /> Phase 23 Atomic Audio Assembler Active
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          All approved audio insertions occur as a single atomic transaction. Single-step Undo (<kbd style={{ background: 'var(--bg-base)', padding: '1px 4px', borderRadius: '3px' }}>Ctrl+Z</kbd>) restores the exact timeline baseline.
        </div>
      </div>

    </div>
  );
}
