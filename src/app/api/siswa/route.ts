import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { includes } from '@/lib/query-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get('kelas');
    
    const siswa = await prisma.siswa.findMany({
      where: kelasId && kelasId !== 'all' ? { kelasId } : undefined,
      include: includes.siswaWithRelations,
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
    
    const newSiswa = await prisma.siswa.create({
      data: body,
      include: includes.siswaWithRelations,
    });
    
    return NextResponse.json({
      success: true,
      data: newSiswa,
      message: 'Siswa berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating siswa:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create siswa' },
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
  } catch (error) {
    console.error('Error updating siswa:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update siswa' },
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
