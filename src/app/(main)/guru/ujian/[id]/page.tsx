"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, FileText, ListChecks, Article } from "@phosphor-icons/react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function UjianDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoading: authLoading } = useAuth();

  const { data, error, isLoading } = useSWR(
    params.id ? `/api/guru/ujian/${params.id}` : null,
    fetcher
  );

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data ujian</p>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Ujian tidak ditemukan</p>
      </div>
    );
  }

  const ujian = data.data.ujian;
  const soalPG = data.data.soalPG || [];
  const soalEssay = data.data.soalEssay || [];

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
          <h1 className="text-3xl font-bold">{ujian.judul}</h1>
          <p className="text-muted-foreground">
            {ujian.kelas.join(", ")} • {ujian.mapel} • {format(new Date(ujian.tanggal), "dd MMMM yyyy", { locale: id })} • {ujian.waktuMulai} • {ujian.durasi} menit
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Ujian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Deskripsi</p>
            <p className="text-sm mt-1">{ujian.deskripsi || "-"}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${
                ujian.status === "aktif" ? "bg-green-100 text-green-700" :
                ujian.status === "draft" ? "bg-orange-100 text-orange-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {ujian.status === "aktif" ? "Aktif" : ujian.status === "draft" ? "Draft" : "Selesai"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Soal</p>
              <p className="text-sm mt-1 font-semibold">{soalPG.length + soalEssay.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Acak Soal</p>
              <p className="text-sm mt-1">{ujian.shuffleQuestions ? "Ya" : "Tidak"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tampilkan Nilai</p>
              <p className="text-sm mt-1">{ujian.showScore ? "Ya" : "Tidak"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {soalPG.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-blue-600" weight="duotone" />
              <CardTitle>Soal Pilihan Ganda ({soalPG.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {soalPG.map((soal: any) => (
              <div key={soal.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                    {soal.nomor}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{soal.pertanyaan}</p>
                  </div>
                </div>
                <div className="ml-11 space-y-2">
                  {['A', 'B', 'C', 'D'].map((option, idx) => (
                    <div 
                      key={option} 
                      className={`p-2 rounded border ${
                        soal.kunciJawaban === option 
                          ? 'bg-green-50 border-green-300' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <span className="font-medium text-sm">{option}. </span>
                      <span className="text-sm">{soal[`opsi${option}`]}</span>
                      {soal.kunciJawaban === option && (
                        <span className="ml-2 text-xs text-green-600 font-semibold">(Kunci Jawaban)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {soalEssay.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Article className="w-5 h-5 text-purple-600" weight="duotone" />
              <CardTitle>Soal Essay ({soalEssay.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {soalEssay.map((soal: any) => (
              <div key={soal.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm">
                    {soal.nomor}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{soal.pertanyaan}</p>
                  </div>
                </div>
                <div className="ml-11 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs font-semibold text-green-700 mb-1">Kunci Jawaban:</p>
                  <p className="text-sm text-green-900 whitespace-pre-wrap">{soal.kunciJawaban}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
