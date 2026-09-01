import { supabase, isSupabaseConfigured, isDemoMode } from '@/lib/supabase';
import { PlatformPackage, PublishingPlatform } from '@/lib/publishing/types';

export interface PublishingQueueInput {
  userId: string;
  projectId?: string;
  projectTitle: string;
  packages: PlatformPackage[];
}

export interface PublishingQueueResult {
  projectId: string;
  queuedCount: number;
  scheduledFor: string | null;
}

const PLATFORM_LABELS: Record<PublishingPlatform, string> = {
  youtube_shorts: 'YouTube Shorts',
  instagram_reels: 'Instagram Reels',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  twitter_x: 'X',
};

function normalizeScheduledAt(packages: PlatformPackage[]): string | null {
  const firstScheduled = packages.find(pkg => pkg.scheduledAt?.trim());
  if (!firstScheduled?.scheduledAt) return null;
  const date = new Date(firstScheduled.scheduledAt);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isUuid(value?: string): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}

export function buildPublishingQueueRecord(input: PublishingQueueInput) {
  const selectedPackages = input.packages.filter(pkg => pkg.status !== 'failed');
  const scheduledFor = normalizeScheduledAt(selectedPackages);
  const platformLabels = selectedPackages.map(pkg => PLATFORM_LABELS[pkg.platform] || pkg.platform);
  const queueProjectId = isUuid(input.projectId) ? input.projectId : crypto.randomUUID();

  const queuedRecord = {
    id: queueProjectId,
    user_id: input.userId,
    title: input.projectTitle || selectedPackages[0]?.title || 'Queued Studio Publish',
    status: scheduledFor ? 'scheduled' : 'queued',
    scheduled_for: scheduledFor,
    platforms_targeted: platformLabels,
    platform_preset: selectedPackages[0]?.aspectRatio === '16:9' ? 'youtube-landscape' : 'instagram-reels',
    settings: {
      publishingQueue: selectedPackages.map(pkg => ({
        ...pkg,
        status: scheduledFor ? 'scheduled' : 'ready',
        scheduledAt: pkg.scheduledAt || scheduledFor || undefined,
      })),
      queuedAt: new Date().toISOString(),
    },
  };

  return { queuedRecord, selectedPackages, scheduledFor, queueProjectId };
}

export async function enqueuePublishingPackages(input: PublishingQueueInput): Promise<PublishingQueueResult> {
  const { queuedRecord, selectedPackages, scheduledFor, queueProjectId } = buildPublishingQueueRecord(input);

  if (isDemoMode() || !isSupabaseConfigured()) {
    const raw = localStorage.getItem('kontentos_demo_publishing_queue');
    const queue = raw ? JSON.parse(raw) : [];
    localStorage.setItem('kontentos_demo_publishing_queue', JSON.stringify([queuedRecord, ...queue]));
    return { projectId: queueProjectId, queuedCount: selectedPackages.length, scheduledFor };
  }

  const { error } = await supabase.from('projects').upsert(queuedRecord);
  if (error) {
    throw new Error(`Failed to queue publishing package: ${error.message}`);
  }

  return { projectId: queueProjectId, queuedCount: selectedPackages.length, scheduledFor };
}

