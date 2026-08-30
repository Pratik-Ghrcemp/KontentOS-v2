import OpenAI, { toFile } from 'openai';

// Factory to get the correct OpenAI instance (Standard vs Azure)
export function getOpenAIClient(): OpenAI | null {
  const openAiKey = process.env.OPENAI_API_KEY;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;

  if (azureKey && azureEndpoint) {
    return new OpenAI({
      apiKey: azureKey,
      baseURL: `${azureEndpoint.replace(/\/$/, '')}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini'}`,
      defaultQuery: { 'api-version': '2024-02-15-preview' },
      defaultHeaders: { 'api-key': azureKey }
    });
  }

  if (openAiKey) {
    return new OpenAI({
      apiKey: openAiKey
    });
  }

  return null;
}

export const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

/**
 * Helper to generate structured JSON from OpenAI
 */
export async function generateJson<T>(
  prompt: string,
  systemPrompt: string = 'You are a helpful AI assistant. Output valid JSON only.',
): Promise<{ data: T | null; isMock: boolean }> {
  const client = getOpenAIClient();

  // Fallback to mock if no keys are provided
  if (!client) {
    return { data: null, isMock: true };
  }

  try {
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content from OpenAI');

    const parsed = JSON.parse(content) as T;
    return { data: parsed, isMock: false };
  } catch (error) {
    console.error('AI Generation Error:', error);
    // If it fails (e.g. rate limit), return mock flag so the caller can fallback
    return { data: null, isMock: true };
  }
}

export interface WhisperSegment {
  text: string;
  start_time: number;
  end_time: number;
}

/**
 * Real Speech-to-Text Transcription using OpenAI Whisper API
 */
export async function transcribeAudioBuffer(
  buffer: Buffer,
  filename: string = 'audio.mp4',
  language?: string,
  prompt?: string
): Promise<{ segments: WhisperSegment[]; text: string; isMock: boolean }> {
  const client = getOpenAIClient();
  if (!client) {
    return { segments: [], text: '', isMock: true };
  }

  try {
    const file = await toFile(buffer, filename);
    const transcription: any = await client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
      language,
      prompt
    });

    const segments: WhisperSegment[] = (transcription.segments || []).map((s: any) => ({
      text: String(s.text || '').trim(),
      start_time: Number(s.start || 0),
      end_time: Number(s.end || 0)
    }));

    return {
      segments,
      text: String(transcription.text || ''),
      isMock: false
    };
  } catch (error) {
    console.error('Whisper Transcription Error:', error);
    return { segments: [], text: '', isMock: true };
  }
}

