"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, FloppyDisk } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function EditUjianPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    judul: "",
    deskripsi: "",
    durasi: 0,
  });

  useEffect(() => {
    if (params.id) {
      fetchUjianData();
    }
  }, [params.id]);

  const fetchUjianData = async () => {
    try {
      const response = await fetch(`/api/guru/ujian/${params.id}`);
      const result = await response.json();
      
      if (result.success) {
        const ujian = result.data;
        setFormData({
          judul: ujian.judul,
          deskripsi: ujian.deskripsi || "",
          durasi: ujian.durasi,
        });
      }
    } catch (error) {
      console.error('Error fetching ujian:', error);
      toast.error("Gagal memuat data ujian");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.judul.trim()) {
      toast.error("Judul ujian harus diisi");
      return;
    }

    if (formData.durasi <= 0) {
      toast.error("Durasi ujian harus lebih dari 0");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/guru/ujian/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Ujian berhasil diupdate");
        router.push('/guru/ujian');
      } else {
        toast.error(result.error || "Gagal mengupdate ujian");
      }
    } catch (error) {
      console.error('Error updating ujian:', error);
      toast.error("Terjadi kesalahan saat mengupdate ujian");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

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
          <h1 className="text-3xl font-bold">Edit Ujian</h1>
          <p className="text-muted-foreground">
            Edit informasi ujian
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Ujian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="judul">Judul Ujian *</Label>
            <Input
              id="judul"
              value={formData.judul}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              placeholder="Masukkan judul ujian"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              placeholder="Masukkan deskripsi ujian (opsional)"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="durasi">Durasi (menit) *</Label>
            <Input
              id="durasi"
              type="number"
              value={formData.durasi}
              onChange={(e) => setFormData({ ...formData, durasi: parseInt(e.target.value) || 0 })}
              placeholder="90"
              min="1"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>Menyimpan...</>
              ) : (
                <>
                  <FloppyDisk className="w-4 h-4 mr-2" weight="bold" />
                  Simpan Perubahan
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/guru/ujian')}
            >
              Batal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
