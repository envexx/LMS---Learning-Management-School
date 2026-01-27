"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, Trash, FileText, Clock, Users, CheckCircle, Exam, CheckCircle as CheckCirclePhosphor, File, XCircle, PencilSimple } from "@phosphor-icons/react";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Ujian {
  id: string;
  judul: string;
  deskripsi: string;
  kelas: string;
  mapel: string;
  tanggal: Date;
  waktuMulai: string;
  durasi: number;
  jumlahSoal: number;
  status: "draft" | "aktif" | "selesai";
  jumlahPeserta?: number;
  sudahMengerjakan?: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function UjianGuruPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data, error, isLoading, mutate } = useSWR(
    `/api/guru/ujian?status=${filterStatus}`,
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

  const ujian = data?.data?.ujian || [];

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus ujian ini?")) {
      try {
        const response = await fetch(`/api/guru/ujian?id=${id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok && result.success) {
          await mutate();
          toast.success("Ujian berhasil dihapus");
        } else {
          toast.error(result.error || "Gagal menghapus ujian");
        }
      } catch (error) {
        console.error('Error deleting ujian:', error);
        toast.error("Terjadi kesalahan saat menghapus ujian");
      }
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const response = await fetch('/api/guru/ujian', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'aktif' }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await mutate();
        toast.success("Ujian berhasil dipublikasikan");
      } else {
        toast.error(result.error || "Gagal mempublikasikan ujian");
      }
    } catch (error) {
      console.error('Error publishing ujian:', error);
      toast.error("Terjadi kesalahan saat mempublikasikan ujian");
    }
  };

  const stats = {
    total: ujian.length,
    aktif: ujian.filter((u: any) => u.status === "aktif").length,
    draft: ujian.filter((u: any) => u.status === "draft").length,
    selesai: ujian.filter((u: any) => u.status === "selesai").length,
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Manajemen Ujian</h1>
          <p className="text-sm md:text-base text-muted-foreground">Kelola ujian dan penilaian</p>
        </div>
        <Button onClick={() => router.push("/guru/ujian/create")}>
          <Plus className="w-4 h-4 mr-2" weight="bold" />
          Buat Ujian Baru
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
          title="Total Ujian"
          value={stats.total}
          icon={Exam}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Aktif"
          value={stats.aktif}
          icon={CheckCirclePhosphor}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Draft"
          value={stats.draft}
          icon={File}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
        <StatCard
          title="Selesai"
          value={stats.selesai}
          icon={XCircle}
          iconColor="text-gray-600"
          iconBg="bg-gray-50"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Ujian</CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="selesai">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul Ujian</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Soal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ujian.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Tidak ada ujian
                  </TableCell>
                </TableRow>
              ) : (
                ujian.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{u.judul}</p>
                        <p className="text-sm text-muted-foreground">{u.mapel}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(u.kelas) ? (
                          u.kelas.map((kelas: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-700 font-medium">
                              {kelas}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-700 font-medium">
                            {u.kelas}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(u.tanggal), "dd MMM yyyy", { locale: id })} • {u.waktuMulai}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm">{u.waktuMulai}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{u.durasi} mnt</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm">{u.totalSoalPG + u.totalSoalEssay}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        u.status === "aktif" ? "bg-green-100 text-green-700" :
                        u.status === "draft" ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {u.status === "aktif" ? "Aktif" : u.status === "draft" ? "Draft" : "Selesai"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => router.push(`/guru/ujian/${u.id}`)}
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => router.push(`/guru/ujian/${u.id}/edit`)}
                          title="Edit Ujian"
                        >
                          <PencilSimple className="w-4 h-4 text-orange-600" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => router.push(`/guru/ujian/${u.id}/nilai`)}
                          title="Nilai"
                        >
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        </Button>
                        {u.status === "draft" && (
                          <Button size="sm" variant="ghost" onClick={() => handlePublish(u.id)} title="Publish">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)} title="Hapus">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
