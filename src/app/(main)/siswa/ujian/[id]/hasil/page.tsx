"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Trophy,
  Clock,
  Calendar,
  FileText,
  ChartBar,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function SiswaUjianHasilPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      fetchResult();
    }
  }, [params.id]);

  const fetchResult = async () => {
    try {
      const response = await fetch(`/api/siswa/ujian/${params.id}/hasil`);
      const result = await response.json();
      
      if (result.success) {
        setResultData(result.data);
      } else {
        toast.error(result.error || "Gagal memuat hasil ujian");
        router.push('/siswa/ujian');
      }
    } catch (error) {
      console.error('Error fetching result:', error);
      toast.error("Terjadi kesalahan");
      router.push('/siswa/ujian');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!resultData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Hasil ujian tidak ditemukan</p>
      </div>
    );
  }

  const { ujian, submission, soalPG, soalEssay, answers } = resultData;
  const hasScore = submission.nilai !== null;
  const isPending = submission.status === 'pending';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/siswa/ujian")}
        >
          <ArrowLeft className="w-5 h-5" weight="bold" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Hasil Ujian</h1>
          <p className="text-muted-foreground">{ujian.judul}</p>
        </div>
      </div>

      {/* Score Card */}
      <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            {hasScore ? (
              <>
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#1488cc] to-[#2b32b2] mb-4">
                  <Trophy className="w-12 h-12 text-white" weight="fill" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Nilai Anda</p>
                  <p className="text-6xl font-bold bg-gradient-to-r from-[#1488cc] to-[#2b32b2] bg-clip-text text-transparent">
                    {submission.nilai}
                  </p>
                </div>
                <Badge 
                  variant={submission.nilai >= 75 ? "default" : "destructive"}
                  className="text-sm px-4 py-1"
                >
                  {submission.nilai >= 75 ? "Lulus" : "Tidak Lulus"}
                </Badge>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-100 mb-4">
                  <Clock className="w-12 h-12 text-orange-600" weight="fill" />
                </div>
                <div>
                  <p className="text-lg font-semibold mb-2">Menunggu Penilaian</p>
                  <p className="text-sm text-muted-foreground">
                    Ujian Anda sedang dikoreksi oleh guru. Nilai akan tersedia setelah koreksi selesai.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" weight="duotone" />
              <p className="text-xs text-muted-foreground">Tanggal</p>
              <p className="font-semibold text-sm">
                {format(new Date(submission.submittedAt), "dd MMM yyyy", { locale: id })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" weight="duotone" />
              <p className="text-xs text-muted-foreground">Durasi</p>
              <p className="font-semibold text-sm">{ujian.durasi} menit</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-purple-600" weight="duotone" />
              <p className="text-xs text-muted-foreground">Total Soal</p>
              <p className="font-semibold text-sm">{soalPG.length + soalEssay.length} soal</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <ChartBar className="w-8 h-8 mx-auto mb-2 text-green-600" weight="duotone" />
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold text-sm">
                {isPending ? "Pending" : "Selesai"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Answers Review - Only show PG answers */}
      {soalPG.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Review Jawaban Pilihan Ganda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {soalPG.map((soal: any, index: number) => {
              const userAnswer = answers[soal.id];
              const isCorrect = userAnswer === soal.jawabanBenar;
              
              return (
                <div key={soal.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium mb-3">{soal.pertanyaan}</p>
                      
                      <div className="space-y-2">
                        {['A', 'B', 'C', 'D'].map((option) => {
                          const isUserAnswer = userAnswer === option;
                          const isCorrectAnswer = soal.jawabanBenar === option;
                          
                          return (
                            <div 
                              key={option}
                              className={`p-3 rounded-lg border-2 ${
                                isCorrectAnswer 
                                  ? 'border-green-500 bg-green-50' 
                                  : isUserAnswer 
                                  ? 'border-red-500 bg-red-50' 
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{option}.</span>
                                  <span>{soal[`opsi${option}`]}</span>
                                </div>
                                {isCorrectAnswer && (
                                  <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                                )}
                                {isUserAnswer && !isCorrectAnswer && (
                                  <XCircle className="w-5 h-5 text-red-600" weight="fill" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Essay Answers */}
      {soalEssay.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Jawaban Essay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {soalEssay.map((soal: any, index: number) => {
              const userAnswer = answers[soal.id];
              
              return (
                <div key={soal.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold flex items-center justify-center">
                      {soalPG.length + index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium mb-3">{soal.pertanyaan}</p>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Jawaban Anda:</p>
                        <p className="whitespace-pre-wrap">{userAnswer || "-"}</p>
                      </div>
                      {isPending && (
                        <p className="text-xs text-orange-600 mt-2">
                          Menunggu penilaian dari guru
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button
          onClick={() => router.push('/siswa/ujian')}
          size="lg"
          className="px-8"
        >
          Kembali ke Daftar Ujian
        </Button>
      </div>
    </div>
  );
}
