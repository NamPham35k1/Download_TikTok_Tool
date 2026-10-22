import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TikWmProvider } from '@/lib/providers/tikwm-provider';

describe('TikWmProvider Normalization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes a video response into clean video variants with HD and without watermark', async () => {
    const mockApiResponse = {
      code: 0,
      msg: 'success',
      data: {
        id: '7106594312292453675',
        title: 'Check out this awesome video! #tiktok',
        cover: 'https://p16-sign.tiktokcdn-us.com/cover.jpg',
        duration: 25,
        play: 'https://v16m.tiktokcdn-us.com/clean-sd.mp4',
        hdplay: 'https://v16m.tiktokcdn-us.com/clean-hd.mp4',
        wmplay: 'https://v16m.tiktokcdn-us.com/watermarked.mp4',
        size: 1048576,
        hd_size: 2097152,
        wm_size: 1100000,
        music: 'https://sf16-ies-music.tiktokcdn.com/audio.mp3',
        music_info: {
          id: '123456',
          title: 'Trending Beat',
          author: 'Music Artist',
          duration: 25,
        },
        author: {
          id: '998877',
          unique_id: 'tiktok_star',
          nickname: 'TikTok Star',
          avatar: 'https://p16-sign.tiktokcdn-us.com/avatar.jpg',
        },
        play_count: 50000,
        digg_count: 3500,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const provider = new TikWmProvider();
    const result = await provider.resolveUrl('https://www.tiktok.com/@tiktok_star/video/7106594312292453675');

    expect(result.contentType).toBe('video');
    expect(result.id).toBe('7106594312292453675');
    expect(result.title).toBe('Check out this awesome video! #tiktok');
    expect(result.author?.nickname).toBe('TikTok Star');
    expect(result.author?.uniqueId).toBe('tiktok_star');

    // Video Variants Verification
    expect(result.videoVariants.length).toBe(3);

    const hdVariant = result.videoVariants.find((v) => v.id === 'no_watermark_hd');
    expect(hdVariant).toBeDefined();
    expect(hdVariant?.hasWatermark).toBe(false);
    expect(hdVariant?.downloadUrl).toBe('https://v16m.tiktokcdn-us.com/clean-hd.mp4');
    expect(hdVariant?.fileSizeBytes).toBe(2097152);

    const sdVariant = result.videoVariants.find((v) => v.id === 'no_watermark');
    expect(sdVariant).toBeDefined();
    expect(sdVariant?.hasWatermark).toBe(false);

    const wmVariant = result.videoVariants.find((v) => v.id === 'watermarked');
    expect(wmVariant).toBeDefined();
    expect(wmVariant?.hasWatermark).toBe(true);

    // Audio Track Verification
    expect(result.music?.title).toBe('Trending Beat');
    expect(result.music?.playUrl).toBe('https://sf16-ies-music.tiktokcdn.com/audio.mp3');

    // Photos should be empty for a pure video
    expect(result.photos.length).toBe(0);
  });

  it('normalizes a photo carousel post into ordered photo items with sequential filenames', async () => {
    const mockApiResponse = {
      code: 0,
      msg: 'success',
      data: {
        id: '7238192837482910293',
        title: 'My summer trip photo dump 🏖️',
        cover: 'https://p16-sign.tiktokcdn-us.com/cover.jpg',
        images: [
          'https://p16-sign-useast2a.tiktokcdn.com/slide_1.jpeg',
          'https://p16-sign-useast2a.tiktokcdn.com/slide_2.jpeg',
          'https://p16-sign-useast2a.tiktokcdn.com/slide_3.jpeg',
        ],
        author: {
          unique_id: 'traveler',
          nickname: 'Travel Lover',
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const provider = new TikWmProvider();
    const result = await provider.resolveUrl('https://www.tiktok.com/@traveler/video/7238192837482910293');

    expect(result.contentType).toBe('slideshow');
    expect(result.photos.length).toBe(3);

    // Verify ordering and filenames
    expect(result.photos[0].index).toBe(1);
    expect(result.photos[0].filename).toBe('tiktok-photo-01.jpg');
    expect(result.photos[0].imageUrl).toBe('https://p16-sign-useast2a.tiktokcdn.com/slide_1.jpeg');

    expect(result.photos[1].index).toBe(2);
    expect(result.photos[1].filename).toBe('tiktok-photo-02.jpg');

    expect(result.photos[2].index).toBe(3);
    expect(result.photos[2].filename).toBe('tiktok-photo-03.jpg');
  });

  it('throws an informative error when provider reports non-zero status code', async () => {
    const mockErrorResponse = {
      code: -1,
      msg: 'Url parsing is failed! Please check url.',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockErrorResponse,
    } as Response);

    const provider = new TikWmProvider();
    await expect(
      provider.resolveUrl('https://www.tiktok.com/@invalid/video/9999999999999999999')
    ).rejects.toThrow(/Could not find or resolve this TikTok post/);
  });
});
