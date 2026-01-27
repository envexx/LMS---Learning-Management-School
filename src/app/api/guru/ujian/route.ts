import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

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

    // Build where clause
    const where: any = {
      guruId: guru.id,
    };

    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }

    // Get ujian with counts
    const [ujian, kelasList, mapelList] = await Promise.all([
      prisma.ujian.findMany({
        where,
        include: {
          mapel: true,
          _count: {
            select: {
              soalPilihanGanda: true,
              soalEssay: true,
              submissions: true,
            },
          },
        },
        orderBy: {
          tanggal: 'desc',
        },
      }),
      // Get kelas that this guru teaches
      prisma.kelas.findMany({
        where: {
          guru: {
            some: {
              guruId: guru.id,
            },
          },
        },
        select: {
          id: true,
          nama: true,
        },
        orderBy: {
          nama: 'asc',
        },
      }),
      // Get mapel that this guru teaches
      prisma.guruMapel.findMany({
        where: {
          guruId: guru.id,
        },
        include: {
          mapel: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ujian: ujian.map((u) => ({
          id: u.id,
          judul: u.judul,
          deskripsi: u.deskripsi,
          mapel: u.mapel.nama,
          mapelId: u.mapelId,
          kelas: u.kelas,
          tanggal: u.tanggal,
          waktuMulai: u.waktuMulai,
          durasi: u.durasi,
          shuffleQuestions: u.shuffleQuestions,
          showScore: u.showScore,
          status: u.status,
          totalSoalPG: u._count.soalPilihanGanda,
          totalSoalEssay: u._count.soalEssay,
          totalSubmissions: u._count.submissions,
          createdAt: u.createdAt,
        })),
        kelasList: kelasList.map((k) => ({
          id: k.id,
          nama: k.nama,
        })),
        mapelList: mapelList.map((gm) => ({
          id: gm.mapel.id,
          nama: gm.mapel.nama,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching ujian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ujian' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      judul, 
      deskripsi, 
      mapelId, 
      kelas, 
      tanggal, 
      waktuMulai, 
      durasi,
      shuffleQuestions,
      showScore,
      status,
      soalPG,
      soalEssay,
    } = body;

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

    // Create ujian with soal
    const ujian = await prisma.ujian.create({
      data: {
        judul,
        deskripsi,
        mapelId,
        guruId: guru.id,
        kelas: Array.isArray(kelas) ? kelas : [kelas],
        tanggal: new Date(tanggal),
        waktuMulai,
        durasi: parseInt(durasi),
        shuffleQuestions: shuffleQuestions || false,
        showScore: showScore !== false,
        status: status || 'draft',
        soalPilihanGanda: {
          create: soalPG?.map((soal: any, index: number) => ({
            pertanyaan: soal.pertanyaan,
            opsiA: soal.opsiA,
            opsiB: soal.opsiB,
            opsiC: soal.opsiC,
            opsiD: soal.opsiD,
            jawabanBenar: soal.kunciJawaban,
            urutan: index + 1,
          })) || [],
        },
        soalEssay: {
          create: soalEssay?.map((soal: any, index: number) => ({
            pertanyaan: soal.pertanyaan,
            kunciJawaban: soal.kunciJawaban,
            urutan: index + 1,
          })) || [],
        },
      },
      include: {
        mapel: true,
        soalPilihanGanda: true,
        soalEssay: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ujian,
        totalSoalPG: ujian.soalPilihanGanda.length,
        totalSoalEssay: ujian.soalEssay.length,
      },
      message: 'Ujian berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating ujian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ujian' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
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

    // Update ujian status (only if owned by this guru)
    const ujian = await prisma.ujian.updateMany({
      where: {
        id,
        guruId: guru.id,
      },
      data: {
        status,
      },
    });

    if (ujian.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Status ujian berhasil diupdate',
    });
  } catch (error) {
    console.error('Error updating ujian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ujian' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
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

    // Delete ujian (only if owned by this guru)
    await prisma.ujian.deleteMany({
      where: {
        id,
        guruId: guru.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ujian berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting ujian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete ujian' },
      { status: 500 }
    );
  }
}
