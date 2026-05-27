import { useState, type ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import HelpCenter from "../HelpCenter";
import GlobalWarnings from "../GlobalWarnings";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <GlobalWarnings />
          <Header onToggleHelp={() => setIsHelpOpen(!isHelpOpen)} />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>

      <HelpCenter isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
