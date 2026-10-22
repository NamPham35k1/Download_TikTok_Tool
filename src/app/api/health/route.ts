import { NextResponse } from 'next/server';
import { getActiveProvider } from '@/lib/providers/selected-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const provider = getActiveProvider();
  let providerHealth: { healthy: boolean; message: string };

  try {
    providerHealth = await provider.checkHealth();
  } catch (err: unknown) {
    providerHealth = {
      healthy: false,
      message: `Health check failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const payload = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    application: {
      name: 'Nam IT TikTok Tool',
      version: '1.0.0',
      runtime: 'Node.js',
    },
    provider: {
      name: provider.name,
      healthy: providerHealth.healthy,
      statusMessage: providerHealth.message,
      capabilities: provider.capabilities,
    },
  };

  return NextResponse.json(payload, {
    status: providerHealth.healthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
