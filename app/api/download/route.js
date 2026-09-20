import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const audioUrl = searchParams.get('url');
    const rawTitle = searchParams.get('title') || 'monstah-track';
    const safeTitle = rawTitle.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || 'monstah-track';
    const filename = `${safeTitle}.mp3`;

    if (!audioUrl) {
      return NextResponse.json({ error: 'Audio URL is required' }, { status: 400 });
    }

    // 1. Data URI (Base64 audio)
    if (audioUrl.startsWith('data:')) {
      const base64Data = audioUrl.split(',')[1];
      if (!base64Data) {
        return NextResponse.json({ error: 'Invalid data URI' }, { status: 400 });
      }
      const buffer = Buffer.from(base64Data, 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'no-cache',
        },
      });
    }

    // 2. Local relative URL (e.g. /demo-audio/synthwave.mp3)
    if (audioUrl.startsWith('/')) {
      const localFilePath = path.join(process.cwd(), 'public', audioUrl);
      if (fs.existsSync(localFilePath)) {
        const fileBuffer = fs.readFileSync(localFilePath);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    // 3. Remote URL (e.g. Replicate CDN, external MP3)
    let fetchUrl = audioUrl;
    if (audioUrl.startsWith('/')) {
      const origin = request.headers.get('host') ? `http://${request.headers.get('host')}` : 'http://localhost:3000';
      fetchUrl = `${origin}${audioUrl}`;
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch audio stream (status ${res.status})` },
        { status: res.status }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Download Proxy Error:', err);
    return NextResponse.json({ error: err.message || 'Download failed' }, { status: 500 });
  }
}
