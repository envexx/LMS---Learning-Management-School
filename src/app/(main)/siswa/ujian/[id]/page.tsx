"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MathRenderer } from "@/components/ui/math-renderer";
import { ArrowLeft, Clock, CheckCircle, LockKey } from "@phosphor-icons/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function SiswaUjianDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [token, setToken] = useState("");
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  const [ujianData, setUjianData] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (params.id) {
      fetchUjianDetail();
    }
  }, [params.id]);

  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isStarted, timeLeft]);

  const fetchUjianDetail = async () => {
    try {
      const response = await fetch(`/api/siswa/ujian/${params.id}`);
      const result = await response.json();
      
      if (result.success) {
        setUjianData(result.data);
        
        // Check if already submitted
        if (result.data.submission) {
          toast.info("Anda sudah mengerjakan ujian ini");
          router.push(`/siswa/ujian/${params.id}/hasil`);
          return;
        }
        
        // Check if can start
        if (!result.data.canStart) {
          toast.error("Ujian belum dapat dimulai");
          router.push('/siswa/ujian');
          return;
        }
      } else {
        toast.error(result.error || "Gagal memuat data ujian");
        router.push('/siswa/ujian');
      }
    } catch (error) {
      console.error('Error fetching ujian:', error);
      toast.error("Terjadi kesalahan");
      router.push('/siswa/ujian');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartExam = () => {
    setShowTokenModal(true);
  };

  const handleValidateToken = async () => {
    if (!token.trim()) {
      toast.error("Token harus diisi");
      return;
    }

    setIsValidatingToken(true);
    try {
      const response = await fetch('/api/siswa/ujian/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Token valid! Ujian dimulai");
        setShowTokenModal(false);
        setIsStarted(true);
        setTimeLeft(ujianData.ujian.durasi * 60); // Convert to seconds
      } else {
        toast.error(result.error || "Token tidak valid");
      }
    } catch (error) {
      console.error('Error validating token:', error);
      toast.error("Terjadi kesalahan saat validasi token");
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    if (confirm("Apakah Anda yakin ingin mengumpulkan ujian?")) {
      try {
        console.log('Submitting ujian with answers:', answers);
        console.log('Total answers:', Object.keys(answers).length);
        
        const response = await fetch(`/api/siswa/ujian/${params.id}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);

        if (response.ok && result.success) {
          toast.success(result.data.message || "Ujian berhasil dikumpulkan!");
          router.push(`/siswa/ujian/${params.id}/hasil`);
        } else {
          console.error('Submission failed:', result.error);
          toast.error(result.error || "Gagal mengumpulkan ujian");
        }
      } catch (error) {
        console.error('Error submitting ujian:', error);
        toast.error("Terjadi kesalahan");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!ujianData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Ujian tidak ditemukan</p>
      </div>
    );
  }

  const { ujian, soalPG, soalEssay } = ujianData;
  const allQuestions = [...soalPG, ...soalEssay];
  const currentQ = allQuestions[currentQuestion];
  const isPG = currentQuestion < soalPG.length;

  if (!isStarted) {
    return (
      <>
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
              <h1 className="text-3xl font-bold">{ujian.judul}</h1>
              <p className="text-muted-foreground">{ujian.mapel}</p>
            </div>
          </div>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Informasi Ujian</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal & Waktu</p>
                    <p className="font-semibold">
                      {format(new Date(ujian.tanggal), "dd MMMM yyyy", { locale: id })} • {ujian.waktuMulai}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Durasi</p>
                    <p className="font-semibold">{ujian.durasi} menit</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Soal</p>
                    <p className="font-semibold">{ujian.totalSoal} soal</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jenis Soal</p>
                    <p className="font-semibold">{soalPG.length} PG • {soalEssay.length} Essay</p>
                  </div>
                </div>
              </div>

              {ujian.deskripsi && (
                <div>
                  <h3 className="font-semibold mb-2">Deskripsi</h3>
                  <MathRenderer content={ujian.deskripsi} className="text-muted-foreground" />
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  onClick={handleStartExam}
                  className="w-full"
                  size="lg"
                >
                  <LockKey className="w-5 h-5 mr-2" weight="fill" />
                  Mulai Ujian
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Masukkan Token Ujian</DialogTitle>
              <DialogDescription>
                Masukkan token 6-digit yang diberikan oleh admin untuk memulai ujian
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="token">Token Ujian</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              <Button
                onClick={handleValidateToken}
                disabled={isValidatingToken}
                className="w-full"
              >
                {isValidatingToken ? "Memvalidasi..." : "Mulai Ujian"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm sticky top-0 z-10">
        <div>
          <h2 className="font-bold">{ujian.judul}</h2>
          <p className="text-sm text-muted-foreground">
            Soal {currentQuestion + 1} dari {allQuestions.length}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg">
          <Clock className="w-5 h-5 text-orange-600" weight="fill" />
          <span className="font-mono font-bold text-orange-600">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-8 space-y-6">
          <div>
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                {currentQuestion + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  {isPG ? "Pilihan Ganda" : "Essay"}
                </p>
                <MathRenderer content={currentQ.pertanyaan || ""} className="text-lg" />
              </div>
            </div>

            {isPG ? (
              <RadioGroup
                value={answers[currentQ.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
                className="space-y-3"
              >
                {['A', 'B', 'C', 'D'].map((option) => (
                  <div key={option} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value={option} id={`${currentQ.id}-${option}`} />
                    <Label htmlFor={`${currentQ.id}-${option}`} className="flex-1 cursor-pointer">
                      <span className="font-semibold mr-2">{option}.</span>
                      <MathRenderer content={currentQ[`opsi${option}`] || ""} className="inline" />
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                placeholder="Tulis jawaban Anda di sini..."
                rows={8}
                className="mt-4"
              />
            )}
          </div>

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              Sebelumnya
            </Button>

            {currentQuestion === allQuestions.length - 1 ? (
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" weight="fill" />
                Kumpulkan Ujian
              </Button>
            ) : (
              <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
                Selanjutnya
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Navigasi Soal</h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {allQuestions.map((q, idx) => (
              <Button
                key={q.id}
                variant={idx === currentQuestion ? "default" : answers[q.id] ? "secondary" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestion(idx)}
                className="w-full"
              >
                {idx + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
