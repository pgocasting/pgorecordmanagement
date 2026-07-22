import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { purchaseRequestService, designationService, fppService, fundsService } from '@/services/firebaseService';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Menu, LogOut, Search, User, ShoppingCart } from 'lucide-react';
import SuccessModal from '@/components/SuccessModal';
import TimeOutModal from '@/components/TimeOutModal';
import { Badge } from '@/components/ui/badge';

const getCurrentDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getPhilippinesDateKey = (dateInput: Date | string): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const philippinesTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const year = philippinesTime.getFullYear();
  const month = String(philippinesTime.getMonth() + 1).padStart(2, '0');
  const day = String(philippinesTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface PurchaseRequest {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fpp?: string;
  fullName: string;
  designation: string;
  amount?: string | number;
  purpose: string;
  status: string;
  remarks: string;
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

  if (acronymMap[normalizedDesignation]) {
    return acronymMap[normalizedDesignation];
  }

  const acronyms = Object.values(acronymMap);
  if (acronyms.includes(normalizedDesignation)) {
    return normalizedDesignation;
  }

  const match = normalizedDesignation.match(/\(([^)]+)\)/);
  if (match) {
    return match[1];
  }

  const words = normalizedDesignation.split(' ');
  const acronym = words.slice(0, 4).map(word => word.charAt(0)).join('').toUpperCase();
  return acronym;
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

export default function PurchaseRequestPage() {
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
  const isViewer = user?.role === 'viewer';
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed' | 'Rejected'>('Pending');
  const [activeFundsTab, setActiveFundsTab] = useState<string>('All');
  const [availableFunds, setAvailableFunds] = useState<Array<{id?: string; name: string}>>([]);
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [timeOutConfirmOpen, setTimeOutConfirmOpen] = useState(false);
  const [requestToTimeOut, setRequestToTimeOut] = useState<string | null>(null);
  const [timeOutData, setTimeOutData] = useState({
    dateTimeOut: '',
    timeOutRemarks: '',
  });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
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
  const [fppOptions, setFppOptions] = useState<Array<{id?: string; code: string; description?: string; category?: string}>>([]);
  const [fppDropdownOpen, setFppDropdownOpen] = useState(false);
  const [returnConfirmOpen, setReturnConfirmOpen] = useState(false);
  const [requestToReturn, setRequestToReturn] = useState<string | null>(null);
  const [returnData, setReturnData] = useState({
    remarks: '',
  });

  const [formData, setFormData] = useState({
    trackingId: '',
    dateTimeIn: '',
    dateTimeOut: '',
    fpp: '',
    fullName: '',
    designation: '',
    funds: '',
    amount: '',
    purpose: '',
    remarks: '',
    remarksHistory: [] as Array<{
      remarks: string;
      status: string;
      timestamp: string;
      updatedBy: string;
    }>
  });

  const viewRemarksHistory = (request: PurchaseRequest) => {
    setCurrentRemarksHistory(request.remarksHistory || []);
    setRemarksHistoryOpen(true);
  };

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

  useEffect(() => {
    const loadFPPs = async () => {
      try {
        const fpps = await fppService.getFPPs();
        // Keep the full objects for displaying code + description
        setFppOptions(fpps);
      } catch (error) {
        console.error('Error loading FPPs:', error);
        setFppOptions([]);
      }
    };
    loadFPPs();
    
    // Listen for FPP updates from settings page
    const handleFPPsUpdate = () => {
      loadFPPs();
    };
    window.addEventListener('fppsUpdated', handleFPPsUpdate);
    
    return () => {
      window.removeEventListener('fppsUpdated', handleFPPsUpdate);
    };
  }, []);

  // Load funds from Firestore
  useEffect(() => {
    const loadFunds = async () => {
      try {
        const funds = await fundsService.getFunds();
        setAvailableFunds(funds);
      } catch (error) {
        console.error('Error loading funds:', error);
        setAvailableFunds([]);
      }
    };
    loadFunds();
    
    // Listen for funds updates from settings page
    const handleFundsUpdate = () => {
      loadFunds();
    };
    window.addEventListener('fundsUpdated', handleFundsUpdate);
    
    return () => {
      window.removeEventListener('fundsUpdated', handleFundsUpdate);
    };
  }, []);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await purchaseRequestService.getPurchaseRequests();
        setPurchaseRequests(data as unknown as PurchaseRequest[]);
      } catch (error) {
        console.error('Error loading purchase requests:', error);
        setSuccess('Error loading purchase requests');
        setSuccessModalOpen(true);
      }
    };
    loadRequests();
  }, []);

  const filteredPurchaseRequests = purchaseRequests
    .filter((request) => {
      if ((request.status || 'Pending') !== activeTab) return false;
      
      // Filter by funds tab
      if (activeFundsTab !== 'All') {
        const requestFunds = (request as any).funds;
        if (requestFunds !== activeFundsTab) return false;
      }

      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;

      const designationAcronym = getDesignationAcronym(request.designation || '');

      const searchableFields = [
        request.trackingId,
        request.fullName,
        request.receivedBy,
        request.designation,
        designationAcronym,
        request.purpose,
        typeof request.amount === 'number' ? String(request.amount) : (request.amount as any),
        request.remarks,
        request.timeOutRemarks,
      ];

      return searchableFields
        .filter((v) => typeof v === 'string' && v.trim().length > 0)
        .some((v) => (v as string).toLowerCase().includes(term));
    })
    .sort((a, b) => (b.dateTimeIn || '').localeCompare(a.dateTimeIn || ''));

  const nextTrackingId = useMemo(() => {
    const now = new Date();
    const philippinesTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const year = philippinesTime.getFullYear();
    const month = String(philippinesTime.getMonth() + 1).padStart(2, '0');
    const day = String(philippinesTime.getDate()).padStart(2, '0');

    const todayKey = getPhilippinesDateKey(philippinesTime);
    const todaysCount = purchaseRequests.filter(r => r.dateTimeIn && getPhilippinesDateKey(r.dateTimeIn) === todayKey).length;
    const count = String(todaysCount + 1).padStart(3, '0');
    return `(PR) ${year}/${month}/${day}-${count}`;
  }, [purchaseRequests]);

  

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

  const handleAddRequest = async () => {
    setSuccess('');

    if (
      !formData.dateTimeIn ||
      !formData.fullName ||
      !formData.designation ||
      !formData.amount ||
      !formData.purpose
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
      const newRequest = {
        ...restFormData,
        trackingId: trackingId || nextTrackingId,
        receivedBy: currentUser,
        amount: parseFloat(formData.amount),
        remarks: formData.remarks || 'Purchase request created',
        remarksHistory: [{
          remarks: formData.remarks || 'Purchase request created',
          status: 'Pending',
          timestamp: now,
          updatedBy: currentUser
        }],
        status: 'Pending',
        createdAt: now,
        updatedAt: now
      };
      const result = await purchaseRequestService.addPurchaseRequest(newRequest);
      setSuccess('Purchase request added successfully');
      setPurchaseRequests([result as unknown as PurchaseRequest, ...purchaseRequests]);

      setFormData({
        trackingId: '',
        dateTimeIn: '',
        dateTimeOut: '',
        fpp: '',
        fullName: '',
        designation: '',
        funds: '',
        amount: '',
        purpose: '',
        remarks: '',
        remarksHistory: []
      });
      setIsDialogOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save purchase request:', err);
      setSuccess('Error saving purchase request');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmEditRequest = async () => {
    if (!editingId) return;

    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const existingRequest = purchaseRequests.find(r => r.id === editingId);
      const newRemarksHistory = [
        ...(existingRequest?.remarksHistory || []),
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
      await purchaseRequestService.updatePurchaseRequest(editingId, updateData);
      setSuccess('Purchase request updated successfully');
      setEditingId(null);

      const updatedRequests = purchaseRequests.map(r => r.id === editingId ? { ...r, ...updateData } : r);
      setPurchaseRequests(updatedRequests);

      setFormData({
        trackingId: '',
        dateTimeIn: '',
        dateTimeOut: '',
        fpp: '',
        fullName: '',
        designation: '',
        funds: '',
        amount: '',
        purpose: '',
        remarks: '',
        remarksHistory: []
      });
      setIsDialogOpen(false);
      setEditConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save purchase request:', err);
      setSuccess('Error updating purchase request');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRequest = (id: string) => {
    const request = purchaseRequests.find((item) => item.id === id);
    if (request) {
      setFormData({
        trackingId: request.trackingId,
        dateTimeIn: request.dateTimeIn,
        dateTimeOut: request.dateTimeOut || '',
        fpp: request.fpp || '',
        fullName: request.fullName,
        designation: request.designation,
        funds: (request as any).funds || '',
        amount: (request.amount || (request as any).estimatedCost || 0).toString(),
        purpose: request.purpose,
        remarks: request.remarks,
        remarksHistory: request.remarksHistory || []
      });
      setEditingId(id);
      setIsDialogOpen(true);
    }
  };

  const handleRejectRequest = (id: string) => {
    setRequestToDelete(id);
    setRejectData({ remarks: '' });
    setDeleteConfirmOpen(true);
  };

  const confirmRejectRequest = async () => {
    if (!requestToDelete) return;

    if (!rejectData.remarks.trim()) {
      setSuccess('Error: Rejection remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const request = purchaseRequests.find(r => r.id === requestToDelete);
      if (!request) return;
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = rejectData.remarks;
      const updatedRemarksHistory = [
        ...(request.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Rejected',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      await purchaseRequestService.updatePurchaseRequest(requestToDelete, { status: 'Rejected', remarks: newRemarks, remarksHistory: updatedRemarksHistory, updatedAt: now });
      const updatedRequests = purchaseRequests.map(r => r.id === requestToDelete ? { ...r, status: 'Rejected', remarks: newRemarks, remarksHistory: updatedRemarksHistory, updatedAt: now } : r);
      setPurchaseRequests(updatedRequests);
      setSuccess('Purchase request rejected successfully');
      setRequestToDelete(null);
      setRejectData({ remarks: '' });
      setDeleteConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to reject purchase request:', err);
      setSuccess('Error rejecting purchase request');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingId(null);
      setFormData({
        trackingId: '',
        dateTimeIn: '',
        dateTimeOut: '',
        fpp: '',
        fullName: '',
        designation: '',
        funds: '',
        amount: '',
        purpose: '',
        remarks: '',
        remarksHistory: []
      });
    }
  };

  const handleViewRequest = (id: string) => {
    const request = purchaseRequests.find((item) => item.id === id);
    if (request) {
      setSelectedRequest(request);
      setViewModalOpen(true);
    }
  };

  const handleReturnRequest = (id: string) => {
    setRequestToReturn(id);
    setReturnData({ remarks: '' });
    setReturnConfirmOpen(true);
  };

  const confirmReturnRequest = async () => {
    if (!requestToReturn) return;

    if (!returnData.remarks.trim()) {
      setSuccess('Error: Return remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const request = purchaseRequests.find(r => r.id === requestToReturn);
      if (!request) return;
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = returnData.remarks;
      const updatedRemarksHistory = [
        ...(request.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Returned',
          timestamp: now,
          updatedBy: currentUser
        }
      ];

      await purchaseRequestService.updatePurchaseRequest(requestToReturn, {
        status: 'Pending',
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        dateTimeOut: '',
        timeOutRemarks: ''
      });

      const updated = purchaseRequests.map(r => r.id === requestToReturn ? {
        ...r,
        status: 'Pending',
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        dateTimeOut: '',
        timeOutRemarks: ''
      } : r);
      setPurchaseRequests(updated);
      setSuccess('Purchase request returned successfully');
      setRequestToReturn(null);
      setReturnData({ remarks: '' });
      setReturnConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to return purchase request:', err);
      setSuccess(err instanceof Error ? err.message : 'Error returning purchase request');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeOut = (id: string) => {
    setRequestToTimeOut(id);
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
    if (!requestToTimeOut || !timeOutData.dateTimeOut) return;

    if (!timeOutData.timeOutRemarks.trim()) {
      setSuccess('Error: Time out remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const request = purchaseRequests.find(r => r.id === requestToTimeOut);
      if (!request) return;
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = timeOutData.timeOutRemarks;
      const updatedRemarksHistory = [
        ...(request.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Completed',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      
      const result = await purchaseRequestService.updatePurchaseRequest(requestToTimeOut, {
        dateTimeOut: timeOutData.dateTimeOut,
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        timeOutRemarks: newRemarks,
        status: 'Completed',
        updatedAt: now
      });

      if (!result) {
        throw new Error('Purchase request not found. It may have been deleted or the data is out of sync.');
      }

      const updatedRequests = await purchaseRequestService.getPurchaseRequests();
      setPurchaseRequests(updatedRequests as unknown as PurchaseRequest[]);

      setSuccess('Time out recorded successfully');
      setTimeOutConfirmOpen(false);
      setRequestToTimeOut(null);
      setTimeOutData({
        dateTimeOut: '',
        timeOutRemarks: '',
      });
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to record time out:', err);
      setSuccess(err instanceof Error ? err.message : 'Error recording time out');
      setSuccessModalOpen(true);
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent">Purchase Request Records</h1>
                  <p className="text-sm text-gray-500">Manage procurement and purchase requests</p>
                </div>
                {isViewer && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-300">
                    Read-Only Mode
                  </Badge>
                )}
              </div>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex flex-wrap items-center gap-3">
              {user?.name && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shrink-0 shadow-sm">
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
            <div className="px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Purchase Requests</h2>
                <p className="text-sm text-gray-500 mt-1">Manage and view all purchase request records</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search purchase requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </div>
                {!isViewer && (
                  <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                    <DialogTrigger asChild>
                      <Button
                        className="gap-2 bg-cyan-600 hover:bg-cyan-700 w-full sm:w-auto h-10"
                        onClick={() => {
                          setEditingId(null);
                          setFormData({
                            trackingId: nextTrackingId,
                            dateTimeIn: getCurrentDateTime(),
                            dateTimeOut: '',
                            fpp: '',
                            fullName: '',
                            designation: '',
                            funds: '',
                            amount: '',
                            purpose: '',
                            remarks: '',
                            remarksHistory: []
                          });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add Record
                      </Button>
                    </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Edit' : 'Add New'} Purchase Request</DialogTitle>
                    <DialogDescription>
                      Fill in the form to {editingId ? 'update' : 'add'} a purchase request
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 overflow-x-hidden max-w-full">
                    <div className="space-y-2 w-full max-w-full">
                      <Label htmlFor="trackingId">Tracking ID</Label>
                      <Input
                        id="trackingId"
                        name="trackingId"
                        value={editingId ? formData.trackingId : nextTrackingId}
                        onChange={handleInputChange}
                        disabled={!editingId || user?.role !== 'admin'}
                        className="bg-gray-50 w-full max-w-full"
                      />
                    </div>

                    {editingId && user?.role === 'admin' && (
                      <div className="space-y-2 w-full max-w-full">
                        <Label htmlFor="dateTimeOut">Date/Time OUT</Label>
                        <Input
                          id="dateTimeOut"
                          name="dateTimeOut"
                          type="datetime-local"
                          value={formData.dateTimeOut || ''}
                          onChange={handleInputChange}
                          className="w-full max-w-full"
                        />
                      </div>
                    )}
                    <div className="space-y-2 w-full max-w-full overflow-hidden">
                      <Label htmlFor="fpp">FPP</Label>
                      <Popover open={fppDropdownOpen} onOpenChange={setFppDropdownOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={fppDropdownOpen}
                            className="w-full justify-between h-10 px-3 py-2 bg-background hover:bg-accent hover:text-accent-foreground border border-input items-center max-w-full"
                            style={{ minHeight: '40px', maxHeight: '40px' }}
                          >
                            <span className="flex-1 text-left overflow-hidden min-w-0 text-sm max-w-full" style={{ lineHeight: '1.5rem' }}>
                              {formData.fpp ? (
                                <span className="block overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                                  <span className="font-medium">{formData.fpp}</span>
                                  {fppOptions.find(f => f.code === formData.fpp)?.description && (
                                    <span className="text-muted-foreground text-sm ml-2">
                                      - {fppOptions.find(f => f.code === formData.fpp)?.description}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Select FPP...</span>
                              )}
                            </span>
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
                          <Command className="max-h-none" shouldFilter={true}>
                            <CommandInput placeholder="Search FPP..." />
                            <CommandList
                              style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden' }}
                              onWheel={(e) => e.stopPropagation()}
                            >
                              <CommandEmpty>No FPP found.</CommandEmpty>
                              <CommandGroup>
                                {fppOptions.map((option) => (
                                  <CommandItem
                                    key={option.id || option.code}
                                    value={`${option.code} ${option.description || ''}`}
                                    onSelect={() => {
                                      handleSelectChange('fpp', option.code);
                                      setFppDropdownOpen(false);
                                    }}
                                    className="flex flex-col items-start py-3 px-3 cursor-pointer hover:bg-gray-50"
                                  >
                                    <span className="font-medium text-gray-900">{option.code}</span>
                                    {option.description && (
                                      <span className="text-sm text-muted-foreground mt-1">
                                        {option.description}
                                      </span>
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-full">
                      <div className="space-y-2 min-w-0 max-w-full">
                        <Label htmlFor="dateTimeIn">Date/Time IN *</Label>
                        <Input
                          id="dateTimeIn"
                          name="dateTimeIn"
                          type="datetime-local"
                          value={formData.dateTimeIn}
                          onChange={handleInputChange}
                          required
                          className="w-full max-w-full"
                        />
                      </div>
                      <div className="space-y-2 min-w-0 max-w-full">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          placeholder="Full Name"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                          className="w-full max-w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-full">
                      <div className="space-y-2 min-w-0 max-w-full overflow-hidden">
                        <Label htmlFor="designation">Office *</Label>
                        <Popover open={designationDropdownOpen} onOpenChange={setDesignationDropdownOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={designationDropdownOpen}
                              className="w-full justify-between h-10 px-3 py-2 bg-background hover:bg-accent hover:text-accent-foreground border border-input items-center max-w-full"
                            >
                              <span className="flex-1 text-left overflow-hidden min-w-0 text-sm max-w-full">
                                {formData.designation ? (
                                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{formData.designation}</span>
                                ) : (
                                  <span className="text-muted-foreground">Select office...</span>
                                )}
                              </span>
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
                            <Command className="max-h-none" shouldFilter={true}>
                              <CommandInput placeholder="Search office..." />
                              <CommandList
                                style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden' }}
                                onWheel={(e) => e.stopPropagation()}
                              >
                                <CommandEmpty>No office found.</CommandEmpty>
                                <CommandGroup>
                                  {designationOptions.map((option) => (
                                    <CommandItem
                                      key={option}
                                      value={option}
                                      onSelect={(currentValue) => {
                                        handleSelectChange('designation', currentValue);
                                        setDesignationDropdownOpen(false);
                                      }}
                                      className="cursor-pointer hover:bg-gray-50 py-2"
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
                      <div className="space-y-2 min-w-0 max-w-full overflow-hidden">
                        <Label htmlFor="funds">Funds</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between h-10 px-3 py-2 bg-background hover:bg-accent hover:text-accent-foreground border border-input items-center max-w-full"
                            >
                              <span className="flex-1 text-left overflow-hidden min-w-0 text-sm max-w-full">
                                {formData.funds ? (
                                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{formData.funds}</span>
                                ) : (
                                  <span className="text-muted-foreground">Select funds...</span>
                                )}
                              </span>
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search funds..." />
                              <CommandList>
                                <CommandEmpty>No funds found.</CommandEmpty>
                                <CommandGroup>
                                  {availableFunds.map((fund) => (
                                    <CommandItem
                                      key={fund.id || fund.name}
                                      value={fund.name}
                                      onSelect={() => {
                                        handleSelectChange('funds', fund.name);
                                      }}
                                      className="cursor-pointer hover:bg-gray-50 py-2"
                                    >
                                      {fund.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="space-y-2 w-full max-w-full">
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                        className="w-full max-w-full"
                      />
                    </div>
                    <div className="space-y-2 w-full max-w-full">
                      <Label htmlFor="purpose">Purpose *</Label>
                      <Textarea
                        id="purpose"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        placeholder="Enter purpose"
                        rows={3}
                        required
                        className="resize-none w-full max-w-full"
                      />
                    </div>
                    <div className="space-y-2 w-full max-w-full">
                      <Label htmlFor="remarks">Remarks</Label>
                      <Input
                        id="remarks"
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleInputChange}
                        placeholder="Enter remarks"
                        className="w-full max-w-full"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={editingId ? confirmEditRequest : handleAddRequest}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? 'Saving...' : editingId ? 'Update Purchase Request' : 'Add Purchase Request'}
                  </Button>
                </DialogContent>
                </Dialog>
                )}

      {/* Return Confirmation Modal */}
      <Dialog open={returnConfirmOpen} onOpenChange={setReturnConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return Purchase Request</DialogTitle>
            <DialogDescription>
              Provide a reason for returning this request. The status will be set back to "Pending".
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
                setRequestToReturn(null);
                setReturnData({ remarks: '' });
              }}
            >
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={confirmReturnRequest}>
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
                Pending ({purchaseRequests.filter(r => (r.status || 'Pending') === 'Pending').length})
              </button>
              <button
                onClick={() => setActiveTab('Completed')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'Completed'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed ({purchaseRequests.filter(r => r.status === 'Completed').length})
              </button>
              <button
                onClick={() => setActiveTab('Rejected')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'Rejected'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Rejected ({purchaseRequests.filter(r => r.status === 'Rejected').length})
              </button>
            </div>

            {/* Funds Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200 px-4 sm:px-6 shrink-0 overflow-x-auto">
              <button
                onClick={() => setActiveFundsTab('All')}
                className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeFundsTab === 'All'
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Funds ({purchaseRequests.filter(r => (r.status || 'Pending') === activeTab).length})
              </button>
              {availableFunds.map((fund) => (
                <button
                  key={fund.id || fund.name}
                  onClick={() => setActiveFundsTab(fund.name)}
                  className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeFundsTab === fund.name
                      ? 'text-cyan-600 border-b-2 border-cyan-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {fund.name} ({purchaseRequests.filter(r => (r.status || 'Pending') === activeTab && (r as any).funds === fund.name).length})
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-auto min-h-0">
                <div className="overflow-visible">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 sticky top-0 z-10">
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs">Received / Created By</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs">Tracking ID</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs whitespace-normal wrap-break-word max-w-[120px]">Date/Time IN</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs whitespace-normal wrap-break-word max-w-[120px]">Date/Time OUT</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs">FPP</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs">Funds</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs">Full Name</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs whitespace-normal wrap-break-word max-w-[240px]">Purpose</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs">Amount</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs">Status</TableHead>
                        <TableHead className="font-semibold py-3 px-4 text-center text-xs">Remarks</TableHead>
                        {!isViewer && <TableHead className="font-semibold py-3 px-4 text-center text-xs">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                  {filteredPurchaseRequests.length === 0 ? (
                    <TableRow key="empty-state">
                      <TableCell colSpan={isViewer ? 11 : 12} className="text-center py-8 text-muted-foreground">
                        {purchaseRequests.length === 0 ? 'No purchase requests found. Click "Add Purchase Request" to create one.' : 'No purchase requests match your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPurchaseRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-sm py-3 px-4 text-center">{request.receivedBy || '-'}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center font-bold text-primary">{request.trackingId}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center whitespace-normal wrap-break-word max-w-[120px]">{formatDateTimeWithoutSeconds(request.dateTimeIn)}</TableCell>
                        <TableCell className={`text-sm py-3 px-4 text-center whitespace-normal wrap-break-word max-w-[120px] ${request.status === 'Completed' ? 'text-green-600 font-medium' : 'text-red-600'}`}>{request.dateTimeOut ? formatDateTimeWithoutSeconds(request.dateTimeOut) : '-'}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">{request.fpp || '-'}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">{(request as any).funds || '-'}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">{request.fullName}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center whitespace-normal wrap-break-word max-w-[240px]">{request.purpose}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">{formatAmount(request.amount || (request as any).estimatedCost)}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">
                          <Badge 
                            variant={
                              request.status === 'Rejected' ? 'destructive' : 'secondary'
                            }
                            className={`${
                              request.status === 'Completed' || request.status === 'Approved' ? 
                              'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' : 
                              request.status === 'Pending' || (!request.status || request.status === 'Pending') ? 
                              'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200' : ''
                            }`}
                          >
                            {request.status || 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell 
                          className="wrap-break-word whitespace-normal text-sm cursor-pointer hover:bg-gray-50"
                          onClick={() => viewRemarksHistory(request)}
                        >
                          {request.remarks ? (
                            <div className="space-y-1 relative">
                              {request.status === 'Pending' && request.remarksHistory?.some(h => h.status === 'Edited') && (
                                <span className="absolute -top-2 -right-1 bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded-full">
                                  Edited
                                </span>
                              )}
                              <div className="text-black">
                                {request.remarksHistory?.length > 0 ? request.remarksHistory[0].remarks : request.remarks}
                              </div>
                              {request.remarksHistory?.length > 0 && (
                                <div className={`${request.status === 'Completed' ? 'text-green-600' : request.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                                  {request.remarksHistory[0]?.timestamp && request.status !== 'Completed' && request.status !== 'Pending' && (
                                    <span>[{formatDateTimeWithoutSeconds(request.remarksHistory[0].timestamp)}] </span>
                                  )}
                                  [{request.status === 'Pending' ? `${request.status} - Created by ${request.receivedBy}` : `${request.status} by ${request.receivedBy}`}]
                                </div>
                              )}
                              <div className="text-xs text-blue-600 mt-1">
                                Click to view full history
                              </div>
                            </div>
                          ) : '-'}
                        </TableCell>
                        {!isViewer && (
                          <TableCell className="text-sm py-3 px-4">
                            <div className="flex flex-col items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewRequest(request.id)}
                                className="h-8 w-16 text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              >
                                View
                              </Button>
                              {(request.status === 'Pending' || request.status === 'Approved' || user?.role === 'admin') && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditRequest(request.id)}
                                    className="h-8 w-16 text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                  >
                                    Edit
                                  </Button>
                                </>
                              )}
                              {request.status === 'Pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectRequest(request.id)}
                                  className="h-8 w-16 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  Reject
                                </Button>
                              )}
                              {(request.status === 'Pending' || request.status === 'Approved') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTimeOut(request.id)}
                                  className="h-8 w-16 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                                >
                                  Out
                                </Button>
                              )}
                              {(request.status === 'Completed' || request.status === 'Rejected') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReturnRequest(request.id)}
                                  className="h-8 w-16 text-purple-600 border-purple-600 hover:bg-purple-50 hover:text-purple-700"
                                >
                                  Return
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">Confirm Reject</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject this purchase request? The status will be changed to "Rejected".
          </DialogDescription>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectRemarks" className="text-sm font-medium">Rejection Remarks *</Label>
              <textarea
                id="rejectRemarks"
                placeholder="Enter rejection remarks (required)"
                value={rejectData.remarks}
                onChange={(e) => setRejectData({ remarks: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setRequestToDelete(null);
                setRejectData({ remarks: '' });
              }}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRejectRequest}
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
          <DialogTitle className="text-lg font-semibold">Confirm Update</DialogTitle>
          <DialogDescription>
            Are you sure you want to update this purchase request?
          </DialogDescription>
          <div className="flex gap-3 justify-end pt-6">
            <Button
              variant="outline"
              onClick={() => setEditConfirmOpen(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEditRequest}
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
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
          setRequestToTimeOut(null);
        }}
        dateTimeOut={timeOutData.dateTimeOut}
        onDateTimeOutChange={(value) => setTimeOutData({ ...timeOutData, dateTimeOut: value })}
        remarks={timeOutData.timeOutRemarks}
        onRemarksChange={(value) => setTimeOutData({ ...timeOutData, timeOutRemarks: value })}
        isLoading={isLoading}
      />

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Purchase Request Details</DialogTitle>
            <DialogDescription>
              View complete information about this purchase request record
            </DialogDescription>
          </DialogHeader>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            {selectedRequest && (
              <div className="space-y-4">
                {/* Personal Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Full Name</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Designation/Office</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.designation}</p>
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Date/Time In</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{formatDateTimeWithoutSeconds(selectedRequest.dateTimeIn)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Date/Time Out</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.dateTimeOut ? formatDateTimeWithoutSeconds(selectedRequest.dateTimeOut) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Amount</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{formatAmount(selectedRequest.amount || (selectedRequest as any).estimatedCost)}</p>
                    </div>
                  </div>
                </div>

                {/* Purpose */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Purpose</h3>
                  <p className="text-sm font-semibold text-gray-900 whitespace-pre-wrap">{selectedRequest.purpose || '-'}</p>
                </div>

                {/* Remarks */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Remarks</h3>
                  <p className="text-sm font-semibold text-gray-900 whitespace-pre-wrap">{selectedRequest.remarks || '-'}</p>
                  {selectedRequest.timeOutRemarks && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase">Date/Time Out</p>
                          <p className="text-sm font-semibold text-blue-900 mt-1">{selectedRequest.dateTimeOut ? formatDateTimeWithoutSeconds(selectedRequest.dateTimeOut) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase">Time Out Remarks</p>
                          <p className="text-sm font-semibold text-blue-900 mt-1 whitespace-pre-wrap">{selectedRequest.timeOutRemarks}</p>
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
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <SuccessModal
        open={successModalOpen}
        onOpenChange={setSuccessModalOpen}
        message={success}
        isError={success.includes('Error')}
      />

      {/* Remarks History Modal */}
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

                    {/* Header with status, user, and timestamp */}
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

                    {/* Remarks content */}
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
