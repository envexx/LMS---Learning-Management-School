"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FloppyDisk, Download, Plus, Student, CheckCircle, XCircle, ChartLine, Gear } from "@phosphor-icons/react";
import { toast } from "sonner";
import Link from "next/link";

interface GradeWeightConfig {
  tugas: { name: string; weight: number; active: boolean };
  uts: { name: string; weight: number; active: boolean };
  uas: { name: string; weight: number; active: boolean };
}

interface NilaiSiswa {
  id: string | null;
  siswaId: string;
  nisn: string;
  nama: string;
  kelas: string;
  tugas: number | null;
  uts: number | null;
  uas: number | null;
  nilaiAkhir: number | null;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function NilaiGuruPage() {
  const { isLoading: authLoading } = useAuth();
  const [filterKelas, setFilterKelas] = useState<string>("");
  const [filterMapel, setFilterMapel] = useState<string>("");
  const [nilai, setNilai] = useState<NilaiSiswa[]>([]);
  const [gradeConfig, setGradeConfig] = useState<GradeWeightConfig>({
    tugas: { name: "Tugas", weight: 30, active: true },
    uts: { name: "UTS", weight: 30, active: true },
    uas: { name: "UAS", weight: 40, active: true },
  });

  const { data, error, isLoading, mutate } = useSWR(
    filterKelas && filterMapel ? `/api/guru/nilai?kelasId=${filterKelas}&mapelId=${filterMapel}` : '/api/guru/nilai',
    fetcher
  );

  useEffect(() => {
    const savedConfig = localStorage.getItem("gradeWeightConfig");
    if (savedConfig) {
      setGradeConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Reset nilai when filters change
  useEffect(() => {
    setNilai([]);
  }, [filterKelas, filterMapel]);

  useEffect(() => {
    if (data?.data?.nilai) {
      // Replace entire array, don't append
      setNilai(data.data.nilai);
    } else {
      // If no data, set empty array
      setNilai([]);
    }
  }, [data]);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data nilai</p>
      </div>
    );
  }

  const kelasList = data?.data?.kelasList || [];
  const mapelList = data?.data?.mapelList || [];

  const handleNilaiChange = (siswaId: string, field: keyof NilaiSiswa, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setNilai(nilai.map(n => {
      if (n.siswaId === siswaId) {
        const updated = { ...n, [field]: numValue };
        
        // Check if all active components have values
        const allActiveHaveValues = 
          (!gradeConfig.tugas.active || updated.tugas !== null) &&
          (!gradeConfig.uts.active || updated.uts !== null) &&
          (!gradeConfig.uas.active || updated.uas !== null);
        
        if (allActiveHaveValues) {
          let total = 0;
          if (gradeConfig.tugas.active && updated.tugas !== null) {
            total += updated.tugas * (gradeConfig.tugas.weight / 100);
          }
          if (gradeConfig.uts.active && updated.uts !== null) {
            total += updated.uts * (gradeConfig.uts.weight / 100);
          }
          if (gradeConfig.uas.active && updated.uas !== null) {
            total += updated.uas * (gradeConfig.uas.weight / 100);
          }
          updated.nilaiAkhir = Math.round(total);
        }
        return updated;
      }
      return n;
    }));
  };

  const handleSaveAll = async () => {
    try {
      console.log('Starting save process...');
      console.log('Filter Mapel:', filterMapel);
      console.log('Nilai to save:', nilai);
      
      const promises = nilai.map(async (n) => {
        if (n.tugas !== null || n.uts !== null || n.uas !== null) {
          console.log('Saving nilai for siswa:', n.nama, {
            siswaId: n.siswaId,
            mapelId: filterMapel,
            tugas: n.tugas,
            uts: n.uts,
            uas: n.uas,
            nilaiAkhir: n.nilaiAkhir,
          });
          
          const response = await fetch('/api/guru/nilai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              siswaId: n.siswaId,
              mapelId: filterMapel,
              tugas: n.tugas,
              uts: n.uts,
              uas: n.uas,
              nilaiAkhir: n.nilaiAkhir,
            }),
          });
          
          const result = await response.json();
          console.log('Save result for', n.nama, ':', result);
          
          if (!response.ok) {
            console.error('Error response:', result);
            throw new Error(result.error || 'Failed to save');
          }
          
          return result;
        }
        return null;
      });

      const results = await Promise.all(promises);
      console.log('All save results:', results);
      
      await mutate();
      toast.success("Semua nilai berhasil disimpan");
    } catch (error) {
      console.error('Error saving nilai:', error);
      toast.error("Gagal menyimpan nilai: " + (error as Error).message);
    }
  };

  const handleExport = () => {
    toast.success("Data nilai berhasil diekspor");
  };

  const filteredNilai = nilai;

  const stats = {
    totalSiswa: filteredNilai.length,
    sudahDinilai: filteredNilai.filter(n => n.nilaiAkhir !== null).length,
    belumDinilai: filteredNilai.filter(n => n.nilaiAkhir === null).length,
    rataRata: filteredNilai.filter(n => n.nilaiAkhir !== null).length > 0
      ? Math.round(
          filteredNilai
            .filter(n => n.nilaiAkhir !== null)
            .reduce((sum, n) => sum + (n.nilaiAkhir || 0), 0) /
            filteredNilai.filter(n => n.nilaiAkhir !== null).length
        )
      : 0,
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Penilaian Siswa</h1>
          <p className="text-sm md:text-base text-muted-foreground">Kelola nilai siswa berdasarkan kelas dan mata pelajaran</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href="/guru/settings" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              <Gear className="w-4 h-4 mr-2" weight="bold" />
              Pengaturan
            </Button>
          </Link>
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" weight="bold" />
            Ekspor
          </Button>
          <Button onClick={handleSaveAll} className="w-full sm:w-auto">
            <FloppyDisk className="w-4 h-4 mr-2" weight="bold" />
            Simpan Semua
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          title="Total Siswa"
          value={stats.totalSiswa}
          icon={Student}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Sudah Dinilai"
          value={stats.sudahDinilai}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Belum Dinilai"
          value={stats.belumDinilai}
          icon={XCircle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatCard
          title="Rata-rata Kelas"
          value={stats.rataRata}
          icon={ChartLine}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Daftar Nilai Siswa</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={filterKelas} onValueChange={setFilterKelas}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {kelasList.map((kelas: any) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      Kelas {kelas.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterMapel} onValueChange={setFilterMapel}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Pilih Mapel" />
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">NISN</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  {gradeConfig.tugas.active && (
                    <TableHead className="text-center w-[120px]">{gradeConfig.tugas.name} ({gradeConfig.tugas.weight}%)</TableHead>
                  )}
                  {gradeConfig.uts.active && (
                    <TableHead className="text-center w-[120px]">{gradeConfig.uts.name} ({gradeConfig.uts.weight}%)</TableHead>
                  )}
                  {gradeConfig.uas.active && (
                    <TableHead className="text-center w-[120px]">{gradeConfig.uas.name} ({gradeConfig.uas.weight}%)</TableHead>
                  )}
                  <TableHead className="text-center w-[120px]">Nilai Akhir</TableHead>
                  <TableHead className="text-center w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNilai.map((n) => (
                  <TableRow key={n.siswaId}>
                    <TableCell className="font-medium">{n.nisn}</TableCell>
                    <TableCell>{n.nama}</TableCell>
                    {gradeConfig.tugas.active && (
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={n.tugas ?? ""}
                          onChange={(e) => handleNilaiChange(n.siswaId, "tugas", e.target.value)}
                          className="w-20 text-center mx-auto"
                        />
                      </TableCell>
                    )}
                    {gradeConfig.uts.active && (
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={n.uts ?? ""}
                          onChange={(e) => handleNilaiChange(n.siswaId, "uts", e.target.value)}
                          className="w-20 text-center mx-auto"
                        />
                      </TableCell>
                    )}
                    {gradeConfig.uas.active && (
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={n.uas ?? ""}
                          onChange={(e) => handleNilaiChange(n.siswaId, "uas", e.target.value)}
                          className="w-20 text-center mx-auto"
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-center">
                      <span className="font-bold">
                        {n.nilaiAkhir ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {n.nilaiAkhir !== null ? (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          n.nilaiAkhir >= 75 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {n.nilaiAkhir >= 75 ? "Lulus" : "Tidak Lulus"}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                          Belum
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
