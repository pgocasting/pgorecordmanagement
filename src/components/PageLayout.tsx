import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface PageLayoutProps {
  title: string;
  subtitle: string;
  userName?: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function PageLayout({
  title,
  subtitle,
  userName,
  onLogout,
  children,
}: PageLayoutProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600">{subtitle}{userName && `, ${userName}`}</p>
        </div>
        <Button
          variant="outline"
          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
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
