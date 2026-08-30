export interface CreatorBrainContext {
  name?: string;
  handle?: string;
  mode?: 'viral' | 'pro';
  selectedVibe?: string;
  proNiche?: string;
  proSubNiche?: string;
  language?: string;
  voiceArchetype?: string;
  hookFormula?: string;
  customCatchphrase?: string;
  bannedWords?: string;
}

/**
 * Injects the Creator's unique signature DNA into AI LLM system prompts.
 * Transforms generic ChatGPT responses into tailored creator intelligence.
 */
export function buildCreatorSystemPrompt(
  baseSystemPrompt: string,
  profile?: CreatorBrainContext
): string {
  if (!profile) return baseSystemPrompt;

  const instructions: string[] = [];

  if (profile.name || profile.handle) {
    instructions.push(`Creator Persona: ${profile.name || 'Creator'} (${profile.handle || '@creator'})`);
  }

  if (profile.voiceArchetype) {
    instructions.push(`Voice Archetype: ${profile.voiceArchetype}. Write with this exact personality.`);
  }

  if (profile.language) {
    instructions.push(`Primary Language & Dialect: ${profile.language}. Use authentic colloquial phrasing matching this language preference.`);
  }

  if (profile.proNiche || profile.proSubNiche) {
    instructions.push(`Niche Authority: ${profile.proNiche || 'Content Creation'} (${profile.proSubNiche || 'Short-Form Video'}).`);
  }

  if (profile.selectedVibe) {
    instructions.push(`Content Style & Vibe: ${profile.selectedVibe}.`);
  }

  if (profile.customCatchphrase) {
    instructions.push(`Signature Catchphrase: Naturally weave in or echo "${profile.customCatchphrase}" when contextually appropriate.`);
  }

  if (profile.bannedWords) {
    instructions.push(`STRICT BANNED WORDS: Never use any of these words/clichés: [${profile.bannedWords}].`);
  }

  if (profile.hookFormula) {
    instructions.push(`Signature Hook Formula Pattern: ${profile.hookFormula}.`);
  }

  if (instructions.length === 0) return baseSystemPrompt;

  return `${baseSystemPrompt}\n\n=== CREATOR BRAIN DNA & STYLE GUIDELINES ===\n${instructions.join('\n')}`;
}
