"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, CameraSlash, CheckCircle, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import Webcam from "react-webcam";
import jsQR from "jsqr";

interface ScannedStudent {
  nisn: string;
  nama: string;
  kelas: string;
  waktu: string;
  status: string;
}

export default function ScanPresensiPage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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

    // Check if already scanned
    const alreadyScanned = scannedStudents.find(s => s.nisn === nisn);
    if (alreadyScanned) {
      toast.warning(`${alreadyScanned.nama} sudah di-scan sebelumnya`);
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
        const newStudent: ScannedStudent = {
          nisn: result.data.siswa.nisn,
          nama: result.data.siswa.nama,
          kelas: result.data.siswa.kelas.nama,
          waktu: new Date().toLocaleTimeString('id-ID'),
          status: result.data.status,
        };

        setScannedStudents(prev => [newStudent, ...prev]);
        toast.success(`✅ ${newStudent.nama} - Hadir`);
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
            <h1 className="text-3xl font-bold">Scan Presensi Pagi</h1>
            <p className="text-muted-foreground">Scan QR code kartu pelajar untuk presensi pagi hari</p>
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
                <p>• Arahkan kamera ke QR code pada kartu pelajar</p>
                <p>• Pastikan QR code terlihat jelas dan tidak blur</p>
                <p>• Sistem akan otomatis mendeteksi dan mencatat presensi</p>
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
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {student.waktu}
                        </p>
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
