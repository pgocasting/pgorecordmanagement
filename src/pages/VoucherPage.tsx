import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { voucherService, designationService } from '@/services/firebaseService';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Plus,
  Menu,
  LogOut,
  Search,
  User,
  Receipt
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Badge } from '@/components/ui/badge';
import SuccessModal from '@/components/SuccessModal';
import TimeOutModal from '@/components/TimeOutModal';

const getPhilippinesDateKey = (dateInput: Date | string): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const philippinesTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const year = philippinesTime.getFullYear();
  const month = String(philippinesTime.getMonth() + 1).padStart(2, '0');
  const day = String(philippinesTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface Voucher {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fpp?: string;
  dvNo: string;
  payee: string;
  particulars: string;
  designationOffice: string;
  amount: number;
  voucherType: string;
  funds: string;
  status: string;
  remarks?: string;
  remarksHistory: Array<{
    remarks: string;
    status: string;
    timestamp: string;
    updatedBy: string;
  }>;
  timeOutRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

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

const getCurrentDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
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
  'Processing',
  'Others',
];

export default function VoucherPage() {
  // Helper function to format time without seconds with AM/PM in Philippine timezone
  const formatDateTimeWithoutSeconds = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    });
  };

  // Helper function to get acronym from designation
  const getDesignationAcronym = (designation: string): string => {
    const normalizedDesignation = (designation ?? '').trim();
    if (!normalizedDesignation) return 'N/A';
    if (normalizedDesignation.toUpperCase() === 'N/A') return 'N/A';
    const acronymMap: { [key: string]: string } = {
      'Office of the Provincial Governor (PGO)': 'PGO',
      'Office of the Vice Governor (OVG)': 'OVG',
      "Provincial Administrator's Office (PAO)": 'PAO',
      'Provincial Legal Office (PLO)': 'PLO',
      'Provincial Treasury Office (PTO)': 'PTO',
      'Provincial Accounting Office (PAccO)': 'PAccO',
      'Provincial Budget Office (PBO)': 'PBO',
      "Provincial Assessor's Office (PAO)": 'PAO',
      'Provincial Engineer\'s Office (PEO)': 'PEO',
      'Provincial Health Office (PHO)': 'PHO',
      'Provincial Social Welfare and Development Office (PSWDO)': 'PSWDO',
      'Provincial Agriculture Office (PAgrO)': 'PAgrO',
      'Provincial Veterinary Office (PVO)': 'PVO',
      'Provincial Environment and Natural Resources Office (PENRO)': 'PENRO',
      'Provincial Planning and Development Office (PPDO)': 'PPDO',
      'Provincial Human Resource Management Office (PHRMO)': 'PHRMO',
      'Provincial General Services Office (PGSO)': 'PGSO',
      'Provincial Information and Communications Technology Office (PICTO)': 'PICTO',
      'Provincial Disaster Risk Reduction and Management Office (PDRRMO)': 'PDRRMO',
      'Provincial Tourism Office (PTO)': 'PTO',
      'Provincial Youth, Sports, and Development Office (PYSDO)': 'PYSDO',
      'Sangguniang Panlalawigan Secretariat (SPS)': 'SPS',
      'Admin': 'Admin',
      'Manager': 'Manager',
      'Staff': 'Staff',
      'Officer': 'Officer'
    };
    
    // If the full designation is in the map, return its acronym
    if (acronymMap[normalizedDesignation]) {
      return acronymMap[normalizedDesignation];
    }
    
    // If it's already an acronym, return as is
    const acronyms = Object.values(acronymMap);
    if (acronyms.includes(normalizedDesignation)) {
      return normalizedDesignation;
    }
    
    // Extract acronym from parentheses if present
    const match = normalizedDesignation.match(/\(([^)]+)\)/);
    if (match) {
      return match[1];
    }
    
    // Default: return first letters of words (max 4 chars)
    const words = normalizedDesignation.split(' ');
    const acronym = words.slice(0, 4).map(word => word.charAt(0)).join('').toUpperCase();
    return acronym;
  };

  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed' | 'Rejected'>('Pending');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<string | null>(null);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [timeOutConfirmOpen, setTimeOutConfirmOpen] = useState(false);
  const [voucherToTimeOut, setVoucherToTimeOut] = useState<string | null>(null);
  const [timeOutData, setTimeOutData] = useState({
    dateTimeOut: '',
    timeOutRemarks: '',
  });
  const [returnConfirmOpen, setReturnConfirmOpen] = useState(false);
  const [voucherToReturn, setVoucherToReturn] = useState<string | null>(null);
  const [returnData, setReturnData] = useState({
    remarks: '',
  });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [rejectData, setRejectData] = useState({
    remarks: '',
  });
  const [remarksHistoryOpen, setRemarksHistoryOpen] = useState(false);
  const [currentRemarksHistory, setCurrentRemarksHistory] = useState<Array<{
    remarks: string;
    status: string;
    timestamp: string;
    updatedBy: string;
  }>>([]);
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);
  const [designationDropdownOpen, setDesignationDropdownOpen] = useState(false);

  useEffect(() => {
    const loadDesignations = async () => {
      try {
        const designations = await designationService.getDesignations();
        setDesignationOptions(designations);
      } catch (error) {
        console.error('Error loading designations:', error);
        setDesignationOptions([
          'Office of the Provincial Governor (PGO)',
          'Office of the Vice Governor (OVG)',
          'Provincial Administrator\'s Office (PAO)',
          'Provincial Legal Office (PLO)',
          'Provincial Treasury Office (PTO)',
          'Provincial Accounting Office (PAccO)',
          'Provincial Budget Office (PBO)',
          'Provincial Assessor\'s Office (PAO)',
          'Provincial Engineer\'s Office (PEO)',
          'Provincial Health Office (PHO)',
          'Provincial Social Welfare and Development Office (PSWDO)',
          'Provincial Agriculture Office (PAgrO)',
          'Provincial Veterinary Office (PVO)',
          'Provincial Environment and Natural Resources Office (PENRO)',
          'Provincial Planning and Development Office (PPDO)',
          'Provincial Human Resource Management Office (PHRMO)',
          'Provincial General Services Office (PGSO)',
          'Provincial Information and Communications Technology Office (PICTO)',
          'Provincial Disaster Risk Reduction and Management Office (PDRRMO)',
          'Provincial Tourism Office (PTO)',
          'Provincial Youth, Sports, and Development Office (PYSDO)',
          'Sangguniang Panlalawigan Secretariat (SPS)',
          'Admin',
          'Manager',
          'Staff',
          'Officer'
        ]);
      }
    };
    loadDesignations();
  }, []);

  const [formData, setFormData] = useState({
    trackingId: '',
    dateTimeIn: '',
    receivedBy: '',
    fpp: '',
    dvNo: '',
    payee: '',
    particulars: '',
    designationOffice: '',
    amount: '',
    voucherType: '',
    funds: '',
    remarks: '',
    remarksHistory: [] as Array<{
      remarks: string;
      status: string;
      timestamp: string;
      updatedBy: string;
    }>
  });

  const viewRemarksHistory = (voucher: Voucher) => {
    setCurrentRemarksHistory(voucher.remarksHistory || []);
    setRemarksHistoryOpen(true);
  };

  useEffect(() => {
    const loadVouchers = async () => {
      try {
        console.log('📂 Loading vouchers from Firestore...');
        const data = await voucherService.getVouchers();
        console.log(`✅ Vouchers loaded: ${data.length} records`);
        setVouchers(data as Voucher[]);
      } catch (error) {
        console.error('❌ Error loading vouchers:', error);
        setSuccess('Error loading vouchers. Please try again.');
        setSuccessModalOpen(true);
      }
    };
    
    loadVouchers();
    const interval = setInterval(loadVouchers, 30000);
    return () => clearInterval(interval);
  }, []);

  const nextTrackingId = useMemo(() => {
    const now = new Date();
    const philippinesTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const year = philippinesTime.getFullYear();
    const month = String(philippinesTime.getMonth() + 1).padStart(2, '0');
    const day = String(philippinesTime.getDate()).padStart(2, '0');

    const todayKey = getPhilippinesDateKey(philippinesTime);
    const todaysCount = vouchers.filter(r => r.dateTimeIn && getPhilippinesDateKey(r.dateTimeIn) === todayKey).length;
    const count = String(todaysCount + 1).padStart(3, '0');
    return `(V) ${year}/${month}/${day}-${count}`;
  }, [vouchers]);


  const filteredVouchers = useMemo(() => {
    return vouchers
      .filter((voucher) => {
        if ((voucher.status || 'Pending') !== activeTab) return false;

        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;

        const designationAcronym = getDesignationAcronym(voucher.designationOffice || '');

        const searchableFields = [
          voucher.trackingId,
          voucher.payee,
          voucher.dvNo,
          voucher.particulars,
          voucher.designationOffice,
          designationAcronym,
          voucher.voucherType,
          voucher.funds,
          typeof voucher.amount === 'number' ? String(voucher.amount) : (voucher.amount as any),
          voucher.remarks,
          voucher.timeOutRemarks,
          voucher.receivedBy,
        ];

        return searchableFields
          .filter((v) => typeof v === 'string' && v.trim().length > 0)
          .some((v) => (v as string).toLowerCase().includes(term));
      })
      .sort((a, b) => (b.dateTimeIn || '').localeCompare(a.dateTimeIn || ''));
  }, [vouchers, searchTerm, activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddVoucher = async () => {
    setSuccess('');

    if (
      !formData.dateTimeIn ||
      !formData.dvNo ||
      !formData.payee ||
      !formData.particulars ||
      !formData.designationOffice ||
      !formData.amount ||
      !formData.voucherType ||
      !formData.funds
    ) {
      setSuccess('Please fill in all required fields');
      setSuccessModalOpen(true);
      return;
    }

    if (editingId) {
      setEditConfirmOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const { trackingId, ...restFormData } = formData;
      const newVoucher = {
        ...restFormData,
        trackingId: trackingId || nextTrackingId,
        status: 'Pending',
        timeOutRemarks: '',
        amount: parseFloat(formData.amount),
        receivedBy: formData.receivedBy || currentUser,
        remarks: formData.remarks || 'Voucher created',
        remarksHistory: [{
          remarks: formData.remarks || 'Voucher created',
          status: 'Pending',
          timestamp: now,
          updatedBy: currentUser
        }],
        createdAt: now,
        updatedAt: now
      };

      const result = await voucherService.addVoucher(newVoucher);
      setSuccess('Voucher added successfully');
      setVouchers([result as Voucher, ...vouchers]);

      setFormData({
        trackingId: '',
        dateTimeIn: '',
        receivedBy: '',
        fpp: '',
        dvNo: '',
        payee: '',
        particulars: '',
        designationOffice: '',
        amount: '',
        voucherType: '',
        funds: '',
        remarks: '',
        remarksHistory: []
      });
      setIsDialogOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save voucher:', err);
      setSuccess('Error saving voucher');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmEditVoucher = async () => {
    if (!editingId) return;

    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const existingVoucher = vouchers.find(v => v.id === editingId);
      const newRemarksHistory = [
        ...(existingVoucher?.remarksHistory || []),
        {
          remarks: formData.remarks,
          status: 'Edited',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      const updateData = {
        ...formData,
        amount: parseFloat(formData.amount),
        remarks: formData.remarks || '',
        remarksHistory: newRemarksHistory,
        updatedAt: now
      };
      await voucherService.updateVoucher(editingId, updateData);
      setSuccess('Voucher updated successfully');
      setEditingId(null);

      const updatedVouchers = vouchers.map(v => v.id === editingId ? { ...v, ...updateData } : v);
      setVouchers(updatedVouchers);

      setFormData({
        trackingId: '',
        dateTimeIn: '',
        receivedBy: '',
        fpp: '',
        dvNo: '',
        payee: '',
        particulars: '',
        designationOffice: '',
        amount: '',
        voucherType: '',
        funds: '',
        remarks: '',
        remarksHistory: []
      });
      setIsDialogOpen(false);
      setEditConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save voucher:', err);
      setSuccess(err instanceof Error ? err.message : 'Error updating voucher');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditVoucher = (id: string) => {
    const voucher = vouchers.find((item) => item.id === id);
    if (voucher) {
      setFormData({
        trackingId: voucher.trackingId,
        dateTimeIn: voucher.dateTimeIn,
        receivedBy: voucher.receivedBy || '',
        fpp: voucher.fpp || '',
        dvNo: voucher.dvNo,
        payee: voucher.payee,
        particulars: voucher.particulars,
        designationOffice: voucher.designationOffice,
        amount: voucher.amount.toString(),
        voucherType: voucher.voucherType,
        funds: voucher.funds,
        remarks: voucher.remarks || '',
        remarksHistory: voucher.remarksHistory || []
      });
      setEditingId(id);
      setIsDialogOpen(true);
    }
  };

  const handleRejectVoucher = (id: string) => {
    setVoucherToDelete(id);
    setRejectData({ remarks: '' });
    setDeleteConfirmOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingId(null);
      setFormData({
        trackingId: '',
        dateTimeIn: '',
        receivedBy: '',
        fpp: '',
        dvNo: '',
        payee: '',
        particulars: '',
        designationOffice: '',
        amount: '',
        voucherType: '',
        funds: '',
        remarks: '',
        remarksHistory: []
      });
    }
  };

  const confirmRejectVoucher = async () => {
    if (!voucherToDelete) return;

    if (!rejectData.remarks.trim()) {
      setSuccess('Error: Rejection remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const voucher = vouchers.find(v => v.id === voucherToDelete);
      if (!voucher) return;
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = rejectData.remarks;
      const updatedRemarksHistory = [
        ...(voucher.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Rejected',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      await voucherService.updateVoucher(voucherToDelete, { status: 'Rejected', remarks: newRemarks, remarksHistory: updatedRemarksHistory, updatedAt: now });
      const updatedVouchers = vouchers.map(v => v.id === voucherToDelete ? { ...v, status: 'Rejected', remarks: newRemarks, remarksHistory: updatedRemarksHistory, updatedAt: now } : v);
      setVouchers(updatedVouchers);
      setSuccess('Voucher rejected successfully');
      setVoucherToDelete(null);
      setRejectData({ remarks: '' });
      setDeleteConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to reject voucher:', err);
      setSuccess(err instanceof Error ? err.message : 'Error rejecting voucher');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewVoucher = (id: string) => {
    const voucher = vouchers.find((item) => item.id === id);
    if (voucher) {
      setSelectedVoucher(voucher);
      setViewModalOpen(true);
    }
  };

  const handleReturnVoucher = (id: string) => {
    setVoucherToReturn(id);
    setReturnData({ remarks: '' });
    setReturnConfirmOpen(true);
  };

  const confirmReturnVoucher = async () => {
    if (!voucherToReturn) return;

    if (!returnData.remarks.trim()) {
      setSuccess('Error: Return remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const voucher = vouchers.find(v => v.id === voucherToReturn);
      if (!voucher) return;
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = returnData.remarks;
      const updatedRemarksHistory = [
        ...(voucher.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Returned',
          timestamp: now,
          updatedBy: currentUser
        }
      ];

      await voucherService.updateVoucher(voucherToReturn, {
        status: 'Pending',
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        dateTimeOut: '',
        timeOutRemarks: ''
      });

      const updated = vouchers.map(v => v.id === voucherToReturn ? {
        ...v,
        status: 'Pending',
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        dateTimeOut: '',
        timeOutRemarks: ''
      } : v);
      setVouchers(updated);
      setSuccess('Voucher returned successfully');
      setVoucherToReturn(null);
      setReturnData({ remarks: '' });
      setReturnConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to return voucher:', err);
      setSuccess(err instanceof Error ? err.message : 'Error returning voucher');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeOut = (id: string) => {
    setVoucherToTimeOut(id);
    // Get current time in Philippine timezone (GMT+8)
    const now = new Date();
    // Format as YYYY-MM-DDTHH:mm in Philippine timezone
    const philippinesTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const year = philippinesTime.getFullYear();
    const month = String(philippinesTime.getMonth() + 1).padStart(2, '0');
    const day = String(philippinesTime.getDate()).padStart(2, '0');
    const hours = String(philippinesTime.getHours()).padStart(2, '0');
    const minutes = String(philippinesTime.getMinutes()).padStart(2, '0');
    const dateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    setTimeOutData({ 
      dateTimeOut: dateTimeLocal,
      timeOutRemarks: '' 
    });
    setTimeOutConfirmOpen(true);
  };

  const confirmTimeOut = async () => {
    if (!voucherToTimeOut || !timeOutData.dateTimeOut) return;

    if (!timeOutData.timeOutRemarks.trim()) {
      setSuccess('Error: Time out remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const voucher = vouchers.find(v => v.id === voucherToTimeOut);
      if (!voucher) return;
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = timeOutData.timeOutRemarks;
      const updatedRemarksHistory = [
        ...(voucher.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Completed',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      await voucherService.updateVoucher(voucherToTimeOut, {
        dateTimeOut: timeOutData.dateTimeOut,
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        timeOutRemarks: newRemarks,
        status: 'Completed',
        updatedAt: now
      });

      const updatedVouchers = await voucherService.getVouchers();
      setVouchers(updatedVouchers as Voucher[]);

      setSuccess('Time out recorded successfully');
      setVoucherToTimeOut(null);
      setTimeOutData({ dateTimeOut: '', timeOutRemarks: '' });
      setTimeOutConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to record time out:', err);
      setSuccess(err instanceof Error ? err.message : 'Error recording time out');
      setSuccessModalOpen(true);

      const updatedVouchers = await voucherService.getVouchers();
      setVouchers(updatedVouchers as Voucher[]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
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
      <div className="hidden md:block bg-card border-r shadow-sm">
        <Sidebar recordTypes={recordTypes} onNavigate={undefined} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b shadow-sm pl-14 pr-4 sm:px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">Voucher Records</h1>
                <p className="text-sm text-gray-500">Manage disbursement vouchers and payments</p>
              </div>
            </div>

            
            
            {/* User Info and Logout */}
            <div className="flex flex-wrap items-center gap-3">
              {user?.name && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
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
        <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-gray-50 flex flex-col min-h-0">
          <div className="border-0 shadow-md rounded-lg bg-white overflow-hidden flex flex-col flex-1 min-h-0">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Vouchers</h2>
                <p className="text-sm text-gray-500 mt-1">Manage and view all voucher records</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search vouchers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto h-10"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          trackingId: nextTrackingId,
                          dateTimeIn: getCurrentDateTime(),
                          receivedBy: '',
                          fpp: '',
                          dvNo: '',
                          payee: '',
                          particulars: '',
                          designationOffice: '',
                          amount: '',
                          voucherType: '',
                          funds: '',
                          remarks: '',
                          remarksHistory: []
                        });
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg z-50 max-h-[90vh] overflow-y-auto overflow-x-hidden">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-semibold">
                        {editingId ? 'Edit Voucher' : 'Add New Voucher'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingId ? 'Update the voucher details' : 'Fill in the form to add a new voucher'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="trackingId" className="text-xs font-medium">Tracking ID</Label>
                        <Input
                          id="trackingId"
                          name="trackingId"
                          type="text"
                          value={editingId ? formData.trackingId : nextTrackingId}
                          onChange={handleInputChange}
                          disabled={!editingId || user?.role !== 'admin'}
                          className="bg-gray-50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="dateTimeIn" className="text-xs font-medium">Date/Time IN *</Label>
                          <Input
                            id="dateTimeIn"
                            name="dateTimeIn"
                            type="datetime-local"
                            value={formData.dateTimeIn}
                            onChange={handleInputChange}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="dvNo" className="text-xs font-medium">DV No. *</Label>
                          <Input
                            id="dvNo"
                            name="dvNo"
                            value={formData.dvNo}
                            onChange={handleInputChange}
                            placeholder="DV No."
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="fpp" className="text-xs font-medium">FPP</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between h-8 text-xs"
                            >
                              {formData.fpp || "Select FPP..."}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search FPP..." />
                              <CommandList>
                                <CommandEmpty>No FPP found.</CommandEmpty>
                                <CommandGroup>
                                  {['FPP 1', 'FPP 2', 'FPP 3', 'FPP 4', 'FPP 5'].map((option) => (
                                    <CommandItem
                                      key={option}
                                      value={option}
                                      onSelect={(currentValue) => {
                                        handleSelectChange('fpp', currentValue);
                                      }}
                                    >
                                      {option}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="payee" className="text-xs font-medium">Payee *</Label>
                          <Input
                            id="payee"
                            name="payee"
                            value={formData.payee}
                            onChange={handleInputChange}
                            placeholder="Payee"
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="amount" className="text-xs font-medium">Amount *</Label>
                          <Input
                            id="amount"
                            name="amount"
                            type="number"
                            value={formData.amount}
                            onChange={handleInputChange}
                            placeholder="Amount"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="particulars" className="text-xs font-medium">Particulars *</Label>
                        <Textarea
                          id="particulars"
                          name="particulars"
                          value={formData.particulars}
                          onChange={handleInputChange}
                          placeholder="Enter particulars"
                          rows={2}
                          className="text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="designationOffice" className="text-xs font-medium">Designation / Office *</Label>
                          <Popover open={designationDropdownOpen} onOpenChange={setDesignationDropdownOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={designationDropdownOpen}
                                className="w-full h-8 text-xs justify-between truncate"
                              >
                                <span className="truncate flex-1 text-left">
                                  {formData.designationOffice || "Select office..."}
                                </span>
                                <Search className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search office..." />
                                <CommandList>
                                  <CommandEmpty>No office found.</CommandEmpty>
                                  <CommandGroup>
                                    {designationOptions.map((option) => (
                                      <CommandItem
                                        key={option}
                                        value={option}
                                        onSelect={(currentValue) => {
                                          handleSelectChange('designationOffice', currentValue);
                                          setDesignationDropdownOpen(false);
                                        }}
                                      >
                                        {option}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="voucherType" className="text-xs font-medium">Voucher Type *</Label>
                          <Input
                            id="voucherType"
                            name="voucherType"
                            value={formData.voucherType}
                            onChange={handleInputChange}
                            placeholder="Type"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="funds" className="text-xs font-medium">Funds *</Label>
                        <Input
                          id="funds"
                          name="funds"
                          value={formData.funds}
                          onChange={handleInputChange}
                          placeholder="Enter funds"
                          className="h-8 text-xs"
                        />
                      </div>

                      {editingId && (
                        <div className="space-y-1">
                          <Label htmlFor="remarks" className="text-xs font-medium">Remarks</Label>
                          <Textarea
                            id="remarks"
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleInputChange}
                            placeholder="Enter remarks"
                            rows={2}
                            className="text-xs"
                          />
                        </div>
                      )}

                      <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 mt-2 h-9 text-sm"
                        onClick={handleAddVoucher}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : editingId ? 'Update Voucher' : 'Add Voucher'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

      {/* Return Confirmation Modal */}
      <Dialog open={returnConfirmOpen} onOpenChange={setReturnConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return Voucher</DialogTitle>
            <DialogDescription>
              Provide a reason for returning this voucher. The status will be set back to "Pending".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="returnRemarks" className="text-sm font-medium text-gray-700">Return Remarks *</Label>
              <textarea
                id="returnRemarks"
                placeholder="Enter return remarks (required)"
                value={returnData.remarks}
                onChange={(e) => setReturnData({ remarks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReturnConfirmOpen(false);
                setVoucherToReturn(null);
                setReturnData({ remarks: '' });
              }}
            >
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={confirmReturnVoucher}>
              Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
              </div>
            </div>

            <div className="flex gap-2 mt-4 border-b border-gray-200 px-4 sm:px-6 shrink-0">
              <button
                onClick={() => setActiveTab('Pending')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'Pending'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({vouchers.filter(v => (v.status || 'Pending') === 'Pending').length})
              </button>
              <button
                onClick={() => setActiveTab('Completed')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'Completed'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed ({vouchers.filter(v => v.status === 'Completed').length})
              </button>
              <button
                onClick={() => setActiveTab('Rejected')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'Rejected'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Rejected ({vouchers.filter(v => v.status === 'Rejected').length})
              </button>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-auto min-h-0">
                <div className="overflow-visible">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 sticky top-0 z-10">
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs bg-muted/50">Received / Created By</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs bg-muted/50">Tracking ID</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs whitespace-normal wrap-break-word max-w-[120px] bg-muted/50">Date/Time IN</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs whitespace-normal wrap-break-word max-w-[120px] bg-muted/50">Date/Time OUT</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs bg-muted/50">FPP</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs bg-muted/50">DV No.</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs bg-muted/50">Payee</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs bg-muted/50">Office</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs bg-muted/50">Amount</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs bg-muted/50">Type</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs bg-muted/50">Status</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs bg-muted/50">Remarks</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs bg-muted/50">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVouchers.length > 0 ? (
                        filteredVouchers.map((voucher) => (
                          <TableRow key={voucher.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="text-sm py-3 px-4 text-center">{voucher.receivedBy || '-'}</TableCell>
                            <TableCell className="text-sm py-3 px-4 text-center font-bold text-primary">{voucher.trackingId}</TableCell>
                            <TableCell className="text-sm py-3 px-4 text-center whitespace-normal wrap-break-word max-w-[120px]">{formatDateTimeWithoutSeconds(voucher.dateTimeIn)}</TableCell>
                            <TableCell className={`text-sm py-3 px-4 text-center whitespace-normal wrap-break-word max-w-[120px] ${voucher.status === 'Completed' ? 'text-green-600 font-medium' : 'text-red-600'}`}>{voucher.dateTimeOut ? formatDateTimeWithoutSeconds(voucher.dateTimeOut) : '-'}</TableCell>
                            <TableCell className="text-sm py-3 px-4 text-center">{voucher.fpp || '-'}</TableCell>
                            <TableCell className="text-sm py-3 px-4 text-center">{voucher.dvNo}</TableCell>
                            <TableCell className="text-sm py-3 px-4 text-center">{voucher.payee}</TableCell>
                            <TableCell className="text-sm py-3 px-4 text-center">
                              <div className="group relative inline-block">
                                <span className="text-primary font-medium hover:underline cursor-default">
                                  {getDesignationAcronym(voucher.designationOffice)}
                                </span>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                  <div className="font-medium">{voucher.designationOffice}</div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm py-3 px-4 text-center">{formatAmount(voucher.amount)}</TableCell>
                            <TableCell className="text-sm py-3 px-4 text-center">{voucher.voucherType}</TableCell>
                            <TableCell className="text-sm py-3 px-4 text-center">
                              <Badge 
                                variant={
                                  voucher.status === 'Rejected' ? 'destructive' : 'secondary'
                                }
                                className={`${
                                  voucher.status === 'Completed' || voucher.status === 'Approved' ? 
                                  'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' : 
                                  voucher.status === 'Pending' || (!voucher.status || voucher.status === 'Pending') ? 
                                  'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200' : 
                                  voucher.status === 'Rejected' ? 
                                  'bg-red-50 text-red-700 hover:bg-red-100 border-red-200' : ''
                                }`}
                              >
                                {voucher.status || 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell 
                              className="wrap-break-word whitespace-normal text-xs cursor-pointer hover:bg-muted/50"
                              onClick={() => viewRemarksHistory(voucher)}
                            >
                              {voucher.remarks ? (
                                <div className="space-y-1 relative">
                                  {voucher.status === 'Pending' && voucher.remarksHistory?.some(h => h.status === 'Edited') && (
                                    <span className="absolute -top-2 -right-1 bg-yellow-50 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded-full">
                                      Edited
                                    </span>
                                  )}
                                  <div className="text-black">
                                    {voucher.remarksHistory?.length > 0 ? voucher.remarksHistory[voucher.remarksHistory.length - 1].remarks : voucher.remarks}
                                  </div>
                                  {voucher.remarksHistory?.length > 0 && (
                                    <div className={`${voucher.status === 'Completed' ? 'text-green-600' : voucher.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                                      {voucher.remarksHistory[voucher.remarksHistory.length - 1]?.timestamp && voucher.status !== 'Completed' && voucher.status !== 'Pending' && (
                                        <span>[{formatDateTimeWithoutSeconds(voucher.remarksHistory[voucher.remarksHistory.length - 1].timestamp)}] </span>
                                      )}
                                      [{voucher.status === 'Pending' ? `${voucher.status} - Created by ${voucher.receivedBy}` : `${voucher.status} by ${voucher.receivedBy}`}]
                                    </div>
                                  )}
                                  <div className="text-xs text-blue-600 mt-1">
                                    Click to view full history
                                  </div>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-sm py-3 px-4">
                              <div className="flex flex-col items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewVoucher(voucher.id)}
                                  className="h-8 w-16 text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  View
                                </Button>
                                {(voucher.status === 'Pending' || voucher.status === 'Approved' || user?.role === 'admin') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditVoucher(voucher.id)}
                                    className="h-8 w-16 text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                  >
                                    Edit
                                  </Button>
                                )}
                                {voucher.status === 'Pending' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRejectVoucher(voucher.id)}
                                    className="h-8 w-16 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                                  >
                                    Reject
                                  </Button>
                                )}
                                {(voucher.status === 'Pending' || voucher.status === 'Approved') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTimeOut(voucher.id)}
                                    className="h-8 w-16 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                                  >
                                    Out
                                  </Button>
                                )}
                                {(voucher.status === 'Completed' || voucher.status === 'Rejected') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReturnVoucher(voucher.id)}
                                    className="h-8 w-16 text-purple-600 border-purple-600 hover:bg-purple-50 hover:text-purple-700"
                                  >
                                    Return
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-muted-foreground wrap-break-word whitespace-normal">
                            No vouchers found. Add one to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>

        </div>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">Voucher Details</DialogTitle>
            <DialogDescription>
              View complete information about this voucher record
            </DialogDescription>
          </DialogHeader>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            {selectedVoucher && (
              <div className="space-y-4">
                {/* Personal Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Payee</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedVoucher.payee}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Designation/Office</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        <div className="group relative inline-block">
                          <span className="text-primary font-medium hover:underline cursor-default">
                            {getDesignationAcronym(selectedVoucher.designationOffice)}
                          </span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            <div className="font-medium">{selectedVoucher.designationOffice}</div>
                            <div className="text-xs text-gray-300 mt-1">Click to copy</div>
                          </div>
                        </div>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Voucher Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">DV No.</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedVoucher.dvNo}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Amount</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{formatAmount(selectedVoucher.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Type</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedVoucher.voucherType}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Date/Time In</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{formatDateTimeWithoutSeconds(selectedVoucher.dateTimeIn)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Date/Time Out</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedVoucher.dateTimeOut ? formatDateTimeWithoutSeconds(selectedVoucher.dateTimeOut) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Funds</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedVoucher.funds || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Particulars */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Particulars</h3>
                  <p className="text-sm font-semibold text-gray-900 whitespace-pre-wrap">{selectedVoucher.particulars || '-'}</p>
                </div>

                {/* Remarks */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Remarks</h3>
                  <p className="text-sm font-semibold text-gray-900 whitespace-pre-wrap">{selectedVoucher.remarks || '-'}</p>
                  {selectedVoucher.timeOutRemarks && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase">Date/Time Out</p>
                          <p className="text-sm font-semibold text-blue-900 mt-1">{selectedVoucher.dateTimeOut ? formatDateTimeWithoutSeconds(selectedVoucher.dateTimeOut) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase">Time Out Remarks</p>
                          <p className="text-sm font-semibold text-blue-900 mt-1 whitespace-pre-wrap">{selectedVoucher.timeOutRemarks}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewModalOpen(false)}
              className="px-6"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">Confirm Reject</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject this voucher? The status will be changed to "Rejected".
          </DialogDescription>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectRemarks" className="text-sm font-medium text-gray-700">Rejection Remarks *</Label>
              <textarea
                id="rejectRemarks"
                placeholder="Enter rejection remarks (required)"
                value={rejectData.remarks}
                onChange={(e) => setRejectData({ remarks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setVoucherToDelete(null);
                setRejectData({ remarks: '' });
              }}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRejectVoucher}
              className="px-6 bg-red-600 hover:bg-red-700 text-white"
            >
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Confirmation Modal */}
      <Dialog open={editConfirmOpen} onOpenChange={setEditConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to update this voucher?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setEditConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={confirmEditVoucher}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Out Modal */}
      <TimeOutModal
        open={timeOutConfirmOpen}
        onOpenChange={setTimeOutConfirmOpen}
        onConfirm={confirmTimeOut}
        onCancel={() => {
          setTimeOutConfirmOpen(false);
          setVoucherToTimeOut(null);
        }}
        dateTimeOut={timeOutData.dateTimeOut}
        onDateTimeOutChange={(value) => setTimeOutData({ ...timeOutData, dateTimeOut: value })}
        remarks={timeOutData.timeOutRemarks}
        onRemarksChange={(value) => setTimeOutData({ ...timeOutData, timeOutRemarks: value })}
        isLoading={isLoading}
      />

      {/* Success Modal */}
      <SuccessModal
        open={successModalOpen}
        onOpenChange={setSuccessModalOpen}
        message={success}
        isError={success.includes('Error')}
      />

      {/* Remarks History Dialog */}
      <Dialog open={remarksHistoryOpen} onOpenChange={setRemarksHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Remarks History</DialogTitle>
            <DialogDescription>
              View the complete history of remarks for this record
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {currentRemarksHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No remarks history available</p>
            ) : (
              <div className="space-y-3">
                {[...currentRemarksHistory].reverse().map((item, index) => (
                  <div key={index} className={`border-l-4 ${
                    item.status === 'Completed' ? 'border-green-200' :
                    item.status === 'Rejected' ? 'border-red-200' :
                    'border-blue-200'
                  } pl-4 py-3 bg-gray-50 rounded-r-lg`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'Completed' ? 'bg-green-50 text-green-700' :
                          item.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                          item.status === 'Edited' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-sm text-gray-700 font-medium">
                          {item.updatedBy}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                      {item.remarks.split('\n').map((line, i) => (
                        <div key={i} className="flex items-start">
                          <span className="mr-2 text-gray-400 mt-0.5">•</span>
                          <span className="flex-1">{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

