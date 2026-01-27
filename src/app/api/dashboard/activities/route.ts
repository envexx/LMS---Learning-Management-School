import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get recent activities from different tables
    const [recentSiswa, recentKelas, recentUjian] = await Promise.all([
      prisma.siswa.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          nama: true,
          createdAt: true,
        },
      }),
      prisma.kelas.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          nama: true,
          updatedAt: true,
        },
      }),
      prisma.ujian.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          judul: true,
          createdAt: true,
          mapel: {
            select: {
              nama: true,
            },
          },
        },
      }),
    ]);

    // Combine and sort all activities
    const activities = [
      ...recentSiswa.map(s => ({
        type: 'siswa',
        message: `Siswa ${s.nama} ditambahkan`,
        timestamp: s.createdAt,
        color: 'blue',
      })),
      ...recentKelas.map(k => ({
        type: 'kelas',
        message: `Kelas ${k.nama} diperbarui`,
        timestamp: k.updatedAt,
        color: 'purple',
      })),
      ...recentUjian.map(u => ({
        type: 'ujian',
        message: `Ujian ${u.mapel?.nama || 'Umum'} - ${u.judul} dibuat`,
        timestamp: u.createdAt,
        color: 'green',
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
