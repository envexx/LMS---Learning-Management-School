"use client";

import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { ClipboardText, CheckCircle, Clock, Calendar, BookOpen, ArrowRight, Trophy } from "@phosphor-icons/react";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function SiswaTugasPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { data, error, isLoading } = useSWR('/api/siswa/tugas', fetcher);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data tugas</p>
      </div>
    );
  }

  const tugas = data?.data?.tugas || [];

  const stats = {
    total: tugas.length,
    selesai: tugas.filter((t: any) => t.submission).length,
    belum: tugas.filter((t: any) => !t.submission).length,
  };

  const getCardGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-green-500 to-emerald-500',
      'from-indigo-500 to-blue-500',
      'from-rose-500 to-orange-500',
    ];
    return gradients[index % gradients.length];
  };

  const getDaysLeft = (deadline: string) => {
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return { text: 'Terlewat', color: 'text-red-600', urgent: true };
    if (days === 0) return { text: 'Hari ini!', color: 'text-orange-600', urgent: true };
    if (days === 1) return { text: '1 hari lagi', color: 'text-orange-600', urgent: true };
    if (days <= 3) return { text: `${days} hari lagi`, color: 'text-yellow-600', urgent: true };
    return { text: `${days} hari lagi`, color: 'text-muted-foreground', urgent: false };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tugas</h1>
        <p className="text-muted-foreground">
          Lihat dan kerjakan tugas dari guru
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Card className="rounded-xl border-0 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/60 backdrop-blur-sm">
                <ClipboardText className="w-4 h-4 text-blue-600" weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/60 backdrop-blur-sm">
                <CheckCircle className="w-4 h-4 text-green-600" weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Selesai</p>
                <p className="text-2xl font-bold text-green-600">{stats.selesai}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-orange-50 to-red-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/60 backdrop-blur-sm">
                <Clock className="w-4 h-4 text-orange-600" weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Belum</p>
                <p className="text-2xl font-bold text-orange-600">{stats.belum}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {tugas.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <ClipboardText className="w-16 h-16 mx-auto text-muted-foreground mb-4" weight="duotone" />
              <p className="text-muted-foreground">Belum ada tugas</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tugas.map((t: any, index: number) => {
            const daysLeft = getDaysLeft(t.deadline);
            const hasSubmission = !!t.submission;
            const isLate = t.submission?.status === 'terlambat';
            
            const lightGradients = [
              'from-blue-50 to-cyan-50',
              'from-purple-50 to-pink-50',
              'from-orange-50 to-red-50',
              'from-green-50 to-emerald-50',
              'from-indigo-50 to-blue-50',
              'from-rose-50 to-orange-50',
            ];
            
            const iconColors = [
              'text-blue-600',
              'text-purple-600',
              'text-orange-600',
              'text-green-600',
              'text-indigo-600',
              'text-rose-600',
            ];
            
            return (
              <Card 
                key={t.id} 
                className={`rounded-3xl border-0 bg-gradient-to-br ${lightGradients[index % lightGradients.length]} shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer`}
                onClick={() => router.push(`/siswa/tugas/${t.id}`)}
              >
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-xl bg-white/60 backdrop-blur-sm">
                          <BookOpen className={`w-4 h-4 ${iconColors[index % iconColors.length]}`} weight="duotone" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {t.mapel}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg leading-tight line-clamp-2 mb-1">
                        {t.judul}
                      </h3>
                    </div>
                    {hasSubmission && (
                      <div className="p-2 rounded-xl bg-white/60 backdrop-blur-sm">
                        <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" weight="duotone" />
                      <span className="text-sm text-muted-foreground font-medium">
                        {format(new Date(t.deadline), "dd MMM yyyy", { locale: id })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${daysLeft.color}`} weight="duotone" />
                        <span className={`text-sm font-semibold ${daysLeft.color}`}>
                          {daysLeft.text}
                        </span>
                      </div>
                      
                      {hasSubmission && t.submission.nilai !== null && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 backdrop-blur-sm">
                          <Trophy className="w-4 h-4 text-amber-500" weight="fill" />
                          <span className="font-bold text-base">{t.submission.nilai}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        hasSubmission 
                          ? (isLate ? 'bg-orange-500' : 'bg-green-500')
                          : 'bg-gray-400'
                      }`} />
                      <span className="text-xs font-medium text-muted-foreground">
                        {hasSubmission ? (isLate ? 'Terlambat' : 'Selesai') : 'Belum dikerjakan'}
                      </span>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className={`rounded-xl ${iconColors[index % iconColors.length]} bg-white/60 hover:bg-white/80 backdrop-blur-sm border-0 shadow-none`}
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/siswa/tugas/${t.id}`);
                      }}
                    >
                      <span className="text-xs font-semibold">{hasSubmission ? 'Lihat' : 'Mulai'}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" weight="bold" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
