import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { withAuth } from '@/lib/auth-helpers';
import { MAX_UPLOAD_SIZE, ACCEPTED_IMAGE_TYPES } from '@/lib/constants';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  return withAuth(async () => {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Accepted: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    const ext = extname((file as File).name || '').toLowerCase() || '.jpg';
    const filename = `${nanoid()}${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadPath = join(process.cwd(), 'public', 'uploads', filename);
    await writeFile(uploadPath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  });
}
