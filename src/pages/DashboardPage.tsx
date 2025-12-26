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
import {
  Menu,
  LogOut,
  Search,
  User,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sidebar } from '@/components/Sidebar';
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
        <div className="bg-card border-b pl-14 pr-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Records Management</h1>
              <p className="text-sm text-muted-foreground">Welcome back</p>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex flex-wrap items-center gap-2">
              {user?.name && (
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg border">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 h-9"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-linear-to-br from-gray-100 via-gray-50 to-gray-100" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}>
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">All Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {records.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">All records</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {records.filter(r => r.status === 'pending').length}
                </div>
                <p className="text-xs text-gray-500 mt-1">Awaiting completion</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Completed Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {records.filter(r => r.status === 'completed').length}
                </div>
                <p className="text-xs text-gray-500 mt-1">Finished items</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Rejected Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {records.filter(r => r.status === 'rejected').length}
                </div>
                <p className="text-xs text-gray-500 mt-1">Rejected items</p>
              </CardContent>
            </Card>
          </div>

          {/* Records Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Records</CardTitle>
                  <CardDescription>Manage and view all records</CardDescription>
                </div>
              </div>
              {/* Tabs */}
              <div className="flex gap-2 mt-4 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    activeTab === 'pending'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pending ({records.filter(r => r.status === 'pending').length})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    activeTab === 'completed'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Completed ({records.filter(r => r.status === 'completed').length})
                </button>
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    activeTab === 'rejected'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Rejected ({records.filter(r => r.status === 'rejected').length})
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="mb-4 flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Records Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-center text-xs">Received By</TableHead>
                      <TableHead className="text-center text-xs">Tracking ID</TableHead>
                      <TableHead className="text-center text-xs">Category</TableHead>
                      <TableHead className="text-center text-xs whitespace-normal wrap-break-word max-w-[120px]">Date/Time IN</TableHead>
                      {activeTab === 'completed' && (
                        <TableHead className="text-center text-xs whitespace-normal wrap-break-word max-w-[120px]">Date/Time OUT</TableHead>
                      )}
                      {activeTab === 'rejected' && (
                        <TableHead className="text-center text-xs whitespace-normal wrap-break-word max-w-[120px]">Date/Time Rejected</TableHead>
                      )}
                      <TableHead className="text-center text-xs">Name/Reference</TableHead>
                      <TableHead className="text-center text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => (
                        <TableRow key={record.id} className="hover:bg-gray-50">
                          <TableCell className="text-center text-xs text-gray-600">
                            {record.receivedBy || '-'}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-indigo-600 text-xs">
                            {record.trackingId}
                          </TableCell>
                          <TableCell className="text-center text-xs">{record.category}</TableCell>
                          <TableCell className="text-center text-xs whitespace-normal wrap-break-word max-w-[120px]">
                            {formatDateTime(record.dateTimeIn) !== '-' ? formatDateTime(record.dateTimeIn) : record.date}
                          </TableCell>
                          {activeTab === 'completed' && (
                            <TableCell className="text-center text-xs whitespace-normal wrap-break-word max-w-[120px]">
                              {formatDateTime(record.dateTimeOut)}
                            </TableCell>
                          )}
                          {activeTab === 'rejected' && (
                            <TableCell className="text-center text-xs whitespace-normal wrap-break-word max-w-[120px]">
                              {formatDateTime(record.dateTimeRejected)}
                            </TableCell>
                          )}
                          <TableCell className="text-center text-xs">
                            {record.title}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={activeTab === 'pending' ? 6 : 7} className="text-center py-8 text-gray-500">
                          No records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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
