export interface FillerWordInterval {
  id: string;
  word: string;
  start: number;
  end: number;
  duration: number;
  confidence: number;
  language: 'en' | 'hi' | 'hinglish' | 'auto';
  category: 'filler' | 'pause' | 'disfluency';
  segmentId?: string;
  enabled?: boolean;
}

export interface FillerDetectionOptions {
  languages?: ('en' | 'hi' | 'hinglish')[];
  customFillerWords?: string[];
  minConfidence?: number;
  includeContextWords?: boolean;
}

export const DEFAULT_ENGLISH_FILLERS = [
  'um',
  'uh',
  'er',
  'ah',
  'like',
  'you know',
  'i mean',
  'basically',
  'actually',
  'literally',
  'sort of',
  'kind of',
  'right',
  'so yeah'
];

export const DEFAULT_HINDI_FILLERS = [
  'मतलब',
  'मतलब की',
  'तो फिर',
  'अम्म्म',
  'अह',
  'यार',
  'वैसे',
  'dekho',
  'matlab',
  'matlab ki',
  'toh phir',
  'ummm',
  'uhhh',
  'yaar',
  'waise'
];

/**
 * Normalizes text for dictionary matching by stripping punctuation and lowercasing.
 */
export function normalizeToken(token: string): string {
  return token
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'–—]/g, '')
    .trim();
}

/**
 * Scans caption segments / words against filler dictionaries and extracts candidate cut intervals.
 */
export function detectFillerWords(
  segments: Array<{ id?: string; text?: string; content?: string; start_time?: number; end_time?: number; start?: number; end?: number; words?: Array<{ word: string; start: number; end: number; probability?: number }> }>,
  options: FillerDetectionOptions = {}
): FillerWordInterval[] {
  if (!segments || segments.length === 0) return [];

  const minConfidence = options.minConfidence ?? 0.6;
  const activeLangs = options.languages || ['en', 'hi', 'hinglish'];
  const fillerSet = new Set<string>();

  if (activeLangs.includes('en')) {
    DEFAULT_ENGLISH_FILLERS.forEach(w => fillerSet.add(normalizeToken(w)));
  }
  if (activeLangs.includes('hi') || activeLangs.includes('hinglish')) {
    DEFAULT_HINDI_FILLERS.forEach(w => fillerSet.add(normalizeToken(w)));
  }
  if (options.customFillerWords) {
    options.customFillerWords.forEach(w => fillerSet.add(normalizeToken(w)));
  }

  const results: FillerWordInterval[] = [];
  let candidateIndex = 1;

  for (const seg of segments) {
    const segStart = seg.start_time ?? seg.start ?? 0;
    const segEnd = seg.end_time ?? seg.end ?? (segStart + 2);
    const segText = (seg.text || seg.content || '').trim();

    // If word-level tokens exist
    if (seg.words && Array.isArray(seg.words) && seg.words.length > 0) {
      for (const w of seg.words) {
        const norm = normalizeToken(w.word);
        if (fillerSet.has(norm)) {
          const confidence = w.probability ?? 0.95;
          if (confidence >= minConfidence) {
            results.push({
              id: `filler-${candidateIndex++}`,
              word: w.word,
              start: Number(w.start.toFixed(3)),
              end: Number(w.end.toFixed(3)),
              duration: Number((w.end - w.start).toFixed(3)),
              confidence: Number(confidence.toFixed(2)),
              language: /[\u0900-\u097F]/.test(w.word) ? 'hi' : 'en',
              category: 'filler',
              segmentId: seg.id,
              enabled: true
            });
          }
        }
      }
    } else if (segText) {
      // Segment level n-gram word split heuristic
      const rawWords = segText.split(/\s+/).filter(Boolean);
      const segDuration = Math.max(0.1, segEnd - segStart);
      const estWordDuration = segDuration / Math.max(1, rawWords.length);

      let wIdx = 0;
      while (wIdx < rawWords.length) {
        let matched = false;

        // Try 3-word phrase
        if (wIdx + 2 < rawWords.length) {
          const triGram = `${normalizeToken(rawWords[wIdx])} ${normalizeToken(rawWords[wIdx + 1])} ${normalizeToken(rawWords[wIdx + 2])}`;
          if (fillerSet.has(triGram)) {
            const wordStart = segStart + (wIdx * estWordDuration);
            const wordEnd = wordStart + (3 * estWordDuration);
            results.push({
              id: `filler-${candidateIndex++}`,
              word: `${rawWords[wIdx]} ${rawWords[wIdx + 1]} ${rawWords[wIdx + 2]}`,
              start: Number(wordStart.toFixed(3)),
              end: Number(wordEnd.toFixed(3)),
              duration: Number((3 * estWordDuration).toFixed(3)),
              confidence: 0.9,
              language: /[\u0900-\u097F]/.test(triGram) ? 'hi' : 'en',
              category: 'filler',
              segmentId: seg.id,
              enabled: true
            });
            wIdx += 3;
            matched = true;
          }
        }

        // Try 2-word phrase
        if (!matched && wIdx + 1 < rawWords.length) {
          const biGram = `${normalizeToken(rawWords[wIdx])} ${normalizeToken(rawWords[wIdx + 1])}`;
          if (fillerSet.has(biGram)) {
            const wordStart = segStart + (wIdx * estWordDuration);
            const wordEnd = wordStart + (2 * estWordDuration);
            results.push({
              id: `filler-${candidateIndex++}`,
              word: `${rawWords[wIdx]} ${rawWords[wIdx + 1]}`,
              start: Number(wordStart.toFixed(3)),
              end: Number(wordEnd.toFixed(3)),
              duration: Number((2 * estWordDuration).toFixed(3)),
              confidence: 0.9,
              language: /[\u0900-\u097F]/.test(biGram) ? 'hi' : 'en',
              category: 'filler',
              segmentId: seg.id,
              enabled: true
            });
            wIdx += 2;
            matched = true;
          }
        }

        // Try single word
        if (!matched) {
          const singleWord = normalizeToken(rawWords[wIdx]);
          if (fillerSet.has(singleWord)) {
            const wordStart = segStart + (wIdx * estWordDuration);
            const wordEnd = wordStart + estWordDuration;
            results.push({
              id: `filler-${candidateIndex++}`,
              word: rawWords[wIdx],
              start: Number(wordStart.toFixed(3)),
              end: Number(wordEnd.toFixed(3)),
              duration: Number(estWordDuration.toFixed(3)),
              confidence: 0.85,
              language: /[\u0900-\u097F]/.test(singleWord) ? 'hi' : 'en',
              category: 'filler',
              segmentId: seg.id,
              enabled: true
            });
          }
          wIdx += 1;
        }
      }
    }
  }

  return results;
}
