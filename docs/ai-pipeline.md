# KontentOS AI Pipeline

This document outlines the AI integration for KontentOS Raw Studio features like caption generation, hooks, rewrites, and repurposing.

## Current Implementation
- KontentOS uses the **OpenAI SDK** via the **Chat Completions API** with strict JSON mode enabled.
- The API is safely abstracted behind Next.js server-side API routes (\`/api/ai/*\`).
- No API keys are exposed to the client.
- We support both **OpenAI** and **Azure OpenAI** environments.

## Demo / Mock Fallback
To ensure a smooth developer experience without requiring paid API keys, the system includes a seamless mock fallback:
- If \`AI_PROVIDER=mock\` or if no valid keys are found, the provider returns \`{ isMock: true }\`.
- The server route detects this and responds with typed fallback JSON.
- The frontend continues to function normally.

## Supported Endpoints
- \`POST /api/ai/captions\` - AI caption segments synced to duration
- \`POST /api/ai/hooks\` - 3 catchy video hooks
- \`POST /api/ai/hashtags\` - Platform-specific hashtags
- \`POST /api/ai/ctas\` - Call to action suggestions
- \`POST /api/ai/rewrite-caption\` - Tone-based string manipulation
- \`POST /api/ai/repurpose\` - Multi-platform idea generation
- \`GET /api/ai/status\` - Safe configuration status check

## Future Improvements
- **OpenAI Responses API:** Migrate from Chat Completions with JSON mode to the newer Responses API for guaranteed schema adherence once all prompt models are aligned.
