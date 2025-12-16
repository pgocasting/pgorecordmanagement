import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { purchaseRequestService, designationService } from '@/services/firebaseService';

const getCurrentDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Menu, LogOut } from 'lucide-react';
import { ActionButtons } from '@/components/ActionButtons';
import SuccessModal from '@/components/SuccessModal';
import TimeOutModal from '@/components/TimeOutModal';
import { MonthlyTotalCard } from '@/components/MonthlyTotalCard';

interface PurchaseRequest {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designation: string;
  itemDescription: string;
  quantity: number;
  estimatedCost: number;
  purpose: string;
  status: string;
  remarks: string;
  timeOutRemarks?: string;
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

export default function PurchaseRequestPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
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
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    dateTimeIn: '',
    dateTimeOut: '',
    fullName: '',
    designation: '',
    itemDescription: '',
    quantity: '',
    estimatedCost: '',
    purpose: '',
    remarks: '',
  });

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
        setPurchaseRequests(data as PurchaseRequest[]);
      } catch (error) {
        console.error('Error loading purchase requests:', error);
        setSuccess('Error loading purchase requests');
        setSuccessModalOpen(true);
      }
    };
    loadRequests();
  }, []);

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
      .reduce((sum, request) => sum + (request.estimatedCost || 0), 0);
  }, [purchaseRequests]);

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
      !formData.quantity ||
      !formData.estimatedCost ||
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
      const newRequest = {
        trackingId: nextTrackingId,
        receivedBy: user?.name || '',
        ...formData,
        quantity: parseInt(formData.quantity),
        estimatedCost: parseFloat(formData.estimatedCost),
        status: 'Pending',
      };
      const result = await purchaseRequestService.addPurchaseRequest(newRequest);
      setSuccess('Purchase request added successfully');
      setPurchaseRequests([result as PurchaseRequest, ...purchaseRequests]);

      setFormData({
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        designation: '',
        itemDescription: '',
        quantity: '',
        estimatedCost: '',
        purpose: '',
        remarks: '',
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
      const updateData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        estimatedCost: parseFloat(formData.estimatedCost),
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
        quantity: '',
        estimatedCost: '',
        purpose: '',
        remarks: '',
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
        quantity: request.quantity.toString(),
        estimatedCost: request.estimatedCost.toString(),
        purpose: request.purpose,
        remarks: request.remarks,
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

    try {
      const now = new Date();
      const dateTimeStr = now.toLocaleString();
      const remarksWithDateTime = `[${dateTimeStr}] [${user?.name || 'Unknown'}] ${rejectData.remarks}`;
      
      await purchaseRequestService.updatePurchaseRequest(requestToDelete, { status: 'Rejected', remarks: remarksWithDateTime });
      const updatedRequests = purchaseRequests.map(r => r.id === requestToDelete ? { ...r, status: 'Rejected', remarks: remarksWithDateTime } : r);
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
        quantity: '',
        estimatedCost: '',
        purpose: '',
        remarks: '',
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
    setTimeOutData({ dateTimeOut: '', timeOutRemarks: '' });
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
      const timeOutRemarksWithUser = `[${user?.name || 'Unknown'}] ${timeOutData.timeOutRemarks}`;
      const result = await purchaseRequestService.updatePurchaseRequest(requestToTimeOut, {
        dateTimeOut: timeOutData.dateTimeOut,
        timeOutRemarks: timeOutRemarksWithUser,
        status: 'Completed'
      });

      if (!result) {
        throw new Error('Purchase request not found. It may have been deleted or the data is out of sync.');
      }

      const updatedRequests = await purchaseRequestService.getPurchaseRequests();
      setPurchaseRequests(updatedRequests as PurchaseRequest[]);

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
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 shadow-sm">
        <Sidebar recordTypes={recordTypes} onNavigate={undefined} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Request Records</h1>
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
        <div className="flex-1 overflow-auto p-6">
          <MonthlyTotalCard total={monthlyTotal} />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Purchase Requests</h2>
                <p className="text-sm text-gray-600">Manage and view all purchase request records</p>
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
                        quantity: '',
                        estimatedCost: '',
                        purpose: '',
                        remarks: '',
                      });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Purchase Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg z-50 max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                      {editingId ? 'Edit Purchase Request' : 'Add New Purchase Request'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingId ? 'Update the purchase request details' : 'Fill in the form to add a new purchase request'}
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
                        <Label htmlFor="fullName" className="text-xs font-medium text-gray-700">Full Name *</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          placeholder="Full Name"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="designation" className="text-sm font-medium text-gray-700">Designation *</Label>
                      <Select value={formData.designation} onValueChange={(value) => handleSelectChange('designation', value)}>
                        <SelectTrigger id="designation" className="w-full">
                          <SelectValue placeholder="Select designation" />
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
                      <Label htmlFor="itemDescription" className="text-xs font-medium text-gray-700">Item Description *</Label>
                      <Textarea
                        id="itemDescription"
                        name="itemDescription"
                        value={formData.itemDescription}
                        onChange={handleInputChange}
                        placeholder="Enter item description"
                        rows={2}
                        className="text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="quantity" className="text-xs font-medium text-gray-700">Quantity *</Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          placeholder="Quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="estimatedCost" className="text-xs font-medium text-gray-700">Estimated Cost *</Label>
                        <Input
                          id="estimatedCost"
                          name="estimatedCost"
                          type="number"
                          placeholder="Estimated Cost"
                          value={formData.estimatedCost}
                          onChange={handleInputChange}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="purpose" className="text-xs font-medium text-gray-700">Purpose *</Label>
                      <Textarea
                        id="purpose"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        placeholder="Enter purpose"
                        rows={2}
                        className="text-xs"
                      />
                    </div>

                    {editingId && user?.role === 'admin' && (
                      <div className="space-y-1">
                        <Label htmlFor="dateTimeOut" className="text-xs font-medium text-gray-700">Date/Time OUT</Label>
                        <Input
                          id="dateTimeOut"
                          name="dateTimeOut"
                          type="datetime-local"
                          value={formData.dateTimeOut || ''}
                          onChange={handleInputChange}
                          className="h-8 text-xs"
                        />
                      </div>
                    )}

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

                    <Button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 mt-2 h-9 text-sm"
                      onClick={editingId ? confirmEditRequest : handleAddRequest}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : editingId ? 'Update Request' : 'Add Request'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                    <TableHead className="text-center">Item Description</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-center">Est. Cost</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Remarks</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseRequests.length === 0 ? (
                    <TableRow key="empty-state">
                      <TableCell colSpan={11} className="text-center py-4 text-gray-500 text-xs">
                        No purchase requests found. Click "Add Purchase Request" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-gray-50">
                        <TableCell className="text-center text-xs">
                          {request.receivedBy || '-'}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-indigo-600 text-xs">
                          {request.trackingId}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {new Date(request.dateTimeIn).toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-center text-xs ${request.status === 'Completed' ? 'text-green-600 font-medium' : ''}`}>
                          {request.dateTimeOut ? new Date(request.dateTimeOut).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-center text-xs">{request.fullName}</TableCell>
                        <TableCell className="text-center text-xs">{request.itemDescription}</TableCell>
                        <TableCell className="text-center text-xs">{request.quantity}</TableCell>
                        <TableCell className="text-center text-xs">₱{request.estimatedCost.toLocaleString()}</TableCell>
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
                          className={`text-center text-xs wrap-break-word whitespace-normal ${
                            request.status === 'Completed' ? 'text-green-600 font-medium' : request.status === 'Rejected' ? 'text-red-600 font-medium' : ''
                          }`}
                        >
                          {request.status === 'Completed'
                            ? request.timeOutRemarks || request.remarks || '-'
                            : request.remarks || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <ActionButtons
                            onView={() => handleViewRequest(request.id)}
                            onEdit={() => handleEditRequest(request.id)}
                            onTimeOut={() => handleTimeOut(request.id)}
                            onReject={() => handleRejectRequest(request.id)}
                            hidden={request.status === 'Rejected'}
                            rejectDisabledReason={request.status === 'Rejected' ? 'Cannot edit rejected records' : undefined}
                            showTimeOut={request.status !== 'Completed' && request.status !== 'Rejected'}
                            showEdit={request.status !== 'Completed'}
                            showReject={request.status !== 'Completed'}
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Purchase Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tracking ID</p>
                  <p className="text-lg font-bold text-indigo-600 mt-1">{selectedRequest.trackingId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</p>
                  <p className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedRequest.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      selectedRequest.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedRequest.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedRequest.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date/Time In</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{new Date(selectedRequest.dateTimeIn).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Received By</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedRequest.receivedBy || '-'}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Request Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Full Name</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Designation</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.designation}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Quantity</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Estimated Cost</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">₱{selectedRequest.estimatedCost.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Item Description</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.itemDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Quantity</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.quantity}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Estimated Cost</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">₱{selectedRequest.estimatedCost.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Purpose</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.purpose}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Date/Time Out</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.dateTimeOut ? new Date(selectedRequest.dateTimeOut).toLocaleString() : '-'}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Remarks</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.remarks || selectedRequest.timeOutRemarks || '-'}</p>
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

      {/* Success Modal */}
      <SuccessModal
        open={successModalOpen}
        onOpenChange={setSuccessModalOpen}
        message={success}
        isError={success.includes('Error')}
      />
    </div>
  );
}
