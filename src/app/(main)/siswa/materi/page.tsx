"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Download, FileText, Video, Link as LinkIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function SiswaMateriPage() {
  const { isLoading: authLoading } = useAuth();
  const { data, error, isLoading } = useSWR('/api/siswa/materi', fetcher);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data materi</p>
      </div>
    );
  }

  const materi = data?.data?.materi || [];

  const getIcon = (tipe: string) => {
    switch (tipe) {
      case 'video':
        return <Video className="w-5 h-5" weight="duotone" />;
      case 'link':
        return <LinkIcon className="w-5 h-5" weight="duotone" />;
      default:
        return <FileText className="w-5 h-5" weight="duotone" />;
    }
  };

  const getColor = (tipe: string) => {
    switch (tipe) {
      case 'video':
        return 'text-red-600 bg-red-50';
      case 'link':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Materi Pembelajaran</h1>
        <p className="text-muted-foreground">
          Akses materi pembelajaran dari guru
        </p>
      </div>

      {materi.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" weight="duotone" />
              <p className="text-muted-foreground">Belum ada materi tersedia</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materi.map((m: any) => (
            <Card key={m.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${getColor(m.tipe)}`}>
                    {getIcon(m.tipe)}
                  </div>
                  <span className="text-xs px-2 py-1 bg-muted rounded-full">
                    {m.tipe}
                  </span>
                </div>
                <CardTitle className="text-lg mt-3">{m.judul}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {m.deskripsi}
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Mapel:</span> {m.mapel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Guru:</span> {m.guru}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(m.createdAt), "dd MMM yyyy", { locale: id })}
                  </p>
                </div>
                {m.fileUrl && (
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => window.open(m.fileUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" weight="bold" />
                    {m.tipe === 'link' ? 'Buka Link' : 'Download Materi'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
