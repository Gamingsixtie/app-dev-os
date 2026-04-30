import Anthropic from '@anthropic-ai/sdk';

let anthropic: Anthropic | null = null;

function getAnthropic() {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

export async function GET(): Promise<Response> {
  const startTime = Date.now();
  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });

    const duration = Date.now() - startTime;
    console.log(`[ai-analysis/health] [ok] [${duration}ms]`);

    return Response.json({
      status: 'ok',
      model: response.model,
      duration_ms: duration,
      region: process.env.VERCEL_REGION || 'unknown',
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[ai-analysis/health] [error] [${duration}ms]`, err);

    return Response.json(
      {
        status: 'error',
        error: String(err),
        duration_ms: duration,
        region: process.env.VERCEL_REGION || 'unknown',
      },
      { status: 503 },
    );
  }
}
