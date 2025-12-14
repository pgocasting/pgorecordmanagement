import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, FileText, BarChart3, Settings } from 'lucide-react';

interface SidebarProps {
  onNavigate?: () => void;
  recordTypes?: string[];
}

const recordTypeRoutes: { [key: string]: string } = {
  'Leave': '/leave',
  'Letter': '/letter',
  'Locator': '/locator',
  'Obligation Request': '/obligation-request',
  'Purchase Request': '/purchase-request',
  'Admin to PGO': '/admin-to-pgo',
  'Request for Overtime': '/overtime',
  'Travel Order': '/travel-order',
  'Voucher': '/voucher',
  'Others': '/others',
};

export function Sidebar({ onNavigate, recordTypes = [] }: SidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (href: string) => {
    onNavigate?.();
    navigate(href);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-indigo-600">PGO</h2>
        <p className="text-xs text-gray-500">Record Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Main Menu */}
        <button
          onClick={() => handleNavigate('/dashboard')}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
        >
          <Home className="h-5 w-5" />
          <span className="text-sm font-medium">Dashboard</span>
        </button>

        <button
          onClick={() => handleNavigate('/reports')}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-sm font-medium">Reports</span>
        </button>

        {/* Records Section */}
        {recordTypes.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3 px-4 py-2 text-gray-700">
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">Records</span>
            </div>
            <div className="pl-8 space-y-1">
              {recordTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    const href = recordTypeRoutes[type] || '/dashboard';
                    handleNavigate(href);
                  }}
                  className="w-full block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User Info Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-indigo-600">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Settings Button (Admin Only) */}
      {user?.role === 'admin' && (
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            onClick={() => handleNavigate('/settings')}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      )}
    </div>
  );
}
