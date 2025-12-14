import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { leaveService, letterService, voucherService, locatorService, adminToPGOService, othersService, travelOrderService, overtimeService } from '@/services/firebaseService';
import { Menu, LogOut, Download } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import LoadingScene from '@/components/LoadingScene';
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
  'Others',
];

export default function ReportPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reportData, setReportData] = useState<ReportRecord[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats>({
    total: 0,
    pending: 0,
    completed: 0,
    approved: 0,
    rejected: 0,
  });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateReport();
  }, [reportType, selectedCategory]);

  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

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
    return records.filter((record) => {
      const recordDate = new Date(record.dateTimeIn);
      return recordDate >= start && recordDate <= end;
    });
  };

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();
      setDateRange({
        start: start.toLocaleDateString(),
        end: end.toLocaleDateString(),
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

      const filteredRecords = filterRecordsByDateRange(allRecords, start, end);
      setReportData(filteredRecords);

      const stats: ReportStats = {
        total: filteredRecords.length,
        pending: filteredRecords.filter((r) => r.status === 'Pending').length,
        completed: filteredRecords.filter((r) => r.status === 'Completed').length,
        approved: filteredRecords.filter((r) => r.status === 'Approved').length,
        rejected: filteredRecords.filter((r) => r.status === 'Rejected').length,
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

  if (isLoading) {
    return <LoadingScene message="Generating report..." />;
  }

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
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 shadow-sm">
        <Sidebar recordTypes={recordTypes} onNavigate={undefined} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
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
        <div className="flex-1 overflow-auto p-3 flex flex-col">
          {/* Filter Section */}
          <Card className="mb-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Report Filters</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
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

                <div className="flex-1">
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

                <div className="text-xs text-gray-600 flex-1">
                  <p className="mb-1 font-medium">Period</p>
                  <p className="text-xs">
                    <span className="font-semibold">{dateRange.start}</span> to{' '}
                    <span className="font-semibold">{dateRange.end}</span>
                  </p>
                </div>

                <Button
                  onClick={exportToCSV}
                  className="gap-2 bg-green-600 hover:bg-green-700 h-8 text-xs"
                  disabled={reportData.length === 0}
                >
                  <Download className="h-3 w-3" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
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
                      <TableHead className="text-center text-xs">Tracking ID</TableHead>
                      <TableHead className="text-center text-xs">Category</TableHead>
                      <TableHead className="text-center text-xs">Date/Time IN</TableHead>
                      <TableHead className="text-center text-xs">Name/Reference</TableHead>
                      <TableHead className="text-center text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Loading report data...
                        </TableCell>
                      </TableRow>
                    ) : reportData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          No records found for the selected period and category.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData.map((record) => (
                        <TableRow key={record.id} className="hover:bg-gray-50">
                          <TableCell className="text-center font-semibold text-indigo-600 text-xs">
                            {record.trackingId}
                          </TableCell>
                          <TableCell className="text-center text-xs">{record.category}</TableCell>
                          <TableCell className="text-center text-xs">
                            {new Date(record.dateTimeIn).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {record.fullName || record.payee || record.dvNo || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                record.status === 'Completed'
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'Approved'
                                  ? 'bg-blue-100 text-blue-800'
                                  : record.status === 'Rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : record.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
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

