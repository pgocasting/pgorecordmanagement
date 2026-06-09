import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Menu, LogOut, Search, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sidebar } from '@/components/Sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { voucherService, letterService, leaveService, locatorService, adminToPGOService, othersService, travelOrderService, overtimeService, obligationRequestService, purchaseRequestService } from '@/services/firebaseService';

interface Record {
  id: string;
  trackingId: string;
  title: string;
  date: string;
  dateTimeIn?: string;
  dateTimeOut?: string;
  dateTimeRejected?: string;
  status: 'active' | 'archived' | 'pending' | 'completed' | 'rejected';
  category: string;
  amount?: number;
  receivedBy?: string;
}

const extractName = (fullNameField: string): string => {
  if (!fullNameField) return '';
  // If the field contains tracking ID format like "(L) 2025/12/12 - 001", extract the actual name
  // Otherwise return as is
  const match = fullNameField.match(/^[^-]*-\s*(.+)$/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return fullNameField;
};

const extractDateFromText = (text?: string): string | undefined => {
  if (!text) return undefined;

  // ISO-ish timestamp (with optional seconds / ms / Z)
  const isoMatch = text.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z)?/);
  if (isoMatch?.[0]) return isoMatch[0];

  // Bracketed date/time (e.g. [12/26/2025, 9:30 AM])
  const bracketMatch = text.match(/\[([^\]]+)\]/);
  if (bracketMatch?.[1]) {
    const parsed = new Date(bracketMatch[1]);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return undefined;
};

const getOutTimestamp = (record: any): string | undefined => {
  if (record?.dateTimeOut) return record.dateTimeOut;

  // Some pages store time-out info inside remarks fields.
  const fromTimeOutRemarks = extractDateFromText(record?.timeOutRemarks);
  if (fromTimeOutRemarks) return fromTimeOutRemarks;

  const fromRemarks = extractDateFromText(record?.remarks);
  if (fromRemarks) return fromRemarks;

  const history = record?.remarksHistory;
  if (Array.isArray(history) && history.length > 0) {
    const completedEntries = history.filter((h: any) => h?.status === 'Completed' && h?.timestamp);
    if (completedEntries.length > 0) {
      const lastCompleted = completedEntries[completedEntries.length - 1];
      return lastCompleted.timestamp;
    }
  }

  return undefined;
};

const getRejectedTimestamp = (record: any): string | undefined => {
  const history = record?.remarksHistory;
  if (Array.isArray(history) && history.length > 0) {
    const rejectedEntries = history.filter((h: any) => h?.status === 'Rejected' && h?.timestamp);
    if (rejectedEntries.length > 0) {
      const lastRejected = rejectedEntries[rejectedEntries.length - 1];
      return lastRejected.timestamp;
    }
  }

  const fromRemarks = extractDateFromText(record?.remarks);
  if (fromRemarks) return fromRemarks;

  if (record?.updatedAt) return record.updatedAt;
  return undefined;
};

const formatDateTime = (value?: string): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<Record[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'rejected'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Avatar view state
  const [isAvatarViewOpen, setIsAvatarViewOpen] = useState(false);
  const [viewingAvatar, setViewingAvatar] = useState('');

  const handleAvatarView = (avatarSrc: string, userName: string) => {
    if (avatarSrc) {
      setViewingAvatar(avatarSrc);
      setIsAvatarViewOpen(true);
      console.log('Viewing avatar for:', userName);
    }
  };

  // Load records on mount
  useEffect(() => {
    const loadAllPendingRecords = async () => {
      try {
        const allRecords: Record[] = [];

        // Fetch all collections in parallel
        const [vouchers, letters, leaves, locators, adminToPGO, others, travelOrders, overtimes, obligationRequests, purchaseRequests] = await Promise.all([
          voucherService.getVouchers(),
          letterService.getLetters(),
          leaveService.getLeaves(),
          locatorService.getLocators(),
          adminToPGOService.getRecords(),
          othersService.getRecords(),
          travelOrderService.getTravelOrders(),
          overtimeService.getOvertimes(),
          obligationRequestService.getObligationRequests(),
          purchaseRequestService.getPurchaseRequests()
        ]);

        // Process vouchers
        vouchers.forEach((v: any) => {
          if (v.status === 'Pending' || v.status === 'Completed' || v.status === 'Rejected') {
            allRecords.push({
              id: v.id,
              trackingId: v.trackingId,
              title: v.payee,
              date: formatDateTime(v.dateTimeIn),
              dateTimeIn: v.dateTimeIn,
              dateTimeOut: getOutTimestamp(v),
              dateTimeRejected: v.status === 'Rejected' ? getRejectedTimestamp(v) : undefined,
              status: v.status === 'Completed' ? 'completed' : v.status === 'Rejected' ? 'rejected' : 'pending',
              category: 'Voucher',
              amount: v.amount || 0,
              receivedBy: v.receivedBy || '-'
            });
          }
        });

        // Process letters
        letters.forEach((l: any) => {
          if (l.status === 'Pending' || l.status === 'Completed' || l.status === 'Rejected') {
            allRecords.push({
              id: l.id,
              trackingId: l.trackingId,
              title: extractName(l.fullName),
              date: formatDateTime(l.dateTimeIn),
              dateTimeIn: l.dateTimeIn,
              dateTimeOut: getOutTimestamp(l),
              dateTimeRejected: l.status === 'Rejected' ? getRejectedTimestamp(l) : undefined,
              status: l.status === 'Completed' ? 'completed' : l.status === 'Rejected' ? 'rejected' : 'pending',
              category: 'Letter',
              receivedBy: l.receivedBy || '-'
            });
          }
        });

        // Process leaves
        leaves.forEach((lv: any) => {
          if (lv.status === 'Pending' || lv.status === 'Completed' || lv.status === 'Rejected') {
            allRecords.push({
              id: lv.id,
              trackingId: lv.trackingId,
              title: extractName(lv.fullName),
              date: formatDateTime(lv.dateTimeIn),
              dateTimeIn: lv.dateTimeIn,
              dateTimeOut: getOutTimestamp(lv),
              dateTimeRejected: lv.status === 'Rejected' ? getRejectedTimestamp(lv) : undefined,
              status: lv.status === 'Completed' ? 'completed' : lv.status === 'Rejected' ? 'rejected' : 'pending',
              category: 'Leave',
              receivedBy: lv.receivedBy || '-'
            });
          }
        });

        // Process locators
        locators.forEach((loc: any) => {
          if (loc.status === 'Pending' || loc.status === 'Completed' || loc.status === 'Rejected') {
            allRecords.push({
              id: loc.id,
              trackingId: loc.trackingId,
              title: extractName(loc.fullName),
              date: formatDateTime(loc.dateTimeIn),
              dateTimeIn: loc.dateTimeIn,
              dateTimeOut: getOutTimestamp(loc),
              dateTimeRejected: loc.status === 'Rejected' ? getRejectedTimestamp(loc) : undefined,
              status: loc.status === 'Completed' ? 'completed' : loc.status === 'Rejected' ? 'rejected' : 'pending',
              category: 'Locator',
              receivedBy: loc.receivedBy || '-'
            });
          }
        });

        // Process admin to PGO
        adminToPGO.forEach((a: any) => {
          if (a.status === 'Pending' || a.status === 'Completed' || a.status === 'Rejected') {
            allRecords.push({
              id: a.id,
              trackingId: a.trackingId,
              title: extractName(a.fullName),
              date: formatDateTime(a.dateTimeIn),
              dateTimeIn: a.dateTimeIn,
              dateTimeOut: getOutTimestamp(a),
              dateTimeRejected: a.status === 'Rejected' ? getRejectedTimestamp(a) : undefined,
              status: a.status === 'Completed' ? 'completed' : a.status === 'Rejected' ? 'rejected' : 'pending',
              category: 'Admin to PGO',
              receivedBy: a.receivedBy || '-'
            });
          }
        });

        // Process others
        others.forEach((o: any) => {
          if (o.status === 'Pending' || o.status === 'Completed' || o.status === 'Rejected') {
            allRecords.push({
              id: o.id,
              trackingId: o.trackingId,
              title: extractName(o.fullName),
              date: formatDateTime(o.dateTimeIn),
              dateTimeIn: o.dateTimeIn,
              dateTimeOut: getOutTimestamp(o),
              dateTimeRejected: o.status === 'Rejected' ? getRejectedTimestamp(o) : undefined,
              status: o.status === 'Completed' ? 'completed' : o.status === 'Rejected' ? 'rejected' : 'pending',
              category: 'Others',
              receivedBy: o.receivedBy || '-'
            });
          }
        });

        // Process travel orders
        travelOrders.forEach((t: any) => {
          if (t.status === 'Pending' || t.status === 'Completed' || t.status === 'Rejected') {
            allRecords.push({
              id: t.id,
              trackingId: t.trackingId,
              title: extractName(t.fullName),
              date: formatDateTime(t.dateTimeIn),
              dateTimeIn: t.dateTimeIn,
              dateTimeOut: getOutTimestamp(t),
              dateTimeRejected: t.status === 'Rejected' ? getRejectedTimestamp(t) : undefined,
              status: t.status === 'Completed' ? 'completed' : t.status === 'Rejected' ? 'rejected' : 'pending',
              category: 'Travel Order',
              receivedBy: t.receivedBy || '-'
            });
          }
        });

        // Process overtimes
        overtimes.forEach((ot: any) => {
          if (ot.status === 'Pending' || ot.status === 'Completed' || ot.status === 'Rejected') {
            allRecords.push({
              id: ot.id,
              trackingId: ot.trackingId,
              title: extractName(ot.fullName),
              date: formatDateTime(ot.dateTimeIn),
              dateTimeIn: ot.dateTimeIn,
              dateTimeOut: getOutTimestamp(ot),
              dateTimeRejected: ot.status === 'Rejected' ? getRejectedTimestamp(ot) : undefined,
              status: ot.status === 'Completed' ? 'completed' : ot.status === 'Rejected' ? 'rejected' : 'pending',
              category: 'Overtime',
              receivedBy: ot.receivedBy || '-'
            });
          }
        });

        // Process obligation requests
        obligationRequests.forEach((or: any) => {
          if (or.status === 'Pending' || or.status === 'Completed' || or.status === 'Rejected') {
            allRecords.push({
              id: or.id,
              trackingId: or.trackingId,
              title: extractName(or.fullName),
              date: formatDateTime(or.dateTimeIn),
              dateTimeIn: or.dateTimeIn,
              dateTimeOut: getOutTimestamp(or),
              dateTimeRejected: or.status === 'Rejected' ? getRejectedTimestamp(or) : undefined,
              status: or.status === 'Completed' ? 'completed' : or.status === 'Rejected' ? 'rejected' : 'pending',
              category: 'Obligation Request',
              amount: or.amount || 0,
              receivedBy: or.receivedBy || '-'
            });
          }
        });

        // Process purchase requests
        purchaseRequests.forEach((pr: any) => {
          if (pr.status === 'Pending' || pr.status === 'Completed' || pr.status === 'Rejected') {
            allRecords.push({
              id: pr.id,
              trackingId: pr.trackingId,
              title: extractName(pr.fullName),
              date: formatDateTime(pr.dateTimeIn),
              dateTimeIn: pr.dateTimeIn,
              dateTimeOut: getOutTimestamp(pr),
              dateTimeRejected: pr.status === 'Rejected' ? getRejectedTimestamp(pr) : undefined,
              status: pr.status === 'Completed' ? 'completed' : pr.status === 'Rejected' ? 'rejected' : 'pending',
              category: 'Purchase Request',
              amount: pr.estimatedCost || 0,
              receivedBy: pr.receivedBy || '-'
            });
          }
        });

        setRecords(allRecords);
      } catch (err) {
        console.error('Error loading records:', err);
        setError('Failed to load records');
      }
    };

    loadAllPendingRecords();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  const filteredRecords = records.filter(record =>
    record.status === activeTab && (
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination derived values
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700';
      case 'rejected':
        return 'bg-red-50 text-red-700';
      case 'archived':
        return 'bg-gray-50 text-gray-700';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-40">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar recordTypes={recordTypes} onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:block bg-white border-r border-gray-200 shadow-sm">
        <Sidebar recordTypes={recordTypes} onNavigate={undefined} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b shadow-sm pl-14 pr-4 sm:px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">Records Management</h1>
                <p className="text-sm text-gray-500">Track and manage all documents</p>
              </div>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex flex-wrap items-center gap-3">
              {user?.name && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div 
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => user.avatar && handleAvatarView(user.avatar, user.name)}
                    title={user.avatar ? "Click to view full size avatar" : "No avatar to view"}
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-indigo-100">
                      <AvatarImage src={user.avatar || undefined} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-xs font-semibold">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-10 px-4"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 bg-gray-50 flex flex-col gap-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">All Records</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-3xl font-bold text-blue-600">{records.length}</div>
                <p className="text-xs text-gray-500 mt-1">Total documents</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pending</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-3xl font-bold text-yellow-600">{records.filter(r => r.status === 'pending').length}</div>
                <p className="text-xs text-gray-500 mt-1">Awaiting completion</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Completed</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-3xl font-bold text-green-600">{records.filter(r => r.status === 'completed').length}</div>
                <p className="text-xs text-gray-500 mt-1">Successfully processed</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Rejected</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-3xl font-bold text-red-600">{records.filter(r => r.status === 'rejected').length}</div>
                <p className="text-xs text-gray-500 mt-1">Not approved</p>
              </CardContent>
            </Card>
          </div>

          {/* Records Section */}
          <div className="flex-1 min-h-0">
          <Card className="border-0 shadow-md h-full flex flex-col">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Records</CardTitle>
                  <CardDescription className="text-sm text-gray-500 mt-1">Manage and view all records</CardDescription>
                </div>
              </div>
              {/* Tabs */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-4 py-2.5 font-semibold text-sm rounded-lg transition-all ${
                    activeTab === 'pending'
                      ? 'bg-yellow-100 text-yellow-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Pending</span>
                    <span className="px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 text-xs font-bold">
                      {records.filter(r => r.status === 'pending').length}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-4 py-2.5 font-semibold text-sm rounded-lg transition-all ${
                    activeTab === 'completed'
                      ? 'bg-green-100 text-green-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Completed</span>
                    <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-xs font-bold">
                      {records.filter(r => r.status === 'completed').length}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`px-4 py-2.5 font-semibold text-sm rounded-lg transition-all ${
                    activeTab === 'rejected'
                      ? 'bg-red-100 text-red-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    <span>Rejected</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-800 text-xs font-bold">
                      {records.filter(r => r.status === 'rejected').length}
                    </span>
                  </div>
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pt-4">
              {/* Search Bar */}
              <div className="mb-4 flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Records Table - Improved layout and design */}
              <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 overflow-auto min-h-0">
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                        <TableHead className="text-center text-xs font-semibold bg-gray-100 whitespace-nowrap">Received / Created By</TableHead>
                        <TableHead className="text-center text-xs font-semibold bg-gray-100 whitespace-nowrap">Tracking ID</TableHead>
                        <TableHead className="text-center text-xs font-semibold bg-gray-100 whitespace-nowrap">Category</TableHead>
                        <TableHead className="text-center text-xs font-semibold bg-gray-100 whitespace-nowrap min-w-[160px]">Date/Time IN</TableHead>
                        {(activeTab === 'completed' || activeTab === 'rejected') && (
                          <TableHead className="text-center text-xs font-semibold bg-gray-100 whitespace-nowrap min-w-[160px]">
                            {activeTab === 'completed' ? 'Date/Time OUT' : 'Date/Time Rejected'}
                          </TableHead>
                        )}
                        <TableHead className="text-center text-xs font-semibold bg-gray-100 whitespace-nowrap">Name/Reference</TableHead>
                        {activeTab !== 'rejected' && (
                          <TableHead className="text-center text-xs font-semibold bg-gray-100 whitespace-nowrap">Amount</TableHead>
                        )}
                        <TableHead className="text-center text-xs font-semibold bg-gray-100 whitespace-nowrap">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRecords.length > 0 ? (
                        paginatedRecords.map((record, idx) => (
                          <TableRow key={record.id} className={`hover:bg-indigo-50/50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <TableCell className="text-center text-sm text-gray-700 py-3.5">
                              {record.receivedBy || '-'}
                            </TableCell>
                            <TableCell className="text-center font-semibold text-indigo-600 text-sm py-3.5">
                              {record.trackingId}
                            </TableCell>
                            <TableCell className="text-center text-sm font-medium py-3.5">{record.category}</TableCell>
                            <TableCell className="text-center text-xs text-gray-600 py-3.5 whitespace-nowrap">
                              {formatDateTime(record.dateTimeIn) !== '-' ? formatDateTime(record.dateTimeIn) : record.date}
                            </TableCell>
                            {activeTab === 'completed' && (
                              <TableCell className="text-center text-xs text-gray-600 py-3.5 whitespace-nowrap">
                                {formatDateTime(record.dateTimeOut)}
                              </TableCell>
                            )}
                            {activeTab === 'rejected' && (
                              <TableCell className="text-center text-xs text-gray-600 py-3.5 whitespace-nowrap">
                                {formatDateTime(record.dateTimeRejected)}
                              </TableCell>
                            )}
                            <TableCell className="text-center text-sm text-gray-700 py-3.5 max-w-[200px] truncate" title={record.title}>
                              {record.title}
                            </TableCell>
                            {activeTab !== 'rejected' && (
                              <TableCell className="text-center text-sm font-semibold text-blue-700 py-3.5 whitespace-nowrap">
                                {record.amount ? `₱${Number(record.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                              </TableCell>
                            )}
                            <TableCell className="text-center py-3.5">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize inline-flex items-center gap-1.5 ${getStatusColor(record.status)}`}>
                                {record.status === 'completed' ? <CheckCircle className="h-3 w-3" /> : 
                                 record.status === 'rejected' ? <XCircle className="h-3 w-3" /> :
                                 record.status === 'pending' ? <Clock className="h-3 w-3" /> : null}
                                {record.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={activeTab === 'pending' ? 7 : activeTab === 'rejected' ? 7 : 8} className="text-center py-12 text-gray-500">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <Search className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-base font-medium">No records found</p>
                              <p className="text-sm">Try adjusting your search or filter</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Improved Pagination Controls */}
                <div className="border-t bg-white px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="hidden sm:inline">Showing</span>
                    <span className="font-semibold">{filteredRecords.length > 0 ? startIndex + 1 : 0}</span>
                    <span className="hidden sm:inline">to</span>
                    <span className="sm:hidden">-</span>
                    <span className="font-semibold">{Math.min(endIndex, filteredRecords.length)}</span>
                    <span className="hidden sm:inline">of</span>
                    <span className="sm:hidden">/</span>
                    <span className="font-semibold">{filteredRecords.length}</span>
                    <span className="hidden md:inline">records</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 font-medium hidden sm:inline">
                      Page <span className="text-indigo-600">{currentPage}</span> of <span className="text-indigo-600">{totalPages}</span>
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-sm font-medium border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-sm font-medium border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>

      {/* Message Modal (Success/Error) */}
      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{error ? 'Error' : 'Success'}</DialogTitle>
            <DialogDescription>
              {error ? 'An error occurred' : 'Operation completed successfully'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              {error ? (
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-700">{error || success}</p>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => {
                setMessageModalOpen(false);
                setError('');
                setSuccess('');
              }}
              className={error ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar View Modal */}
      <Dialog open={isAvatarViewOpen} onOpenChange={setIsAvatarViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Avatar Preview</DialogTitle>
            <DialogDescription>
              Full size avatar image
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center items-center p-4">
            <img 
              src={viewingAvatar} 
              alt="Avatar preview" 
              className="max-w-full max-h-96 rounded-lg shadow-lg object-contain"
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={() => setIsAvatarViewOpen(false)}
              className="px-4"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const recordTypes = [
  'Leave',
  'Letter',
  'Locator',
  'Obligation Request',
  'Purchase Request',
  'Request for Overtime',
  'Travel Order',
  'Voucher',
  'Admin to PGO',
  'Processing',
  'Others',
];
