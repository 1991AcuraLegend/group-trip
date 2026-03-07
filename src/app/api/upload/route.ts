import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { withAuth } from '@/lib/auth-helpers';
import { MAX_UPLOAD_SIZE, ACCEPTED_IMAGE_TYPES } from '@/lib/constants';
import { rateLimit } from '@/lib/rate-limit';
import { nanoid } from 'nanoid';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function matchesMagicBytes(fileType: string, buffer: Buffer) {
  if (fileType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (fileType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  if (fileType === 'image/webp') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  return false;
}

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request, 'upload');
  if (blocked) {
    return blocked;
  }

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!matchesMagicBytes(file.type, buffer)) {
      return NextResponse.json(
        { error: 'File content does not match its declared type' },
        { status: 400 }
      );
    }

    const ext = MIME_TO_EXT[file.type] || '.jpg';
    const filename = `${nanoid()}${ext}`;

    const uploadPath = join(process.cwd(), 'public', 'uploads', filename);
    await writeFile(uploadPath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  });
}
