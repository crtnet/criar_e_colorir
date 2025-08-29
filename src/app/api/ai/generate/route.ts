import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { prompt, size } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    // Normalizar tamanho para valores aceitos pela OpenAI
    const allowedSizes = new Set(['256x256', '512x512', '1024x1024']);
    const normalizedSize = allowedSizes.has(size) ? size : '1024x1024';

    const body = {
      model: 'gpt-image-1',
      prompt: `${prompt}\nblack and white outline only, no shading, for coloring book`,
      size: normalizedSize,
      n: 1,
      response_format: 'b64_json'
    } as any;

    const doRequest = async (model: string) => fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...body, model })
    });

    let response = await doRequest('gpt-image-1');
    if (!response.ok) {
      // Tentar fallback para DALL·E 3
      response = await doRequest('dall-e-3');
    }

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: 'OpenAI error', details: errorText }, { status: 502 });
    }

    const data = await response.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: 'Empty image data' }, { status: 502 });
    }

    const url = `data:image/png;base64,${b64}`;
    return NextResponse.json({ url });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', details: String(err?.message || err) }, { status: 500 });
  }
}


