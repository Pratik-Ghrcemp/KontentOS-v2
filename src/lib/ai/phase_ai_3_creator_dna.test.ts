import { buildCreatorSystemPrompt, CreatorBrainContext } from './creator-dna';
import { generateJson } from './provider';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ PHASE AI-3 TEST FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PHASE AI-3 TEST PASSED: ${msg}`);
}

console.log('========================================================================');
console.log('--- PHASE AI-3: CREATOR BRAIN DNA PERSONALIZATION TEST SUITE ---');
console.log('========================================================================');

// 1. Test Base System Prompt without Profile
const basePrompt = 'You are a video editor.';
const untouchedPrompt = buildCreatorSystemPrompt(basePrompt);
assert(untouchedPrompt === basePrompt, 'Phase AI-3: Base system prompt is untouched when profile is undefined');

// 2. Test Creator Brain DNA Injection
const sampleProfile: CreatorBrainContext = {
  name: 'Aman Sharma',
  handle: '@amanshades',
  voiceArchetype: 'High-Energy Motivator',
  language: 'Hinglish (Hindi + English)',
  proNiche: 'Tech & Startups',
  proSubNiche: 'AI Tools',
  selectedVibe: 'Relatable Comedy & Skits',
  customCatchphrase: 'Bhai suno!',
  bannedWords: 'Synergy, Game-changer, Deep dive',
  hookFormula: 'Curiosity Gap ("Nobody is talking about...")'
};

const personalizedPrompt = buildCreatorSystemPrompt(basePrompt, sampleProfile);

assert(personalizedPrompt.includes('Aman Sharma'), 'Phase AI-3: Injected Creator Name');
assert(personalizedPrompt.includes('@amanshades'), 'Phase AI-3: Injected Creator Handle');
assert(personalizedPrompt.includes('High-Energy Motivator'), 'Phase AI-3: Injected Voice Archetype');
assert(personalizedPrompt.includes('Hinglish (Hindi + English)'), 'Phase AI-3: Injected Language & Dialect');
assert(personalizedPrompt.includes('Bhai suno!'), 'Phase AI-3: Injected Signature Catchphrase');
assert(personalizedPrompt.includes('Synergy, Game-changer, Deep dive'), 'Phase AI-3: Injected Strict Banned Words List');
assert(personalizedPrompt.includes('Curiosity Gap'), 'Phase AI-3: Injected Signature Hook Formula');

console.log('\n[Generated Personalized System Prompt Sample]:\n', personalizedPrompt);

// 3. Test generateJson execution with personalized prompt
async function testPersonalizedGeneration() {
  const userPrompt = 'Generate a 10s opening hook for video editing tools.';
  const res = await generateJson<{ hooks: string[] }>(userPrompt, personalizedPrompt);
  assert(typeof res === 'object', 'Phase AI-3: generateJson returned structured object with personalized prompt');
}

testPersonalizedGeneration().then(() => {
  console.log('\n========================================================================');
  console.log('🎉 ALL PHASE AI-3 CREATOR BRAIN DNA TESTS 100% PASSED! 🎉');
  console.log('========================================================================');
}).catch(err => {
  console.error('Fatal AI-3 Error:', err);
  process.exit(1);
});
