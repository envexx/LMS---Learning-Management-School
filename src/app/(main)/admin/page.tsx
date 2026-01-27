"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Student, Users, BookOpen, ClipboardText } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface DashboardStats {
  totalSiswa: number;
  totalGuru: number;
  totalKelas: number;
  ujianAktif: number;
}

interface Activity {
  type: string;
  message: string;
  timestamp: string;
  color: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSiswa: 0,
    totalGuru: 0,
    totalKelas: 0,
    ujianAktif: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch statistics
        const statsResponse = await fetch('/api/dashboard/stats');
        const statsResult = await statsResponse.json();
        
        if (statsResult.success) {
          setStats(statsResult.data);
        }

        // Fetch activities
        const activitiesResponse = await fetch('/api/dashboard/activities');
        const activitiesResult = await activitiesResponse.json();
        
        if (activitiesResult.success) {
          setActivities(activitiesResult.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "Total Siswa",
      value: stats.totalSiswa,
      icon: Student,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      title: "Total Guru",
      value: stats.totalGuru,
      icon: Users,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
    },
    {
      title: "Total Kelas",
      value: stats.totalKelas,
      icon: BookOpen,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
    },
    {
      title: "Ujian Aktif",
      value: stats.ujianAktif,
      icon: ClipboardText,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-50",
    },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground">Selamat datang di panel administrator</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconColor={stat.iconColor}
            iconBg={stat.iconBg}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada aktivitas
                </p>
              ) : (
                activities.map((activity, index) => {
                  const colorMap: Record<string, string> = {
                    blue: 'bg-gradient-to-r from-[#1488cc] to-[#2b32b2]',
                    green: 'bg-green-600',
                    purple: 'bg-purple-600',
                    orange: 'bg-orange-600',
                  };
                  
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${colorMap[activity.color] || 'bg-gray-600'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { 
                            addSuffix: true, 
                            locale: id 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <a
                href="/admin/siswa"
                className="p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <p className="font-medium text-sm">Tambah Siswa</p>
                <p className="text-xs text-muted-foreground">Daftarkan siswa baru</p>
              </a>
              <a
                href="/admin/kelas"
                className="p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <p className="font-medium text-sm">Kelola Kelas</p>
                <p className="text-xs text-muted-foreground">Atur kelas dan siswa</p>
              </a>
              <a
                href="/admin/token-ujian"
                className="p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <p className="font-medium text-sm">Token Ujian</p>
                <p className="text-xs text-muted-foreground">Kelola akses ujian</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
