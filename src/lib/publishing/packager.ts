import {
  PublishingPlatform,
  PlatformPackage,
  PackagingInput,
} from './types';
import { PLATFORM_CONSTRAINTS, validatePlatformPackage } from './platform-constraints';

/**
 * Pure helper function to generate tailored platform packages from creation artifacts.
 */
export async function generatePlatformPackages(input: PackagingInput): Promise<PlatformPackage[]> {
  const targetPlatforms: PublishingPlatform[] = input.targetPlatforms || [
    'youtube_shorts',
    'instagram_reels',
    'tiktok',
    'linkedin',
    'twitter_x',
  ];

  const storyboardTitle = input.storyboard?.title || 'High Impact Creator Video';
  const firstBeat = input.storyboard?.beats?.[0];
  const hookLine = firstBeat?.voiceoverLine || firstBeat?.title || storyboardTitle;
  const niche = input.creatorProfile?.niche || 'Content Creation';
  const tone = input.creatorProfile?.brandTone || 'energetic';
  const creatorHandle = input.creatorProfile?.handle ? `@${input.creatorProfile.handle.replace('@', '')}` : '';

  const packages: PlatformPackage[] = [];

  for (const platform of targetPlatforms) {
    const pkg = formatPackageForPlatform({
      platform,
      storyboardTitle,
      hookLine,
      beats: input.storyboard?.beats || [],
      transcript: input.transcript || '',
      niche,
      tone,
      creatorHandle,
      durationSeconds: input.renderResult.durationSeconds,
      aspectRatio: input.renderResult.aspectRatio,
    });

    // Validate package against platform rules
    const validation = validatePlatformPackage(pkg, input.renderResult.durationSeconds);
    if (!validation.valid) {
      console.warn(`[Packager] Validation warning for ${platform}:`, validation.errors);
    }

    packages.push(pkg);
  }

  return packages;
}

interface FormatContext {
  platform: PublishingPlatform;
  storyboardTitle: string;
  hookLine: string;
  beats: Array<{ title: string; voiceoverLine?: string }>;
  transcript: string;
  niche: string;
  tone: string;
  creatorHandle: string;
  durationSeconds: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
}

function formatPackageForPlatform(ctx: FormatContext): PlatformPackage {
  const { platform, storyboardTitle, hookLine, beats, niche, creatorHandle, durationSeconds, aspectRatio } = ctx;
  const constraints = PLATFORM_CONSTRAINTS[platform];
  const cleanNiche = niche.replace(/[^a-zA-Z0-9]/g, '');

  let title = '';
  let description = '';
  let hashtags: string[] = [];
  const thumbnailTimestamp = Math.min(1.0, Math.max(0.5, durationSeconds * 0.15));

  switch (platform) {
    case 'youtube_shorts': {
      // YouTube Shorts: High-CTR hook title (under 100 chars), #Shorts in title, SEO description
      const baseTitle = `${hookLine.slice(0, 75)} ⚡ #Shorts`;
      title = baseTitle.length > constraints.maxTitleLength ? baseTitle.slice(0, constraints.maxTitleLength) : baseTitle;
      
      const takeawayPoints = beats.slice(1).map((b, i) => `${i + 1}. ${b.title}`).join('\n');
      description = `🔥 In this video: ${storyboardTitle}\n\nKey Takeaways:\n${takeawayPoints || 'Watch the full breakdown!'}\n\n👉 Subscribe for daily ${niche} frameworks.\n${creatorHandle ? `Connect: ${creatorHandle}` : ''}`;
      hashtags = ['#Shorts', `#${cleanNiche}`, '#ViralVideo', '#CreatorEconomy'];
      break;
    }

    case 'instagram_reels': {
      // Instagram Reels: No separate title. Caption line 1 is hook, followed by value bullets and hashtags
      title = '';
      const bullets = beats.map(b => `✨ ${b.title}: ${b.voiceoverLine || ''}`).filter(Boolean).join('\n');
      description = `${hookLine.toUpperCase()} 👇\n\nHere is how to master this:\n\n${bullets || 'Follow along with the step-by-step breakdown!'}\n\n💬 Drop a comment below with your thoughts.\n📌 Save this Reel so you don't lose it!`;
      hashtags = [`#${cleanNiche}`, '#reelsinstagram', '#contentcreation', '#videomarketing', '#creators'];
      break;
    }

    case 'tiktok': {
      // TikTok: Punchy conversational caption, high-energy viral tags
      title = '';
      description = `Wait till the end... ${hookLine} 🔥 What do you think about this? Let me know in the comments!`;
      hashtags = ['#FYP', '#ForYou', `#${cleanNiche}`, '#viral', '#creatorTips'];
      break;
    }

    case 'linkedin': {
      // LinkedIn: Executive thought-leadership format, structured insights, professional hashtags
      title = `${storyboardTitle}: Strategic Framework for ${niche}`;
      const insightSteps = beats.map((b, i) => `Step ${i + 1}: ${b.title}\n→ ${b.voiceoverLine || 'Execute with focused intent.'}`).join('\n\n');
      description = `The biggest bottleneck in ${niche.toLowerCase()} is execution speed.\n\nHere is a 3-step breakdown to streamline your workflow:\n\n${insightSteps}\n\nWhat is your team's approach to this? Let's discuss in the comments.\n\n${creatorHandle ? `Follow ${creatorHandle} for more.` : ''}`;
      hashtags = [`#${cleanNiche}`, '#Leadership', '#Productivity', '#Innovation'];
      break;
    }

    case 'twitter_x': {
      // X (Twitter): 280 char max hook + teaser
      title = '';
      const tweetBody = `${hookLine.slice(0, 180)} 🧵\n\nFull breakdown below 👇`;
      description = tweetBody.length > 240 ? tweetBody.slice(0, 240) : tweetBody;
      hashtags = [`#${cleanNiche}`, '#BuildInPublic'];
      break;
    }
  }

  // Enforce description length constraints
  if (description.length > constraints.maxDescriptionLength) {
    description = description.slice(0, constraints.maxDescriptionLength - 3) + '...';
  }

  // Format hashtags properly
  const cleanHashtags = hashtags
    .map(h => (h.startsWith('#') ? h : `#${h}`))
    .slice(0, constraints.maxHashtags);

  return {
    id: `pkg-${platform}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    platform,
    title,
    description,
    hashtags: cleanHashtags,
    thumbnailTimestamp,
    aspectRatio: constraints.supportedAspectRatios.includes(aspectRatio)
      ? aspectRatio
      : constraints.supportedAspectRatios[0],
    status: 'ready',
    metadata: {
      characterCount: (title ? title.length + 1 : 0) + description.length,
      hashtagCount: cleanHashtags.length,
      generatedByAi: true,
    },
  };
}
