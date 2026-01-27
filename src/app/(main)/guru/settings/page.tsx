"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FloppyDisk, Percent, Warning, ToggleLeft, ToggleRight } from "@phosphor-icons/react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface GradeWeightConfig {
  tugas: {
    name: string;
    weight: number;
    active: boolean;
  };
  uts: {
    name: string;
    weight: number;
    active: boolean;
  };
  uas: {
    name: string;
    weight: number;
    active: boolean;
  };
}

export default function GuruSettingsPage() {
  const [config, setConfig] = useState<GradeWeightConfig>({
    tugas: {
      name: "Tugas",
      weight: 30,
      active: true,
    },
    uts: {
      name: "UTS",
      weight: 30,
      active: true,
    },
    uas: {
      name: "UAS",
      weight: 40,
      active: true,
    },
  });

  const [tempConfig, setTempConfig] = useState<GradeWeightConfig>(config);

  useEffect(() => {
    // Load config from localStorage or API
    const savedConfig = localStorage.getItem("gradeWeightConfig");
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      setTempConfig(parsed);
    }
  }, []);

  const totalWeight = 
    (tempConfig.tugas.active ? tempConfig.tugas.weight : 0) +
    (tempConfig.uts.active ? tempConfig.uts.weight : 0) +
    (tempConfig.uas.active ? tempConfig.uas.weight : 0);
  const activeComponentCount = 
    (tempConfig.tugas.active ? 1 : 0) +
    (tempConfig.uts.active ? 1 : 0) +
    (tempConfig.uas.active ? 1 : 0);
  const isValidWeight = totalWeight === 100 && activeComponentCount > 0;

  const handleSave = () => {
    if (!isValidWeight) {
      toast.error("Total persentase harus 100%");
      return;
    }

    // Validate names
    if (!tempConfig.tugas.name || !tempConfig.uts.name || !tempConfig.uas.name) {
      toast.error("Semua nama komponen harus diisi");
      return;
    }

    // Save to localStorage or API
    localStorage.setItem("gradeWeightConfig", JSON.stringify(tempConfig));
    setConfig(tempConfig);
    toast.success("Pengaturan berhasil disimpan");
  };

  const handleReset = () => {
    const defaultConfig: GradeWeightConfig = {
      tugas: {
        name: "Tugas",
        weight: 30,
        active: true,
      },
      uts: {
        name: "UTS",
        weight: 30,
        active: true,
      },
      uas: {
        name: "UAS",
        weight: 40,
        active: true,
      },
    };
    setTempConfig(defaultConfig);
    toast.info("Pengaturan dikembalikan ke default");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola konfigurasi penilaian siswa</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Bobot Penilaian</CardTitle>
          <CardDescription>
            Atur nama dan persentase untuk setiap komponen penilaian. Total persentase harus 100%.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Komponen 1 - Tugas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Percent className="w-4 h-4 text-blue-600" weight="duotone" />
                </div>
                <h3 className="font-semibold">Komponen 1</h3>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="tugas-active" className="text-sm text-muted-foreground">
                  {tempConfig.tugas.active ? "Aktif" : "Nonaktif"}
                </Label>
                <Switch
                  id="tugas-active"
                  checked={tempConfig.tugas.active}
                  onCheckedChange={(checked) =>
                    setTempConfig({
                      ...tempConfig,
                      tugas: { ...tempConfig.tugas, active: checked },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tugas-name">Nama Komponen</Label>
                <Input
                  id="tugas-name"
                  placeholder="Tugas"
                  value={tempConfig.tugas.name}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      tugas: { ...tempConfig.tugas, name: e.target.value },
                    })
                  }
                  disabled={!tempConfig.tugas.active}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tugas-weight">Persentase (%)</Label>
                <Input
                  id="tugas-weight"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="30"
                  value={tempConfig.tugas.weight}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      tugas: { ...tempConfig.tugas, weight: parseInt(e.target.value) || 0 },
                    })
                  }
                  disabled={!tempConfig.tugas.active}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Komponen 2 - UTS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-50">
                  <Percent className="w-4 h-4 text-green-600" weight="duotone" />
                </div>
                <h3 className="font-semibold">Komponen 2</h3>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="uts-active" className="text-sm text-muted-foreground">
                  {tempConfig.uts.active ? "Aktif" : "Nonaktif"}
                </Label>
                <Switch
                  id="uts-active"
                  checked={tempConfig.uts.active}
                  onCheckedChange={(checked) =>
                    setTempConfig({
                      ...tempConfig,
                      uts: { ...tempConfig.uts, active: checked },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="uts-name">Nama Komponen</Label>
                <Input
                  id="uts-name"
                  placeholder="UTS"
                  value={tempConfig.uts.name}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      uts: { ...tempConfig.uts, name: e.target.value },
                    })
                  }
                  disabled={!tempConfig.uts.active}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uts-weight">Persentase (%)</Label>
                <Input
                  id="uts-weight"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="30"
                  value={tempConfig.uts.weight}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      uts: { ...tempConfig.uts, weight: parseInt(e.target.value) || 0 },
                    })
                  }
                  disabled={!tempConfig.uts.active}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Komponen 3 - UAS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Percent className="w-4 h-4 text-purple-600" weight="duotone" />
                </div>
                <h3 className="font-semibold">Komponen 3</h3>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="uas-active" className="text-sm text-muted-foreground">
                  {tempConfig.uas.active ? "Aktif" : "Nonaktif"}
                </Label>
                <Switch
                  id="uas-active"
                  checked={tempConfig.uas.active}
                  onCheckedChange={(checked) =>
                    setTempConfig({
                      ...tempConfig,
                      uas: { ...tempConfig.uas, active: checked },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="uas-name">Nama Komponen</Label>
                <Input
                  id="uas-name"
                  placeholder="UAS"
                  value={tempConfig.uas.name}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      uas: { ...tempConfig.uas, name: e.target.value },
                    })
                  }
                  disabled={!tempConfig.uas.active}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uas-weight">Persentase (%)</Label>
                <Input
                  id="uas-weight"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="40"
                  value={tempConfig.uas.weight}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      uas: { ...tempConfig.uas, weight: parseInt(e.target.value) || 0 },
                    })
                  }
                  disabled={!tempConfig.uas.active}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Total Weight Display */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-muted-foreground" weight="duotone" />
              <span className="font-semibold">Total Persentase</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${isValidWeight ? "text-green-600" : "text-red-600"}`}>
                {totalWeight}%
              </span>
              {!isValidWeight && (
                <Warning className="w-5 h-5 text-red-600" weight="duotone" />
              )}
            </div>
          </div>

          {!isValidWeight && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <Warning className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" weight="duotone" />
              <div className="text-sm text-red-600">
                <p className="font-semibold">
                  {activeComponentCount === 0 
                    ? "Minimal satu komponen harus aktif" 
                    : "Total persentase harus 100%"}
                </p>
                <p className="text-red-500">
                  {activeComponentCount === 0
                    ? "Aktifkan minimal satu komponen penilaian."
                    : `Saat ini total: ${totalWeight}%. Silakan sesuaikan persentase komponen yang aktif.`}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleReset}>
              Reset ke Default
            </Button>
            <Button onClick={handleSave} disabled={!isValidWeight}>
              <FloppyDisk className="w-4 h-4 mr-2" weight="bold" />
              Simpan Pengaturan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Konfigurasi</CardTitle>
          <CardDescription>
            Pratinjau bagaimana konfigurasi ini akan ditampilkan di halaman penilaian
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tempConfig.tugas.active && (
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="font-medium">{tempConfig.tugas.name}</span>
                <span className="text-muted-foreground">{tempConfig.tugas.weight}%</span>
              </div>
            )}
            {tempConfig.uts.active && (
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="font-medium">{tempConfig.uts.name}</span>
                <span className="text-muted-foreground">{tempConfig.uts.weight}%</span>
              </div>
            )}
            {tempConfig.uas.active && (
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="font-medium">{tempConfig.uas.name}</span>
                <span className="text-muted-foreground">{tempConfig.uas.weight}%</span>
              </div>
            )}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              Rumus perhitungan nilai akhir:
            </p>
            <p className="font-mono text-sm mt-1">
              Nilai Akhir = {[
                tempConfig.tugas.active && `(${tempConfig.tugas.name} × ${tempConfig.tugas.weight / 100})`,
                tempConfig.uts.active && `(${tempConfig.uts.name} × ${tempConfig.uts.weight / 100})`,
                tempConfig.uas.active && `(${tempConfig.uas.name} × ${tempConfig.uas.weight / 100})`
              ].filter(Boolean).join(' + ') || 'Tidak ada komponen aktif'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
