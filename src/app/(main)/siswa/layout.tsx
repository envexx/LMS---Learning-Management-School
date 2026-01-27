import { SidebarProvider } from "@/components/ui/sidebar";
import { SiswaSidebar } from "./_components/siswa-sidebar";
import { SiswaHeader } from "./_components/siswa-header";

export default function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <SiswaSidebar />
      <main className="flex flex-1 flex-col">
        <SiswaHeader />
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
