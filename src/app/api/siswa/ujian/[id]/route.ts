import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'SISWA') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const siswa = await prisma.siswa.findFirst({
      where: { userId: session.userId },
      include: { kelas: true },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: 'Siswa not found' },
        { status: 404 }
      );
    }

    // Get ujian detail
    const ujian = await prisma.ujian.findFirst({
      where: {
        id,
        kelas: { has: siswa.kelas.nama },
        status: 'aktif',
      },
      include: {
        mapel: true,
        soalPilihanGanda: {
          orderBy: { urutan: 'asc' },
        },
        soalEssay: {
          orderBy: { urutan: 'asc' },
        },
        submissions: {
          where: { siswaId: siswa.id },
        },
      },
    });

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found' },
        { status: 404 }
      );
    }

    // Check time validation
    const now = new Date();
    const examDate = new Date(ujian.tanggal);
    const [hours, minutes] = ujian.waktuMulai.split(':').map(Number);
    examDate.setHours(hours, minutes, 0, 0);
    const examEndTime = new Date(examDate.getTime() + ujian.durasi * 60000);

    const canStart = now >= examDate && now <= examEndTime && !ujian.submissions[0];

    return NextResponse.json({
      success: true,
      data: {
        ujian: {
          id: ujian.id,
          judul: ujian.judul,
          deskripsi: ujian.deskripsi,
          mapel: ujian.mapel.nama,
          tanggal: ujian.tanggal,
          waktuMulai: ujian.waktuMulai,
          durasi: ujian.durasi,
          totalSoal: ujian.soalPilihanGanda.length + ujian.soalEssay.length,
        },
        soalPG: ujian.soalPilihanGanda.map((s, idx) => ({
          id: s.id,
          nomor: idx + 1,
          pertanyaan: s.pertanyaan,
          opsiA: s.opsiA,
          opsiB: s.opsiB,
          opsiC: s.opsiC,
          opsiD: s.opsiD,
        })),
        soalEssay: ujian.soalEssay.map((s, idx) => ({
          id: s.id,
          nomor: idx + 1,
          pertanyaan: s.pertanyaan,
        })),
        submission: ujian.submissions[0] || null,
        canStart,
      },
    });
  } catch (error) {
    console.error('Error fetching ujian detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ujian detail' },
      { status: 500 }
    );
  }
}
