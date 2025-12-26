import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { leaveService, letterService, voucherService, locatorService, adminToPGOService, othersService, travelOrderService, overtimeService, obligationRequestService, purchaseRequestService } from '@/services/firebaseService';
import { Menu, LogOut, Download, RefreshCw, User } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportRecord {
  id: string;
  trackingId: string;
  category: string;
  dateTimeIn: string;
  status: string;
  [key: string]: any;
}

interface ReportStats {
  total: number;
  pending: number;
  completed: number;
  approved: number;
  rejected: number;
  totalAmount: number;
  rejectedAmount: number;
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

const formatAmount = (amount: string | number | undefined): string => {
  if (amount === undefined || amount === null || amount === '') return '-';
  
  const num = typeof amount === 'string' ? 
    parseFloat(amount.replace(/[^0-9.-]+/g, '')) : 
    Number(amount);
    
  if (isNaN(num)) return '-';
  
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num).replace('₱', '₱ ');
};

export default function ReportPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect non-admin users away from reports
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reportData, setReportData] = useState<ReportRecord[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats>({
    total: 0,
    pending: 0,
    completed: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
    rejectedAmount: 0,
  });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateReport();
  }, [reportType, selectedCategory]);

  const getDateRange = () => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (reportType) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        const day = now.getDay();
        start.setDate(now.getDate() - day);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(quarter * 3 + 2, 31);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  };

  const filterRecordsByDateRange = (records: any[], start: Date, end: Date) => {
    if (!records || records.length === 0) return [];
    
    return records.filter((record) => {
      if (!record.dateTimeIn) return false;
      
      const recordDate = new Date(record.dateTimeIn);
      
      if (isNaN(recordDate.getTime())) {
        console.warn('Invalid date for record:', record.id, record.dateTimeIn);
        return false;
      }
      
      return recordDate >= start && recordDate <= end;
    });
  };

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();
      setDateRange({
        start: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        end: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      });

      let allRecords: ReportRecord[] = [];

      if (selectedCategory === 'all' || selectedCategory === 'Leave') {
        const leaves = await leaveService.getLeaves();
        allRecords.push(
          ...leaves.map((l: any) => ({
            ...l,
            category: 'Leave',
          }))
        );
      }

      if (selectedCategory === 'all' || selectedCategory === 'Letter') {
        const letters = await letterService.getLetters();
        allRecords.push(
          ...letters.map((l: any) => ({
            ...l,
            category: 'Letter',
          }))
        );
      }

      if (selectedCategory === 'all' || selectedCategory === 'Voucher') {
        const vouchers = await voucherService.getVouchers();
        allRecords.push(
          ...vouchers.map((v: any) => ({
            ...v,
            category: 'Voucher',
          }))
        );
      }

      if (selectedCategory === 'all' || selectedCategory === 'Locator') {
        const locators = await locatorService.getLocators();
        allRecords.push(
          ...locators.map((l: any) => ({
            ...l,
            category: 'Locator',
          }))
        );
      }

      if (selectedCategory === 'all' || selectedCategory === 'Admin to PGO') {
        const adminRecords = await adminToPGOService.getRecords();
        allRecords.push(
          ...adminRecords.map((r: any) => ({
            ...r,
            category: 'Admin to PGO',
          }))
        );
      }

      if (selectedCategory === 'all' || selectedCategory === 'Others') {
        const others = await othersService.getRecords();
        allRecords.push(
          ...others.map((o: any) => ({
            ...o,
            category: 'Others',
          }))
        );
      }

      if (selectedCategory === 'all' || selectedCategory === 'Travel Order') {
        const travelOrders = await travelOrderService.getTravelOrders();
        allRecords.push(
          ...travelOrders.map((t: any) => ({
            ...t,
            category: 'Travel Order',
          }))
        );
      }

      if (selectedCategory === 'all' || selectedCategory === 'Request for Overtime') {
        const overtimes = await overtimeService.getOvertimes();
        allRecords.push(
          ...overtimes.map((o: any) => ({
            ...o,
            category: 'Request for Overtime',
          }))
        );
      }

      if (selectedCategory === 'all' || selectedCategory === 'Obligation Request') {
        const obligationRequests = await obligationRequestService.getObligationRequests();
        allRecords.push(
          ...obligationRequests.map((o: any) => ({
            ...o,
            category: 'Obligation Request',
          }))
        );
      }

      if (selectedCategory === 'all' || selectedCategory === 'Purchase Request') {
        const purchaseRequests = await purchaseRequestService.getPurchaseRequests();
        allRecords.push(
          ...purchaseRequests.map((p: any) => ({
            ...p,
            category: 'Purchase Request',
          }))
        );
      }

      const filteredRecords = filterRecordsByDateRange(allRecords, start, end);
      setReportData(filteredRecords);

      const rejectedRecords = filteredRecords.filter((r) => r.status === 'Rejected');
      const nonRejectedRecords = filteredRecords.filter((r) => r.status !== 'Rejected');

      const totalAmount = nonRejectedRecords.reduce((sum, record) => {
        const amount = record.amount || record.estimatedCost || 0;
        return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
      }, 0);

      const rejectedAmount = rejectedRecords.reduce((sum, record) => {
        const amount = record.amount || record.estimatedCost || 0;
        return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
      }, 0);

      const stats: ReportStats = {
        total: filteredRecords.length,
        pending: filteredRecords.filter((r) => r.status === 'Pending').length,
        completed: filteredRecords.filter((r) => r.status === 'Completed').length,
        approved: filteredRecords.filter((r) => r.status === 'Approved').length,
        rejected: rejectedRecords.length,
        totalAmount: totalAmount,
        rejectedAmount: rejectedAmount,
      };

      setReportStats(stats);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const exportToCSV = () => {
    const headers = ['Tracking ID', 'Category', 'Date/Time IN', 'Status', 'Full Name'];
    const rows = reportData.map((record) => [
      record.trackingId,
      record.category,
      new Date(record.dateTimeIn).toLocaleString(),
      record.status,
      record.fullName || record.payee || record.dvNo || '-',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar */}
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
              <h1 className="text-2xl font-bold text-foreground">Reports</h1>
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
        <div className="flex-1 overflow-auto p-3 flex flex-col">
          {/* Filter Section */}
          <Card className="mb-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Report Filters</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-3">
                <div className="w-32">
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Report Type
                  </label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-40">
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Category
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {recordTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-xs text-gray-600">
                  <p className="mb-1 font-medium">Period</p>
                  <p className="text-xs whitespace-nowrap">
                    <span className="font-semibold">{dateRange.start}</span> to{' '}
                    <span className="font-semibold">{dateRange.end}</span>
                  </p>
                </div>

                <div className="flex gap-2 ml-auto">
                  <Button
                    onClick={generateReport}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>

                  <Button
                    onClick={exportToCSV}
                    className="gap-2 bg-green-600 hover:bg-green-700 h-8 text-xs"
                    disabled={reportData.length === 0 || isLoading}
                  >
                    <Download className="h-3 w-3" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-3">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-gray-600">Total Records</CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold text-indigo-600">{reportStats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-gray-600">Pending</CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold text-yellow-600">{reportStats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-gray-600">Completed</CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold text-green-600">{reportStats.completed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-gray-600">Rejected</CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold text-red-600">{reportStats.rejected}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-gray-600">Total Amount</CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold text-blue-600">₱{(reportStats.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-gray-600">Total Amount Rejected</CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold text-red-600">₱{(reportStats.rejectedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
          </div>

          {/* Report Table */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Report Details</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pt-2">
              <div className="overflow-x-auto h-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-center text-xs">Received By</TableHead>
                      <TableHead className="text-center text-xs">Tracking ID</TableHead>
                      <TableHead className="text-center text-xs">Category</TableHead>
                      <TableHead className="text-center text-xs whitespace-normal wrap-break-word max-w-[120px]">Date/Time IN</TableHead>
                      <TableHead className="text-center text-xs">Name/Reference</TableHead>
                      <TableHead className="text-center text-xs">Amount</TableHead>
                      <TableHead className="text-center text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Loading report data...
                        </TableCell>
                      </TableRow>
                    ) : reportData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                          No records found for the selected period and category.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData.map((record) => (
                        <TableRow key={record.id} className="hover:bg-gray-50">
                          <TableCell className="text-center text-xs text-gray-600">
                            {record.receivedBy || '-'}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-indigo-600 text-xs">
                            {record.trackingId}
                          </TableCell>
                          <TableCell className="text-center text-xs">{record.category}</TableCell>
                          <TableCell className="text-center text-xs whitespace-normal wrap-break-word max-w-[120px]">
                            {new Date(record.dateTimeIn).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {record.fullName || record.payee || record.dvNo || '-'}
                          </TableCell>
                          <TableCell className="text-center text-xs font-semibold">
                            {formatAmount(record.amount || record.estimatedCost)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                record.status === 'Completed'
                                  ? 'bg-green-50 text-green-700'
                                  : record.status === 'Approved'
                                  ? 'bg-green-50 text-green-700'
                                  : record.status === 'Rejected'
                                  ? 'bg-red-50 text-red-700'
                                  : record.status === 'Pending'
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {record.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

