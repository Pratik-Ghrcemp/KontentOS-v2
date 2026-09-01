import { ScriptInputRequest, StoryboardPlan, StoryboardBeat, StoryboardBeatRole, StoryboardTone } from './storyboard-types';
import { validateAndSanitizeStoryboard } from './storyboard-validator';
import { getOllamaStatus, generateOllamaStructured } from './ollama-client';

const WORDS_PER_SECOND_DEFAULT = 2.5; // ~150 WPM

/**
 * Keyword dictionaries for deterministic b-roll and visual intent mapping
 */
const BROLL_KEYWORDS_MAP: Record<string, string[]> = {
  hook: ['high energy', 'quick cut', 'dynamic camera move', 'close up face', 'attention grabbing'],
  problem: ['frustrated person', 'slow computer', 'overwhelmed desk', 'warning screen', 'complex workflow'],
  solution: ['seamless workflow', 'instant results', 'sleek software dashboard', 'happy user', 'clean setup'],
  proof: ['customer review', '5 star rating', 'analytics dashboard', 'success story', 'verified metrics'],
  call_to_action: ['pointing to link', 'subscribe animation', 'phone in hand', 'profile tap', 'action banner'],
  transition: ['whip pan', 'glitch effect', 'smooth zoom', 'light leak']
};

const THEMATIC_KEYWORDS_MAP: Record<string, string[]> = {
  ai: ['artificial intelligence', 'glowing neural network', 'futuristic ui', 'code on screen', 'modern workspace'],
  growth: ['rising charts', 'stock graphs', 'speedy progress', 'celebration', 'smiling creator'],
  money: ['revenue dashboard', 'digital currency', 'success metrics', 'green profit graphs'],
  creator: ['content creator studio', 'camera setup', 'microphone recording', 'video editing timeline'],
  business: ['modern office', 'team meeting', 'laptop typing', 'strategy board', 'executive handshake'],
  saas: ['cloud software', 'web application', 'api code', 'modern dashboard', 'tech setup']
};

/**
 * Deterministic topic-based outline generator when rawText is not provided
 */
function synthesizeScriptFromTopic(topic: string, tone: StoryboardTone, targetDuration: number): string[] {
  const cleanTopic = topic.trim();
  
  if (targetDuration <= 20) {
    return [
      `Stop scrolling if you want to master ${cleanTopic}!`,
      `Most people make the mistake of overcomplicating it, but here is the 1 trick that changes everything.`,
      `Apply this right now and save this reel for later!`
    ];
  }

  if (targetDuration <= 45) {
    return [
      `Here is the exact truth about ${cleanTopic} that nobody talks about.`,
      `The biggest problem creators face is wasting hours on manual repetition without seeing tangible results.`,
      `By structuring your workflow around automated smart systems, you eliminate 90% of the friction instantly.`,
      `Try this exact framework on your next project and comment below with your thoughts!`
    ];
  }

  return [
    `If you are trying to understand ${cleanTopic} in 2026, you need to hear this first.`,
    `Here is the fundamental issue: traditional approaches simply don't scale when speed and retention matter most.`,
    `Step one is identifying the core bottleneck in your creation process and replacing it with focused high-leverage assets.`,
    `Step two is deploying intelligent templates and rapid feedback loops to test variations in minutes instead of days.`,
    `The result is 10x faster output with uncompromising quality and maximum viewer engagement.`,
    `Follow for more deep dives on ${cleanTopic} and check the link in bio to get started today!`
  ];
}

/**
 * Deterministic offline storyboard generator
 */
export function generateDeterministicStoryboard(req: ScriptInputRequest): StoryboardPlan {
  const targetDuration = Math.max(10, Math.min(180, req.targetDuration || 30));
  const tone = req.tone || 'energetic';
  const formatPreset = req.formatPreset || 'instagram-reels';
  const wordsPerSecond = (req.wordsPerMinute || 150) / 60;

  let sentences: string[] = [];

  if (req.rawText && req.rawText.trim().length > 0) {
    sentences = req.rawText
      .split(/(?<=[.?!])\s+|\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  if (sentences.length === 0) {
    const topic = req.topic || 'High-Impact Content Creation';
    sentences = synthesizeScriptFromTopic(topic, tone, targetDuration);
  }

  // Calculate raw word counts and estimate duration per beat
  const beatCount = sentences.length;
  const rawDurations = sentences.map(s => {
    const wordCount = s.split(/\s+/).length;
    const dur = wordCount / wordsPerSecond;
    return Math.max(2.0, Math.min(15.0, Number(dur.toFixed(2))));
  });

  const sumRawDuration = rawDurations.reduce((acc, d) => acc + d, 0);
  const scalingFactor = sumRawDuration > 0 ? targetDuration / sumRawDuration : 1.0;

  const rawBeats: StoryboardBeat[] = [];
  let currentStart = 0;

  for (let i = 0; i < sentences.length; i++) {
    const text = sentences[i];
    let scaledDuration = Number((rawDurations[i] * scalingFactor).toFixed(2));
    if (scaledDuration < 1.0) scaledDuration = 1.0;

    let role: StoryboardBeatRole = 'solution';
    if (i === 0) role = 'hook';
    else if (i === 1 && beatCount > 2) role = 'problem';
    else if (i === beatCount - 1) role = 'call_to_action';
    else if (i === beatCount - 2 && beatCount > 3) role = 'proof';

    // Extract b-roll keywords
    const keywords: string[] = [...(BROLL_KEYWORDS_MAP[role] || ['dynamic scene', 'visual narrative'])];
    const textLower = text.toLowerCase();
    
    for (const [theme, kwList] of Object.entries(THEMATIC_KEYWORDS_MAP)) {
      if (textLower.includes(theme)) {
        keywords.push(...kwList);
      }
    }

    const brollKeywords = Array.from(new Set(keywords)).slice(0, 5);

    // Create headline callout
    const words = text.split(/\s+/);
    const suggestedHeadline = words.length > 5 ? words.slice(0, 4).join(' ').toUpperCase() + '...' : text.toUpperCase();

    const beat: StoryboardBeat = {
      id: `beat-${i + 1}-${Date.now().toString(36)}`,
      beatIndex: i,
      role,
      title: `${role.toUpperCase()}: Beat ${i + 1}`,
      spokenText: text,
      estimatedStartTime: Number(currentStart.toFixed(2)),
      estimatedDuration: scaledDuration,
      visualIntent: `Dynamic ${role} visual showcasing: ${brollKeywords.slice(0, 3).join(', ')}`,
      brollKeywords,
      suggestedHeadline,
      transitionType: i === 0 ? 'cut' : i % 2 === 0 ? 'zoom_in' : 'crossfade',
      soundCue: i === 0 ? 'whoosh_impact' : undefined,
      confidence: 90,
      isApproved: true
    };

    currentStart += scaledDuration;
    rawBeats.push(beat);
  }

  const rawPlan: Partial<StoryboardPlan> = {
    title: req.topic ? `${req.topic} Storyboard` : 'Script Storyboard Plan',
    topic: req.topic,
    targetDuration,
    tone,
    formatPreset,
    beats: rawBeats,
    provider: 'heuristic'
  };

  const validated = validateAndSanitizeStoryboard(rawPlan, targetDuration);
  return validated.sanitizedPlan;
}

/**
 * Main AI Storyboard Generator
 */
export async function generateStoryboard(req: ScriptInputRequest): Promise<StoryboardPlan> {
  const targetDuration = Math.max(10, Math.min(180, req.targetDuration || 30));

  if (req.preferredProvider === 'heuristic') {
    return generateDeterministicStoryboard(req);
  }

  const status = await getOllamaStatus(2000);
  if (!status.available) {
    console.log('[Storyboard Engine] Ollama offline. Using deterministic heuristic storyboard generator.');
    return generateDeterministicStoryboard(req);
  }

  const scriptOrTopic = req.rawText?.trim() 
    ? `SCRIPT:\n"""\n${req.rawText}\n"""`
    : `TOPIC: "${req.topic || 'Creating engaging short-form video'}"`;

  const prompt = `You are an expert video director and storyboard architect for short-form social media (TikTok, Reels, Shorts).
Analyze the following input and generate a structured scene-by-scene storyboard plan.

${scriptOrTopic}

TARGET DURATION: ${targetDuration} seconds
TONE: ${req.tone || 'energetic'}
FORMAT: ${req.formatPreset || 'instagram-reels'}

Strict Output Requirements:
1. Return ONLY a valid JSON object matching this schema without markdown or conversational commentary.
2. JSON structure:
{
  "title": "Short Catchy Video Title",
  "beats": [
    {
      "role": "hook" | "problem" | "solution" | "proof" | "call_to_action",
      "title": "Scene summary",
      "spokenText": "Exact voiceover or spoken dialogue for this beat",
      "estimatedDuration": number (in seconds),
      "visualIntent": "Visual description of camera angle, action, and b-roll",
      "brollKeywords": ["keyword1", "keyword2", "keyword3"],
      "suggestedHeadline": "PUNCHY 3-5 WORD ON-SCREEN TEXT",
      "transitionType": "cut" | "crossfade" | "zoom_in" | "slide_left",
      "soundCue": "whoosh" | "pop" | "riser" | "hit"
    }
  ]
}
3. The sum of estimatedDuration across all beats should closely approximate ${targetDuration} seconds.`;

  try {
    const result = await generateOllamaStructured<any>(prompt, {
      model: req.model || status.selectedModel || 'llama3.2',
      temperature: 0.4
    });

    if (!result.success || !result.data || !Array.isArray(result.data.beats) || result.data.beats.length === 0) {
      throw new Error(result.error || 'Ollama returned invalid storyboard beats array.');
    }

    const rawPlan: Partial<StoryboardPlan> = {
      title: result.data.title || req.topic || 'AI Storyboard Plan',
      topic: req.topic,
      targetDuration,
      tone: req.tone || 'energetic',
      formatPreset: req.formatPreset || 'instagram-reels',
      beats: result.data.beats,
      provider: 'ollama'
    };

    const validation = validateAndSanitizeStoryboard(rawPlan, targetDuration);
    if (validation.isValid) {
      return validation.sanitizedPlan;
    }
    console.warn('[Storyboard Engine] Ollama output validation rejected, falling back to heuristic:', validation.rejections);
    return generateDeterministicStoryboard(req);
  } catch (err: any) {
    console.warn('[Storyboard Engine] Ollama storyboard generation failed, falling back to heuristic:', err?.message);
    return generateDeterministicStoryboard(req);
  }
}

