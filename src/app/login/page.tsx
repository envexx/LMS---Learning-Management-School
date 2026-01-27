"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const { login } = useAuth(false);

  useEffect(() => {
    // Fetch school info
    console.log('Fetching school info from frontend...');
    fetch('/api/school/info')
      .then(res => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('School info received:', data);
        if (data.success && data.data) {
          setSchoolInfo(data.data);
          console.log('School info set:', data.data);
        }
      })
      .catch(err => console.error('Error fetching school info:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ddeeff] via-[#aaccff] to-[#88aaff] p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {schoolInfo?.logo ? (
              <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-lg bg-white p-2">
                <Image
                  src={schoolInfo.logo}
                  alt={schoolInfo.nama || 'School Logo'}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <GraduationCap className="w-10 h-10 text-primary-foreground" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {schoolInfo?.nama || 'E-Learning System'}
          </CardTitle>
          <CardDescription>
            Masuk dengan Email dan Password Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#1488cc] to-[#2b32b2] hover:opacity-90 transition-opacity text-white"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>

            <div className="text-sm text-center text-muted-foreground mt-4">
              <p className="font-medium">Gunakan email yang terdaftar di sistem</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
