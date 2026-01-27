"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Download, 
  Upload,
  CheckCircle,
  FileText,
  Trophy,
  Link as LinkIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function SiswaTugasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoading: authLoading } = useAuth();
  const [submitMethod, setSubmitMethod] = useState<"url" | "upload">("url");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [catatan, setCatatan] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    params.id ? `/api/siswa/tugas/${params.id}` : null,
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
  const submission = data.data.submission;
  const hasSubmitted = !!submission;
  const isLate = submission && new Date(submission.submittedAt) > new Date(tugas.deadline);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    // Validate based on selected method
    if (submitMethod === "url") {
      if (!fileUrl.trim()) {
        toast.error("URL file harus diisi");
        return;
      }
    } else if (submitMethod === "upload") {
      if (!selectedFile) {
        toast.error("File harus dipilih");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let uploadedFileUrl = null;

      // If upload method, upload file first
      if (submitMethod === "upload" && selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadResult.success) {
          toast.error(uploadResult.error || "Gagal upload file");
          setIsUploading(false);
          setIsSubmitting(false);
          return;
        }

        uploadedFileUrl = uploadResult.data.url;
        setIsUploading(false);
      }

      // Submit tugas
      const response = await fetch(`/api/siswa/tugas/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: submitMethod === "url" ? fileUrl.trim() : null,
          fileUpload: submitMethod === "upload" ? uploadedFileUrl : null,
          catatan: catatan.trim() || null,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Tugas berhasil dikumpulkan!");
        mutate();
        setFileUrl("");
        setSelectedFile(null);
        setCatatan("");
      } else {
        toast.error(result.error || "Gagal mengumpulkan tugas");
      }
    } catch (error) {
      console.error('Error submitting tugas:', error);
      toast.error("Terjadi kesalahan saat mengumpulkan tugas");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/siswa/tugas")}
        >
          <ArrowLeft className="w-5 h-5" weight="bold" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{tugas.judul}</h1>
          <p className="text-muted-foreground">{tugas.mapel}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Detail Tugas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tugas.deskripsi && (
                <div>
                  <h3 className="font-semibold mb-2">Deskripsi</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {tugas.deskripsi}
                  </p>
                </div>
              )}

              {tugas.instruksi && (
                <div>
                  <h3 className="font-semibold mb-2">Instruksi</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {tugas.instruksi}
                  </p>
                </div>
              )}

              {tugas.fileUrl && (
                <div>
                  <h3 className="font-semibold mb-2">File Lampiran</h3>
                  <Button
                    variant="outline"
                    onClick={() => window.open(tugas.fileUrl, '_blank')}
                    className="w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4 mr-2" weight="bold" />
                    Download File
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {!hasSubmitted ? (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Kumpulkan Tugas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Pilih Metode Pengumpulan *</Label>
                  <RadioGroup value={submitMethod} onValueChange={(value: "url" | "upload") => setSubmitMethod(value)}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="url" id="url" />
                      <Label htmlFor="url" className="flex items-center gap-2 cursor-pointer flex-1">
                        <LinkIcon className="w-4 h-4 text-blue-600" weight="duotone" />
                        <div>
                          <p className="font-medium">Link URL</p>
                          <p className="text-xs text-muted-foreground">Google Drive, OneDrive, dll</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="upload" id="upload" />
                      <Label htmlFor="upload" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Upload className="w-4 h-4 text-green-600" weight="duotone" />
                        <div>
                          <p className="font-medium">Upload File</p>
                          <p className="text-xs text-muted-foreground">Upload langsung dari komputer</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {submitMethod === "url" ? (
                  <div className="space-y-2">
                    <Label htmlFor="fileUrl">URL File Tugas *</Label>
                    <Input
                      id="fileUrl"
                      placeholder="https://drive.google.com/..."
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload file ke Google Drive atau layanan lain, lalu paste link-nya di sini
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="fileUpload">Upload File *</Label>
                    <Input
                      id="fileUpload"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.jpg,.jpeg,.png"
                    />
                    {selectedFile && (
                      <p className="text-xs text-green-600">
                        ✓ File terpilih: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Format: PDF, Word, Excel, PowerPoint, ZIP, atau gambar (Max 10MB)
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="catatan">Catatan (Opsional)</Label>
                  <Textarea
                    id="catatan"
                    placeholder="Tambahkan catatan untuk guru..."
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>Mengupload file...</>
                  ) : isSubmitting ? (
                    <>Mengumpulkan...</>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" weight="bold" />
                      Kumpulkan Tugas
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                  Tugas Sudah Dikumpulkan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Waktu Pengumpulan</p>
                  <p className="font-medium">
                    {format(new Date(submission.submittedAt), "dd MMMM yyyy, HH:mm", { locale: id })}
                  </p>
                  {isLate && (
                    <p className="text-sm text-orange-600 mt-1">⚠️ Dikumpulkan terlambat</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">File yang Dikumpulkan</p>
                  {submission.fileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(submission.fileUrl, '_blank')}
                      className="mr-2"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Buka Link
                    </Button>
                  )}
                  {submission.fileUpload && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(submission.fileUpload, '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download File
                    </Button>
                  )}
                </div>

                {submission.catatan && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Catatan</p>
                    <p className="text-sm whitespace-pre-wrap">{submission.catatan}</p>
                  </div>
                )}

                {submission.nilai !== null && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Nilai</p>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-500" weight="fill" />
                          <span className="text-3xl font-bold">{submission.nilai}</span>
                        </div>
                      </div>
                    </div>
                    {submission.feedback && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-1">Feedback Guru</p>
                        <p className="text-sm whitespace-pre-wrap p-3 bg-white/60 rounded-lg">
                          {submission.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Calendar className="w-4 h-4 text-blue-600" weight="duotone" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="font-semibold text-sm">
                    {format(new Date(tugas.deadline), "dd MMM yyyy", { locale: id })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-50">
                  <Clock className="w-4 h-4 text-orange-600" weight="duotone" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Waktu</p>
                  <p className="font-semibold text-sm">
                    {format(new Date(tugas.deadline), "HH:mm", { locale: id })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <FileText className="w-4 h-4 text-purple-600" weight="duotone" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-semibold text-sm">
                    {hasSubmitted ? (
                      <span className="text-green-600">Sudah Dikumpulkan</span>
                    ) : (
                      <span className="text-orange-600">Belum Dikumpulkan</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
