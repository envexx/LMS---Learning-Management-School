"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, CameraSlash, CheckCircle, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import { useSiswa } from "@/hooks/useSWR";

interface ScannedStudent {
  nisn: string;
  nama: string;
  kelas: string;
  waktu: string;
  status: string;
  tipe?: string;
}

export default function ScanPresensiPage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Load semua data siswa ke cache SWR
  const { data: siswaData, isLoading: siswaLoading } = useSiswa('all');
  
  // Cache siswa dalam Map untuk akses cepat berdasarkan NISN
  const [siswaCache, setSiswaCache] = useState<Map<string, any>>(new Map());
  
  useEffect(() => {
    const siswa = (siswaData as any)?.data;
    if (siswa && Array.isArray(siswa)) {
      const cache = new Map();
      siswa.forEach((siswa: any) => {
        cache.set(siswa.nisn, {
          id: siswa.id,
          nisn: siswa.nisn,
          nama: siswa.nama,
          kelas: siswa.kelas?.nama || '',
          namaWali: siswa.namaWali,
          noTelpWali: siswa.noTelpWali,
        });
      });
      setSiswaCache(cache);
    }
  }, [siswaData]);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const videoConstraints = {
    facingMode: "environment",
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };

  const scanQRCode = useCallback(async () => {
    if (!webcamRef.current || !isScanning || isProcessing) {
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        handleQRCodeDetected(code.data);
      }
    };
  }, [isScanning, isProcessing]);

  React.useEffect(() => {
    if (isScanning) {
      const interval = setInterval(scanQRCode, 500);
      return () => clearInterval(interval);
    }
  }, [isScanning, scanQRCode]);

  const handleQRCodeDetected = async (nisn: string) => {
    if (isProcessing) return;

    // Check if already scanned today
    const alreadyScanned = scannedStudents.find(s => s.nisn === nisn);
    if (alreadyScanned) {
      // Ambil data dari cache untuk menampilkan nama
      const siswaData = siswaCache.get(nisn);
      const nama = siswaData?.nama || nisn;
      toast.warning(`${nama} sudah di-scan sebelumnya`);
      return;
    }

    // Cek apakah siswa ada di cache
    const siswaData = siswaCache.get(nisn);
    if (!siswaData && !siswaLoading) {
      toast.error('Siswa tidak ditemukan');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/presensi/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nisn,
          type: 'hadir',
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const tipe = result.data.tipe || 'masuk';
        const waktu = result.data.waktu || new Date().toLocaleTimeString('id-ID');
        
        const newStudent: ScannedStudent = {
          nisn: result.data.siswa.nisn,
          nama: result.data.siswa.nama,
          kelas: result.data.siswa.kelas.nama,
          waktu: waktu,
          status: result.data.status,
          tipe: tipe,
        };

        setScannedStudents(prev => [newStudent, ...prev]);
        
        const tipeText = tipe === 'masuk' ? 'Masuk' : 'Pulang';
        toast.success(`✅ ${newStudent.nama} - ${tipeText} (${waktu})`);
        playAudio();
      } else {
        toast.error(result.error || 'Gagal mencatat presensi');
      }
    } catch (error) {
      console.error('Error scanning:', error);
      toast.error('Terjadi kesalahan saat memproses QR code');
    } finally {
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  const toggleScanning = () => {
    setIsScanning(!isScanning);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src="/audio/good-morning.wav" preload="auto" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Scan Presensi</h1>
            <p className="text-muted-foreground">Scan QR code kartu absensi untuk presensi masuk/pulang</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Kamera Scanner</span>
                <Badge variant={isScanning ? "default" : "secondary"}>
                  {isScanning ? "Aktif" : "Nonaktif"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Webcam */}
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                {isScanning ? (
                  <>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      className="w-full h-full object-cover"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                          <p>Memproses...</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 border-4 border-blue-500/50 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-blue-500"></div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Camera className="h-16 w-16 mx-auto mb-2" />
                      <p>Kamera tidak aktif</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={toggleScanning}
                  className="flex-1"
                  variant={isScanning ? "destructive" : "default"}
                >
                  {isScanning ? (
                    <>
                      <CameraSlash className="mr-2 h-4 w-4" />
                      Stop Scanning
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Mulai Scanning
                    </>
                  )}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Arahkan kamera ke QR code pada kartu absensi</p>
                <p>• Pastikan QR code terlihat jelas dan tidak blur</p>
                <p>• Sistem akan otomatis mendeteksi dan mencatat presensi (masuk/pulang)</p>
                <p>• Pesan notifikasi akan dikirim ke WhatsApp orang tua</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scanned Students List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Siswa Ter-scan</span>
                <Badge variant="outline">{scannedStudents.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scannedStudents.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <XCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada siswa yang di-scan</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {scannedStudents.map((student, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" weight="fill" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{student.nama}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.kelas} • {student.nisn}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={student.tipe === 'masuk' ? 'default' : 'secondary'} className="text-xs">
                            {student.tipe === 'masuk' ? 'Masuk' : 'Pulang'}
                          </Badge>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {student.waktu}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
