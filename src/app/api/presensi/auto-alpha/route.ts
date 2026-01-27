import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDateIndonesia, getStartOfDayIndonesia } from '@/lib/date-utils';

/**
 * Auto-mark students as ALPHA if they haven't scanned by 9:00 AM
 * This endpoint should be called by a cron job at 9:00 AM daily
 */
export async function POST(request: Request) {
  try {
    // Get current time in Indonesian timezone
    const now = getCurrentDateIndonesia();
    const currentHour = now.getHours();
    
    // Only run if it's 9 AM or later
    if (currentHour < 9) {
      return NextResponse.json({
        success: false,
        message: 'Auto-alpha only runs at 9:00 AM or later',
        currentTime: now.toISOString(),
      });
    }

    const todayStart = getStartOfDayIndonesia();
    
    // Get all students
    const allSiswa = await prisma.siswa.findMany({
      select: {
        id: true,
        nisn: true,
        nama: true,
        kelasId: true,
      },
    });

    // Get students who already have presensi today
    const todayPresensi = await prisma.presensi.findMany({
      where: {
        tanggal: {
          gte: todayStart,
        },
      },
      select: {
        siswaId: true,
      },
    });

    // Create a Set of siswaIds who already have presensi
    const presentSiswaIds = new Set(todayPresensi.map(p => p.siswaId));

    // Filter students who don't have presensi yet (absent)
    const absentSiswa = allSiswa.filter(siswa => !presentSiswaIds.has(siswa.id));

    if (absentSiswa.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All students have been marked for attendance',
        totalStudents: allSiswa.length,
        absentCount: 0,
      });
    }

    // Create ALPHA presensi records for absent students
    const alphaRecords = await prisma.presensi.createMany({
      data: absentSiswa.map(siswa => ({
        siswaId: siswa.id,
        tanggal: now,
        status: 'alpha',
        keterangan: 'Auto-marked as ALPHA - tidak hadir sebelum jam 09:00',
      })),
    });

    console.log(`Auto-marked ${alphaRecords.count} students as ALPHA at ${now.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${alphaRecords.count} students as ALPHA`,
      totalStudents: allSiswa.length,
      presentCount: presentSiswaIds.size,
      absentCount: absentSiswa.length,
      markedAsAlpha: alphaRecords.count,
      executedAt: now.toISOString(),
      absentStudents: absentSiswa.map(s => ({
        nisn: s.nisn,
        nama: s.nama,
      })),
    });
  } catch (error) {
    console.error('Error in auto-alpha marking:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to auto-mark students as alpha',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger endpoint (for testing)
 * GET request to check status without marking
 */
export async function GET() {
  try {
    const now = getCurrentDateIndonesia();
    const todayStart = getStartOfDayIndonesia();
    
    // Get all students
    const allSiswa = await prisma.siswa.findMany({
      select: {
        id: true,
        nisn: true,
        nama: true,
      },
    });

    // Get students who already have presensi today
    const todayPresensi = await prisma.presensi.findMany({
      where: {
        tanggal: {
          gte: todayStart,
        },
      },
      select: {
        siswaId: true,
        status: true,
      },
    });

    const presentSiswaIds = new Set(todayPresensi.map(p => p.siswaId));
    const absentSiswa = allSiswa.filter(siswa => !presentSiswaIds.has(siswa.id));

    return NextResponse.json({
      success: true,
      currentTime: now.toISOString(),
      currentHour: now.getHours(),
      shouldRunAutoAlpha: now.getHours() >= 9,
      totalStudents: allSiswa.length,
      presentCount: presentSiswaIds.size,
      absentCount: absentSiswa.length,
      absentStudents: absentSiswa.map(s => ({
        nisn: s.nisn,
        nama: s.nama,
      })),
      presensiBreakdown: {
        hadir: todayPresensi.filter(p => p.status === 'hadir').length,
        izin: todayPresensi.filter(p => p.status === 'izin').length,
        sakit: todayPresensi.filter(p => p.status === 'sakit').length,
        alpha: todayPresensi.filter(p => p.status === 'alpha').length,
      },
    });
  } catch (error) {
    console.error('Error checking auto-alpha status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
