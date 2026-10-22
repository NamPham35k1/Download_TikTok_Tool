import { ProviderFactory } from './provider-factory';
import { TikTokMediaProvider } from './types';

// Singleton instance of the active provider
export const activeProvider: TikTokMediaProvider = ProviderFactory.createProvider();

export function getActiveProvider(): TikTokMediaProvider {
  return activeProvider;
}
