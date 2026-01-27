import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get the first (and should be only) school info record
    const sekolahInfo = await prisma.sekolahInfo.findFirst();
    
    return NextResponse.json({
      success: true,
      data: sekolahInfo,
    });
  } catch (error) {
    console.error('Error fetching sekolah info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sekolah info' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if school info already exists
    const existing = await prisma.sekolahInfo.findFirst();
    
    if (existing) {
      // Update existing record
      const updated = await prisma.sekolahInfo.update({
        where: { id: existing.id },
        data: body,
      });
      
      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Informasi sekolah berhasil diperbarui',
      });
    } else {
      // Create new record
      const created = await prisma.sekolahInfo.create({
        data: body,
      });
      
      return NextResponse.json({
        success: true,
        data: created,
        message: 'Informasi sekolah berhasil ditambahkan',
      });
    }
  } catch (error) {
    console.error('Error saving sekolah info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save sekolah info' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const updated = await prisma.sekolahInfo.update({
      where: { id },
      data,
    });
    
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Informasi sekolah berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updating sekolah info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update sekolah info' },
      { status: 500 }
    );
  }
}
