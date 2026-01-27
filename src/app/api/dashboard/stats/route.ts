import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get counts in parallel for better performance
    const [totalSiswa, totalGuru, totalKelas, ujianAktif] = await Promise.all([
      prisma.siswa.count(),
      prisma.guru.count(),
      prisma.kelas.count(),
      prisma.ujian.count({
        where: {
          status: 'aktif',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalSiswa,
        totalGuru,
        totalKelas,
        ujianAktif,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
