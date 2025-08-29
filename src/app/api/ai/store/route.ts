import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

type Body = {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  imageDataUrl: string; // data:image/... base64
  tags?: string[];
};

const AI_DIR = path.join(process.cwd(), 'public', 'ai');
const META_FILE = path.join(AI_DIR, 'images.json');

async function ensureDir() {
  try {
    await fs.mkdir(AI_DIR, { recursive: true });
  } catch {}
}

async function readMeta(): Promise<any[]> {
  try {
    const buf = await fs.readFile(META_FILE, 'utf-8');
    return JSON.parse(buf) as any[];
  } catch {
    return [];
  }
}

async function writeMeta(list: any[]) {
  await fs.writeFile(META_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

export async function POST(req: Request) {
  try {
    await ensureDir();
    const body = (await req.json()) as Body;
    const { id, name, category, difficulty, imageDataUrl, tags = [] } = body;
    if (!id || !imageDataUrl || !category || !difficulty || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const match = imageDataUrl.match(/^data:(image\/(?:png|jpeg|jpg|svg\+xml));base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid data URL' }, { status: 400 });
    }
    const mime = match[1];
    const b64 = match[2];
    const ext = mime.includes('svg') ? 'svg' : mime.includes('png') ? 'png' : 'jpg';
    const filename = `${id}.${ext}`;
    const filePath = path.join(AI_DIR, filename);

    await fs.writeFile(filePath, Buffer.from(b64, 'base64'));

    const publicUrl = `/ai/${filename}`;
    const metaList = await readMeta();

    // evitar duplicados por id
    const existingIndex = metaList.findIndex((m) => m.id === id);
    const record = {
      id,
      name,
      category,
      difficulty,
      imageUrl: publicUrl,
      thumbnailUrl: publicUrl,
      isAIGenerated: true,
      isApproved: true,
      createdAt: new Date().toISOString(),
      tags
    };
    if (existingIndex >= 0) metaList[existingIndex] = record; else metaList.push(record);

    // manter ordenado por data desc e limitar a 200
    metaList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const trimmed = metaList.slice(0, 200);
    await writeMeta(trimmed);

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', details: String(err?.message || err) }, { status: 500 });
  }
}


