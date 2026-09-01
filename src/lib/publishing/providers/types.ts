import { PlatformPackage, PublishResult, ValidationResult } from '../types';

export interface PublishingProvider {
  name: string;
  isMock: boolean;
  validate(pkg: PlatformPackage, mediaPath: string): Promise<ValidationResult>;
  publish(pkg: PlatformPackage, mediaPath: string): Promise<PublishResult>;
  checkStatus?(postId: string): Promise<{ status: string; url?: string }>;
}
