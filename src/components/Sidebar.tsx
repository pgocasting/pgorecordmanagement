import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, FileText, BarChart3, Settings, Printer, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

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
  'Processing': '/processing',
  'Receiving Copy': '/receiving-copy',
};

export function Sidebar({ onNavigate, recordTypes = [] }: SidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Update current date and time every second
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const philippinesTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
      const formattedDateTime = philippinesTime.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila'
      });
      setCurrentDateTime(formattedDateTime);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (href: string) => {
    onNavigate?.();
    navigate(href);
  };

  return (
    <div className={`h-full flex flex-col bg-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo Section */}
      <div className={`border-b border-gray-200 bg-linear-to-r from-indigo-50 to-blue-50 relative transition-all duration-300 ${isCollapsed ? 'py-4 px-2' : 'p-6'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 pr-8'}`}>
          <div className="shrink-0">
            <img 
              src="/images/bataan-logo.png" 
              alt="Bataan Logo" 
              className={`object-contain transition-all duration-300 ${isCollapsed ? 'h-12 w-12' : 'h-14 w-14'}`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <h2 className="text-xl font-bold text-indigo-700 leading-tight">PGO</h2>
              <p className="text-xs text-gray-700 font-medium leading-tight mt-0.5">Record Management</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg z-10 border-2 border-white"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Main Menu */}
        <button
          onClick={() => handleNavigate('/dashboard')}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
          title={isCollapsed ? 'Dashboard' : ''}
        >
          <Home className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Dashboard</span>}
        </button>

        {user?.role === 'admin' && (
          <button
            onClick={() => handleNavigate('/reports')}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
            title={isCollapsed ? 'Reports' : ''}
          >
            <BarChart3 className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Reports</span>}
          </button>
        )}

        <button
          onClick={() => handleNavigate('/receiving-copy')}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
          title={isCollapsed ? 'Receiving Copy' : ''}
        >
          <Printer className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Receiving Copy</span>}
        </button>

        {/* Records Section */}
        {recordTypes.length > 0 && !isCollapsed && (
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

      {/* Date and Time Display */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-indigo-600 shrink-0" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500">Philippine Time</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{currentDateTime}</p>
            </div>
          )}
          {isCollapsed && (
            <div className="text-xs text-gray-600 text-center">
              {currentDateTime.split(', ')[1] || '--:--'}
            </div>
          )}
        </div>
      </div>

      {/* Settings Button (Admin Only) */}
      {user?.role === 'admin' && (
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            onClick={() => handleNavigate('/settings')}
            title={isCollapsed ? 'Settings' : ''}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </Button>
        </div>
      )}
    </div>
  );
}
