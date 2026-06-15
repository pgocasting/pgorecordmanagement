import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { leaveService, letterService, voucherService, locatorService, adminToPGOService, othersService, travelOrderService, overtimeService, obligationRequestService, purchaseRequestService } from '@/services/firebaseService';
import { Menu, LogOut, RefreshCw, User, FileDown, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  dateTimeOut?: string;
  status: string;
  receivedBy?: string;
  fullName?: string;
  payee?: string;
  dvNo?: string;
  designation?: string;
  leaveType?: string;
  purpose?: string;
  remarks?: string;
  amount?: string | number;
  estimatedCost?: string | number;
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
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [reportData, setReportData] = useState<ReportRecord[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
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
  const [selectedRecord, setSelectedRecord] = useState<ReportRecord | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    generateReport();
  }, [reportType, selectedCategory, selectedStatus, selectedMonth, selectedYear]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [reportType, selectedCategory, selectedStatus, selectedMonth, selectedYear]);

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
        // Use selected month/year for monthly reports
        start = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
        // Day 0 of next month gives last day of selected month
        end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
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

      const filteredByDate = filterRecordsByDateRange(allRecords, start, end);
      // Sort newest first by dateTimeIn so current date appears first
      const sortedByDateDesc = [...filteredByDate].sort((a, b) => {
        const ta = new Date(a.dateTimeIn || 0).getTime();
        const tb = new Date(b.dateTimeIn || 0).getTime();
        return tb - ta;
      });
      const filteredRecords = selectedStatus === 'all'
        ? sortedByDateDesc
        : sortedByDateDesc.filter((r) => (r.status || 'Pending') === selectedStatus);
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

  const exportToPDF = () => {
    const title = `PGO Record Management - Report (${reportType.toUpperCase()})`;
    const period = `${dateRange.start} to ${dateRange.end}`;
    const status = selectedStatus === 'all' ? 'All' : selectedStatus;
    const category = selectedCategory === 'all' ? 'All Categories' : selectedCategory;

    const rowsHtml = reportData.map(r => `
      <tr>
        <td>${(r.receivedBy || '-')}</td>
        <td>${(r.trackingId || '')}</td>
        <td>${(r.category || '')}</td>
        <td>${r.dateTimeIn ? new Date(r.dateTimeIn).toLocaleString('en-US', { 
          month: 'short', 
          day: '2-digit', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : '-'}</td>
        <td>${r.dateTimeOut ? new Date(r.dateTimeOut).toLocaleString('en-US', { 
          month: 'short', 
          day: '2-digit', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : '-'}</td>
        <td>${(r.fullName || r.payee || r.dvNo || r.subject || '-')}</td>
        <td>${(r.designation || r.leaveType || r.type || '-')}</td>
        <td style="max-width:200px; word-wrap:break-word;">${(r.purpose || r.description || r.particulars || '-')}</td>
        <td style="text-align:right">${formatAmount(r.amount || r.estimatedCost)}</td>
        <td>${(r.status || '')}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji; padding: 24px; color: #111827; }
        .header { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
        .header img { height: 40px; width: 40px; object-fit: contain; }
        .title { font-size: 18px; font-weight: 700; }
        .meta { font-size: 12px; color:#4B5563; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        thead th { position: sticky; top: 0; background: #F9FAFB; }
        th, td { border: 1px solid #E5E7EB; padding: 4px 6px; text-align: center; }
        th:nth-child(4), td:nth-child(4) { max-width: 120px; word-wrap: break-word; }
        th:nth-child(5), td:nth-child(5) { max-width: 120px; word-wrap: break-word; }
        th:nth-child(8), td:nth-child(8) { max-width: 150px; word-wrap: break-word; text-align: left; }
        tfoot { margin-top: 8px; font-size: 12px; color:#6B7280; }
        @media print { 
          .no-print { display:none; }
          body { padding: 12px; }
          table { font-size: 9px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/images/bataan-logo.png" onerror="this.style.display='none'" />
        <div>
          <div class="title">${title}</div>
          <div class="meta">Period: ${period} • Status: ${status} • Category: ${category}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Received / Created By</th>
            <th>Tracking ID</th>
            <th>Category</th>
            <th>Date/Time IN</th>
            <th>Date/Time OUT</th>
            <th>Name/Reference</th>
            <th>Designation/Type</th>
            <th style="text-align:left">Purpose/Description</th>
            <th style="text-align:right">Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div class="no-print" style="margin-top:16px; text-align:right;">
        <button onclick="window.print();" style="padding:6px 10px; border:1px solid #D1D5DB; border-radius:6px; background:#fff; cursor:pointer;">Print / Save as PDF</button>
      </div>
      <script>
        window.addEventListener('load', function() {
          setTimeout(function(){
            try { window.focus(); } catch(e){}
            try { window.print(); } catch(e){}
          }, 300);
        });
      </script>
    </body>
    </html>`;

    // Preferred: print via hidden iframe in the same window (avoids popup issues)
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        iframe.onload = () => {
          try { iframe.contentWindow?.focus(); } catch(_) {}
          try { iframe.contentWindow?.print(); } catch(_) {}
          setTimeout(() => {
            try { document.body.removeChild(iframe); } catch(_) {}
          }, 1500);
        };
        return;
      } else {
        try { document.body.removeChild(iframe); } catch(_) {}
      }
    } catch (_) {}

    // Fallback: open a new window with Blob URL
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) return;
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      win.location.replace(url);
    } catch (e) {
      try {
        win.document.open();
        win.document.write(html);
        win.document.close();
      } catch (_) {}
    }
    try { win.focus(); } catch (e) {}
    setTimeout(() => { try { win.print(); } catch(e){} }, 1200);
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
        <div className="bg-white border-b shadow-sm pl-14 pr-4 sm:px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">Reports</h1>
                <p className="text-sm text-gray-500">Comprehensive analytics and insights</p>
              </div>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex flex-wrap items-center gap-3">
              {user?.name && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                    <User className="h-4 w-4 text-white" />
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
        <div className="flex-1 overflow-auto p-3 sm:p-3 flex flex-col gap-2 bg-gray-50">
          {/* Filter Section */}
          <Card className="border-0 shadow-md">
            <CardHeader className="py-2 border-b bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-base font-semibold text-gray-900">Report Filters</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2">
                <div className="lg:col-span-1">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Report Type
                  </label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger className="h-8 text-xs border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
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

                {reportType === 'monthly' && (
                  <>
                    <div className="lg:col-span-1">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Month
                      </label>
                      <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                        <SelectTrigger className="h-8 text-xs border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">January</SelectItem>
                          <SelectItem value="1">February</SelectItem>
                          <SelectItem value="2">March</SelectItem>
                          <SelectItem value="3">April</SelectItem>
                          <SelectItem value="4">May</SelectItem>
                          <SelectItem value="5">June</SelectItem>
                          <SelectItem value="6">July</SelectItem>
                          <SelectItem value="7">August</SelectItem>
                          <SelectItem value="8">September</SelectItem>
                          <SelectItem value="9">October</SelectItem>
                          <SelectItem value="10">November</SelectItem>
                          <SelectItem value="11">December</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="lg:col-span-1">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Year
                      </label>
                      <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                        <SelectTrigger className="h-8 text-xs border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(10)].map((_, i) => {
                            const year = new Date().getFullYear() - i;
                            return (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="lg:col-span-1">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Category
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-8 text-xs border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
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

                <div className="lg:col-span-1">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Status
                  </label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-8 text-xs border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-1 flex flex-col">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Actions
                  </label>
                  <div className="flex gap-2 flex-1">
                    <Button
                      onClick={generateReport}
                      className="gap-2 bg-blue-600 hover:bg-blue-700 h-8 text-xs flex-1"
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                      <span className="hidden lg:inline">Refresh</span>
                    </Button>

                    <Button
                      onClick={exportToPDF}
                      className="gap-2 bg-green-600 hover:bg-green-700 h-8 text-xs flex-1"
                      disabled={reportData.length === 0 || isLoading}
                    >
                      <FileDown className="h-3 w-3" />
                      <span className="hidden lg:inline">Export</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Period Display */}
              <div className="mt-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-xs text-indigo-900">
                  <span className="font-semibold">Report Period:</span>{' '}
                  <span className="font-medium">{dateRange.start}</span> to{' '}
                  <span className="font-medium">{dateRange.end}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-indigo-50 to-white">
              <CardHeader className="pb-1 pt-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Total Records</CardTitle>
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <TrendingUp className="h-3 w-3 text-indigo-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-2 px-3">
                <div className="text-2xl font-bold text-indigo-600">{reportStats.total}</div>
                <p className="text-[10px] text-gray-500">All documents</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-white">
              <CardHeader className="pb-1 pt-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Pending</CardTitle>
                  <div className="w-6 h-6 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-3 w-3 text-yellow-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-2 px-3">
                <div className="text-2xl font-bold text-yellow-600">{reportStats.pending}</div>
                <p className="text-[10px] text-gray-500">Awaiting action</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-1 pt-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Completed</CardTitle>
                  <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-2 px-3">
                <div className="text-2xl font-bold text-green-600">{reportStats.completed}</div>
                <p className="text-[10px] text-gray-500">Successfully processed</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-white">
              <CardHeader className="pb-1 pt-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Rejected</CardTitle>
                  <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                    <XCircle className="h-3 w-3 text-red-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-2 px-3">
                <div className="text-2xl font-bold text-red-600">{reportStats.rejected}</div>
                <p className="text-[10px] text-gray-500">Not approved</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Total Amount</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2 px-3">
                <div className="text-lg font-bold text-blue-600">₱{(reportStats.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-[10px] text-gray-500">Approved funds</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-white">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Rejected Amount</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2 px-3">
                <div className="text-lg font-bold text-red-600">₱{(reportStats.rejectedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-[10px] text-gray-500">Declined funds</p>
              </CardContent>
            </Card>
          </div>

          {/* Report Table */}
          <Card className="border-0 shadow-md flex flex-col overflow-hidden min-h-[500px]">
            <CardHeader className="py-3 border-b bg-gradient-to-r from-gray-50 to-white shrink-0">
              <CardTitle className="text-lg font-semibold text-gray-900">Report Details</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <div className="flex-1 overflow-auto min-h-0">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                      <TableHead className="text-center text-xs font-semibold bg-gray-100">Received By</TableHead>
                      <TableHead className="text-center text-xs font-semibold bg-gray-100">Tracking ID</TableHead>
                      <TableHead className="text-center text-xs font-semibold bg-gray-100">Category</TableHead>
                      <TableHead className="text-center text-xs font-semibold bg-gray-100 min-w-[140px]">Date/Time IN</TableHead>
                      <TableHead className="text-center text-xs font-semibold bg-gray-100 min-w-[140px]">Date/Time OUT</TableHead>
                      <TableHead className="text-center text-xs font-semibold bg-gray-100">Name/Reference</TableHead>
                      <TableHead className="text-center text-xs font-semibold bg-gray-100">Designation/Type</TableHead>
                      <TableHead className="text-center text-xs font-semibold bg-gray-100 min-w-[200px]">Purpose/Description</TableHead>
                      <TableHead className="text-center text-xs font-semibold bg-gray-100">Amount</TableHead>
                      <TableHead className="text-center text-xs font-semibold bg-gray-100">Status</TableHead>
                      <TableHead className="text-center text-xs font-semibold bg-gray-100">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                    <TableBody>
                      {(!isLoading && reportData.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-12 text-gray-500">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <TrendingUp className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-base font-medium">No records found</p>
                              <p className="text-sm">Try adjusting your filters or date range</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        // Paginate data
                        (() => {
                          const startIndex = (currentPage - 1) * rowsPerPage;
                          const endIndex = startIndex + rowsPerPage;
                          const pageData = reportData.slice(startIndex, endIndex);
                          return pageData;
                        })().map((record, idx) => (
                          <TableRow key={record.id} className={`hover:bg-indigo-50/50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`} onClick={() => { setSelectedRecord(record); setDetailDialogOpen(true); }}>
                            <TableCell className="text-center text-sm text-gray-700">
                              {record.receivedBy || '-'}
                            </TableCell>
                            <TableCell className="text-center font-semibold text-indigo-600 text-sm">
                              {record.trackingId}
                            </TableCell>
                            <TableCell className="text-center text-sm font-medium">{record.category}</TableCell>
                            <TableCell className="text-center text-xs text-gray-600 min-w-[140px]">
                              {record.dateTimeIn ? new Date(record.dateTimeIn).toLocaleString('en-US', { 
                                month: 'short', 
                                day: '2-digit', 
                                year: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              }) : '-'}
                            </TableCell>
                            <TableCell className="text-center text-xs text-gray-600 min-w-[140px]">
                              {record.dateTimeOut ? new Date(record.dateTimeOut).toLocaleString('en-US', { 
                                month: 'short', 
                                day: '2-digit', 
                                year: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              }) : '-'}
                            </TableCell>
                            <TableCell className="text-center text-sm text-gray-700">
                              {record.fullName || record.payee || record.dvNo || record.subject || '-'}
                            </TableCell>
                            <TableCell className="text-center text-sm text-gray-600">
                              {record.designation || record.leaveType || record.type || '-'}
                            </TableCell>
                            <TableCell className="text-center text-xs text-gray-600 min-w-[200px]">
                              {record.purpose || record.description || record.particulars || '-'}
                            </TableCell>
                            <TableCell className="text-center text-sm font-semibold text-blue-700">
                              {formatAmount(record.amount || record.estimatedCost)}
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                                  record.status === 'Completed'
                                    ? 'bg-green-100 text-green-700'
                                    : record.status === 'Approved'
                                    ? 'bg-green-100 text-green-700'
                                    : record.status === 'Rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : record.status === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {record.status === 'Completed' || record.status === 'Approved' ? <CheckCircle className="h-3 w-3" /> : 
                                 record.status === 'Rejected' ? <XCircle className="h-3 w-3" /> :
                                 record.status === 'Pending' ? <Clock className="h-3 w-3" /> : null}
                                {record.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs px-3 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRecord(record);
                                  setDetailDialogOpen(true);
                                }}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {isLoading && (
                  <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
                      <img
                        src="/images/bataan-logo.png"
                        alt="Bataan Logo"
                        className="h-16 w-16 object-contain drop-shadow-lg animate-pulse"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="flex items-center gap-3 text-base text-gray-800">
                        <span className="font-semibold">Loading...</span>
                      </div>
                      <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
                        <div className="h-full bg-gradient-to-r from-indigo-400 via-indigo-600 to-indigo-400 rounded-full absolute left-0 animate-[loading-slide_1.5s_ease-in-out_infinite]" style={{width: '50%'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              
              {/* Pagination Controls */}
              <div className="flex items-center justify-between gap-4 p-4 border-t shrink-0 bg-white">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-700 font-medium">Rows per page:</span>
                    <Select value={String(rowsPerPage)} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9 w-24 text-sm border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {(() => {
                      const totalPages = Math.max(1, Math.ceil(reportData.length / rowsPerPage));
                      const canPrev = currentPage > 1;
                      const canNext = currentPage < totalPages;
                      return (
                        <>
                          <span className="text-gray-700 font-medium">
                            Page <span className="text-indigo-600">{currentPage}</span> of <span className="text-indigo-600">{totalPages}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              className="h-9 px-4 text-sm border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                              disabled={!canPrev}
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              className="h-9 px-4 text-sm border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                              disabled={!canNext}
                              onClick={() => setCurrentPage((p) => p + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detail View Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Record Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedRecord?.category} - {selectedRecord?.trackingId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 border-b pb-2">
                <h3 className="font-semibold text-sm text-gray-700">Basic Information</h3>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500">Tracking ID</Label>
                <p className="text-sm font-semibold text-indigo-600">{selectedRecord.trackingId}</p>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500">Category</Label>
                <p className="text-sm">{selectedRecord.category}</p>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500">Status</Label>
                <Badge className={`${
                  selectedRecord.status === 'Completed' || selectedRecord.status === 'Approved'
                    ? 'bg-green-100 text-green-700'
                    : selectedRecord.status === 'Rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedRecord.status}
                </Badge>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500">Received/Created By</Label>
                <p className="text-sm">{selectedRecord.receivedBy || '-'}</p>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500">Date/Time IN</Label>
                <p className="text-sm">
                  {selectedRecord.dateTimeIn ? new Date(selectedRecord.dateTimeIn).toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }) : '-'}
                </p>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500">Date/Time OUT</Label>
                <p className="text-sm">
                  {selectedRecord.dateTimeOut ? new Date(selectedRecord.dateTimeOut).toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }) : '-'}
                </p>
              </div>

              <div className="col-span-2 border-b pb-2 mt-2">
                <h3 className="font-semibold text-sm text-gray-700">Specific Details</h3>
              </div>
              
              {selectedRecord.fullName && (
                <div>
                  <Label className="text-xs text-gray-500">Full Name</Label>
                  <p className="text-sm">{selectedRecord.fullName}</p>
                </div>
              )}
              
              {selectedRecord.designation && (
                <div>
                  <Label className="text-xs text-gray-500">Designation</Label>
                  <p className="text-sm">{selectedRecord.designation}</p>
                </div>
              )}
              
              {selectedRecord.leaveType && (
                <div>
                  <Label className="text-xs text-gray-500">Leave Type</Label>
                  <p className="text-sm">{selectedRecord.leaveType}</p>
                </div>
              )}
              
              {selectedRecord.inclusiveDateStart && (
                <div>
                  <Label className="text-xs text-gray-500">Inclusive Date Start</Label>
                  <p className="text-sm">{new Date(selectedRecord.inclusiveDateStart).toLocaleDateString()}</p>
                </div>
              )}
              
              {selectedRecord.inclusiveDateEnd && (
                <div>
                  <Label className="text-xs text-gray-500">Inclusive Date End</Label>
                  <p className="text-sm">{new Date(selectedRecord.inclusiveDateEnd).toLocaleDateString()}</p>
                </div>
              )}
              
              {selectedRecord.payee && (
                <div>
                  <Label className="text-xs text-gray-500">Payee</Label>
                  <p className="text-sm">{selectedRecord.payee}</p>
                </div>
              )}
              
              {selectedRecord.dvNo && (
                <div>
                  <Label className="text-xs text-gray-500">DV No.</Label>
                  <p className="text-sm">{selectedRecord.dvNo}</p>
                </div>
              )}
              
              {selectedRecord.obr && (
                <div>
                  <Label className="text-xs text-gray-500">OBR</Label>
                  <p className="text-sm">{selectedRecord.obr}</p>
                </div>
              )}
              
              {selectedRecord.subject && (
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Subject</Label>
                  <p className="text-sm">{selectedRecord.subject}</p>
                </div>
              )}
              
              {selectedRecord.type && (
                <div>
                  <Label className="text-xs text-gray-500">Type</Label>
                  <p className="text-sm">{selectedRecord.type}</p>
                </div>
              )}
              
              {(selectedRecord.amount || selectedRecord.estimatedCost) && (
                <div>
                  <Label className="text-xs text-gray-500">Amount</Label>
                  <p className="text-sm font-semibold">{formatAmount(selectedRecord.amount || selectedRecord.estimatedCost)}</p>
                </div>
              )}
              
              {selectedRecord.purpose && (
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Purpose</Label>
                  <p className="text-sm">{selectedRecord.purpose}</p>
                </div>
              )}
              
              {selectedRecord.description && (
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Description</Label>
                  <p className="text-sm">{selectedRecord.description}</p>
                </div>
              )}
              
              {selectedRecord.particulars && (
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Particulars</Label>
                  <p className="text-sm">{selectedRecord.particulars}</p>
                </div>
              )}
              
              {selectedRecord.remarks && (
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Remarks</Label>
                  <p className="text-sm">{selectedRecord.remarks}</p>
                </div>
              )}
              
              {selectedRecord.timeOutRemarks && (
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Time Out Remarks</Label>
                  <p className="text-sm">{selectedRecord.timeOutRemarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

