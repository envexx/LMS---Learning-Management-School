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

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get guru data
    const guru = await prisma.guru.findFirst({
      where: { userId: session.userId },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, error: 'Guru not found' },
        { status: 404 }
      );
    }

    // Get ujian detail with questions
    const ujian = await prisma.ujian.findFirst({
      where: {
        id: id,
        guruId: guru.id,
      },
      include: {
        mapel: true,
        soalPilihanGanda: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        soalEssay: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ujian: {
          id: ujian.id,
          judul: ujian.judul,
          deskripsi: ujian.deskripsi,
          mapel: ujian.mapel.nama,
          mapelId: ujian.mapelId,
          kelas: ujian.kelas,
          tanggal: ujian.tanggal,
          waktuMulai: ujian.waktuMulai,
          durasi: ujian.durasi,
          shuffleQuestions: ujian.shuffleQuestions,
          showScore: ujian.showScore,
          status: ujian.status,
          createdAt: ujian.createdAt,
        },
        soalPG: ujian.soalPilihanGanda.map((soal, index) => ({
          id: soal.id,
          nomor: index + 1,
          pertanyaan: soal.pertanyaan,
          opsiA: soal.opsiA,
          opsiB: soal.opsiB,
          opsiC: soal.opsiC,
          opsiD: soal.opsiD,
          kunciJawaban: soal.jawabanBenar,
        })),
        soalEssay: ujian.soalEssay.map((soal, index) => ({
          id: soal.id,
          nomor: index + 1,
          pertanyaan: soal.pertanyaan,
          kunciJawaban: soal.kunciJawaban,
        })),
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const guru = await prisma.guru.findFirst({
      where: { userId: session.userId },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, error: 'Guru not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { judul, deskripsi, durasi } = body;

    // Validate
    if (!judul || !judul.trim()) {
      return NextResponse.json(
        { success: false, error: 'Judul harus diisi' },
        { status: 400 }
      );
    }

    if (!durasi || durasi <= 0) {
      return NextResponse.json(
        { success: false, error: 'Durasi harus lebih dari 0' },
        { status: 400 }
      );
    }

    // Check if ujian exists and belongs to this guru
    const existingUjian = await prisma.ujian.findFirst({
      where: {
        id: id,
        guruId: guru.id,
      },
    });

    if (!existingUjian) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found' },
        { status: 404 }
      );
    }

    // Update ujian
    const updatedUjian = await prisma.ujian.update({
      where: { id },
      data: {
        judul: judul.trim(),
        deskripsi: deskripsi?.trim() || null,
        durasi: parseInt(durasi),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUjian,
      message: 'Ujian berhasil diupdate',
    });
  } catch (error) {
    console.error('Error updating ujian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ujian' },
      { status: 500 }
    );
  }
}
