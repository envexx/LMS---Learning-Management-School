import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get('kelas');
    
    const kartuPelajar = await prisma.kartuPelajar.findMany({
      where: kelasId && kelasId !== 'all' ? {
        siswa: { kelasId }
      } : undefined,
      include: {
        siswa: {
          include: {
            kelas: true,
          },
        },
      },
      orderBy: { siswa: { nama: 'asc' } },
    });
    
    return NextResponse.json({
      success: true,
      data: kartuPelajar,
    });
  } catch (error) {
    console.error('Error fetching kartu pelajar:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch kartu pelajar' },
      { status: 500 }
    );
  }
}
