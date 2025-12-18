import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  voucherService, 
  letterService, 
  leaveService, 
  locatorService,
  obligationRequestService,
  purchaseRequestService,
  travelOrderService,
  overtimeService,
  adminToPGOService,
  processingService,
  othersService
} from '@/services/firebaseService';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, Printer } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

interface RecordItem {
  id: string;
  trackingId: string;
  dateTimeIn: string;
  fullName?: string;
  receivedBy?: string;
  particulars?: string;
  amount?: string | number;
  officeAddress?: string;
  designation?: string;
  purpose?: string;
  placeOfAssignment?: string;
  recordType?: string;
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

export default function ReceivingCopyPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [allRecords, setAllRecords] = useState<RecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(recordTypes));
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadAllRecords = async () => {
      setIsLoading(true);
      try {
        const records: RecordItem[] = [];

        // Load all record types
        try {
          const vouchers = await voucherService.getVouchers();
          records.push(...vouchers.map((v: any) => ({ ...v, recordType: 'Voucher' })));
        } catch (e) {
          console.error('Error loading vouchers:', e);
        }

        try {
          const letters = await letterService.getLetters();
          records.push(...letters.map((l: any) => ({ ...l, recordType: 'Letter' })));
        } catch (e) {
          console.error('Error loading letters:', e);
        }

        try {
          const leaves = await leaveService.getLeaves();
          records.push(...leaves.map((l: any) => ({ ...l, recordType: 'Leave' })));
        } catch (e) {
          console.error('Error loading leaves:', e);
        }

        try {
          const locators = await locatorService.getLocators();
          records.push(...locators.map((l: any) => ({ ...l, recordType: 'Locator' })));
        } catch (e) {
          console.error('Error loading locators:', e);
        }

        try {
          const obligations = await obligationRequestService.getObligationRequests();
          records.push(...obligations.map((o: any) => ({ ...o, recordType: 'Obligation Request' })));
        } catch (e) {
          console.error('Error loading obligation requests:', e);
        }

        try {
          const purchases = await purchaseRequestService.getPurchaseRequests();
          records.push(...purchases.map((p: any) => ({ ...p, recordType: 'Purchase Request' })));
        } catch (e) {
          console.error('Error loading purchase requests:', e);
        }

        try {
          const travelOrders = await travelOrderService.getTravelOrders();
          records.push(...travelOrders.map((t: any) => ({ ...t, recordType: 'Travel Order' })));
        } catch (e) {
          console.error('Error loading travel orders:', e);
        }

        try {
          const overtimes = await overtimeService.getOvertimes();
          records.push(...overtimes.map((o: any) => ({ ...o, recordType: 'Request for Overtime' })));
        } catch (e) {
          console.error('Error loading overtimes:', e);
        }

        try {
          const adminToPGO = await adminToPGOService.getRecords();
          records.push(...adminToPGO.map((a: any) => ({ ...a, recordType: 'Admin to PGO' })));
        } catch (e) {
          console.error('Error loading admin to PGO records:', e);
        }

        try {
          const processings = await processingService.getRecords();
          records.push(...processings.map((p: any) => ({ ...p, recordType: 'Processing' })));
        } catch (e) {
          console.error('Error loading processings:', e);
        }

        try {
          const others = await othersService.getRecords();
          records.push(...others.map((o: any) => ({ ...o, recordType: 'Others' })));
        } catch (e) {
          console.error('Error loading others:', e);
        }

        // Sort by date received (descending)
        records.sort((a, b) => new Date(b.dateTimeIn).getTime() - new Date(a.dateTimeIn).getTime());
        setAllRecords(records);
      } catch (error) {
        console.error('Error loading records:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllRecords();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleRecordSelection = (recordId: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRecords.size === allRecords.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(allRecords.map(r => r.id)));
    }
  };

  const toggleCategorySelection = (category: string) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  const toggleSelectAllCategories = () => {
    if (selectedCategories.size === recordTypes.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(recordTypes));
    }
  };

  const filteredRecords = allRecords.filter(record => 
    selectedCategories.has(record.recordType || '')
  ).sort((a, b) => new Date(b.dateTimeIn).getTime() - new Date(a.dateTimeIn).getTime());

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Format amount for display
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

  const handlePrint = () => {
    if (selectedRecords.size === 0) {
      alert('Please select at least one record to print');
      return;
    }
    window.print();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getDesignationOffice = (record: RecordItem): string => {
    const recordType = record.recordType;
    
    switch (recordType) {
      case 'Voucher':
      case 'Letter':
        return (record as any).designationOffice || '-';
      case 'Leave':
      case 'Locator':
      case 'Travel Order':
      case 'Request for Overtime':
        return (record as any).designation || '-';
      case 'Admin to PGO':
        return (record as any).officeAddress || '-';
      case 'Obligation Request':
      case 'Purchase Request':
        return (record as any).designation || '-';
      case 'Others':
        return (record as any).designationOffice || (record as any).designation || '-';
      default:
        return record.designation || (record as any).designationOffice || (record as any).officeAddress || '-';
    }
  };

  const getFullName = (record: RecordItem): string => {
    const recordType = record.recordType;
    
    switch (recordType) {
      case 'Voucher':
        return (record as any).payee || '-';
      default:
        return record.fullName || '-';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <button className="lg:hidden fixed top-4 left-4 z-40 p-2 hover:bg-gray-200 rounded-lg">
            <Menu className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar onNavigate={() => setSidebarOpen(false)} recordTypes={recordTypes} />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:block w-64 border-r border-gray-200">
        <Sidebar recordTypes={recordTypes} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Receiving Copy</h2>
            <p className="text-sm text-gray-600">Printable record of all received documents</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handlePrint}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col">
          {/* Category Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 print-hide shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Filter by Category</h3>
              <button
                onClick={toggleSelectAllCategories}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {selectedCategories.size === recordTypes.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {recordTypes.map((category) => (
                <label key={category} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(category)}
                    onChange={() => toggleCategorySelection(category)}
                    className="cursor-pointer"
                  />
                  <span className="text-xs text-gray-700">
                    {category}
                    <span className="text-gray-500 opacity-80 ml-1">
                      {category === 'Voucher' || category === 'Purchase Request' || category === 'Obligation Request' || category === 'Processing' ? 
                        '(Have Amount)' : 
                        '(No Amount)'}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <p className="text-gray-500">Loading records...</p>
              </div>
            ) : allRecords.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <p className="text-gray-500">No records found</p>
              </div>
            ) : (
              <div className="overflow-auto flex-1 min-h-0">
                <table className="w-full h-full border-collapse table-fixed">
                  <colgroup>
                    <col style={{ width: '3%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '23%' }} />
                    <col style={{ width: '17%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-300">
                      <th className="border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-gray-900">
                        <input
                          type="checkbox"
                          checked={selectedRecords.size === filteredRecords.length && filteredRecords.length > 0}
                          onChange={toggleSelectAll}
                          className="cursor-pointer"
                        />
                      </th>
                      <th className="border border-gray-300 px-2 py-2 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Tracking ID</th>
                      <th className="border border-gray-300 px-2 py-2 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Date Received</th>
                      <th className="border border-gray-300 px-2 py-2 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Category</th>
                      <th className="border border-gray-300 px-2 py-2 text-left text-sm font-semibold text-gray-900">Full Name</th>
                      <th className="border border-gray-300 px-2 py-2 text-left text-sm font-semibold text-gray-900">Requesting Office</th>
                      <th className="border border-gray-300 px-2 py-2 text-left text-sm font-semibold text-gray-900">Particulars</th>
                      <th className="border border-gray-300 px-2 py-2 text-left text-sm font-semibold text-gray-900">Amount</th>
                      <th className="border border-gray-300 px-2 py-2 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Received By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((record) => (
                      <tr key={record.id} className={`border-b border-gray-200 ${selectedRecords.has(record.id) ? 'bg-blue-50 print-selected' : 'hover:bg-gray-50'}`}>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRecords.has(record.id)}
                            onChange={() => toggleRecordSelection(record.id)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-900 truncate">
                          {record.trackingId || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-900 whitespace-nowrap">
                          {formatDate(record.dateTimeIn)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-900 truncate">
                          {record.recordType || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-900 break-words">
                          {getFullName(record)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-900 break-words">
                          {getDesignationOffice(record)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-900 break-words">
                          {record.particulars || record.purpose || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-900 text-right whitespace-nowrap">
                          {formatAmount(record.amount)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-900 text-center">
                          -
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {!isLoading && filteredRecords.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 print-hide shrink-0">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredRecords.length)}</span> of{' '}
                  <span className="font-medium">{filteredRecords.length}</span> records
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            className={currentPage === page ? 'bg-indigo-600 text-white' : ''}
                          >
                            {page}
                          </Button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @page {
          size: A4 landscape;
          margin: 0.2in;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            width: 100%;
          }
          .hidden, .lg\\:hidden, .print-hide, button, input[type="checkbox"] {
            display: none !important;
          }
          .flex-1 {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .overflow-auto {
            overflow: visible !important;
          }
          table {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
            font-size: 10px !important;
            table-layout: fixed;
            max-width: 100% !important;
          }
          thead {
            display: table-header-group;
            break-inside: avoid;
          }
          tbody {
            display: table-row-group;
            break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 4px 5px !important;
            text-align: left;
            font-size: 10px !important;
            line-height: 1.2 !important;
            word-break: break-word;
            overflow-wrap: break-word;
            vertical-align: top;
          }
          th {
            background-color: #f3f4f6 !important;
            font-weight: bold !important;
            font-size: 9px !important;
            padding: 4px 5px !important;
          }
          tr:nth-child(even) {
            background-color: #f9fafb !important;
          }
          .bg-white {
            background-color: white !important;
            box-shadow: none !important;
          }
          col:first-child, th:first-child, td:first-child {
            display: none !important;
          }
          th:last-child, td:last-child {
            color: white !important;
          }
          tbody tr:not(.print-selected) {
            display: none !important;
          }
          /* Ensure table headers and footers are repeated on each printed page */
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          /* Prevent page breaks inside table rows */
          tr { page-break-inside: avoid; }
          /* Ensure the table uses the full page width */
          .overflow-x-auto {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          /* Adjust column widths for better fit */
          colgroup col {
            width: auto !important;
          }
          /* Ensure text is visible in print */
          * {
            color: #000 !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
