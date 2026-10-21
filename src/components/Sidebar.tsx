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
  const isDark = true;
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
    <div className={`h-full flex flex-col ${isDark ? 'bg-[#070d1e]/90 border-white/10 text-white' : 'bg-white/95 border-slate-200 text-slate-800'} backdrop-blur-2xl transition-all duration-300 border-r shadow-2xl relative z-20 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      {/* Logo Section */}
      <div className={`border-b ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/70'} relative transition-all duration-300 ${isCollapsed ? 'py-5 px-2' : 'p-5'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3.5 pr-6'}`}>
          <div className={`shrink-0 w-11 h-11 rounded-xl backdrop-blur-md border flex items-center justify-center shadow-lg ${isDark ? 'bg-white/[0.08] border-white/15 shadow-blue-500/10' : 'bg-white border-slate-200 shadow-slate-200'}`}>
            <img 
              src="/images/bataan-logo.png" 
              alt="Bataan Logo" 
              className={`object-contain transition-all duration-300 ${isCollapsed ? 'h-7 w-7' : 'h-8 w-8'}`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <h2 className={`text-base font-bold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>PGO Records</h2>
              <p className={`text-xs font-medium leading-tight mt-0.5 ${isDark ? 'text-blue-300/80' : 'text-blue-600'}`}>Management System</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-blue-500/50 z-30 border border-white/20 hover:scale-110 cursor-pointer"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin bg-transparent">
        {/* Main Menu */}
        <button
          onClick={() => handleNavigate('/dashboard')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${
            isActivePath('/dashboard')
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/35 border border-white/15 font-semibold'
              : isDark
                ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title={isCollapsed ? 'Dashboard' : ''}
        >
          <Home className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110 ${isActivePath('/dashboard') ? 'text-white' : isDark ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-500 group-hover:text-blue-600'}`} />
          {!isCollapsed && <span className="text-sm">Dashboard</span>}
        </button>

        {user?.role === 'admin' && (
          <button
            onClick={() => handleNavigate('/reports')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${
              isActivePath('/reports')
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/35 border border-white/15 font-semibold'
                : isDark
                  ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title={isCollapsed ? 'Reports' : ''}
          >
            <BarChart3 className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110 ${isActivePath('/reports') ? 'text-white' : isDark ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-500 group-hover:text-blue-600'}`} />
            {!isCollapsed && <span className="text-sm">Reports</span>}
          </button>
        )}

        <button
          onClick={() => handleNavigate('/receiving-copy')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${
            isActivePath('/receiving-copy')
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/35 border border-white/15 font-semibold'
              : isDark
                ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title={isCollapsed ? 'Receiving Copy' : ''}
        >
          <Printer className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110 ${isActivePath('/receiving-copy') ? 'text-white' : isDark ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-500 group-hover:text-blue-600'}`} />
          {!isCollapsed && <span className="text-sm">Receiving Copy</span>}
        </button>

        {/* Records Section */}
        {visibleRecordTypes.length > 0 && (
          <div className="space-y-1 pt-2">
            {!isCollapsed ? (
              <>
                <button
                  onClick={() => setIsRecordsExpanded(!isRecordsExpanded)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer group ${
                    isDark
                      ? 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110 ${isDark ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-500 group-hover:text-blue-600'}`} />
                    <span className="text-sm font-semibold">Records</span>
                  </div>
                  {isRecordsExpanded ? (
                    <ChevronUp className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  ) : (
                    <ChevronDown className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
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
                          className={`w-full flex items-center px-3.5 py-2 rounded-lg transition-all text-left text-xs cursor-pointer ${
                            isActive
                              ? isDark
                                ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30 shadow-inner'
                                : 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                              : isDark
                                ? 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span className={`mr-2.5 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' : isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
                          <span className="truncate">{type}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => handleNavigate('/leave')}
                className={`w-full flex items-center justify-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  isDark
                    ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Records"
              >
                <FileText className="h-5 w-5 shrink-0" />
              </button>
            )}
          </div>
        )}
      </nav>



      {/* Date and Time Display */}
      <div className={`p-3 border-t ${isDark ? 'border-white/10 bg-white/[0.01]' : 'border-slate-200 bg-slate-50/50'}`}>
        <div className={`p-2.5 rounded-xl border flex items-center ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-slate-200 shadow-xs'} ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Clock className={`h-4.5 w-4.5 shrink-0 animate-pulse ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-bold uppercase tracking-widest leading-none ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Philippine Time</p>
              <p className={`text-xs font-semibold truncate mt-1 leading-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{currentDateTime}</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings Button (Admin Only) */}
      {user?.role === 'admin' && (
        <div className={`p-3 border-t bg-transparent ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <Button
            variant="outline"
            className={`w-full justify-start gap-3 transition-all shadow-sm ${
              isDark
                ? 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600'
            } ${isCollapsed ? 'px-2' : ''}`}
            onClick={() => handleNavigate('/settings')}
            title={isCollapsed ? 'Settings' : ''}
          >
            <Settings className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span className="font-semibold text-sm">Settings</span>}
          </Button>
        </div>
      )}
    </div>
  );
}
