import { PublishingPlatform } from '../types';
import { PublishingProvider } from './types';
import { MockPublishingProvider } from './mock-provider';

export * from './types';
export * from './mock-provider';

const mockProviderInstance = new MockPublishingProvider();

/**
 * Resolves the appropriate publishing provider for a given platform.
 * Defaults to MockSandboxProvider when no live OAuth credentials are configured.
 */
export function getPublishingProvider(platform: PublishingPlatform): PublishingProvider {
  // In future phases, check for live OAuth token in process.env / user session
  return mockProviderInstance;
}
