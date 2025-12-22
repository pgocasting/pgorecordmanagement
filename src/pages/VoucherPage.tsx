import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { voucherService, designationService } from '@/services/firebaseService';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Menu,
  LogOut,
  Search,
  User,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ActionButtons } from '@/components/ActionButtons';
import SuccessModal from '@/components/SuccessModal';
import TimeOutModal from '@/components/TimeOutModal';
import { MonthlyTotalCard } from '@/components/MonthlyTotalCard';

interface Voucher {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
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

  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    const loadDesignations = async () => {
      try {
        const designations = await designationService.getDesignations();
        setDesignationOptions(designations);
      } catch (error) {
        console.error('Error loading designations:', error);
        setDesignationOptions(['Admin', 'Manager', 'Staff', 'Officer']);
      }
    };
    loadDesignations();
  }, []);

  const [formData, setFormData] = useState({
    dateTimeIn: '',
    receivedBy: '',
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
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const count = String(vouchers.length + 1).padStart(3, '0');
    return `(V) ${year}/${month}/${day}-${count}`;
  }, [vouchers.length]);

  const monthlyTotal = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    return vouchers
      .filter(voucher => {
        const voucherDate = new Date(voucher.dateTimeIn);
        return voucherDate.getFullYear() === currentYear && voucherDate.getMonth() === currentMonth && voucher.status !== 'Rejected';
      })
      .reduce((sum, voucher) => sum + (voucher.amount || 0), 0);
  }, [vouchers]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(voucher =>
      voucher.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.dvNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (voucher.receivedBy && voucher.receivedBy.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [vouchers, searchTerm]);

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
      const newVoucher = {
        trackingId: nextTrackingId,
        status: 'Pending',
        timeOutRemarks: '',
        ...formData,
        amount: parseFloat(formData.amount),
        remarks: formData.remarks || 'Voucher record created',
        remarksHistory: [{
          remarks: formData.remarks || 'Voucher record created',
          status: 'Pending',
          timestamp: now,
          updatedBy: currentUser
        }],
        receivedBy: formData.receivedBy || currentUser,
        createdAt: now,
        updatedAt: now
      };
      const result = await voucherService.addVoucher(newVoucher);
      setSuccess('Voucher added successfully');

      setVouchers([result as Voucher, ...vouchers]);

      setFormData({
        dateTimeIn: '',
        receivedBy: '',
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
        dateTimeIn: '',
        receivedBy: '',
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
        dateTimeIn: voucher.dateTimeIn,
        receivedBy: voucher.receivedBy || '',
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
        dateTimeIn: '',
        receivedBy: '',
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
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Voucher Records</h1>
              <p className="text-sm text-gray-600">Welcome back</p>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex items-center gap-4">
              {user?.name && (
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-linear-to-br from-gray-100 via-gray-50 to-gray-100" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}>
          <MonthlyTotalCard total={monthlyTotal} />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Vouchers</h2>
                <p className="text-sm text-gray-600">Manage and view all voucher records</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by tracking ID, payee, DV No..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button
                      className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          dateTimeIn: getCurrentDateTime(),
                          receivedBy: '',
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
                      {!editingId && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-700">Tracking ID</Label>
                          <Input
                            type="text"
                            value={nextTrackingId}
                            disabled
                            className="bg-gray-100 h-8 text-xs"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="dateTimeIn" className="text-xs font-medium text-gray-700">Date/Time IN *</Label>
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
                          <Label htmlFor="dvNo" className="text-xs font-medium text-gray-700">DV No. *</Label>
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

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="payee" className="text-xs font-medium text-gray-700">Payee *</Label>
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
                          <Label htmlFor="amount" className="text-xs font-medium text-gray-700">Amount *</Label>
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
                        <Label htmlFor="particulars" className="text-xs font-medium text-gray-700">Particulars *</Label>
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
                          <Label htmlFor="designationOffice" className="text-xs font-medium text-gray-700">Designation / Office *</Label>
                          <Select value={formData.designationOffice} onValueChange={(value) => handleSelectChange('designationOffice', value)}>
                            <SelectTrigger id="designationOffice" className="w-full h-8 text-xs">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {designationOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="voucherType" className="text-xs font-medium text-gray-700">Voucher Type *</Label>
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
                        <Label htmlFor="funds" className="text-xs font-medium text-gray-700">Funds *</Label>
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
                          <Label htmlFor="remarks" className="text-xs font-medium text-gray-700">Remarks</Label>
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
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-center">Received By</TableHead>
                      <TableHead className="text-center">Tracking ID</TableHead>
                      <TableHead className="text-center">Date/Time IN</TableHead>
                      <TableHead className="text-center">Date/Time OUT</TableHead>
                      <TableHead className="text-center">DV No.</TableHead>
                      <TableHead className="text-center">Payee</TableHead>
                      <TableHead className="text-center">Amount</TableHead>
                      <TableHead className="text-center">Type</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Remarks</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVouchers.length > 0 ? (
                      filteredVouchers.map((voucher) => (
                        <TableRow key={voucher.id} className="hover:bg-gray-50">
                          <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{voucher.receivedBy || '-'}</TableCell>
                          <TableCell className="font-bold italic wrap-break-word whitespace-normal text-center text-xs text-indigo-600">{voucher.trackingId}</TableCell>
                          <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{formatDateTimeWithoutSeconds(voucher.dateTimeIn)}</TableCell>
                          <TableCell className={`wrap-break-word whitespace-normal text-center text-xs ${voucher.status === 'Completed' ? 'text-green-600 font-medium' : 'text-red-600'}`}>{voucher.dateTimeOut ? formatDateTimeWithoutSeconds(voucher.dateTimeOut) : '-'}</TableCell>
                          <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{voucher.dvNo}</TableCell>
                          <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{voucher.payee}</TableCell>
                          <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{formatAmount(voucher.amount)}</TableCell>
                          <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{voucher.voucherType}</TableCell>
                          <TableCell className="wrap-break-word whitespace-normal text-center text-xs">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              voucher.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              voucher.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              voucher.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {voucher.status}
                            </span>
                          </TableCell>
                          <TableCell 
  className="wrap-break-word whitespace-normal text-xs cursor-pointer hover:bg-gray-50"
  onClick={() => viewRemarksHistory(voucher)}
>
  {voucher.remarks ? (
    <div className="space-y-1 relative">
      {voucher.status === 'Pending' && voucher.remarksHistory?.some(h => h.status === 'Edited') && (
        <span className="absolute -top-2 -right-1 bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded-full">
          Edited
        </span>
      )}
      <div className="text-black">
        {voucher.remarksHistory?.length > 0 ? voucher.remarksHistory[0].remarks : voucher.remarks}
      </div>
      {voucher.remarksHistory?.length > 0 && (
        <div className={`${voucher.status === 'Completed' ? 'text-green-600' : voucher.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
          {voucher.remarksHistory[0]?.timestamp && voucher.status !== 'Completed' && voucher.status !== 'Pending' && (
            <span>[{formatDateTimeWithoutSeconds(voucher.remarksHistory[0].timestamp)}] </span>
          )}
          [{voucher.status} by {voucher.receivedBy}]
        </div>
      )}
      <div className="text-xs text-blue-600 mt-1">
        Click to view full history
      </div>
    </div>
  ) : '-'}
</TableCell>
                          <TableCell className="text-center">
                            <ActionButtons
                              onView={() => handleViewVoucher(voucher.id)}
                              onEdit={() => handleEditVoucher(voucher.id)}
                              onTimeOut={() => handleTimeOut(voucher.id)}
                              onReject={() => handleRejectVoucher(voucher.id)}
                              hidden={voucher.status === 'Rejected'}
                              canEdit={voucher.status !== 'Rejected'}
                              canReject={voucher.status !== 'Rejected'}
                              showTimeOut={voucher.status !== 'Completed' && voucher.status !== 'Rejected'}
                              showEdit={voucher.status !== 'Completed'}
                              showReject={voucher.status !== 'Completed'}
                              editDisabledReason={voucher.status === 'Rejected' ? 'Cannot edit rejected records' : undefined}
                              rejectDisabledReason={user?.role !== 'admin' && (!!voucher.dateTimeOut || voucher.status !== 'Pending') ? 'Users can only reject pending records' : undefined}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500 wrap-break-word whitespace-normal">
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Voucher Details</DialogTitle>
            <DialogDescription>
              View the complete details of this voucher record.
            </DialogDescription>
          </DialogHeader>
          {selectedVoucher && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tracking ID</p>
                  <p className="text-lg font-bold text-indigo-600 mt-1">{selectedVoucher.trackingId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</p>
                  <p className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedVoucher.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      selectedVoucher.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedVoucher.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedVoucher.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date/Time In</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDateTimeWithoutSeconds(selectedVoucher.dateTimeIn)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Received By</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedVoucher.receivedBy || '-'}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Voucher Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">DV No.</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedVoucher.dvNo}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Payee</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedVoucher.payee}</p>
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
                    <p className="text-xs font-medium text-gray-600 uppercase">Designation / Office</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedVoucher.designationOffice}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Funds</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedVoucher.funds}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Particulars</p>
                <p className="text-sm font-semibold text-gray-900 mt-1 whitespace-pre-wrap">{selectedVoucher.particulars}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Date/Time Out</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedVoucher.dateTimeOut ? formatDateTimeWithoutSeconds(selectedVoucher.dateTimeOut) : '-'}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Remarks</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedVoucher.remarks || selectedVoucher.timeOutRemarks || '-'}</p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setViewModalOpen(false)}
                  className="px-6"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
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
                          item.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          item.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          item.status === 'Edited' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
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
  );
}

