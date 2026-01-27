"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  ArrowLeft, 
  Plus, 
  Trash, 
  FileText, 
  ListChecks, 
  Article,
  Upload,
  Download,
  Shuffle,
  Eye,
  EyeClosed,
} from "@phosphor-icons/react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { parseWordFile } from "@/lib/wordParser";

interface MultipleChoiceQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface EssayQuestion {
  id: string;
  question: string;
  answerKey: string;
}

interface ExamInfo {
  judul: string;
  deskripsi: string;
  kelas: string[];
  mapelId: string;
  tanggal: Date;
  waktuMulai: string;
  durasi: number;
  shuffleQuestions: boolean;
  showScore: boolean;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function CreateUjianPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("info");
  
  const [examInfo, setExamInfo] = useState<ExamInfo>({
    judul: "",
    deskripsi: "",
    kelas: [],
    mapelId: "",
    tanggal: new Date(),
    waktuMulai: "08:00",
    durasi: 90,
    shuffleQuestions: false,
    showScore: true,
  });

  const { data, error, isLoading } = useSWR('/api/guru/ujian?status=all', fetcher);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data</p>
      </div>
    );
  }

  const kelasList = data?.data?.kelasList || [];
  const mapelList = data?.data?.mapelList || [];

  const [multipleChoice, setMultipleChoice] = useState<MultipleChoiceQuestion[]>([
    {
      id: "1",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    },
  ]);

  const [essay, setEssay] = useState<EssayQuestion[]>([
    {
      id: "1",
      question: "",
      answerKey: "",
    },
  ]);

  const handleAddMultipleChoice = () => {
    setMultipleChoice([
      ...multipleChoice,
      {
        id: Date.now().toString(),
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
  };

  const handleRemoveMultipleChoice = (id: string) => {
    setMultipleChoice(multipleChoice.filter((q) => q.id !== id));
  };

  const handleAddEssay = () => {
    setEssay([
      ...essay,
      {
        id: Date.now().toString(),
        question: "",
        answerKey: "",
      },
    ]);
  };

  const handleRemoveEssay = (id: string) => {
    setEssay(essay.filter((q) => q.id !== id));
  };

  const handleImportWord = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      toast.error("Format file harus .docx");
      return;
    }

    try {
      toast.loading("Memproses file Word...");
      const parsed = await parseWordFile(file);
      
      // Convert parsed data to our format
      const newMultipleChoice = parsed.soalPG.map((soal, idx) => ({
        id: `imported-pg-${Date.now()}-${idx}`,
        question: soal.pertanyaan,
        options: [soal.opsiA, soal.opsiB, soal.opsiC, soal.opsiD],
        correctAnswer: soal.kunciJawaban === 'A' ? 0 : soal.kunciJawaban === 'B' ? 1 : soal.kunciJawaban === 'C' ? 2 : 3,
      }));

      const newEssay = parsed.soalEssay.map((soal, idx) => ({
        id: `imported-essay-${Date.now()}-${idx}`,
        question: soal.pertanyaan,
        answerKey: soal.kunciJawaban,
      }));

      setMultipleChoice([...multipleChoice, ...newMultipleChoice]);
      setEssay([...essay, ...newEssay]);
      
      toast.dismiss();
      toast.success(`Berhasil import ${newMultipleChoice.length} soal PG dan ${newEssay.length} soal Essay`);
      
      // Switch to appropriate tab
      if (newMultipleChoice.length > 0) {
        setActiveTab("multiple");
      } else if (newEssay.length > 0) {
        setActiveTab("essay");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Gagal memproses file Word. Pastikan format file sesuai template.");
      console.error(error);
    }

    // Reset input
    event.target.value = '';
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/template-soal-ujian.txt';
    link.download = 'Template-Soal-Ujian.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Template berhasil didownload");
  };

  const handleKelasToggle = (kelas: string) => {
    setExamInfo(prev => ({
      ...prev,
      kelas: prev.kelas.includes(kelas)
        ? prev.kelas.filter(k => k !== kelas)
        : [...prev.kelas, kelas]
    }));
  };

  const handleSave = async (status: "draft" | "publish") => {
    // Validate
    if (!examInfo.judul || examInfo.kelas.length === 0 || !examInfo.mapelId) {
      toast.error("Mohon lengkapi informasi ujian dan pilih minimal 1 kelas");
      setActiveTab("info");
      return;
    }

    const totalQuestions = multipleChoice.length + essay.length;
    if (totalQuestions === 0) {
      toast.error("Tambahkan minimal 1 soal");
      return;
    }

    try {
      const response = await fetch('/api/guru/ujian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: examInfo.judul,
          deskripsi: examInfo.deskripsi,
          mapelId: examInfo.mapelId,
          kelas: examInfo.kelas,
          tanggal: examInfo.tanggal,
          waktuMulai: examInfo.waktuMulai,
          durasi: examInfo.durasi,
          shuffleQuestions: examInfo.shuffleQuestions,
          showScore: examInfo.showScore,
          status: status === "publish" ? "aktif" : "draft",
          soalPG: multipleChoice.map(q => ({
            pertanyaan: q.question,
            opsiA: q.options[0],
            opsiB: q.options[1],
            opsiC: q.options[2],
            opsiD: q.options[3],
            kunciJawaban: ['A', 'B', 'C', 'D'][q.correctAnswer],
          })),
          soalEssay: essay.map(q => ({
            pertanyaan: q.question,
            kunciJawaban: q.answerKey,
          })),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(status === "draft" ? "Ujian disimpan sebagai draft" : "Ujian berhasil dipublikasikan");
        router.push("/guru/ujian");
      } else {
        toast.error(result.error || "Gagal menyimpan ujian");
      }
    } catch (error) {
      console.error('Error saving ujian:', error);
      toast.error("Terjadi kesalahan saat menyimpan ujian");
    }
  };

  const totalQuestions = multipleChoice.length + essay.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/guru/ujian")}
          >
            <ArrowLeft className="w-5 h-5" weight="bold" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Buat Ujian Baru</h1>
            <p className="text-muted-foreground">
              Buat dan kelola soal ujian untuk siswa
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => handleSave("draft")} className="w-full sm:w-auto">
            Simpan Draft
          </Button>
          <Button onClick={() => handleSave("publish")} className="w-full sm:w-auto">
            Publikasikan
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info" className="gap-2">
            <FileText className="w-4 h-4" weight="duotone" />
            Informasi
          </TabsTrigger>
          <TabsTrigger value="multiple" className="gap-2">
            <ListChecks className="w-4 h-4" weight="duotone" />
            Pilihan Ganda ({multipleChoice.length})
          </TabsTrigger>
          <TabsTrigger value="essay" className="gap-2">
            <Article className="w-4 h-4" weight="duotone" />
            Essay ({essay.length})
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="w-4 h-4" weight="duotone" />
            Import Word
          </TabsTrigger>
        </TabsList>

        {/* Tab Informasi */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Ujian</CardTitle>
              <CardDescription>
                Atur detail dan konfigurasi ujian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="judul">Judul Ujian</Label>
                <Input
                  id="judul"
                  placeholder="Contoh: Ulangan Harian Matematika Bab 3"
                  value={examInfo.judul}
                  onChange={(e) => setExamInfo({ ...examInfo, judul: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea
                  id="deskripsi"
                  placeholder="Deskripsi singkat tentang ujian"
                  value={examInfo.deskripsi}
                  onChange={(e) => setExamInfo({ ...examInfo, deskripsi: e.target.value })}
                  className="w-full"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Kelas (Pilih satu atau lebih)</Label>
                <div className="grid grid-cols-3 gap-3 p-4 border rounded-lg">
                  {kelasList.map((kelas: any) => (
                    <div key={kelas.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`exam-kelas-${kelas.id}`}
                        checked={examInfo.kelas.includes(kelas.nama)}
                        onCheckedChange={() => handleKelasToggle(kelas.nama)}
                      />
                      <label
                        htmlFor={`exam-kelas-${kelas.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {kelas.nama}
                      </label>
                    </div>
                  ))}
                </div>
                {examInfo.kelas.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Dipilih: {examInfo.kelas.join(", ")}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mapel">Mata Pelajaran</Label>
                  <Select
                    value={examInfo.mapelId}
                    onValueChange={(value) => setExamInfo({ ...examInfo, mapelId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Mata Pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {mapelList.map((mapel: any) => (
                        <SelectItem key={mapel.id} value={mapel.id}>
                          {mapel.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal">Tanggal Ujian</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !examInfo.tanggal && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {examInfo.tanggal ? format(examInfo.tanggal, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={examInfo.tanggal}
                        onSelect={(date) => date && setExamInfo({ ...examInfo, tanggal: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label htmlFor="waktuMulai">Waktu Mulai</Label>
                  <Input
                    id="waktuMulai"
                    type="time"
                    value={examInfo.waktuMulai}
                    onChange={(e) => setExamInfo({ ...examInfo, waktuMulai: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durasi">Durasi (menit)</Label>
                  <Input
                    id="durasi"
                    type="number"
                    min="15"
                    placeholder="90"
                    value={examInfo.durasi}
                    onChange={(e) => setExamInfo({ ...examInfo, durasi: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Pengaturan Ujian</h3>
                
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <Shuffle className="w-5 h-5 text-purple-600" weight="duotone" />
                    </div>
                    <div>
                      <Label htmlFor="shuffle" className="font-medium">Acak Urutan Soal</Label>
                      <p className="text-sm text-muted-foreground">
                        Soal akan ditampilkan secara acak untuk setiap siswa
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="shuffle"
                    checked={examInfo.shuffleQuestions}
                    onCheckedChange={(checked) => setExamInfo({ ...examInfo, shuffleQuestions: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50">
                      {examInfo.showScore ? (
                        <Eye className="w-5 h-5 text-green-600" weight="duotone" />
                      ) : (
                        <EyeClosed className="w-5 h-5 text-gray-600" weight="duotone" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="showScore" className="font-medium">Tampilkan Nilai ke Siswa</Label>
                      <p className="text-sm text-muted-foreground">
                        Siswa dapat melihat nilai setelah menyelesaikan ujian
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="showScore"
                    checked={examInfo.showScore}
                    onCheckedChange={(checked) => setExamInfo({ ...examInfo, showScore: checked })}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Soal</span>
                  <span className="text-lg font-bold">{totalQuestions}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Pilihan Ganda: {multipleChoice.length} • Essay: {essay.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pilihan Ganda */}
        <TabsContent value="multiple" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Soal Pilihan Ganda</CardTitle>
                  <CardDescription>
                    Tambah dan kelola soal pilihan ganda
                  </CardDescription>
                </div>
                <Button onClick={handleAddMultipleChoice}>
                  <Plus className="w-4 h-4 mr-2" weight="bold" />
                  Tambah Soal
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {multipleChoice.map((question, index) => (
                <div key={question.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold">Soal {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMultipleChoice(question.id)}
                      disabled={multipleChoice.length === 1}
                    >
                      <Trash className="w-4 h-4 text-red-600" weight="duotone" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Pertanyaan</Label>
                    <Textarea
                      placeholder="Tulis pertanyaan di sini..."
                      value={question.question}
                      onChange={(e) => {
                        const updated = [...multipleChoice];
                        updated[index].question = e.target.value;
                        setMultipleChoice(updated);
                      }}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Pilihan Jawaban</Label>
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <Input
                          placeholder={`Pilihan ${String.fromCharCode(65 + optIndex)}`}
                          value={option}
                          onChange={(e) => {
                            const updated = [...multipleChoice];
                            updated[index].options[optIndex] = e.target.value;
                            setMultipleChoice(updated);
                          }}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Kunci Jawaban</Label>
                    <Select
                      value={question.correctAnswer.toString()}
                      onValueChange={(value) => {
                        const updated = [...multipleChoice];
                        updated[index].correctAnswer = parseInt(value);
                        setMultipleChoice(updated);
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">A</SelectItem>
                        <SelectItem value="1">B</SelectItem>
                        <SelectItem value="2">C</SelectItem>
                        <SelectItem value="3">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Essay */}
        <TabsContent value="essay" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Soal Essay</CardTitle>
                  <CardDescription>
                    Tambah dan kelola soal essay
                  </CardDescription>
                </div>
                <Button onClick={handleAddEssay}>
                  <Plus className="w-4 h-4 mr-2" weight="bold" />
                  Tambah Soal
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {essay.map((question, index) => (
                <div key={question.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold">Soal {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEssay(question.id)}
                      disabled={essay.length === 1}
                    >
                      <Trash className="w-4 h-4 text-red-600" weight="duotone" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Pertanyaan</Label>
                    <Textarea
                      placeholder="Tulis pertanyaan essay di sini..."
                      value={question.question}
                      onChange={(e) => {
                        const updated = [...essay];
                        updated[index].question = e.target.value;
                        setEssay(updated);
                      }}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Kunci Jawaban</Label>
                    <Textarea
                      placeholder="Tulis kunci jawaban atau poin-poin penting yang harus ada dalam jawaban siswa..."
                      value={question.answerKey}
                      onChange={(e) => {
                        const updated = [...essay];
                        updated[index].answerKey = e.target.value;
                        setEssay(updated);
                      }}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Kunci jawaban ini akan membantu Anda dalam menilai jawaban siswa
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Import Word */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Soal dari Word</CardTitle>
              <CardDescription>
                Upload file Word (.docx) yang berisi soal ujian dengan format tertentu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" weight="bold" />
                  Download Template
                </Button>
              </div>

              <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" weight="duotone" />
                <h3 className="font-semibold mb-2">Upload File Word</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Klik tombol di bawah untuk memilih file .docx
                </p>
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleImportWord}
                  className="hidden"
                  id="word-upload"
                />
                <label htmlFor="word-upload">
                  <Button asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" weight="bold" />
                      Pilih File
                    </span>
                  </Button>
                </label>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Format File Word:</h4>
                <div className="p-4 bg-muted rounded-lg space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-blue-600">A. PILIHAN GANDA</p>
                    <pre className="text-xs mt-2 bg-white p-3 rounded border">
{`1. Pertanyaan soal nomor 1?
A. Pilihan A
B. Pilihan B
C. Pilihan C
D. Pilihan D
Kunci Jawaban: A`}
                    </pre>
                  </div>
                  
                  <div>
                    <p className="font-medium text-green-600 mt-4">B. ESSAY</p>
                    <pre className="text-xs mt-2 bg-white p-3 rounded border">
{`1. Jelaskan tentang...
Kunci Jawaban: Jawaban harus mencakup:
- Poin penting 1
- Poin penting 2`}
                    </pre>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="font-medium text-yellow-800 text-xs">⚠️ Catatan Penting:</p>
                    <ul className="text-xs text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                      <li>File harus dalam format .docx (Microsoft Word)</li>
                      <li>Gunakan format "Kunci Jawaban:" (bukan "Jawaban:")</li>
                      <li>Untuk PG: Kunci Jawaban harus A, B, C, atau D</li>
                      <li>Pisahkan section Pilihan Ganda dan Essay dengan jelas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
