import { TikTokMediaProvider, ProviderConfig } from './types';
import { TikWmProvider } from './tikwm-provider';
import { RapidApiTikTokProvider } from './rapidapi-provider';

export type ProviderType = 'tikwm' | 'rapidapi';

export class ProviderFactory {
  public static createProvider(type?: ProviderType, config?: ProviderConfig): TikTokMediaProvider {
    const selectedType = type || (process.env.TIKTOK_PROVIDER_TYPE as ProviderType) || 'tikwm';

    switch (selectedType) {
      case 'rapidapi':
        return new RapidApiTikTokProvider(config);
      case 'tikwm':
      default:
        return new TikWmProvider(config);
    }
  }
}
