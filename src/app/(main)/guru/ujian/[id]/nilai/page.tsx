"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Eye, Download } from "@phosphor-icons/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function UjianNilaiPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoading: authLoading } = useAuth();
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [essayGrades, setEssayGrades] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("nilai");

  const { data, error, isLoading, mutate } = useSWR(
    params.id ? `/api/guru/ujian/${params.id}/nilai` : null,
    fetcher
  );

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data nilai ujian</p>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Data tidak ditemukan</p>
      </div>
    );
  }

  const ujian = data.data.ujian;
  const soalEssay = data.data.soalEssay || [];
  const submissions = data.data.submissions || [];

  const handleGrade = (submission: any) => {
    if (submission.status === 'belum') {
      toast.error("Siswa belum mengerjakan ujian");
      return;
    }

    setSelectedSubmission(submission);
    
    // Initialize essay grades from existing data
    const grades = soalEssay.map((soal: any) => {
      const existingJawaban = submission.jawabanEssay?.find(
        (j: any) => j.soalId === soal.id
      );
      return {
        id: existingJawaban?.id || null,
        soalId: soal.id,
        pertanyaan: soal.pertanyaan,
        kunciJawaban: soal.kunciJawaban,
        jawaban: existingJawaban?.jawaban || '',
        nilai: existingJawaban?.nilai || 0,
        feedback: existingJawaban?.feedback || '',
      };
    });
    
    setEssayGrades(grades);
    setIsGradingOpen(true);
  };

  const handleSubmitGrades = async () => {
    if (!selectedSubmission?.id) {
      toast.error("Data submission tidak valid");
      return;
    }

    try {
      const response = await fetch(`/api/guru/ujian/${params.id}/nilai`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          jawabanEssay: essayGrades.map(g => ({
            id: g.id,
            nilai: g.nilai,
            feedback: g.feedback,
          })),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await mutate();
        toast.success("Nilai essay berhasil disimpan");
        setIsGradingOpen(false);
        setSelectedSubmission(null);
      } else {
        toast.error(result.error || "Gagal menyimpan nilai");
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error("Terjadi kesalahan saat menyimpan nilai");
    }
  };

  const stats = {
    sudahMengerjakan: submissions.filter((s: any) => s.status === 'sudah').length,
    belumMengerjakan: submissions.filter((s: any) => s.status === 'belum').length,
  };

  const handleExport = () => {
    // Prepare data for export
    const exportData = submissions.map((s: any) => {
      const row: any = {
        'No': submissions.indexOf(s) + 1,
        'Nama Siswa': s.siswa,
      };
      
      // Add PG answers
      s.jawabanPG?.forEach((j: any, idx: number) => {
        row[`PG${idx + 1}`] = j.jawaban || '-';
      });
      
      // Add Essay answers
      s.jawabanEssay?.forEach((j: any, idx: number) => {
        row[`Essay${idx + 1}`] = j.jawaban || '-';
      });
      
      return row;
    });
    
    // Convert to CSV
    const headers = Object.keys(exportData[0] || {});
    const csv = [
      headers.join(','),
      ...exportData.map((row: any) => 
        headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `jawaban-ujian-${ujian.judul}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('Data berhasil diekspor');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/guru/ujian")}
        >
          <ArrowLeft className="w-5 h-5" weight="bold" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nilai Ujian: {ujian.judul}</h1>
          <p className="text-muted-foreground">
            {ujian.kelas.join(", ")} • {ujian.mapel} • {format(new Date(ujian.tanggal), "dd MMMM yyyy", { locale: id })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground">Total Soal</p>
              <p className="text-2xl font-semibold">{ujian.totalSoalPG + ujian.totalSoalEssay}</p>
              <p className="text-xs text-muted-foreground">PG: {ujian.totalSoalPG} • Essay: {ujian.totalSoalEssay}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground">Sudah Mengerjakan</p>
              <p className="text-2xl font-semibold text-green-600">{stats.sudahMengerjakan}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground">Belum Mengerjakan</p>
              <p className="text-2xl font-semibold text-red-600">{stats.belumMengerjakan}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground">Rata-rata Nilai</p>
              <p className="text-2xl font-semibold">
                {submissions.filter((s: any) => s.nilaiTotal).length > 0
                  ? Math.round(
                      submissions
                        .filter((s: any) => s.nilaiTotal)
                        .reduce((sum: number, s: any) => sum + s.nilaiTotal, 0) /
                        submissions.filter((s: any) => s.nilaiTotal).length
                    )
                  : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="nilai">Daftar Nilai</TabsTrigger>
          <TabsTrigger value="jawaban">Jawaban Siswa</TabsTrigger>
        </TabsList>

        <TabsContent value="nilai">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Nilai Siswa</CardTitle>
            </CardHeader>
            <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Siswa</TableHead>
                <TableHead>Tanggal Submit</TableHead>
                <TableHead className="text-center">Nilai PG</TableHead>
                <TableHead className="text-center">Nilai Essay</TableHead>
                <TableHead className="text-center">Nilai Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((s: any) => (
                <TableRow key={s.siswaId}>
                  <TableCell className="font-medium">{s.siswa}</TableCell>
                  <TableCell>
                    {s.submittedAt ? (
                      <span className="text-sm">
                        {format(new Date(s.submittedAt), "dd MMM yyyy HH:mm", { locale: id })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.nilaiPG !== null ? (
                      <span className="font-semibold">{s.nilaiPG}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.nilaiEssay !== null ? (
                      <span className="font-semibold">{s.nilaiEssay}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.nilaiTotal !== null ? (
                      <span className="font-bold text-lg">{s.nilaiTotal}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      s.status === "sudah" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {s.status === "sudah" ? "Sudah" : "Belum"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status === "sudah" && ujian.totalSoalEssay > 0 && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleGrade(s)}
                      >
                        <Eye className="w-4 h-4" weight="duotone" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jawaban">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Jawaban Semua Siswa</CardTitle>
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" weight="bold" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead className="min-w-[150px]">Nama Siswa</TableHead>
                      {Array.from({ length: ujian.totalSoalPG }, (_, i) => (
                        <TableHead key={`pg-${i}`} className="text-center w-16">PG{i + 1}</TableHead>
                      ))}
                      {Array.from({ length: ujian.totalSoalEssay }, (_, i) => (
                        <TableHead key={`essay-${i}`} className="text-center min-w-[200px]">Essay{i + 1}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-yellow-50">
                      <TableCell className="font-semibold">Kunci</TableCell>
                      <TableCell className="font-semibold">-</TableCell>
                      {data.data.soalPG?.map((soal: any) => (
                        <TableCell key={soal.id} className="text-center font-semibold text-green-700">
                          {soal.jawabanBenar}
                        </TableCell>
                      ))}
                      {soalEssay.map((soal: any) => (
                        <TableCell key={soal.id} className="text-xs text-green-700">
                          {soal.kunciJawaban?.substring(0, 50)}{soal.kunciJawaban?.length > 50 ? '...' : ''}
                        </TableCell>
                      ))}
                    </TableRow>
                    {submissions.map((s: any, idx: number) => (
                      <TableRow key={s.siswaId}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">{s.siswa}</TableCell>
                        {data.data.soalPG?.map((soal: any, i: number) => {
                          const jawaban = s.jawabanPG?.find((j: any) => j.soalId === soal.id);
                          const isCorrect = jawaban?.isCorrect;
                          return (
                            <TableCell 
                              key={`pg-${i}`} 
                              className={`text-center ${
                                isCorrect ? 'bg-green-50 text-green-700 font-semibold' : 
                                jawaban ? 'bg-red-50 text-red-700' : ''
                              }`}
                            >
                              {jawaban?.jawaban || '-'}
                            </TableCell>
                          );
                        })}
                        {data.data.soalEssay?.map((soal: any, i: number) => {
                          const jawaban = s.jawabanEssay?.find((j: any) => j.soalId === soal.id);
                          return (
                            <TableCell key={`essay-${i}`} className="text-xs">
                              {jawaban?.jawaban ? (
                                <div className="max-w-[200px] truncate" title={jawaban.jawaban}>
                                  {jawaban.jawaban}
                                </div>
                              ) : '-'}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Penilaian Essay - {selectedSubmission?.siswa}</DialogTitle>
            <DialogDescription>
              Berikan nilai dan feedback untuk setiap jawaban essay
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {essayGrades.map((grade, index) => (
              <div key={grade.soalId} className="p-4 border rounded-lg space-y-3">
                <div>
                  <p className="font-semibold text-sm mb-2">Soal {index + 1}:</p>
                  <p className="text-sm">{grade.pertanyaan}</p>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs font-semibold text-green-700 mb-1">Kunci Jawaban:</p>
                  <p className="text-sm text-green-900 whitespace-pre-wrap">{grade.kunciJawaban}</p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Jawaban Siswa:</p>
                  <p className="text-sm text-blue-900 whitespace-pre-wrap">{grade.jawaban || '(Tidak ada jawaban)'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`nilai-${index}`}>Nilai (0-100)</Label>
                    <Input
                      id={`nilai-${index}`}
                      type="number"
                      min="0"
                      max="100"
                      value={grade.nilai}
                      onChange={(e) => {
                        const newGrades = [...essayGrades];
                        newGrades[index].nilai = parseInt(e.target.value) || 0;
                        setEssayGrades(newGrades);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`feedback-${index}`}>Feedback</Label>
                  <Textarea
                    id={`feedback-${index}`}
                    placeholder="Berikan feedback untuk siswa..."
                    value={grade.feedback}
                    onChange={(e) => {
                      const newGrades = [...essayGrades];
                      newGrades[index].feedback = e.target.value;
                      setEssayGrades(newGrades);
                    }}
                    rows={3}
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsGradingOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmitGrades}>
                Simpan Nilai
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
