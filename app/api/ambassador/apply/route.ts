import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fullName = formData.get('fullName') as string;
    const role = formData.get('role') as string || 'Ambassadeur';
    const phoneNumber = formData.get('phoneNumber') as string;
    const photo = formData.get('photo') as File;

    if (!fullName || !phoneNumber || !photo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure the public/uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Handle file upload
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique filename and slug
    const fileExtension = photo.name.split('.').pop() || 'jpg';
    const uniqueId = Math.floor(1000 + Math.random() * 9000).toString(); // e.g. 1234
    const baseSlug = fullName.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const slug = `${baseSlug}-${uniqueId}`;
    const fileName = `${slug}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);
    
    // Save file
    await writeFile(filePath, buffer);
    const photoUrl = `/uploads/${fileName}`;

    // Save to database
    await prisma.ambassador.create({
      data: {
        fullName,
        role,
        phoneNumber,
        photoUrl,
        slug,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ambassador application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
