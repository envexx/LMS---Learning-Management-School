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
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Submission {
  id: string | null;
  siswaId: string;
  siswa: string;
  nisn: string;
  tanggalKumpul: Date | null;
  file?: string | null;
  catatan?: string | null;
  nilai: number | null;
  feedback?: string | null;
  status: "sudah" | "belum" | "terlambat";
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function TugasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoading: authLoading } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [gradingData, setGradingData] = useState({
    nilai: 0,
    feedback: "",
  });

  const { data, error, isLoading, mutate } = useSWR(
    params.id ? `/api/guru/tugas/${params.id}` : null,
    fetcher
  );

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data tugas</p>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Tugas tidak ditemukan</p>
      </div>
    );
  }

  const tugas = data.data.tugas;
  const submissions = data.data.submissions || [];

  console.log('All submissions:', submissions);
  console.log('Submissions with files:', submissions.filter((s: Submission) => s.file));

  const handleGrade = (submission: Submission) => {
    console.log('Grading submission:', submission);
    console.log('File URL:', submission.file);
    console.log('Catatan:', submission.catatan);
    
    setSelectedSubmission(submission);
    setGradingData({
      nilai: submission.nilai || 0,
      feedback: submission.feedback || "",
    });
    setIsGradingOpen(true);
  };

  const handleSubmitGrade = async () => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch('/api/guru/submissions/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          siswaId: selectedSubmission.siswaId,
          tugasId: params.id,
          nilai: gradingData.nilai,
          feedback: gradingData.feedback,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await mutate();
        toast.success("Nilai berhasil disimpan");
        setIsGradingOpen(false);
        setSelectedSubmission(null);
      } else {
        toast.error(result.error || "Gagal menyimpan nilai");
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      toast.error("Terjadi kesalahan saat menyimpan nilai");
    }
  };

  const stats = {
    sudahMengumpulkan: submissions.filter((s: any) => s.status === "sudah").length,
    belumMengumpulkan: submissions.filter((s: any) => s.status === "belum").length,
    terlambat: submissions.filter((s: any) => s.status === "terlambat").length,
    sudahDinilai: submissions.filter((s: any) => s.nilai !== null).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/guru/tugas")}
        >
          <ArrowLeft className="w-5 h-5" weight="bold" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{tugas.judul}</h1>
          <p className="text-muted-foreground">
            {tugas.kelas.join(", ")} • {tugas.mapel} • Deadline: {format(new Date(tugas.deadline), "dd MMMM yyyy", { locale: id })}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instruksi Tugas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">{tugas.instruksi}</p>
          {tugas.fileUrl && (
            <div className="mt-4 p-3 border rounded-lg bg-muted">
              <p className="text-sm font-medium mb-2">File Lampiran:</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(tugas.fileUrl, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" weight="bold" />
                Download File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm text-muted-foreground">Sudah Mengumpulkan</p>
                <p className="text-2xl font-semibold tracking-tight">{stats.sudahMengumpulkan}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-green-50 flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm text-muted-foreground">Belum Mengumpulkan</p>
                <p className="text-2xl font-semibold tracking-tight">{stats.belumMengumpulkan}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-red-50 flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-600" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm text-muted-foreground">Terlambat</p>
                <p className="text-2xl font-semibold tracking-tight">{stats.terlambat}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-50 flex-shrink-0">
                <Clock className="w-5 h-5 text-orange-600" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm text-muted-foreground">Sudah Dinilai</p>
                <p className="text-2xl font-semibold tracking-tight">{stats.sudahDinilai}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-blue-600" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengumpulan Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NISN</TableHead>
                <TableHead>Nama Siswa</TableHead>
                <TableHead>Tanggal Kumpul</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-center">Nilai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((s: Submission) => (
                <TableRow key={s.siswaId}>
                  <TableCell className="font-medium">{s.nisn}</TableCell>
                  <TableCell>{s.siswa}</TableCell>
                  <TableCell>
                    {s.tanggalKumpul ? (
                      <span className="text-sm">
                        {format(s.tanggalKumpul, "dd MMM yyyy HH:mm", { locale: id })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.file ? (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => window.open(s.file!, '_blank')}
                        title={s.file.split('/').pop() || 'Download'}
                      >
                        <Download className="w-4 h-4 mr-1" weight="duotone" />
                        {(() => {
                          const filename = s.file.split('/').pop() || 'Download';
                          return filename.length > 20 ? filename.substring(0, 17) + '...' : filename;
                        })()}
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.nilai !== null ? (
                      <span className="font-bold">{s.nilai}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      s.status === "sudah" ? "bg-green-100 text-green-700" :
                      s.status === "terlambat" ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {s.status === "sudah" ? "Sudah" : s.status === "terlambat" ? "Terlambat" : "Belum"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status !== "belum" && (
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

      <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Penilaian Tugas</DialogTitle>
            <DialogDescription>
              {selectedSubmission && `Nilai tugas untuk ${selectedSubmission.siswa}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-w-full">
            {selectedSubmission?.catatan && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">Catatan Siswa:</p>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{selectedSubmission.catatan}</p>
              </div>
            )}

            {selectedSubmission?.file ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-900 mb-2">File Tugas:</p>
                <div className="flex items-center gap-2 p-3 bg-white rounded border">
                  <Download className="w-5 h-5 text-green-600 flex-shrink-0" weight="duotone" />
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-medium truncate" 
                      title={selectedSubmission.file.split('/').pop()}
                    >
                      {(() => {
                        const filename = selectedSubmission.file.split('/').pop() || '';
                        const maxLength = window.innerWidth < 640 ? 15 : 25;
                        return filename.length > maxLength ? filename.substring(0, maxLength - 3) + '...' : filename;
                      })()}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">Klik untuk download</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => window.open(selectedSubmission.file!, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-1" weight="bold" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Perhatian:</strong> Siswa tidak mengupload file untuk tugas ini.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nilai">Nilai (0-100)</Label>
              <Input
                id="nilai"
                type="number"
                min="0"
                max="100"
                value={gradingData.nilai}
                onChange={(e) => setGradingData({ ...gradingData, nilai: parseInt(e.target.value) || 0 })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Berikan feedback untuk siswa..."
                value={gradingData.feedback}
                onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
                rows={4}
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsGradingOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmitGrade}>
                Simpan Nilai
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
