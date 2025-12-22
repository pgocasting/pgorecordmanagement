import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { othersService, designationService } from '@/services/firebaseService';

const getCurrentDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

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
import { Plus, Menu, LogOut, Search } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ActionButtons } from '@/components/ActionButtons';
import SuccessModal from '@/components/SuccessModal';
import TimeOutModal from '@/components/TimeOutModal';

interface Others {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designationOffice: string;
  inclusiveDateStart?: string;
  inclusiveDateEnd?: string;
  inclusiveTimeStart?: string;
  inclusiveTimeEnd?: string;
  purpose: string;
  amount?: string;
  status: string;
  remarks: string;
  remarksHistory: Array<{
    remarks: string;
    status: string;
    timestamp: string;
    updatedBy: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  timeOutRemarks?: string;
  linkAttachments?: string;
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

export default function OthersPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [records, setRecords] = useState<Others[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
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
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [timeOutConfirmOpen, setTimeOutConfirmOpen] = useState(false);
  const [recordToTimeOut, setRecordToTimeOut] = useState<string | null>(null);
  const [timeOutData, setTimeOutData] = useState({
    dateTimeOut: '',
    timeOutRemarks: '',
  });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Others | null>(null);
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
    dateTimeOut: '',
    fullName: '',
    designationOffice: '',
    inclusiveDateStart: '',
    inclusiveDateEnd: '',
    inclusiveTimeStart: '',
    inclusiveTimeEnd: '',
    purpose: '',
    amount: '',
    linkAttachments: '',
    remarks: '',
    remarksHistory: [] as Array<{
      remarks: string;
      status: string;
      timestamp: string;
      updatedBy: string;
    }>
  });

  const viewRemarksHistory = (record: Others) => {
    setCurrentRemarksHistory(record.remarksHistory || []);
    setRemarksHistoryOpen(true);
  };

  // Load records from Firestore on mount
  useEffect(() => {
    const loadRecords = async () => {
      try {
        console.log('📂 Loading other records from Firestore...');
        const data = await othersService.getRecords();
        console.log(`✅ Other records loaded: ${data.length} records`);
        setRecords(data as Others[]);
      } catch (error) {
        console.error('❌ Error loading records:', error);
        setSuccess('Error loading records. Please try again.');
        setSuccessModalOpen(true);
      }
    };
    
    loadRecords();
    const interval = setInterval(loadRecords, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredRecords = records.filter(record =>
    record.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.receivedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const nextTrackingId = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const count = String(records.length + 1).padStart(3, '0');
    return `(O) ${year}/${month}/${day}-${count}`;
  }, [records.length]);

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

  const handleAddRecord = async () => {
    setSuccess('');

    if (
      !formData.dateTimeIn ||
      !formData.fullName ||
      !formData.designationOffice ||
      !formData.inclusiveDateStart ||
      !formData.inclusiveDateEnd
    ) {
      setSuccess('Please fill in all required fields');
      setSuccessModalOpen(true);
      return;
    }

    // If editing, show confirmation modal
    if (editingId) {
      setEditConfirmOpen(true);
      return;
    }

    // If adding new, proceed directly
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRecord = {
        trackingId: nextTrackingId,
        receivedBy: currentUser,
        ...formData,
        status: 'Pending',
        remarks: formData.remarks || 'Record created',
        timeOutRemarks: '',
        remarksHistory: [{
          remarks: formData.remarks || 'Record created',
          status: 'Pending',
          timestamp: now,
          updatedBy: currentUser
        }],
        createdAt: now,
        updatedAt: now
      };
      const result = await othersService.addRecord(newRecord);
      setSuccess('Record added successfully');

      setRecords([result as Others, ...records]);

      setFormData({
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        designationOffice: '',
        inclusiveDateStart: '',
        inclusiveDateEnd: '',
        inclusiveTimeStart: '',
        inclusiveTimeEnd: '',
        purpose: '',
        amount: '',
        linkAttachments: '',
        remarks: '',
        remarksHistory: []
      });
      setIsDialogOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save record:', err);
      setSuccess('Error saving record');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmEditRecord = async () => {
    if (!editingId) return;

    setIsLoading(true);
    try {
      const existingRecord = records.find(r => r.id === editingId);
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      
      const newRemarksHistory = [
        ...(existingRecord?.remarksHistory || []),
        {
          remarks: formData.remarks,
          status: 'Edited',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      
      // Keep the status as Pending if it was Pending before
      const newStatus = existingRecord?.status === 'Rejected' ? 'Rejected' : 'Pending';
      
      const updateData = {
        ...formData,
        remarksHistory: newRemarksHistory,
        status: newStatus,
        updatedAt: now
      };
      
      await othersService.updateRecord(editingId, updateData);
      setSuccess('Record updated successfully');
      setEditingId(null);

      const updatedRecords = records.map(r => 
        r.id === editingId 
          ? { 
              ...r, 
              ...formData,
              remarksHistory: newRemarksHistory,
              status: newStatus,
              updatedAt: now
            } 
          : r
      );
      setRecords(updatedRecords);

      setFormData({
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        designationOffice: '',
        inclusiveDateStart: '',
        inclusiveDateEnd: '',
        inclusiveTimeStart: '',
        inclusiveTimeEnd: '',
        purpose: '',
        amount: '',
        linkAttachments: '',
        remarks: '',
        remarksHistory: []
      });
      setIsDialogOpen(false);
      setEditConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save record:', err);
      setSuccess('Error updating record');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRecord = (id: string) => {
    const record = records.find((item) => item.id === id);
    if (record) {
      setFormData({
        dateTimeIn: record.dateTimeIn,
        dateTimeOut: record.dateTimeOut || '',
        fullName: record.fullName,
        designationOffice: record.designationOffice,
        inclusiveDateStart: record.inclusiveDateStart || '',
        inclusiveDateEnd: record.inclusiveDateEnd || '',
        inclusiveTimeStart: record.inclusiveTimeStart || '',
        inclusiveTimeEnd: record.inclusiveTimeEnd || '',
        purpose: record.purpose,
        amount: record.amount || '',
        linkAttachments: record.linkAttachments || '',
        remarks: record.remarks || '',
        remarksHistory: record.remarksHistory || []
      });
      setEditingId(id);
      setIsDialogOpen(true);
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
        designationOffice: '',
        inclusiveDateStart: '',
        inclusiveDateEnd: '',
        inclusiveTimeStart: '',
        inclusiveTimeEnd: '',
        purpose: '',
        amount: '',
        linkAttachments: '',
        remarks: '',
        remarksHistory: []
      });
    }
  };

  const confirmRejectRecord = async () => {
    if (!recordToDelete) return;

    if (!rejectData.remarks.trim()) {
      setSuccess('Error: Rejection remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const record = records.find(r => r.id === recordToDelete);
      if (!record) return;
      
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = rejectData.remarks;
      
      const updatedRemarksHistory = [
        ...(record.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Rejected',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      
      await othersService.updateRecord(recordToDelete, { 
        status: 'Rejected', 
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        updatedAt: now
      });
      
      const updatedRecords = records.map(r => 
        r.id === recordToDelete 
          ? { 
              ...r, 
              status: 'Rejected', 
              remarks: newRemarks,
              remarksHistory: updatedRemarksHistory,
              updatedAt: now
            } 
          : r
      );
      setRecords(updatedRecords);
      setSuccess('Record rejected successfully');
      setRecordToDelete(null);
      setRejectData({ remarks: '' });
      setDeleteConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to reject record:', err);
      setSuccess('Error rejecting record');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRecord = (id: string) => {
    const record = records.find((item) => item.id === id);
    if (record) {
      setSelectedRecord(record);
      setViewModalOpen(true);
    }
  };

  const handleTimeOut = (id: string) => {
    setRecordToTimeOut(id);
    setTimeOutData({ dateTimeOut: '', timeOutRemarks: '' });
    setTimeOutConfirmOpen(true);
  };

  const confirmTimeOut = async () => {
    if (!recordToTimeOut || !timeOutData.dateTimeOut) return;

    if (!timeOutData.timeOutRemarks.trim()) {
      setSuccess('Error: Time out remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      // Verify the document exists before attempting to update
      const currentRecords = await othersService.getRecords();
      const recordExists = currentRecords.some((r: any) => r.id === recordToTimeOut);
      
      if (!recordExists) {
        throw new Error('Other record not found. It may have been deleted or the data is out of sync.');
      }

      const record = records.find(r => r.id === recordToTimeOut);
      if (!record) return;
      
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = timeOutData.timeOutRemarks;
      
      const updatedRemarksHistory = [
        ...(record.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Completed',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      
      await othersService.updateRecord(recordToTimeOut, {
        dateTimeOut: timeOutData.dateTimeOut,
        status: 'Completed',
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        timeOutRemarks: newRemarks,
        updatedAt: now
      });
      // Reload from Firestore
      const updatedRecords = await othersService.getRecords();
      setRecords(updatedRecords as Others[]);
      setSuccess('Time out recorded successfully');
      setRecordToTimeOut(null);
      setTimeOutData({ dateTimeOut: '', timeOutRemarks: '' });
      setTimeOutConfirmOpen(false);
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
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Other Records</h1>
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
        <div className="flex-1 overflow-auto p-6 bg-linear-to-br from-gray-100 via-gray-50 to-gray-100" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Others</h2>
                <p className="text-sm text-gray-600">Manage and view all other records</p>
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
                          designationOffice: '',
                          inclusiveDateStart: '',
                          inclusiveDateEnd: '',
                          inclusiveTimeStart: '',
                          inclusiveTimeEnd: '',
                          purpose: '',
                          amount: '',
                          linkAttachments: '',
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
                      <DialogTitle>{editingId ? 'Edit' : 'Add New'} Others Record</DialogTitle>
                      <DialogDescription>
                        Fill in the form to {editingId ? 'update' : 'add'} an others record
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="trackingId">Tracking ID</Label>
                        <Input
                          id="trackingId"
                          value={editingId ? records.find(r => r.id === editingId)?.trackingId || '' : nextTrackingId}
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
                          <Label htmlFor="designationOffice">Office *</Label>
                          <Select value={formData.designationOffice} onValueChange={(value) => handleSelectChange('designationOffice', value)}>
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
                          <Label htmlFor="dateTimeOut">Date/Time OUT</Label>
                          <Input
                            id="dateTimeOut"
                            name="dateTimeOut"
                            type="datetime-local"
                            value={formData.dateTimeOut || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="inclusiveDateStart">Date Start *</Label>
                          <Input
                            id="inclusiveDateStart"
                            name="inclusiveDateStart"
                            type="date"
                            value={formData.inclusiveDateStart}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="inclusiveDateEnd">Date End *</Label>
                          <Input
                            id="inclusiveDateEnd"
                            name="inclusiveDateEnd"
                            type="date"
                            value={formData.inclusiveDateEnd}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="inclusiveTimeStart">Time Start</Label>
                          <Input
                            id="inclusiveTimeStart"
                            name="inclusiveTimeStart"
                            type="time"
                            value={formData.inclusiveTimeStart}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="inclusiveTimeEnd">Time End</Label>
                          <Input
                            id="inclusiveTimeEnd"
                            name="inclusiveTimeEnd"
                            type="time"
                            value={formData.inclusiveTimeEnd}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="purpose">Purpose</Label>
                        <Textarea
                          id="purpose"
                          name="purpose"
                          value={formData.purpose}
                          onChange={handleInputChange}
                          placeholder="Enter purpose"
                          rows={3}
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
                    <Button 
                      onClick={handleAddRecord} 
                      disabled={isLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isLoading ? 'Saving...' : editingId ? 'Update Others' : 'Add Others'}
                    </Button>
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
                    <TableHead className="text-center">Full Name</TableHead>
                    <TableHead className="text-center">Office</TableHead>
                    <TableHead className="text-center">Purpose</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Remarks</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500 text-xs wrap-break-word whitespace-normal">
                        {records.length === 0 ? 'No records found. Click "Add Record" to create one.' : 'No records match your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50">
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{record.receivedBy || '-'}</TableCell>
                        <TableCell className="font-bold italic wrap-break-word whitespace-normal text-center text-xs text-indigo-600">{record.trackingId}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{new Date(record.dateTimeIn).toLocaleString()}</TableCell>
                        <TableCell className={`wrap-break-word whitespace-normal text-center text-xs ${record.status === 'Completed' ? 'text-green-600 font-medium' : 'text-red-600'}`}>{record.dateTimeOut ? new Date(record.dateTimeOut).toLocaleString() : '-'}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs uppercase">{record.fullName}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{record.designationOffice}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{record.purpose}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            record.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            record.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status}
                          </span>
                        </TableCell>
                        <TableCell 
                          className="wrap-break-word whitespace-normal text-center text-xs cursor-pointer hover:bg-gray-50"
                          onClick={() => viewRemarksHistory(record)}
                        >
                          {record.remarks ? (
                            <div className="space-y-1 relative">
                              {record.status === 'Pending' && record.remarksHistory?.some(h => h.status === 'Edited') && (
                                <span className="absolute -top-2 -right-1 bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded-full">
                                  Edited
                                </span>
                              )}
                              <div className="text-black">
                                {record.remarks}
                              </div>
                              {record.remarksHistory?.length > 0 && (
                                <div className={`${record.status === 'Completed' ? 'text-green-600' : record.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                                  {record.remarksHistory[0]?.timestamp && record.status !== 'Completed' && record.status !== 'Pending' && (
                                    <span>[{new Date(record.remarksHistory[0].timestamp).toLocaleString()}] </span>
                                  )}
                                  [{record.status} by {record.receivedBy}]
                                </div>
                              )}
                              <div className="text-xs text-blue-600 mt-1">
                                Click to view full history
                              </div>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="py-1 px-1 text-center wrap-break-word whitespace-normal">
                          <ActionButtons
                            onView={() => handleViewRecord(record.id)}
                            onEdit={() => handleEditRecord(record.id)}
                            onTimeOut={() => handleTimeOut(record.id)}
                            onReject={() => {
                              setRecordToDelete(record.id);
                              setRejectData({ remarks: '' });
                              setDeleteConfirmOpen(true);
                            }}
                            hidden={record.status === 'Rejected'}
                            canEdit={record.status !== 'Rejected'}
                            canReject={record.status !== 'Rejected'}
                            showTimeOut={record.status !== 'Completed' && record.status !== 'Rejected'}
                            showEdit={record.status !== 'Completed'}
                            showReject={record.status !== 'Completed'}
                            editDisabledReason={record.status === 'Rejected' ? 'Cannot edit rejected records' : undefined}
                            rejectDisabledReason={user?.role !== 'admin' && (!!record.dateTimeOut || record.status !== 'Pending') ? 'Users can only reject pending records' : undefined}
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
      </div>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Other Records Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              {/* Header Row - Tracking ID, Status, Date/Time IN */}
              <div className="grid grid-cols-3 gap-6 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tracking ID</p>
                  <p className="text-lg font-bold text-indigo-600 mt-1">{selectedRecord.trackingId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</p>
                  <p className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedRecord.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      selectedRecord.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedRecord.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedRecord.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date/Time In</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{new Date(selectedRecord.dateTimeIn).toLocaleString()}</p>
                </div>
              </div>

              {/* Received By */}
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Received By</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedRecord.receivedBy || '-'}</p>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Full Name</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Designation/Office</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.designationOffice}</p>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Duration</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Inclusive Date Start</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.inclusiveDateStart || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Inclusive Date End</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.inclusiveDateEnd || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Inclusive Time Start</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.inclusiveTimeStart || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Inclusive Time End</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.inclusiveTimeEnd || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Date/Time Out */}
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Date/Time Out</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.dateTimeOut ? new Date(selectedRecord.dateTimeOut).toLocaleString() : '-'}</p>
              </div>

              {/* Purpose */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Details</h3>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Purpose</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 whitespace-pre-wrap">{selectedRecord.purpose}</p>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Additional Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Amount</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{formatAmount(selectedRecord.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Link / Attachments</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedRecord.linkAttachments ? (
                        <a href={selectedRecord.linkAttachments} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline break-all">
                          {selectedRecord.linkAttachments}
                        </a>
                      ) : (
                        '-'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Remarks</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.remarks || selectedRecord.timeOutRemarks || '-'}</p>
              </div>

              {/* Close Button */}
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
          <DialogHeader>
            <DialogTitle>Confirm Reject</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Are you sure you want to reject this record? The status will be changed to "Rejected".</p>
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
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setRecordToDelete(null);
                setRejectData({ remarks: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmRejectRecord}
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
          </DialogHeader>
          <p className="text-sm text-gray-600">Are you sure you want to update this record?</p>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setEditConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={confirmEditRecord}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Out Modal */}
      <Dialog open={timeOutConfirmOpen} onOpenChange={setTimeOutConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Record Time Out</DialogTitle>
            <DialogDescription>
              Enter the date/time out and any remarks for this other record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="timeOutDateTime" className="text-sm font-medium text-gray-700">Date/Time OUT *</Label>
              <Input
                id="timeOutDateTime"
                type="datetime-local"
                value={timeOutData.dateTimeOut}
                onChange={(e) => setTimeOutData({ ...timeOutData, dateTimeOut: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="timeOutRemarks" className="text-sm font-medium text-gray-700">Remarks</Label>
              <Textarea
                id="timeOutRemarks"
                value={timeOutData.timeOutRemarks}
                onChange={(e) => setTimeOutData({ ...timeOutData, timeOutRemarks: e.target.value })}
                className="mt-2"
                placeholder="Enter time out remarks (optional)"
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setTimeOutConfirmOpen(false);
                  setRecordToTimeOut(null);
                  setTimeOutData({ dateTimeOut: '', timeOutRemarks: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={confirmTimeOut}
                disabled={!timeOutData.dateTimeOut || isLoading}
              >
                {isLoading ? 'Recording...' : 'Record Time Out'}
              </Button>
            </div>
          </div>
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

      {/* Time Out Modal */}
      <TimeOutModal
        open={timeOutConfirmOpen}
        onOpenChange={setTimeOutConfirmOpen}
        onConfirm={confirmTimeOut}
        onCancel={() => {
          setTimeOutConfirmOpen(false);
          setRecordToTimeOut(null);
          setTimeOutData({ dateTimeOut: '', timeOutRemarks: '' });
        }}
        dateTimeOut={timeOutData.dateTimeOut}
        onDateTimeOutChange={(value) => setTimeOutData({ ...timeOutData, dateTimeOut: value })}
        remarks={timeOutData.timeOutRemarks}
        onRemarksChange={(value) => setTimeOutData({ ...timeOutData, timeOutRemarks: value })}
        isLoading={isLoading}
      />
    </div>
  );
}

