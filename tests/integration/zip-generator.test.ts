import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { sanitizeFilename } from '@/lib/security/url-validator';

describe('ZIP Generation Integration Test', () => {
  it('packages multiple photos in ordered sequence with proper filenames', async () => {
    const zip = new JSZip();

    // Mock 3 photo items with dummy image buffer content
    const mockPhotos = [
      { filename: 'tiktok-photo-01.jpg', content: Buffer.from('FAKE_JPEG_IMAGE_1_DATA') },
      { filename: 'tiktok-photo-02.jpg', content: Buffer.from('FAKE_JPEG_IMAGE_2_DATA') },
      { filename: 'tiktok-photo-03.jpg', content: Buffer.from('FAKE_JPEG_IMAGE_3_DATA') },
    ];

    mockPhotos.forEach((item, idx) => {
      const paddedIdx = String(idx + 1).padStart(2, '0');
      const safeName = sanitizeFilename(item.filename, `tiktok-photo-${paddedIdx}.jpg`);
      zip.file(safeName, item.content);
    });

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    expect(zipBuffer).toBeInstanceOf(Buffer);
    expect(zipBuffer.length).toBeGreaterThan(0);

    // Unpack generated ZIP to verify contents and order
    const unpacked = await JSZip.loadAsync(zipBuffer);
    const filenames = Object.keys(unpacked.files);

    expect(filenames).toEqual([
      'tiktok-photo-01.jpg',
      'tiktok-photo-02.jpg',
      'tiktok-photo-03.jpg',
    ]);

    // Verify content of first file
    const file1Content = await unpacked.file('tiktok-photo-01.jpg')?.async('string');
    expect(file1Content).toBe('FAKE_JPEG_IMAGE_1_DATA');
  });
});
