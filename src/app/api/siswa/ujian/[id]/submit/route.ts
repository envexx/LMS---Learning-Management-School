import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(
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
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: 'Siswa not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { answers } = body;

    // Check if ujian exists
    const ujian = await prisma.ujian.findFirst({
      where: { id },
      include: {
        soalPilihanGanda: true,
        soalEssay: true,
      },
    });

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found' },
        { status: 404 }
      );
    }

    // Check if already submitted
    const existingSubmission = await prisma.ujianSubmission.findFirst({
      where: {
        ujianId: id,
        siswaId: siswa.id,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { success: false, error: 'Ujian sudah dikumpulkan' },
        { status: 400 }
      );
    }

    // Calculate score for multiple choice
    let correctPG = 0;
    const totalPG = ujian.soalPilihanGanda.length;
    
    ujian.soalPilihanGanda.forEach((soal) => {
      if (answers[soal.id] === soal.jawabanBenar) {
        correctPG++;
      }
    });

    // For essay, we'll set nilai to null and let guru grade it manually
    const totalEssay = ujian.soalEssay.length;
    const hasEssay = totalEssay > 0;

    // Calculate final score (only from PG if there are essay questions)
    let finalScore = null;
    if (!hasEssay && totalPG > 0) {
      // Only PG, calculate score
      finalScore = Math.round((correctPG / totalPG) * 100);
    }

    console.log('Creating submission for siswa:', siswa.id, 'ujian:', id);
    console.log('Final score:', finalScore, 'Status:', hasEssay ? 'pending' : 'completed');

    // Create submission
    const submission = await prisma.ujianSubmission.create({
      data: {
        ujianId: id,
        siswaId: siswa.id,
        startedAt: new Date(),
        submittedAt: new Date(),
        nilai: finalScore,
        status: hasEssay ? 'pending' : 'completed',
      },
    });

    console.log('Submission created with ID:', submission.id);

    // Store PG answers
    let pgSaved = 0;
    for (const soal of ujian.soalPilihanGanda) {
      const userAnswer = answers[soal.id];
      if (userAnswer) {
        await prisma.jawabanPilihanGanda.create({
          data: {
            submissionId: submission.id,
            soalId: soal.id,
            jawaban: userAnswer,
            isCorrect: userAnswer === soal.jawabanBenar,
          },
        });
        pgSaved++;
      }
    }
    console.log('PG answers saved:', pgSaved);

    // Store Essay answers
    let essaySaved = 0;
    for (const soal of ujian.soalEssay) {
      const userAnswer = answers[soal.id];
      if (userAnswer) {
        await prisma.jawabanEssay.create({
          data: {
            submissionId: submission.id,
            soalId: soal.id,
            jawaban: userAnswer,
          },
        });
        essaySaved++;
      }
    }
    console.log('Essay answers saved:', essaySaved);

    return NextResponse.json({
      success: true,
      data: {
        submission,
        score: finalScore,
        correctPG,
        totalPG,
        message: hasEssay 
          ? 'Ujian berhasil dikumpulkan. Nilai akan diberikan setelah guru mengoreksi essay.'
          : `Ujian berhasil dikumpulkan. Nilai Anda: ${finalScore}`,
      },
    });
  } catch (error) {
    console.error('Error submitting ujian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit ujian' },
      { status: 500 }
    );
  }
}
