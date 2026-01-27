import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDateIndonesia, getStartOfDayIndonesia } from '@/lib/date-utils';

export async function POST(request: Request) {
  try {
    const { nisn, type = 'hadir' } = await request.json();
    
    if (!nisn) {
      return NextResponse.json(
        { success: false, error: 'NISN diperlukan' },
        { status: 400 }
      );
    }

    // Find siswa by NISN with minimal data
    const siswa = await prisma.siswa.findUnique({
      where: { nisn },
      select: {
        id: true,
        nisn: true,
        nama: true,
        kelasId: true,
        kelas: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    // Use Indonesian timezone for accurate date checking
    const todayIndonesia = getStartOfDayIndonesia();

    // Check if already checked in today
    const existingPresensi = await prisma.presensi.findFirst({
      where: {
        siswaId: siswa.id,
        tanggal: {
          gte: todayIndonesia,
        },
      },
    });

    if (existingPresensi) {
      return NextResponse.json({
        success: false,
        error: 'Siswa sudah melakukan presensi hari ini',
        data: {
          siswa,
          presensi: existingPresensi,
        },
      });
    }

    // Create new presensi record with Indonesian timezone
    const presensi = await prisma.presensi.create({
      data: {
        siswaId: siswa.id,
        tanggal: getCurrentDateIndonesia(),
        status: type, // 'hadir', 'izin', 'sakit', 'alpha'
        keterangan: `Scan QR Code Pagi - ${type}`,
      },
      include: {
        siswa: {
          select: {
            nisn: true,
            nama: true,
            kelas: {
              select: {
                nama: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Presensi ${type} berhasil dicatat`,
      data: presensi,
    });
  } catch (error) {
    console.error('Error scanning presensi:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses presensi' },
      { status: 500 }
    );
  }
}
