import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ToastProvider } from "@/components/ui/toast";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="max-w-[600px] mx-auto bg-white min-h-screen border-x border-rose-200 relative pb-[60px]">
        <Navbar />
        {children}
        <MobileNav />
      </div>
    </ToastProvider>
  );
}
