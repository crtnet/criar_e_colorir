import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const AI_DIR = path.join(process.cwd(), 'public', 'ai');
const META_FILE = path.join(AI_DIR, 'images.json');

export async function GET() {
  try {
    let list: any[] = [];
    try {
      const buf = await fs.readFile(META_FILE, 'utf-8');
      list = JSON.parse(buf) as any[];
    } catch {
      list = [];
    }
    // garantir estrutura esperada
    return NextResponse.json({ images: list });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', details: String(err?.message || err) }, { status: 500 });
  }
}


