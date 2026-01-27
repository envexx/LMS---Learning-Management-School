"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { 
  BookOpen, 
  ClipboardText, 
  Exam, 
  CheckCircle,
  Clock,
  Calendar,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function SiswaDashboardPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { data, error, isLoading } = useSWR('/api/siswa/dashboard', fetcher);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data dashboard</p>
      </div>
    );
  }

  const siswa = data?.data?.siswa || {};
  const stats = data?.data?.stats || {};
  const upcomingTugas = data?.data?.upcomingTugas || [];
  const upcomingUjian = data?.data?.upcomingUjian || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang, {siswa.nama} - {siswa.kelas}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <Card className="rounded-xl border-0 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/60 backdrop-blur-sm">
                <ClipboardText className="w-4 h-4 text-blue-600" weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Tugas</p>
                <p className="text-2xl font-bold">{stats.totalTugas || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/60 backdrop-blur-sm">
                <Exam className="w-4 h-4 text-purple-600" weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Ujian</p>
                <p className="text-2xl font-bold">{stats.totalUjian || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/60 backdrop-blur-sm">
                <BookOpen className="w-4 h-4 text-green-600" weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Materi</p>
                <p className="text-2xl font-bold">{stats.totalMateri || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-orange-50 to-red-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/60 backdrop-blur-sm">
                <CheckCircle className="w-4 h-4 text-orange-600" weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Nilai</p>
                <p className="text-2xl font-bold">{stats.rataRataNilai || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardText className="w-5 h-5 text-blue-600" weight="duotone" />
              Tugas Mendatang
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTugas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tidak ada tugas mendatang
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingTugas.map((tugas: any) => (
                  <div
                    key={tugas.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push('/siswa/tugas')}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{tugas.judul}</p>
                      <p className="text-xs text-muted-foreground">{tugas.mapel}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-orange-600" />
                        <span className="text-xs text-orange-600">
                          {format(new Date(tugas.deadline), "dd MMM yyyy", { locale: id })}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      tugas.status === 'sudah' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {tugas.status === 'sudah' ? 'Selesai' : 'Belum'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Exam className="w-5 h-5 text-purple-600" weight="duotone" />
              Ujian Mendatang
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingUjian.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tidak ada ujian mendatang
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingUjian.map((ujian: any) => (
                  <div
                    key={ujian.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push('/siswa/ujian')}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{ujian.judul}</p>
                      <p className="text-xs text-muted-foreground">{ujian.mapel}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-purple-600" />
                        <span className="text-xs text-purple-600">
                          {format(new Date(ujian.tanggal), "dd MMM yyyy", { locale: id })} • {ujian.waktuMulai} • {ujian.durasi} menit
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      ujian.status === 'sudah' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {ujian.status === 'sudah' ? 'Selesai' : 'Belum'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
