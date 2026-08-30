import React from 'react';
import { X, Download, RefreshCw, CheckCircle, FileVideo, AlertCircle, Sparkles, Sliders } from 'lucide-react';
import { useRawStudio } from './RawStudioContext';
import { platformPresets } from '@/lib/rendering/presets';
import { formatTime } from './utils';

export function ExportModal() {
  const {
    exportModal,
    setExportModal,
    projectTitle,
    platformPreset,
    setPlatformPreset,
    exportQuality,
    setExportQuality,
    exportCaptionMode,
    setExportCaptionMode,
    captionStyle,
    setCaptionStyle,
    activeJob,
    exportHistory,
    handleExport,
    cancelExport,
    editState,
    timelineDuration,
    activeAsset
  } = useRawStudio();

  if (!exportModal) return null;

  const currentPreset = platformPresets[platformPreset] || platformPresets['instagram-reels'];
  const isProcessing = activeJob?.status === 'processing' || activeJob?.status === 'queued';
  const isCompleted = activeJob?.status === 'completed';
  const isFailed = activeJob?.status === 'failed';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={() => {
        if (!isProcessing) setExportModal(false);
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-low)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Export Project — {projectTitle || 'Untitled Reel'}
            </h3>
          </div>
          <button
            onClick={() => setExportModal(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '75vh', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Active Job Progress View */}
          {activeJob && (
            <div
              style={{
                background: isCompleted ? 'rgba(34, 197, 94, 0.1)' : isFailed ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-base)',
                border: `1px solid ${isCompleted ? 'var(--accent-green)' : isFailed ? 'var(--accent-rose)' : 'var(--accent-primary)'}`,
                padding: '1.25rem',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isProcessing && <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />}
                  {isCompleted && <CheckCircle size={18} style={{ color: 'var(--accent-green)' }} />}
                  {isFailed && <AlertCircle size={18} style={{ color: 'var(--accent-rose)' }} />}
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    {isProcessing ? 'Rendering Video in Progress...' : isCompleted ? 'Render Complete!' : 'Render Failed'}
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isCompleted ? 'var(--accent-green)' : 'var(--accent-primary)' }}>
                  {activeJob.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-surface-low)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${activeJob.progress}%`,
                    background: isCompleted ? 'var(--accent-green)' : isFailed ? 'var(--accent-rose)' : 'var(--accent-primary)',
                    transition: 'width 0.3s ease',
                    boxShadow: '0 0 10px var(--accent-primary)'
                  }}
                />
              </div>

              {/* Completed Action Buttons */}
              {isCompleted && activeJob.result_json?.fileUrl && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <a
                    href={activeJob.result_json.fileUrl}
                    download={`${projectTitle || 'render'}.mp4`}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.65rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600 }}
                  >
                    <Download size={16} /> Download Rendered MP4
                  </a>
                </div>
              )}

              {/* Processing Cancel Action */}
              {isProcessing && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-rose)' }}
                  onClick={cancelExport}
                >
                  Cancel Export
                </button>
              )}
            </div>
          )}

          {/* Export Settings Form */}
          {!isProcessing && (
            <>
              {/* Project Summary Summary */}
              <div style={{ background: 'var(--bg-surface-low)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Composition Duration:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatTime(timelineDuration)}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Timeline Clips:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{editState.items.length} clips</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Active Source Asset:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeAsset?.fileName || activeAsset?.id || 'Main Timeline Asset'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Export Format:</span>
                  <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>MP4 Video (H.264)</div>
                </div>
              </div>

              {/* Platform Preset Picker */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>
                  Platform Target Preset
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {Object.entries(platformPresets).map(([id, p]) => (
                    <button
                      key={id}
                      className={`btn ${platformPreset === id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.65rem', fontSize: '0.8rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px' }}
                      onClick={() => setPlatformPreset(id)}
                    >
                      <span style={{ fontWeight: 600 }}>{p.label}</span>
                      <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>{p.aspectRatio} • {p.width}x{p.height}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Preset Picker */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>
                  Render Quality Target
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['high', 'medium', 'low'] as const).map((q) => (
                    <button
                      key={q}
                      className={`btn ${exportQuality === q ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', textTransform: 'capitalize' }}
                      onClick={() => setExportQuality(q)}
                    >
                      {q === 'high' ? 'High (1080p)' : q === 'medium' ? 'Medium (720p)' : 'Draft (480p)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption Export Mode */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>
                  Subtitles / Captions Export Mode
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className={`btn ${exportCaptionMode === 'burn' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem' }}
                    onClick={() => { setExportCaptionMode('burn'); setCaptionStyle(s => ({ ...s, burnIn: true })); }}
                  >
                    🔥 Burn-in
                  </button>
                  <button
                    className={`btn ${exportCaptionMode === 'sidecar' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem' }}
                    onClick={() => { setExportCaptionMode('sidecar'); setCaptionStyle(s => ({ ...s, burnIn: false })); }}
                  >
                    📄 Sidecar SRT
                  </button>
                  <button
                    className={`btn ${exportCaptionMode === 'off' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem' }}
                    onClick={() => { setExportCaptionMode('off'); setCaptionStyle(s => ({ ...s, burnIn: false })); }}
                  >
                    🚫 Off / None
                  </button>
                </div>
              </div>

              {/* Render Start Button */}
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700, borderRadius: '10px', boxShadow: '0 4px 15px rgba(99,102,241,0.4)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => {
                  handleExport();
                }}
              >
                <FileVideo size={18} /> Start Export Render Job
              </button>
            </>
          )}

          {/* Export History List */}
          {exportHistory && exportHistory.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                Recent Render History
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {exportHistory.map(job => (
                  <div
                    key={job.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-base)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileVideo size={14} style={{ color: 'var(--accent-primary)' }} />
                      <span style={{ fontWeight: 500 }}>{job.request_json?.projectTitle || 'Render Job'}</span>
                    </div>
                    <span style={{ color: job.status === 'completed' ? 'var(--accent-green)' : 'var(--accent-primary)', fontWeight: 600 }}>
                      {job.status} ({job.progress}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
