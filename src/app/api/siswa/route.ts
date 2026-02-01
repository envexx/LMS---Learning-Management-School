import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { includes } from '@/lib/query-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get('kelas');
    
    const siswa = await prisma.siswa.findMany({
      where: kelasId && kelasId !== 'all' ? { kelasId } : undefined,
      select: {
        id: true,
        nisn: true,
        nis: true,
        nama: true,
        email: true,
        kelasId: true,
        jenisKelamin: true,
        tanggalLahir: true,
        alamat: true,
        noTelp: true,
        namaWali: true,
        noTelpWali: true,
        foto: true,
        kelas: {
          select: {
            id: true,
            nama: true,
            tingkat: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: { nama: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      data: siswa,
    });
  } catch (error) {
    console.error('Error fetching siswa:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch siswa' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Convert tanggalLahir from date string to DateTime if provided
    const data = { ...body };
    if (data.tanggalLahir) {
      if (typeof data.tanggalLahir === 'string') {
        // If it's just a date (YYYY-MM-DD), convert to DateTime
        if (data.tanggalLahir.match(/^\d{4}-\d{2}-\d{2}$/)) {
          data.tanggalLahir = new Date(data.tanggalLahir + 'T00:00:00.000Z');
        } else if (data.tanggalLahir) {
          // Try to parse as ISO string
          const parsedDate = new Date(data.tanggalLahir);
          if (!isNaN(parsedDate.getTime())) {
            data.tanggalLahir = parsedDate;
          }
        }
      }
      // If it's already a Date object, keep it as is
    }
    
    const newSiswa = await prisma.siswa.create({
      data,
      include: includes.siswaWithRelations,
    });
    
    return NextResponse.json({
      success: true,
      data: newSiswa,
      message: 'Siswa berhasil ditambahkan',
    });
  } catch (error: any) {
    console.error('Error creating siswa:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to create siswa',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
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
    
    // Convert tanggalLahir from date string to DateTime if provided
    if (data.tanggalLahir) {
      if (typeof data.tanggalLahir === 'string') {
        // If it's just a date (YYYY-MM-DD), convert to DateTime
        if (data.tanggalLahir.match(/^\d{4}-\d{2}-\d{2}$/)) {
          data.tanggalLahir = new Date(data.tanggalLahir + 'T00:00:00.000Z');
        } else if (data.tanggalLahir) {
          // Try to parse as ISO string
          const parsedDate = new Date(data.tanggalLahir);
          if (!isNaN(parsedDate.getTime())) {
            data.tanggalLahir = parsedDate;
          }
        }
      }
      // If it's already a Date object, keep it as is
    }
    
    const updatedSiswa = await prisma.siswa.update({
      where: { id },
      data,
      include: includes.siswaWithRelations,
    });
    
    return NextResponse.json({
      success: true,
      data: updatedSiswa,
      message: 'Siswa berhasil diperbarui',
    });
  } catch (error: any) {
    console.error('Error updating siswa:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to update siswa',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    
    await prisma.siswa.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting siswa:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete siswa' },
      { status: 500 }
    );
  }
}
