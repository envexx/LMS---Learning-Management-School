"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChartBar, Trophy, ClipboardText, Exam } from "@phosphor-icons/react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function SiswaRaportPage() {
  const { isLoading: authLoading } = useAuth();
  const { data, error, isLoading } = useSWR('/api/siswa/raport', fetcher);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data raport</p>
      </div>
    );
  }

  const siswa = data?.data?.siswa || {};
  const raport = data?.data?.raport || [];
  const rataRataKeseluruhan = data?.data?.rataRataKeseluruhan || 0;
  const totalTugasDinilai = data?.data?.totalTugasDinilai || 0;
  const totalUjianDinilai = data?.data?.totalUjianDinilai || 0;

  const getNilaiColor = (nilai: number) => {
    if (nilai >= 85) return 'text-green-600 bg-green-50';
    if (nilai >= 70) return 'text-blue-600 bg-blue-50';
    if (nilai >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Raport</h1>
        <p className="text-muted-foreground">
          {siswa.nama} - {siswa.nisn} - {siswa.kelas}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Card className="rounded-xl border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/60 backdrop-blur-sm">
                <Trophy className="w-5 h-5 text-purple-600" weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Rata-rata</p>
                <p className="text-2xl font-bold">{rataRataKeseluruhan}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/60 backdrop-blur-sm">
                <ClipboardText className="w-4 h-4 text-blue-600" weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Tugas</p>
                <p className="text-2xl font-bold">{totalTugasDinilai}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/60 backdrop-blur-sm">
                <Exam className="w-4 h-4 text-green-600" weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Ujian</p>
                <p className="text-2xl font-bold">{totalUjianDinilai}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBar className="w-5 h-5 text-purple-600" weight="duotone" />
            Nilai Per Mata Pelajaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          {raport.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Belum ada nilai yang tersedia
            </p>
          ) : (
            <div className="space-y-6">
              {raport.map((r: any) => (
                <div key={r.mapel} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{r.mapel}</h3>
                    <div className={`px-4 py-2 rounded-lg font-bold text-xl ${getNilaiColor(r.rataRata)}`}>
                      {r.rataRata}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium mb-2">Tugas ({r.totalTugas})</p>
                      <div className="space-y-1">
                        {r.tugas.map((t: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                            <span className="truncate">{t.judul}</span>
                            <span className="font-semibold ml-2">{t.nilai}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Ujian ({r.totalUjian})</p>
                      <div className="space-y-1">
                        {r.ujian.map((u: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                            <span className="truncate">{u.judul}</span>
                            <span className="font-semibold ml-2">{u.nilai}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
