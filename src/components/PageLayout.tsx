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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
          
          {/* User Info and Logout */}
          <div className="flex items-center gap-2">
            {userName && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <User className="h-3 w-3 text-indigo-600" />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 truncate capitalize">{userRole}</p>
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div
        className="flex-1 overflow-auto p-6 bg-linear-to-br from-gray-100 via-gray-50 to-gray-100"
        style={{
          backgroundImage:
            'linear-gradient(0deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px',
        }}
      >
        {children}
      </div>
    </div>
  );
}
