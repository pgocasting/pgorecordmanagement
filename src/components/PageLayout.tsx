import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface PageLayoutProps {
  title: string;
  subtitle: string;
  userName?: string;
  userRole?: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function PageLayout({
  title,
  subtitle,
  userName,
  userRole,
  onLogout,
  children,
}: PageLayoutProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden relative z-10">
      {/* Top Bar */}
      <div className="bg-[#090e1f]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3.5 sm:py-4 shadow-lg shadow-black/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
            <p className="text-xs sm:text-sm text-blue-200/70 mt-0.5">{subtitle}</p>
          </div>
          
          {/* User Info and Logout */}
          <div className="flex flex-wrap items-center gap-2.5">
            {userName && (
              <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-white/[0.04] backdrop-blur-md rounded-xl border border-white/10 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{userName}</p>
                  <p className="text-[10px] text-blue-400 font-medium truncate capitalize">{userRole}</p>
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              className="gap-2 bg-red-500/10 border-red-500/30 text-red-400 hover:text-white hover:bg-red-600 hover:border-red-600 h-9 px-3 rounded-xl transition-all shadow-sm"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline font-medium text-xs">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-transparent">
        {children}
      </div>
    </div>
  );
}
