import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { includes } from '@/lib/query-helpers';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mapelId = searchParams.get('mapel');
    
    const guru = await prisma.guru.findMany({
      where: mapelId && mapelId !== 'all' ? {
        mapel: {
          some: {
            mapelId,
          },
        },
      } : undefined,
      include: includes.guruWithRelations,
      orderBy: { nama: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      data: guru,
    });
  } catch (error) {
    console.error('Error fetching guru:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch guru' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mapelIds = [], kelasIds = [], ...guruData } = body;
    
    // Hash default password
    const defaultPassword = 'guru123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Create User account first
    const user = await prisma.user.create({
      data: {
        email: guruData.email,
        password: hashedPassword, // Default password: guru123 (hashed)
        role: 'GURU',
        isActive: guruData.isActive !== undefined ? guruData.isActive : true,
      },
    });
    
    // Then create Guru with the userId
    const newGuru = await prisma.guru.create({
      data: {
        nipUsername: guruData.nipUsername,
        nama: guruData.nama,
        email: guruData.email,
        alamat: guruData.alamat,
        jenisKelamin: guruData.jenisKelamin || 'L',
        isActive: guruData.isActive !== undefined ? guruData.isActive : true,
        userId: user.id,
        mapel: {
          create: mapelIds.map((mapelId: string) => ({
            mapelId,
          })),
        },
        kelas: {
          create: kelasIds.map((kelasId: string) => ({
            kelasId,
          })),
        },
      },
      include: includes.guruWithRelations,
    });
    
    return NextResponse.json({
      success: true,
      data: newGuru,
      message: 'Guru berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating guru:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create guru' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, mapelIds = [], kelasIds = [], ...data } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    
    // Delete existing mapel and kelas relations
    await prisma.guruMapel.deleteMany({
      where: { guruId: id },
    });
    
    await prisma.guruKelas.deleteMany({
      where: { guruId: id },
    });
    
    const updatedGuru = await prisma.guru.update({
      where: { id },
      data: {
        nipUsername: data.nipUsername,
        nama: data.nama,
        email: data.email,
        alamat: data.alamat,
        jenisKelamin: data.jenisKelamin,
        isActive: data.isActive,
        mapel: {
          create: mapelIds.map((mapelId: string) => ({
            mapelId,
          })),
        },
        kelas: {
          create: kelasIds.map((kelasId: string) => ({
            kelasId,
          })),
        },
      },
      include: includes.guruWithRelations,
    });
    
    return NextResponse.json({
      success: true,
      data: updatedGuru,
      message: 'Guru berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updating guru:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update guru' },
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
    
    await prisma.guru.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Guru berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting guru:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete guru' },
      { status: 500 }
    );
  }
}
