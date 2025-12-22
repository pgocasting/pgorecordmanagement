import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { processingService, designationService } from '@/services/firebaseService';

const getCurrentDateTime = (): string => {
  const now = new Date();
  // Get current time in Philippine timezone (GMT+8)
  const philippinesTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
  const year = philippinesTime.getFullYear();
  const month = String(philippinesTime.getMonth() + 1).padStart(2, '0');
  const day = String(philippinesTime.getDate()).padStart(2, '0');
  const hours = String(philippinesTime.getHours()).padStart(2, '0');
  const minutes = String(philippinesTime.getMinutes()).padStart(2, '0');
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
import {
  Menu,
  Search,
  LogOut,
  User,
  Plus
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import SuccessModal from '@/components/SuccessModal';
import TimeOutModal from '@/components/TimeOutModal';
import { ActionButtons } from '@/components/ActionButtons';

interface Processing {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designationOffice: string;
  purpose: string;
  amount?: number;
  status: string;
  remarks: string;
  remarksHistory: Array<{
    remarks: string;
    status: string;
    timestamp: string;
    updatedBy: string;
  }>;
  timeOutRemarks?: string;
  linkAttachments?: string;
}

// Helper functions can be added here if needed

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

export default function ProcessingPage() {
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
  const [records, setRecords] = useState<Processing[]>([]);
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
  const [timeOutConfirmOpen, setTimeOutConfirmOpen] = useState(false);
  const [recordToTimeOut, setRecordToTimeOut] = useState<string | null>(null);
  const [timeOutData, setTimeOutData] = useState({
    dateTimeOut: '',
    timeOutRemarks: '',
  });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Processing | null>(null);
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

  const initialFormData = () => ({
    receivedBy: '',
    dateTimeIn: getCurrentDateTime(),
    dateTimeOut: '',
    fullName: '',
    designationOffice: '',
    purpose: '',
    amount: '',
    remarks: '',
    linkAttachments: '',
    isEdited: false,
    remarksHistory: [] as Array<{
      remarks: string;
      status: string;
      timestamp: string;
      updatedBy: string;
    }>
  });

  const [formData, setFormData] = useState(initialFormData());

  // Load records from Firestore on mount
  useEffect(() => {
    const loadRecords = async () => {
      try {
        console.log('📂 Loading processing records from Firestore...');
        const data = await processingService.getRecords();
        console.log(`✅ Processing records loaded: ${data.length} records`);
        setRecords(data as Processing[]);
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
    return `(P) ${year}/${month}/${day}-${count}`;
  }, [records.length]);

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

  const handleAddRecord = async () => {
    setSuccess('');

    if (!formData.dateTimeIn || !formData.fullName || !formData.designationOffice) {
      setSuccess('Please fill in all required fields');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      
      if (editingId) {
        // Update existing record
        const existingRecord = records.find(r => r.id === editingId);
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
          amount: formData.amount ? parseFloat(formData.amount) : undefined,
          remarksHistory: newRemarksHistory,
          status: newStatus, // Use the determined status
          updatedAt: now
        };
        
        await processingService.updateRecord(editingId, updateData);
        
        const updatedRecords = records.map(r => 
          r.id === editingId 
            ? { 
                ...r, 
                ...formData,
                amount: formData.amount ? parseFloat(formData.amount) : undefined,
                remarksHistory: newRemarksHistory,
                updatedAt: now
              } 
            : r
        );
        
        setRecords(updatedRecords);
        setSuccess('Record updated successfully');
        setEditingId(null);
      } else {
        // Add new record
        const newRecord = {
          trackingId: nextTrackingId,
          ...formData,
          receivedBy: currentUser,
          amount: formData.amount ? parseFloat(formData.amount) : undefined,
          status: 'Pending',
          timeOutRemarks: '',
          remarks: formData.remarks || 'Record created',
          remarksHistory: [{
            remarks: formData.remarks || 'Record created',
            status: 'Pending',
            timestamp: now,
            updatedBy: currentUser
          }],
          createdAt: now,
          updatedAt: now
        };
        
        const result = await processingService.addRecord(newRecord);
        setRecords([result as Processing, ...records]);
        setSuccess('Record added successfully');
      }

setFormData(initialFormData());
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

  const handleEditRecord = (record: Processing) => {
    setFormData({
      ...initialFormData(),
      receivedBy: record.receivedBy || '',
      dateTimeIn: record.dateTimeIn,
      dateTimeOut: record.dateTimeOut || '',
      fullName: record.fullName,
      designationOffice: record.designationOffice,
      purpose: record.purpose,
      amount: record.amount?.toString() || '',
      remarks: record.remarks || '',
      linkAttachments: record.linkAttachments || '',
      remarksHistory: record.remarksHistory || [],
      isEdited: true // Add flag to indicate this is an edit
    });
    setEditingId(record.id);
    setIsDialogOpen(true);
  };

  const [remarksHistoryOpen, setRemarksHistoryOpen] = useState(false);
  const [currentRemarksHistory, setCurrentRemarksHistory] = useState<Array<{
    remarks: string;
    status: string;
    timestamp: string;
    updatedBy: string;
  }>>([]);

  const viewRemarksHistory = (record: Processing) => {
    setCurrentRemarksHistory(record.remarksHistory || []);
    setRemarksHistoryOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingId(null);
setFormData(initialFormData());
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
      
      await processingService.updateRecord(recordToDelete, { 
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
    setTimeOutData({ dateTimeOut: getCurrentDateTime(), timeOutRemarks: '' });
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
      const currentRecords = await processingService.getRecords();
      const recordExists = currentRecords.some((r: any) => r.id === recordToTimeOut);
      
      if (!recordExists) {
        throw new Error('Processing record not found. It may have been deleted or the data is out of sync.');
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
      
      await processingService.updateRecord(recordToTimeOut, {
        dateTimeOut: timeOutData.dateTimeOut,
        status: 'Completed',
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        timeOutRemarks: newRemarks,
        updatedAt: now
      });
      // Reload from Firestore
      const updatedRecords = await processingService.getRecords();
      setRecords(updatedRecords as Processing[]);
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
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Processing Records</h1>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Processing</h2>
                <p className="text-sm text-gray-600">Manage and view all processing records</p>
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
                          receivedBy: '',
                          dateTimeIn: getCurrentDateTime(),
                          dateTimeOut: '',
                          fullName: '',
                          designationOffice: '',
                          purpose: '',
                          amount: '',
                          remarks: '',
                          linkAttachments: '',
                          isEdited: false,
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
                      <DialogTitle>{editingId ? 'Edit' : 'Add New'} Processing Record</DialogTitle>
                      <DialogDescription>
                        Fill in the form to {editingId ? 'update' : 'add'} a processing record
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
                            type="datetime-local"
                            name="dateTimeIn"
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
                            value={formData.fullName}
                            onChange={handleInputChange}
                            placeholder="Full Name"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="designationOffice">Office *</Label>
                        <Select
                          value={formData.designationOffice}
                          onValueChange={(value) => handleSelectChange('designationOffice', value)}
                          required
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {designationOptions.map((designation) => (
                              <SelectItem key={designation} value={designation}>
                                {designation}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <div className="space-y-2">
                        <Label htmlFor="purpose">Purpose *</Label>
                        <Input
                          id="purpose"
                          name="purpose"
                          value={formData.purpose}
                          onChange={handleInputChange}
                          placeholder="Enter purpose"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          name="amount"
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={handleInputChange}
                          placeholder="Enter amount"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleAddRecord} 
                      disabled={isLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isLoading ? 'Saving...' : editingId ? 'Update Processing' : 'Add Processing'}
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Records Table */}
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
                    <TableHead className="text-center">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Remarks</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-500 text-xs wrap-break-word whitespace-normal">
                        {records.length === 0 ? 'No records found. Click "Add Record" to create one.' : 'No records match your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50">
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{record.receivedBy || '-'}</TableCell>
                        <TableCell className="font-bold italic wrap-break-word whitespace-normal text-center text-xs text-indigo-600">{record.trackingId}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">
                          {formatDateTimeWithoutSeconds(record.dateTimeIn)}
                        </TableCell>
                        <TableCell className={`wrap-break-word whitespace-normal text-center text-xs ${
                          record.status === 'Completed' ? 'text-green-600 font-medium' : 'text-red-600'
                        }`}>
                          {record.dateTimeOut ? formatDateTimeWithoutSeconds(record.dateTimeOut) : '-'}
                        </TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs uppercase">{record.fullName}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{record.designationOffice}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{record.purpose}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">
                          {formatAmount(record.amount)}
                        </TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            record.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            record.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            record.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status}
                          </span>
                        </TableCell>
                        <TableCell 
                          className="wrap-break-word whitespace-normal text-xs cursor-pointer hover:bg-gray-50"
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
                                {record.remarksHistory?.length > 0 ? record.remarksHistory[0].remarks : record.remarks}
                              </div>
                              {record.remarksHistory?.length > 0 && (
                                <div className={`${record.status === 'Completed' ? 'text-green-600' : record.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                                  {record.remarksHistory[0]?.timestamp && record.status !== 'Completed' && record.status !== 'Pending' && (
                                    <span>[{formatDateTimeWithoutSeconds(record.remarksHistory[0].timestamp)}] </span>
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
                            onEdit={() => {
                              const recordToEdit = records.find(r => r.id === record.id);
                              if (recordToEdit) {
                                handleEditRecord(recordToEdit);
                              }
                            }}
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
      <SuccessModal
        open={successModalOpen}
        onOpenChange={setSuccessModalOpen}
        message={success}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Processing Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this processing record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectRemarks">Reason for Rejection *</Label>
              <Textarea
                id="rejectRemarks"
                placeholder="Enter reason for rejection"
                value={rejectData.remarks}
                onChange={(e) => setRejectData({ remarks: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmRejectRecord}
                disabled={isLoading || !rejectData.remarks.trim()}
              >
                {isLoading ? 'Processing...' : 'Reject Record'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Out Modal */}
      <TimeOutModal
        open={timeOutConfirmOpen}
        onOpenChange={setTimeOutConfirmOpen}
        dateTimeOut={timeOutData.dateTimeOut}
        onDateTimeOutChange={(value) => setTimeOutData(prev => ({ ...prev, dateTimeOut: value }))}
        remarks={timeOutData.timeOutRemarks}
        onRemarksChange={(value) => setTimeOutData(prev => ({ ...prev, timeOutRemarks: value }))}
        onConfirm={confirmTimeOut}
        onCancel={() => {
          setTimeOutConfirmOpen(false);
          setRecordToTimeOut(null);
          setTimeOutData({ dateTimeOut: '', timeOutRemarks: '' });
        }}
        isLoading={isLoading}
      />

      {/* View Record Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Processing Record Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Tracking ID</p>
                  <p>{selectedRecord.trackingId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p>
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedRecord.status === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : selectedRecord.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {selectedRecord.status}
                    </span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Date/Time In</p>
                  <p>{formatDateTimeWithoutSeconds(selectedRecord.dateTimeIn)}</p>
                </div>
                {selectedRecord.dateTimeOut && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Date/Time Out</p>
                    <p>{formatDateTimeWithoutSeconds(selectedRecord.dateTimeOut)}</p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p>{selectedRecord.fullName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Designation/Office</p>
                <p>{selectedRecord.designationOffice}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Purpose</p>
                <p className="whitespace-pre-line">{selectedRecord.purpose}</p>
              </div>
              {selectedRecord.amount && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatAmount(selectedRecord.amount)}
                  </p>
                </div>
              )}
              {selectedRecord.linkAttachments && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Link Attachments</p>
                  <a 
                    href={selectedRecord.linkAttachments} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {selectedRecord.linkAttachments}
                  </a>
                </div>
              )}
              {selectedRecord.remarks && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Remarks</p>
                  <p className="whitespace-pre-line">{selectedRecord.remarks}</p>
                </div>
              )}
              {selectedRecord.timeOutRemarks && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Time Out Remarks</p>
                  <p className="whitespace-pre-line">{selectedRecord.timeOutRemarks}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Received By</p>
                  <p>{selectedRecord.receivedBy}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Created At</p>
                  <p>{selectedRecord.dateTimeIn && formatDateTimeWithoutSeconds(selectedRecord.dateTimeIn)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
