import { useState, type ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import HelpCenter from "../HelpCenter";
import GlobalWarnings from "../GlobalWarnings";
import BottomNav from "./BottomNav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="flex min-h-screen">
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen} 
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)} 
        />

        <div className="flex min-w-0 flex-1 flex-col pb-[68px] lg:pb-0">
          <GlobalWarnings />
          <Header onToggleHelp={() => setIsHelpOpen(!isHelpOpen)} />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>

      <HelpCenter isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      
      <BottomNav onOpenMenu={() => setIsMobileMenuOpen(true)} />
    </div>
  );
}
