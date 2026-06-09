import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { pageVisibilityService } from '@/services/firebaseService';
import { Button } from '@/components/ui/button';
import { Home, FileText, BarChart3, Settings, Printer, ChevronLeft, ChevronRight, Clock, ChevronDown, ChevronUp } from 'lucide-react';

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
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRecordsExpanded, setIsRecordsExpanded] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [pageVisibility, setPageVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadPageVisibility = async () => {
      try {
        const visibility = await pageVisibilityService.getPageVisibility();
        setPageVisibility(visibility || {});
      } catch (error) {
        console.error('Error loading page visibility:', error);
        setPageVisibility({});
      }
    };

    loadPageVisibility();
  }, []);

  const visibleRecordTypes = recordTypes.filter(type => pageVisibility[type] !== false);

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

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`h-full flex flex-col bg-gradient-to-b from-indigo-600 via-indigo-700 to-indigo-800 shadow-2xl transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      {/* Logo Section */}
      <div className={`border-b border-indigo-500/30 relative transition-all duration-300 ${isCollapsed ? 'py-6 px-2' : 'p-6'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 pr-8'}`}>
          <div className="shrink-0 bg-white rounded-full p-2 shadow-lg">
            <img 
              src="/images/bataan-logo.png" 
              alt="Bataan Logo" 
              className={`object-contain transition-all duration-300 ${isCollapsed ? 'h-8 w-8' : 'h-10 w-10'}`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-white leading-tight tracking-tight">PGO</h2>
              <p className="text-sm text-indigo-200 font-medium leading-tight mt-1">Record Management</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-50 transition-all shadow-lg z-10 border-2 border-indigo-500 hover:scale-110"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-indigo-800">
        {/* Main Menu */}
        <button
          onClick={() => handleNavigate('/dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group ${
            isActivePath('/dashboard')
              ? 'bg-white text-indigo-700 shadow-lg'
              : 'text-white hover:bg-indigo-500/30'
          }`}
          title={isCollapsed ? 'Dashboard' : ''}
        >
          <Home className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${isActivePath('/dashboard') ? 'text-indigo-700' : ''}`} />
          {!isCollapsed && <span className="text-sm font-semibold">Dashboard</span>}
        </button>

        {user?.role === 'admin' && (
          <button
            onClick={() => handleNavigate('/reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group ${
              isActivePath('/reports')
                ? 'bg-white text-indigo-700 shadow-lg'
                : 'text-white hover:bg-indigo-500/30'
            }`}
            title={isCollapsed ? 'Reports' : ''}
          >
            <BarChart3 className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${isActivePath('/reports') ? 'text-indigo-700' : ''}`} />
            {!isCollapsed && <span className="text-sm font-semibold">Reports</span>}
          </button>
        )}

        <button
          onClick={() => handleNavigate('/receiving-copy')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group ${
            isActivePath('/receiving-copy')
              ? 'bg-white text-indigo-700 shadow-lg'
              : 'text-white hover:bg-indigo-500/30'
          }`}
          title={isCollapsed ? 'Receiving Copy' : ''}
        >
          <Printer className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${isActivePath('/receiving-copy') ? 'text-indigo-700' : ''}`} />
          {!isCollapsed && <span className="text-sm font-semibold">Receiving Copy</span>}
        </button>

        {/* Records Section */}
        {visibleRecordTypes.length > 0 && (
          <div className="space-y-1 pt-2">
            {!isCollapsed ? (
              <>
                <button
                  onClick={() => setIsRecordsExpanded(!isRecordsExpanded)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-white hover:bg-indigo-500/30 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
                    <span className="text-sm font-semibold">Records</span>
                  </div>
                  {isRecordsExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {isRecordsExpanded && (
                  <div className="pl-3 space-y-1 mt-1">
                    {visibleRecordTypes.map((type) => {
                      const href = recordTypeRoutes[type] || '/dashboard';
                      const isActive = isActivePath(href);
                      return (
                        <button
                          key={type}
                          onClick={() => handleNavigate(href)}
                          className={`w-full flex items-start px-4 py-2.5 rounded-lg transition-all text-left text-sm ${
                            isActive
                              ? 'bg-indigo-500/50 text-white font-semibold'
                              : 'text-indigo-100 hover:bg-indigo-500/20 hover:text-white'
                          }`}
                        >
                          <span className="mr-2">•</span>
                          <span>{type}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => handleNavigate('/leave')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-white hover:bg-indigo-500/30 rounded-xl transition-all"
                title="Records"
              >
                <FileText className="h-5 w-5 shrink-0" />
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Date and Time Display */}
      <div className="p-4 border-t border-indigo-500/30 bg-indigo-900/30">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Clock className="h-5 w-5 text-indigo-300 shrink-0 animate-pulse" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-indigo-300 uppercase tracking-wide">Philippine Time</p>
              <p className="text-sm font-bold text-white truncate mt-0.5">{currentDateTime}</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings Button (Admin Only) */}
      {user?.role === 'admin' && (
        <div className="p-3 border-t border-indigo-500/30">
          <Button
            variant="outline"
            className={`w-full justify-start gap-3 bg-white/10 text-white border-white/20 hover:bg-white hover:text-indigo-700 transition-all shadow-lg backdrop-blur-sm ${
              isCollapsed ? 'px-2' : ''
            }`}
            onClick={() => handleNavigate('/settings')}
            title={isCollapsed ? 'Settings' : ''}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="font-semibold">Settings</span>}
          </Button>
        </div>
      )}
    </div>
  );
}
