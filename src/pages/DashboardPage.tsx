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
  Settings,
  FileText,
  BarChart3,
  Search,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { voucherService, letterService, leaveService, locatorService, adminToPGOService, othersService, travelOrderService, overtimeService } from '@/services/firestoreService';

interface Record {
  id: string;
  trackingId: string;
  title: string;
  date: string;
  status: 'active' | 'archived' | 'pending' | 'completed';
  category: string;
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

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<Record[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [messageModalOpen, setMessageModalOpen] = useState(false);

  // Load records on mount
  useEffect(() => {
    const loadAllPendingRecords = async () => {
      try {
        const allRecords: Record[] = [];

        // Fetch all collections in parallel
        const [vouchers, letters, leaves, locators, adminToPGO, others, travelOrders, overtimes] = await Promise.all([
          voucherService.getVouchers(),
          letterService.getLetters(),
          leaveService.getLeaves(),
          locatorService.getLocators(),
          adminToPGOService.getRecords(),
          othersService.getRecords(),
          travelOrderService.getTravelOrders(),
          overtimeService.getOvertimes()
        ]);

        // Process vouchers
        vouchers.forEach((v: any) => {
          if (v.status === 'Pending') {
            allRecords.push({
              id: v.id,
              trackingId: v.trackingId,
              title: v.payee,
              date: new Date(v.dateTimeIn).toLocaleString(),
              status: 'pending',
              category: 'Voucher'
            });
          }
        });

        // Process letters
        letters.forEach((l: any) => {
          if (l.status === 'Pending') {
            allRecords.push({
              id: l.id,
              trackingId: l.trackingId,
              title: extractName(l.fullName),
              date: new Date(l.dateTimeIn).toLocaleString(),
              status: 'pending',
              category: 'Letter'
            });
          }
        });

        // Process leaves
        leaves.forEach((lv: any) => {
          if (lv.status === 'Pending') {
            allRecords.push({
              id: lv.id,
              trackingId: lv.trackingId,
              title: extractName(lv.fullName),
              date: new Date(lv.dateTimeIn).toLocaleString(),
              status: 'pending',
              category: 'Leave'
            });
          }
        });

        // Process locators
        locators.forEach((loc: any) => {
          if (loc.status === 'Pending') {
            allRecords.push({
              id: loc.id,
              trackingId: loc.trackingId,
              title: extractName(loc.fullName),
              date: new Date(loc.dateTimeIn).toLocaleString(),
              status: 'pending',
              category: 'Locator'
            });
          }
        });

        // Process admin to PGO
        adminToPGO.forEach((a: any) => {
          if (a.status === 'Pending') {
            allRecords.push({
              id: a.id,
              trackingId: a.trackingId,
              title: extractName(a.fullName),
              date: new Date(a.dateTimeIn).toLocaleString(),
              status: 'pending',
              category: 'Admin to PGO'
            });
          }
        });

        // Process others
        others.forEach((o: any) => {
          if (o.status === 'Pending') {
            allRecords.push({
              id: o.id,
              trackingId: o.trackingId,
              title: extractName(o.fullName),
              date: new Date(o.dateTimeIn).toLocaleString(),
              status: 'pending',
              category: 'Others'
            });
          }
        });

        // Process travel orders
        travelOrders.forEach((t: any) => {
          if (t.status === 'Pending') {
            allRecords.push({
              id: t.id,
              trackingId: t.trackingId,
              title: extractName(t.fullName),
              date: new Date(t.dateTimeIn).toLocaleString(),
              status: 'pending',
              category: 'Travel Order'
            });
          }
        });

        // Process overtimes
        overtimes.forEach((ot: any) => {
          if (ot.status === 'Pending') {
            allRecords.push({
              id: ot.id,
              trackingId: ot.trackingId,
              title: extractName(ot.fullName),
              date: new Date(ot.dateTimeIn).toLocaleString(),
              status: 'pending',
              category: 'Overtime'
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
    record.status === 'pending' && (
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 shadow-sm">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Records Management</h1>
            <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
          </div>
          <Button
            variant="outline"
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
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
          </div>

          {/* Records Section */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Records</CardTitle>
                <CardDescription>Manage and view all records</CardDescription>
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
                      <TableHead className="text-center">Tracking ID</TableHead>
                      <TableHead className="text-center">Title</TableHead>
                      <TableHead className="text-center">Category</TableHead>
                      <TableHead className="text-center">Date / Time IN</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => (
                        <TableRow key={record.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-center text-indigo-600 uppercase">{record.trackingId}</TableCell>
                          <TableCell className="font-medium text-center uppercase">{record.title}</TableCell>
                          <TableCell className="text-center">{record.category}</TableCell>
                          <TableCell className="text-center">{record.date}</TableCell>
                          <TableCell className="text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
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

function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSettings = () => {
    navigate('/settings');
  };

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
    'Others',
  ];

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-indigo-600">PGO</h2>
        <p className="text-xs text-gray-500">Record Management</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.href)}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}

        {/* Records Menu */}
        <div className="space-y-1">
          <div className="flex items-center gap-3 px-4 py-2 text-gray-700">
            <FileText className="h-5 w-5" />
            <span className="text-sm font-medium">Records</span>
          </div>
          <div className="pl-8 space-y-1">
            {recordTypes.map((type) => (
              <button
                key={type}
                onClick={() => {
                  if (type === 'Locator') {
                    navigate('/locator');
                  } else if (type === 'Admin to PGO') {
                    navigate('/admin-to-pgo');
                  } else if (type === 'Leave') {
                    navigate('/leave');
                  } else if (type === 'Letter') {
                    navigate('/letter');
                  } else if (type === 'Request for Overtime') {
                    navigate('/overtime');
                  } else if (type === 'Travel Order') {
                    navigate('/travel-order');
                  } else if (type === 'Voucher') {
                    navigate('/voucher');
                  } else if (type === 'Others') {
                    navigate('/others');
                  }
                }}
                className="w-full block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* User Info - Bottom */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-indigo-600">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {user?.role === 'admin' && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            onClick={handleSettings}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        )}
        {user?.role !== 'admin' && (
          <></>
        )}
      </div>

    </div>
  );
}
