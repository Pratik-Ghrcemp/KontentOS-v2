"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useRawStudio } from './RawStudioContext';
import { useAuth } from '@/context/auth-context';
import { useAppState } from '@/context/state-context';
import {
  PublishingPlatform,
  PlatformPackage,
  PackagingInput,
} from '@/lib/publishing/types';
import { PLATFORM_CONSTRAINTS, validatePlatformPackage } from '@/lib/publishing/platform-constraints';
import { generatePlatformPackages } from '@/lib/publishing/packager';
import { generateProceduralThumbnailSvg } from '@/lib/publishing/thumbnail-engine';
import { enqueuePublishingPackages } from '@/lib/data/publishing-queue-service';
import {
  Share2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Clock,
  ExternalLink,
  Smartphone,
  Monitor,
  Heart,
  MessageCircle,
  Repeat,
  Send,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Plus,
  X,
  Layers,
  ShieldCheck,
  Eye
} from 'lucide-react';

const PLATFORMS: Array<{ id: PublishingPlatform; label: string; icon: string; badgeColor: string }> = [
  { id: 'youtube_shorts', label: 'YouTube Shorts', icon: '📺', badgeColor: '#ef4444' },
  { id: 'instagram_reels', label: 'Instagram Reels', icon: '📸', badgeColor: '#ec4899' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', badgeColor: '#06b6d4' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', badgeColor: '#0284c7' },
  { id: 'twitter_x', label: 'X (Twitter)', icon: '🐦', badgeColor: '#1d9bf0' },
];

export function PublishingDeck() {
  const { user } = useAuth();
  const { state: appState, setTab } = useAppState();
  const {
    editState,
    storyboardPlan,
    projectId,
    projectTitle,
    platformPackages,
    setPlatformPackages,
    selectedPlatformIds,
    setSelectedPlatformIds,
    packageOverrides,
    setPackageOverrides,
    providerCallCount,
    showToast,
  } = useRawStudio();

  const [activePlatformTab, setActivePlatformTab] = useState<PublishingPlatform>('youtube_shorts');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Primary video clip duration
  const primaryDuration = editState.duration || 45.0;

  // Generate or refresh platform packages
  const handleGeneratePackages = async () => {
    setIsGenerating(true);
    try {
      const primaryVideo = editState.items.find(i => i.type === 'video');
      const captions = editState.items.filter(i => i.type === 'caption');
      const transcriptText = captions.map(c => c.properties?.text || c.label || '').join(' ');

      const input: PackagingInput = {
        renderResult: {
          outputPath: primaryVideo?.assetId || 'test_spoken_video.mp4',
          durationSeconds: primaryDuration,
          aspectRatio: '9:16',
        },
        storyboard: storyboardPlan ? {
          title: storyboardPlan.topic || 'High Impact Creator Video',
          beats: storyboardPlan.beats.map(b => ({
            title: b.title,
            voiceoverLine: b.spokenText,
            visualDirective: b.visualIntent,
          })),
        } : {
          title: 'Autonomous Creator Video',
          beats: [
            { title: 'The Hook', voiceoverLine: 'Stop wasting hours creating content manually.' },
            { title: 'The Framework', voiceoverLine: 'Here is the step-by-step framework to scale 3X.' },
            { title: 'The Action', voiceoverLine: 'Try this in your next project today.' },
          ],
        },
        transcript: transcriptText,
        creatorProfile: {
          brandTone: appState.creatorProfile.mode === 'pro' ? 'professional' : 'energetic',
          creatorName: appState.creatorProfile.name,
          handle: appState.creatorProfile.handle,
          niche: appState.creatorProfile.proNiche || appState.creatorProfile.selectedVibe,
        },
      };

      const generated = await generatePlatformPackages(input);
      setPlatformPackages(generated);
      setSelectedPlatformIds(new Set(generated.map(g => g.platform)));
      showToast(`Generated ${generated.length} platform publishing packages!`);
    } catch (err: any) {
      console.error('Error generating platform packages:', err);
      showToast('Failed to generate platform packages');
    } finally {
      setIsGenerating(false);
    }
  };

  // Find base generated package for active platform tab
  const basePackage = useMemo(() => {
    return platformPackages.find(p => p.platform === activePlatformTab);
  }, [platformPackages, activePlatformTab]);

  // Current overrides for active platform
  const currentOverrides = useMemo(() => {
    if (!basePackage) return {};
    return packageOverrides[basePackage.id] || {};
  }, [basePackage, packageOverrides]);

  // Merged / Resolved package
  const resolvedPackage = useMemo<PlatformPackage | null>(() => {
    if (!basePackage) return null;
    const merged = {
      ...basePackage,
      ...currentOverrides,
      hashtags: currentOverrides.hashtags !== undefined ? currentOverrides.hashtags : basePackage.hashtags,
    };
    return merged;
  }, [basePackage, currentOverrides]);

  // Validation report for resolved package
  const validationReport = useMemo(() => {
    if (!resolvedPackage) return { valid: true, errors: [], warnings: [] };
    return validatePlatformPackage(resolvedPackage, primaryDuration);
  }, [resolvedPackage, primaryDuration]);

  // Update override draft
  const updateOverride = (updates: Partial<PlatformPackage>) => {
    if (!basePackage) return;
    setPackageOverrides(prev => ({
      ...prev,
      [basePackage.id]: {
        ...(prev[basePackage.id] || {}),
        ...updates,
      },
    }));
  };

  // Reset current platform overrides to AI generated baseline
  const handleResetToAi = () => {
    if (!basePackage) return;
    setPackageOverrides(prev => {
      const next = { ...prev };
      delete next[basePackage.id];
      return next;
    });
    showToast(`Reset ${PLATFORM_CONSTRAINTS[activePlatformTab].displayName} to AI baseline`);
  };

  // Reset all overrides
  const handleResetAll = () => {
    setPackageOverrides({});
    showToast('Reset all platform overrides to AI baseline');
  };

  // Add hashtag
  const handleAddHashtag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (!tagInput.trim() || !resolvedPackage) return;
    
    let cleanTag = tagInput.trim();
    if (!cleanTag.startsWith('#')) cleanTag = `#${cleanTag}`;
    cleanTag = cleanTag.replace(/[^a-zA-Z0-9#_]/g, '');

    if (!resolvedPackage.hashtags.includes(cleanTag)) {
      updateOverride({ hashtags: [...resolvedPackage.hashtags, cleanTag] });
    }
    setTagInput('');
  };

  // Remove hashtag
  const handleRemoveHashtag = (tagToRemove: string) => {
    if (!resolvedPackage) return;
    updateOverride({ hashtags: resolvedPackage.hashtags.filter(t => t !== tagToRemove) });
  };

  // Toggle platform selection
  const togglePlatformSelection = (platform: PublishingPlatform) => {
    setSelectedPlatformIds(prev => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  // Batch Select / Deselect
  const handleSelectAll = () => {
    setSelectedPlatformIds(new Set(PLATFORMS.map(p => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedPlatformIds(new Set());
  };

  const resolvePackage = useCallback((pkg: PlatformPackage): PlatformPackage => {
    const overrides = packageOverrides[pkg.id] || {};
    return {
      ...pkg,
      ...overrides,
      hashtags: overrides.hashtags !== undefined ? overrides.hashtags : pkg.hashtags,
    };
  }, [packageOverrides]);

  const selectedResolvedPackages = useMemo(() => {
    return platformPackages
      .filter(pkg => selectedPlatformIds.has(pkg.platform))
      .map(resolvePackage);
  }, [platformPackages, selectedPlatformIds, resolvePackage]);

  const handleQueueSelected = async (publishNow = false) => {
    if (!user || selectedResolvedPackages.length === 0) {
      showToast('Select at least one platform package first');
      return;
    }

    setIsQueueing(true);
    try {
      const packagesToQueue = selectedResolvedPackages.map(pkg => ({
        ...pkg,
        scheduledAt: publishNow ? new Date().toISOString() : pkg.scheduledAt,
        status: publishNow ? 'ready' as const : pkg.status,
      }));
      const result = await enqueuePublishingPackages({
        userId: user.id,
        projectId,
        projectTitle: projectTitle || storyboardPlan?.topic || 'Studio Hub Publish',
        packages: packagesToQueue,
      });
      setPlatformPackages(prev => prev.map(pkg => (
        selectedPlatformIds.has(pkg.platform)
          ? { ...pkg, status: result.scheduledFor ? 'scheduled' : 'ready', scheduledAt: pkg.scheduledAt || result.scheduledFor || undefined }
          : pkg
      )));
      showToast(`${result.queuedCount} package(s) added to Content Calendar`);
      setTab('calendar');
    } catch (err: any) {
      showToast(err?.message || 'Failed to add packages to Content Calendar');
    } finally {
      setIsQueueing(false);
    }
  };

  const activeConstraints = PLATFORM_CONSTRAINTS[activePlatformTab];

  // Generate live thumbnail SVG preview
  const thumbnailSvg = useMemo(() => {
    if (!resolvedPackage) return '';
    return generateProceduralThumbnailSvg({
      title: resolvedPackage.title || resolvedPackage.description.slice(0, 40) || 'Viral Reel Video',
      platform: activePlatformTab,
      aspectRatio: resolvedPackage.aspectRatio,
      themeColor: PLATFORMS.find(p => p.id === activePlatformTab)?.badgeColor || '#6366f1',
    });
  }, [resolvedPackage, activePlatformTab]);

  return (
    <div className="publishing-deck-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: 'var(--bg-surface)', color: 'var(--text-primary)', padding: '1.25rem', gap: '1.25rem' }}>
      
      {/* ─── HEADER BAR ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Cross-Platform Publishing Deck</h2>
            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', fontWeight: 600 }}>
              Phase 25B Sandbox
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Multi-platform packaging, device mockups, metadata overrides, and schedule picker.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Zero-Side-Effect Provider Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
            <ShieldCheck size={14} />
            <span>Provider Calls: {providerCallCount} (Isolated Sandbox)</span>
          </div>

          <button
            type="button"
            onClick={handleResetAll}
            title="Reset All Overrides to AI Baseline"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            <RotateCcw size={13} />
            <span>Reset All</span>
          </button>

          <button
            type="button"
            onClick={handleGeneratePackages}
            disabled={isGenerating}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent-primary)', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 600, cursor: isGenerating ? 'not-allowed' : 'pointer' }}
          >
            <Sparkles size={14} />
            <span>{isGenerating ? 'Packaging AI Assets...' : platformPackages.length === 0 ? 'Generate Platform Packages' : 'Refresh Packages'}</span>
          </button>
        </div>
      </div>

      {/* ─── PLATFORM TAB BAR & SELECTION CONTROLS ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {PLATFORMS.map(p => {
            const isTabActive = activePlatformTab === p.id;
            const isSelected = selectedPlatformIds.has(p.id);
            const pkg = platformPackages.find(pkg => pkg.platform === p.id);
            const overrides = pkg ? packageOverrides[pkg.id] || {} : {};
            const resolved = pkg ? { ...pkg, ...overrides, hashtags: overrides.hashtags || pkg.hashtags } : null;
            const valid = resolved ? validatePlatformPackage(resolved, primaryDuration).valid : true;

            return (
              <div
                key={p.id}
                data-platform={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: isTabActive ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-base)',
                  border: isTabActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => setActivePlatformTab(p.id)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    togglePlatformSelection(p.id);
                  }}
                  style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                />
                <span style={{ fontSize: '0.9rem' }}>{p.icon}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: isTabActive ? 700 : 500, color: isTabActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {p.label}
                </span>

                {/* Validation Indicator Pill */}
                {pkg && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: valid ? '#10b981' : '#ef4444' }} title={valid ? 'Valid package' : 'Constraint warning'} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleSelectAll}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
          >
            Select All ({PLATFORMS.length})
          </button>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <button
            type="button"
            onClick={handleDeselectAll}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer' }}
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* ─── MAIN TWO-COLUMN WORKSPACE: METADATA OVERRIDES & LIVE DEVICE FEED MOCKUP ─── */}
      {resolvedPackage ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', flex: 1, minHeight: 0 }}>
          
          {/* ─── LEFT COLUMN: METADATA & OVERRIDE EDITOR ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem', overflowY: 'auto' }}>
            
            {/* Constraint Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>{PLATFORMS.find(p => p.id === activePlatformTab)?.icon}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{activeConstraints.displayName} Platform Rules</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Max: {activeConstraints.maxDescriptionLength} chars</span>
                <span>•</span>
                <span>Max {activeConstraints.maxHashtags} tags</span>
                <span>•</span>
                <span>{activeConstraints.supportedAspectRatios.join('/')}</span>
              </div>
            </div>

            {/* Validation Feedback Warning Banner */}
            {!validationReport.valid && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>
                  <AlertTriangle size={14} />
                  <span>Platform Constraint Violations:</span>
                </div>
                {validationReport.errors.map((err, idx) => (
                  <span key={idx} style={{ fontSize: '0.7rem', color: '#f87171', paddingLeft: '20px' }}>• {err}</span>
                ))}
              </div>
            )}

            {/* TITLE INPUT (If Platform Supports/Requires Title) */}
            {activeConstraints.maxTitleLength > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Video Title {activeConstraints.requiresTitle && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <span style={{ fontSize: '0.7rem', color: (resolvedPackage.title.length > activeConstraints.maxTitleLength) ? '#ef4444' : 'var(--text-muted)' }}>
                    {resolvedPackage.title.length} / {activeConstraints.maxTitleLength}
                  </span>
                </div>
                <input
                  type="text"
                  value={resolvedPackage.title}
                  onChange={(e) => updateOverride({ title: e.target.value })}
                  placeholder={`Enter ${activeConstraints.displayName} title...`}
                  style={{
                    background: 'var(--bg-surface)',
                    border: (resolvedPackage.title.length > activeConstraints.maxTitleLength) ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            {/* DESCRIPTION / CAPTION TEXTAREA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Caption / Description {activeConstraints.requiresDescription && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <span style={{ fontSize: '0.7rem', color: (resolvedPackage.description.length > activeConstraints.maxDescriptionLength) ? '#ef4444' : 'var(--text-muted)' }}>
                  {resolvedPackage.description.length} / {activeConstraints.maxDescriptionLength}
                </span>
              </div>
              <textarea
                rows={5}
                value={resolvedPackage.description}
                onChange={(e) => updateOverride({ description: e.target.value })}
                placeholder={`Write native caption for ${activeConstraints.displayName}...`}
                style={{
                  background: 'var(--bg-surface)',
                  border: (resolvedPackage.description.length > activeConstraints.maxDescriptionLength) ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  lineHeight: '1.4',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>

            {/* HASHTAGS MANAGER */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Hashtags ({resolvedPackage.hashtags.length} / {activeConstraints.maxHashtags})
                </label>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Optimal: ~{activeConstraints.optimalHashtags} tags
                </span>
              </div>

              {/* Tag Pill Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {resolvedPackage.hashtags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      color: 'var(--accent-primary)',
                      borderRadius: '16px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}
                  >
                    {tag}
                    <X
                      size={12}
                      style={{ cursor: 'pointer', opacity: 0.7 }}
                      onClick={() => handleRemoveHashtag(tag)}
                    />
                  </span>
                ))}
              </div>

              {/* Quick Add Hashtag Input */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddHashtag}
                  placeholder="Add hashtag (e.g. #CreatorTips)..."
                  style={{
                    flex: 1,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddHashtag}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-primary)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* SCHEDULE DATE & TIME PICKER */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="var(--accent-primary)" />
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Scheduled Publishing Time</label>
              </div>
              <input
                type="datetime-local"
                value={resolvedPackage.scheduledAt || ''}
                onChange={(e) => updateOverride({ scheduledAt: e.target.value })}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* RESET TO AI BASELINE BUTTON */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleResetToAi}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer' }}
              >
                <RotateCcw size={12} />
                <span>Reset {activeConstraints.displayName} to AI Default</span>
              </button>
            </div>

          </div>

          {/* ─── RIGHT COLUMN: LIVE DEVICE FEED MOCKUP ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem', overflowY: 'auto' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                {activePlatformTab === 'linkedin' ? <Monitor size={14} /> : <Smartphone size={14} />}
                <span>Live Feed Preview: {activeConstraints.displayName}</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Interactive UI Overlay</span>
            </div>

            {/* MOCKUP 1: YOUTUBE SHORTS */}
            {activePlatformTab === 'youtube_shorts' && (
              <div style={{ width: '280px', height: '480px', background: '#000000', borderRadius: '24px', position: 'relative', overflow: 'hidden', border: '3px solid #334155', boxShadow: '0 12px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px' }}>
                {/* Background Thumbnail/Video */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.85 }} dangerouslySetInnerHTML={{ __html: thumbnailSvg }} />

                {/* Top Channel Header */}
                <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ffffff' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>Shorts</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>⚡ 4K</span>
                </div>

                {/* Right Action Icons Bar */}
                <div style={{ position: 'absolute', right: '10px', bottom: '80px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', color: '#ffffff' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><ThumbsUp size={18} /><span style={{ fontSize: '0.6rem' }}>24K</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><ThumbsDown size={18} /><span style={{ fontSize: '0.6rem' }}>Dislike</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><MessageCircle size={18} /><span style={{ fontSize: '0.6rem' }}>512</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><Send size={18} /><span style={{ fontSize: '0.6rem' }}>Share</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><Repeat size={18} /><span style={{ fontSize: '0.6rem' }}>Remix</span></div>
                </div>

                {/* Bottom Video Metadata */}
                <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', gap: '6px', color: '#ffffff', maxWidth: '80%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>K</div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>@kontentos_ai</span>
                    <span style={{ fontSize: '0.65rem', background: '#ffffff', color: '#000000', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>Subscribe</span>
                  </div>
                  <p style={{ fontSize: '0.72rem', margin: 0, fontWeight: 500, lineHeight: 1.2 }}>
                    {resolvedPackage.title || 'Video Title'}
                  </p>
                </div>
              </div>
            )}

            {/* MOCKUP 2: INSTAGRAM REELS */}
            {activePlatformTab === 'instagram_reels' && (
              <div style={{ width: '280px', height: '480px', background: '#000000', borderRadius: '24px', position: 'relative', overflow: 'hidden', border: '3px solid #334155', boxShadow: '0 12px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.85 }} dangerouslySetInnerHTML={{ __html: thumbnailSvg }} />

                <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ffffff' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Reels</span>
                </div>

                {/* Right Action Icons Bar */}
                <div style={{ position: 'absolute', right: '10px', bottom: '60px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', color: '#ffffff' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><Heart size={18} color="#ec4899" fill="#ec4899" /><span style={{ fontSize: '0.6rem' }}>14.8K</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><MessageCircle size={18} /><span style={{ fontSize: '0.6rem' }}>184</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><Send size={18} /><span style={{ fontSize: '0.6rem' }}>Share</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><Bookmark size={18} /><span style={{ fontSize: '0.6rem' }}>Save</span></div>
                </div>

                {/* Bottom Metadata */}
                <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', color: '#ffffff', maxWidth: '80%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>📸</div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>kontentos_ai</span>
                    <span style={{ fontSize: '0.65rem', border: '1px solid #ffffff', padding: '1px 6px', borderRadius: '4px' }}>Follow</span>
                  </div>
                  <p style={{ fontSize: '0.68rem', margin: 0, lineHeight: 1.2, maxHeight: '42px', overflow: 'hidden' }}>
                    {resolvedPackage.description}
                  </p>
                  <span style={{ fontSize: '0.65rem', color: '#38bdf8' }}>{resolvedPackage.hashtags.join(' ')}</span>
                </div>
              </div>
            )}

            {/* MOCKUP 3: TIKTOK */}
            {activePlatformTab === 'tiktok' && (
              <div style={{ width: '280px', height: '480px', background: '#000000', borderRadius: '24px', position: 'relative', overflow: 'hidden', border: '3px solid #334155', boxShadow: '0 12px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.85 }} dangerouslySetInnerHTML={{ __html: thumbnailSvg }} />

                <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#ffffff' }}>
                  <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>Following</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, borderBottom: '2px solid #ffffff', paddingBottom: '2px' }}>For You</span>
                </div>

                {/* Right Action Icons Bar */}
                <div style={{ position: 'absolute', right: '10px', bottom: '60px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', color: '#ffffff' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🎵</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><Heart size={18} color="#ef4444" fill="#ef4444" /><span style={{ fontSize: '0.6rem' }}>89.2K</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><MessageCircle size={18} /><span style={{ fontSize: '0.6rem' }}>1.4K</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><Bookmark size={18} color="#eab308" fill="#eab308" /><span style={{ fontSize: '0.6rem' }}>12K</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><Send size={18} /><span style={{ fontSize: '0.6rem' }}>Share</span></div>
                </div>

                {/* Bottom Metadata */}
                <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', color: '#ffffff', maxWidth: '80%' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>@kontentos_ai</span>
                  <p style={{ fontSize: '0.68rem', margin: 0, lineHeight: 1.2, maxHeight: '36px', overflow: 'hidden' }}>
                    {resolvedPackage.description}
                  </p>
                  <span style={{ fontSize: '0.65rem', color: '#06b6d4', fontWeight: 600 }}>{resolvedPackage.hashtags.join(' ')}</span>
                </div>
              </div>
            )}

            {/* MOCKUP 4: LINKEDIN */}
            {activePlatformTab === 'linkedin' && (
              <div style={{ width: '320px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                {/* Author Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>K</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>KontentOS Studio</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>• 1st</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Autonomous AI Video Engine • 2h</span>
                  </div>
                </div>

                {/* Post Body */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.3, maxHeight: '80px', overflow: 'hidden' }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>{resolvedPackage.title}</p>
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{resolvedPackage.description}</p>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 600 }}>{resolvedPackage.hashtags.join(' ')}</span>

                {/* Video Container Frame */}
                <div style={{ width: '100%', height: '140px', background: '#000000', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.85 }} dangerouslySetInnerHTML={{ __html: thumbnailSvg }} />
                </div>

                {/* Engagement Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={13} /><span>Like</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={13} /><span>Comment</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Repeat size={13} /><span>Repost</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Send size={13} /><span>Send</span></div>
                </div>
              </div>
            )}

            {/* MOCKUP 5: X (TWITTER) */}
            {activePlatformTab === 'twitter_x' && (
              <div style={{ width: '320px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                {/* Profile Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #334155' }}>𝕏</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>KontentOS</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>@kontentos_ai • 1h</span>
                  </div>
                </div>

                {/* Tweet Body */}
                <p style={{ fontSize: '0.75rem', margin: 0, lineHeight: 1.3, color: 'var(--text-primary)' }}>
                  {resolvedPackage.description}
                </p>
                <span style={{ fontSize: '0.7rem', color: '#1d9bf0' }}>{resolvedPackage.hashtags.join(' ')}</span>

                {/* Video Frame */}
                <div style={{ width: '100%', height: '140px', background: '#000000', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.85 }} dangerouslySetInnerHTML={{ __html: thumbnailSvg }} />
                </div>

                {/* Tweet Engagement Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-around', color: 'var(--text-muted)', fontSize: '0.7rem', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={13} /><span>42</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Repeat size={13} /><span>18</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={13} /><span>230</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Bookmark size={13} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Send size={13} /></div>
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* Empty State */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', border: '2px dashed var(--border-subtle)', borderRadius: '12px', padding: '2rem' }}>
          <Share2 size={36} color="var(--text-muted)" style={{ opacity: 0.5 }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>No Publishing Packages Generated Yet</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '400px', textAlign: 'center', margin: 0 }}>
            Click below to generate platform-optimized packages for YouTube Shorts, Reels, TikTok, LinkedIn, and X with custom titles, hooks, and hashtags.
          </p>
          <button
            type="button"
            onClick={handleGeneratePackages}
            disabled={isGenerating}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent-primary)', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <Sparkles size={14} />
            <span>{isGenerating ? 'Packaging AI Assets...' : 'Generate Platform Packages'}</span>
          </button>
        </div>
      )}

      {/* ─── ACTION FOOTER CARD ─── */}
      {platformPackages.length > 0 && (
        <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              {selectedPlatformIds.size} of {platformPackages.length} platforms selected for distribution
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQueueSelected(false)}
              disabled={selectedPlatformIds.size === 0 || isQueueing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: '6px',
                padding: '7px 14px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: selectedPlatformIds.size === 0 || isQueueing ? 'not-allowed' : 'pointer'
              }}
            >
              <Clock size={14} />
              <span>{isQueueing ? 'Queueing...' : `Schedule Selected (${selectedPlatformIds.size})`}</span>
            </button>

            <button
              type="button"
              onClick={() => handleQueueSelected(true)}
              disabled={selectedPlatformIds.size === 0 || isQueueing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: selectedPlatformIds.size === 0 || isQueueing ? 'not-allowed' : 'pointer'
              }}
            >
              <Send size={14} />
              <span>Publish Now ({selectedPlatformIds.size})</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
