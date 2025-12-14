import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { obligationRequestService } from '@/services/firebaseService';

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

interface ObligationRequest {
  id: string;
  trackingId: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designation: string;
  obligationType: string;
  amount: number;
  particulars: string;
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

export default function ObligationRequestPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [obligationRequests, setObligationRequests] = useState<ObligationRequest[]>([]);
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
  const [selectedRequest, setSelectedRequest] = useState<ObligationRequest | null>(null);
  const [designationOptions] = useState<string[]>(['Admin', 'Manager', 'Staff', 'Officer']);
  const [obligationTypes] = useState<string[]>(['Loan', 'Bond', 'Guarantee', 'Other']);

  const [formData, setFormData] = useState({
    dateTimeIn: '',
    dateTimeOut: '',
    fullName: '',
    designation: '',
    obligationType: '',
    amount: '',
    particulars: '',
    remarks: '',
  });

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await obligationRequestService.getObligationRequests();
        setObligationRequests(data as ObligationRequest[]);
      } catch (error) {
        console.error('Error loading obligation requests:', error);
        setSuccess('Error loading obligation requests');
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
    const count = String(obligationRequests.length + 1).padStart(3, '0');
    return `(OR) ${year}/${month}/${day}-${count}`;
  }, [obligationRequests.length]);

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
      !formData.obligationType ||
      !formData.amount ||
      !formData.particulars
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
        ...formData,
        amount: parseFloat(formData.amount),
        status: 'Pending',
      };
      const result = await obligationRequestService.addObligationRequest(newRequest);
      setSuccess('Obligation request added successfully');
      setObligationRequests([result as ObligationRequest, ...obligationRequests]);

      setFormData({
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        designation: '',
        obligationType: '',
        amount: '',
        particulars: '',
        remarks: '',
      });
      setIsDialogOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save obligation request:', err);
      setSuccess('Error saving obligation request');
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
        amount: parseFloat(formData.amount),
      };
      await obligationRequestService.updateObligationRequest(editingId, updateData);
      setSuccess('Obligation request updated successfully');
      setEditingId(null);

      const updatedRequests = obligationRequests.map(r => r.id === editingId ? { ...r, ...updateData } : r);
      setObligationRequests(updatedRequests);

      setFormData({
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        designation: '',
        obligationType: '',
        amount: '',
        particulars: '',
        remarks: '',
      });
      setIsDialogOpen(false);
      setEditConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save obligation request:', err);
      setSuccess('Error updating obligation request');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRequest = (id: string) => {
    const request = obligationRequests.find((item) => item.id === id);
    if (request) {
      setFormData({
        dateTimeIn: request.dateTimeIn,
        dateTimeOut: request.dateTimeOut || '',
        fullName: request.fullName,
        designation: request.designation,
        obligationType: request.obligationType,
        amount: request.amount.toString(),
        particulars: request.particulars,
        remarks: request.remarks,
      });
      setEditingId(id);
      setIsDialogOpen(true);
    }
  };

  const handleRejectRequest = (id: string) => {
    setRequestToDelete(id);
    setDeleteConfirmOpen(true);
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
        obligationType: '',
        amount: '',
        particulars: '',
        remarks: '',
      });
    }
  };

  const confirmRejectRequest = async () => {
    if (!requestToDelete) return;

    try {
      await obligationRequestService.updateObligationRequest(requestToDelete, { status: 'Rejected' });
      const updatedRequests = obligationRequests.map(r => r.id === requestToDelete ? { ...r, status: 'Rejected' } : r);
      setObligationRequests(updatedRequests);
      setSuccess('Obligation request rejected successfully');
      setRequestToDelete(null);
      setDeleteConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to reject obligation request:', err);
      setSuccess('Error rejecting obligation request');
      setSuccessModalOpen(true);
    }
  };

  const handleViewRequest = (id: string) => {
    const request = obligationRequests.find((item) => item.id === id);
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

    setIsLoading(true);
    try {
      const result = await obligationRequestService.updateObligationRequest(requestToTimeOut, {
        dateTimeOut: timeOutData.dateTimeOut,
        timeOutRemarks: timeOutData.timeOutRemarks,
        status: 'Completed'
      });

      if (!result) {
        throw new Error('Obligation request not found. It may have been deleted or the data is out of sync.');
      }

      const updatedRequests = await obligationRequestService.getObligationRequests();
      setObligationRequests(updatedRequests as ObligationRequest[]);

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
            <h1 className="text-2xl font-bold text-gray-900">Obligation Request Records</h1>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Obligation Requests</h2>
                <p className="text-sm text-gray-600">Manage and view all obligation request records</p>
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
                        obligationType: '',
                        amount: '',
                        particulars: '',
                        remarks: '',
                      });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Obligation Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg z-50 max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                      {editingId ? 'Edit Obligation Request' : 'Add New Obligation Request'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingId ? 'Update the obligation request details' : 'Fill in the form to add a new obligation request'}
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

                    <div className="grid grid-cols-2 gap-3">
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

                      <div className="space-y-2">
                        <Label htmlFor="obligationType" className="text-sm font-medium text-gray-700">Obligation Type *</Label>
                        <Select value={formData.obligationType} onValueChange={(value) => handleSelectChange('obligationType', value)}>
                          <SelectTrigger id="obligationType" className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {obligationTypes.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="amount" className="text-xs font-medium text-gray-700">Amount *</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        placeholder="Amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        className="h-8 text-xs"
                      />
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
                    <TableHead className="text-center">Tracking ID</TableHead>
                    <TableHead className="text-center">Date/Time IN</TableHead>
                    <TableHead className="text-center">Full Name</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {obligationRequests.length === 0 ? (
                    <TableRow key="empty-state">
                      <TableCell colSpan={7} className="text-center py-4 text-gray-500 text-xs">
                        No obligation requests found. Click "Add Obligation Request" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    obligationRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-gray-50">
                        <TableCell className="text-center font-semibold text-indigo-600 text-xs">
                          {request.trackingId}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {new Date(request.dateTimeIn).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center text-xs">{request.fullName}</TableCell>
                        <TableCell className="text-center text-xs">{request.obligationType}</TableCell>
                        <TableCell className="text-center text-xs">₱{request.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              request.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {request.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <ActionButtons
                            onView={() => handleViewRequest(request.id)}
                            onEdit={() => handleEditRequest(request.id)}
                            onTimeOut={() => handleTimeOut(request.id)}
                            onReject={() => handleRejectRequest(request.id)}
                            showTimeOut={request.status !== 'Completed'}
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
            Are you sure you want to reject this obligation request? The status will be changed to "Rejected".
          </DialogDescription>
          <div className="flex gap-3 justify-end pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setRequestToDelete(null);
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
            Are you sure you want to update this obligation request?
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

      {/* Time Out Confirmation Modal */}
      <Dialog open={timeOutConfirmOpen} onOpenChange={setTimeOutConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">Record Time Out</DialogTitle>
          <DialogDescription>
            Record the time out details for this obligation request.
          </DialogDescription>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="timeOutDate" className="text-sm font-medium text-gray-700">Date/Time Out *</Label>
              <Input
                id="timeOutDate"
                type="datetime-local"
                value={timeOutData.dateTimeOut}
                onChange={(e) => setTimeOutData({ ...timeOutData, dateTimeOut: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeOutRemarks" className="text-sm font-medium text-gray-700">Remarks</Label>
              <Textarea
                id="timeOutRemarks"
                value={timeOutData.timeOutRemarks}
                onChange={(e) => setTimeOutData({ ...timeOutData, timeOutRemarks: e.target.value })}
                placeholder="Enter time out remarks"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setTimeOutConfirmOpen(false);
                setRequestToTimeOut(null);
              }}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmTimeOut}
              disabled={isLoading}
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Recording...' : 'Record Time Out'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Obligation Request Details</DialogTitle>
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
                      'bg-blue-100 text-blue-800'
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
                    <p className="text-xs font-medium text-gray-600 uppercase">Obligation Type</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.obligationType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Amount</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">₱{selectedRequest.amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Particulars</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.particulars}</p>
              </div>

              {selectedRequest.dateTimeOut && (
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Date/Time Out</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{new Date(selectedRequest.dateTimeOut).toLocaleString()}</p>
                </div>
              )}

              {selectedRequest.remarks && (
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Remarks</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRequest.remarks}</p>
                </div>
              )}

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
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>
              {success}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setSuccessModalOpen(false)}
              className="bg-green-600 hover:bg-green-700"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
