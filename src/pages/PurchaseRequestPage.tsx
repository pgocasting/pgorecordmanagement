import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { purchaseRequestService, designationService } from '@/services/firebaseService';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Menu, LogOut, Search, User } from 'lucide-react';
import { ActionButtons } from '@/components/ActionButtons';
import SuccessModal from '@/components/SuccessModal';
import TimeOutModal from '@/components/TimeOutModal';
import { MonthlyTotalCard } from '@/components/MonthlyTotalCard';

const getCurrentDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface PurchaseRequest {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designation: string;
  itemDescription: string;
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
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const [formData, setFormData] = useState({
    dateTimeIn: '',
    dateTimeOut: '',
    fullName: '',
    designation: '',
    itemDescription: '',
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

  const filteredPurchaseRequests = purchaseRequests.filter(request =>
    request.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.receivedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const nextTrackingId = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const count = String(purchaseRequests.length + 1).padStart(3, '0');
    return `(PR) ${year}/${month}/${day}-${count}`;
  }, [purchaseRequests.length]);

  const monthlyTotal = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    return purchaseRequests
      .filter(request => {
        const requestDate = new Date(request.dateTimeIn);
        return requestDate.getFullYear() === currentYear && requestDate.getMonth() === currentMonth && request.status !== 'Rejected';
      })
      .reduce((sum, request) => sum + (request.amount || (request as any).estimatedCost || 0), 0);
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
      !formData.itemDescription ||
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
      const newRequest = {
        trackingId: nextTrackingId,
        receivedBy: currentUser,
        ...formData,
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
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        designation: '',
        itemDescription: '',
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
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        designation: '',
        itemDescription: '',
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
        dateTimeIn: request.dateTimeIn,
        dateTimeOut: request.dateTimeOut || '',
        fullName: request.fullName,
        designation: request.designation,
        itemDescription: request.itemDescription,
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
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        designation: '',
        itemDescription: '',
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
              <h1 className="text-2xl font-bold text-gray-900">Purchase Request Records</h1>
              <p className="text-sm text-gray-600">Welcome back</p>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex items-center gap-2">
              {user?.name && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <User className="h-3 w-3 text-indigo-600" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <MonthlyTotalCard total={monthlyTotal} />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Purchase Requests</h2>
                <p className="text-sm text-gray-600">Manage and view all purchase request records</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by tracking ID, name..."
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
                          dateTimeOut: '',
                          fullName: '',
                          designation: '',
                          itemDescription: '',
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
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Edit' : 'Add New'} Purchase Request</DialogTitle>
                    <DialogDescription>
                      Fill in the form to {editingId ? 'update' : 'add'} a purchase request
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="trackingId">Tracking ID</Label>
                      <Input
                        id="trackingId"
                        value={editingId ? purchaseRequests.find(r => r.id === editingId)?.trackingId || '' : nextTrackingId}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateTimeIn">Date/Time IN *</Label>
                        <Input
                          id="dateTimeIn"
                          name="dateTimeIn"
                          type="datetime-local"
                          value={formData.dateTimeIn}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          placeholder="Full Name"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="designation">Office *</Label>
                        <Select value={formData.designation} onValueChange={(value) => handleSelectChange('designation', value)}>
                          <SelectTrigger className="w-full">
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
                      <div className="space-y-2">
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Input
                          id="remarks"
                          name="remarks"
                          value={formData.remarks}
                          onChange={handleInputChange}
                          placeholder="Enter remarks"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purpose">Purpose *</Label>
                      <Textarea
                        id="purpose"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        placeholder="Enter purpose"
                        rows={3}
                        required
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
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-center">Received By</TableHead>
                    <TableHead className="text-center">Tracking ID</TableHead>
                    <TableHead className="text-center">Date/Time IN</TableHead>
                    <TableHead className="text-center">Date/Time OUT</TableHead>
                    <TableHead className="text-center">Full Name</TableHead>
                    <TableHead className="text-center">Purpose</TableHead>
                    <TableHead className="text-center">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Remarks</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchaseRequests.length === 0 ? (
                    <TableRow key="empty-state">
                      <TableCell colSpan={10} className="text-center py-4 text-gray-500 text-xs">
                        {purchaseRequests.length === 0 ? 'No purchase requests found. Click "Add Purchase Request" to create one.' : 'No purchase requests match your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPurchaseRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-gray-50">
                        <TableCell className="text-center text-xs">
                          {request.receivedBy || '-'}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-indigo-600 text-xs">
                          {request.trackingId}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {formatDateTimeWithoutSeconds(request.dateTimeIn)}
                        </TableCell>
                        <TableCell className={`text-center text-xs ${request.status === 'Completed' ? 'text-green-600 font-medium' : ''}`}>
                          {request.dateTimeOut ? formatDateTimeWithoutSeconds(request.dateTimeOut) : '-'}
                        </TableCell>
                        <TableCell className="text-center text-xs">{request.fullName}</TableCell>
                        <TableCell className="text-center text-xs">{request.purpose}</TableCell>
                        <TableCell className="text-center text-xs">{formatAmount(request.amount || (request as any).estimatedCost)}</TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              request.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : request.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {request.status}
                          </span>
                        </TableCell>
                        <TableCell 
                          className="wrap-break-word whitespace-normal text-xs cursor-pointer hover:bg-gray-50"
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
                                  [{request.status} by {request.receivedBy}]
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
                            onView={() => handleViewRequest(request.id)}
                            onEdit={() => handleEditRequest(request.id)}
                            onTimeOut={() => handleTimeOut(request.id)}
                            onReject={() => handleRejectRequest(request.id)}
                            hidden={request.status === 'Rejected'}
                            canEdit={request.status !== 'Rejected'}
                            canReject={request.status !== 'Rejected'}
                            showTimeOut={request.status !== 'Completed' && request.status !== 'Rejected'}
                            showEdit={request.status !== 'Completed'}
                            showReject={request.status !== 'Completed'}
                            editDisabledReason={request.status === 'Rejected' ? 'Cannot edit rejected records' : undefined}
                            rejectDisabledReason={request.status === 'Rejected' ? 'Record already rejected' : (request.status === 'Completed' ? 'Cannot reject completed records' : (user?.role !== 'admin' && (!!request.dateTimeOut || request.status !== 'Pending') ? 'Users can only reject pending records' : undefined))}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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

                {/* Item Description */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Item Description</h3>
                  <p className="text-sm font-semibold text-gray-900 whitespace-pre-wrap">{selectedRequest.itemDescription || '-'}</p>
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
