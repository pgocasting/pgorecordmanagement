import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { othersService } from '@/services/firebaseService';

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
import { Plus, Menu, LogOut } from 'lucide-react';
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
  timeOutRemarks?: string;
  linkAttachments?: string;
}

const getAcronym = (text: string): string => {
  if (!text) return '';
  const acronymMatch = text.match(/\(([^)]+)\)/);
  if (acronymMatch) {
    return acronymMatch[1];
  }
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('');
};

const formatCurrency = (amount: string | number | undefined): string => {
  if (!amount) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  'Others',
];

export default function OthersPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [records, setRecords] = useState<Others[]>([]);
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
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [timeOutConfirmOpen, setTimeOutConfirmOpen] = useState(false);
  const [recordToTimeOut, setRecordToTimeOut] = useState<string | null>(null);
  const [timeOutData, setTimeOutData] = useState({
    dateTimeOut: '',
    timeOutRemarks: '',
  });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Others | null>(null);
  const [designationOptions] = useState<string[]>(['Admin', 'Manager', 'Staff', 'Officer']);

  // Form states
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
  });

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
      const newRecord = {
        trackingId: nextTrackingId,
        receivedBy: user?.name || '',
        ...formData,
        status: 'Pending',
        remarks: '',
        timeOutRemarks: '',
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
      await othersService.updateRecord(editingId, formData);
      setSuccess('Record updated successfully');
      setEditingId(null);

      const updatedRecords = records.map(r => r.id === editingId ? { ...r, ...formData } : r);
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
      const now = new Date();
      const dateTimeStr = now.toLocaleString();
      const remarksWithDateTime = `[${dateTimeStr}] [${user?.name || 'Unknown'}] ${rejectData.remarks}`;
      
      await othersService.updateRecord(recordToDelete, { status: 'Rejected', remarks: remarksWithDateTime });
      const updatedRecords = records.map(r => r.id === recordToDelete ? { ...r, status: 'Rejected', remarks: remarksWithDateTime } : r);
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

      const timeOutRemarksWithUser = `[${user?.name || 'Unknown'}] ${timeOutData.timeOutRemarks}`;
      await othersService.updateRecord(recordToTimeOut, {
        dateTimeOut: timeOutData.dateTimeOut,
        status: 'Completed',
        timeOutRemarks: timeOutRemarksWithUser
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
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 shadow-sm">
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
                      {editingId ? 'Edit Record' : 'Add New Record'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingId ? 'Update the record details' : 'Fill in the form to add a new record'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {/* Tracking ID - Display Only */}
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
                      {/* Date/Time In */}
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

                    {editingId && user?.role === 'admin' && (
                      <div className="space-y-1">
                        <Label htmlFor="dateTimeOut" className="text-xs font-medium text-gray-700">Date/Time OUT</Label>
                        <Input
                          id="dateTimeOut"
                          name="dateTimeOut"
                          type="datetime-local"
                          value={formData.dateTimeOut || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}

                    {/* Designation / Office */}
                    <div className="space-y-2">
                      <Label htmlFor="designationOffice" className="text-sm font-medium text-gray-700">Designation / Office *</Label>
                      <Select value={formData.designationOffice} onValueChange={(value) => handleSelectChange('designationOffice', value)}>
                        <SelectTrigger 
                          id="designationOffice" 
                          className="w-full"
                          title={formData.designationOffice || "Select designation"}
                        >
                          <SelectValue placeholder="Select designation">
                            {formData.designationOffice ? getAcronym(formData.designationOffice) : 'Select designation'}
                          </SelectValue>
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

                    {/* Inclusive Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inclusiveDateStart" className="text-sm font-medium text-gray-700">Inclusive Date Start *</Label>
                        <Input
                          id="inclusiveDateStart"
                          name="inclusiveDateStart"
                          type="date"
                          value={formData.inclusiveDateStart}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inclusiveDateEnd" className="text-sm font-medium text-gray-700">Inclusive Date End *</Label>
                        <Input
                          id="inclusiveDateEnd"
                          name="inclusiveDateEnd"
                          type="date"
                          value={formData.inclusiveDateEnd}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* Inclusive Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inclusiveTimeStart" className="text-sm font-medium text-gray-700">Inclusive Time Start</Label>
                        <Input
                          id="inclusiveTimeStart"
                          name="inclusiveTimeStart"
                          type="time"
                          value={formData.inclusiveTimeStart}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inclusiveTimeEnd" className="text-sm font-medium text-gray-700">Inclusive Time End</Label>
                        <Input
                          id="inclusiveTimeEnd"
                          name="inclusiveTimeEnd"
                          type="time"
                          value={formData.inclusiveTimeEnd}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* Purpose */}
                    <div className="space-y-2">
                      <Label htmlFor="purpose" className="text-sm font-medium text-gray-700">Purpose</Label>
                      <Textarea
                        id="purpose"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        placeholder="Enter purpose"
                        rows={3}
                      />
                    </div>

                    {editingId && (
                      <>
                        {/* Amount - Editable in Edit Mode */}
                        <div className="space-y-2">
                          <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount</Label>
                          <Input
                            id="amount"
                            name="amount"
                            type="number"
                            value={formData.amount}
                            onChange={handleInputChange}
                            placeholder="Enter amount"
                          />
                        </div>

                        {/* Link/Attachments - Editable in Edit Mode */}
                        <div className="space-y-2">
                          <Label htmlFor="linkAttachments" className="text-sm font-medium text-gray-700">Link / Attachments</Label>
                          <Input
                            id="linkAttachments"
                            name="linkAttachments"
                            type="text"
                            value={formData.linkAttachments}
                            onChange={handleInputChange}
                            placeholder="Enter link or attachment URL"
                          />
                        </div>
                      </>
                    )}

                    {/* Add/Update Button - Full Width */}
                    <Button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 mt-6"
                      onClick={handleAddRecord}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : editingId ? 'Update Record' : 'Add Record'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                  {records.length > 0 ? (
                    records.map((record) => (
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
                        <TableCell className={`wrap-break-word whitespace-normal text-center text-xs ${record.status === 'Completed' ? 'text-green-600 font-medium' : record.status === 'Rejected' ? 'text-red-600 font-medium' : ''}`}>{record.status === 'Completed' ? (record.timeOutRemarks || record.remarks || '-') : (record.remarks || '-')}</TableCell>
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
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500 wrap-break-word whitespace-normal">
                        No records found. Add one to get started.
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
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.inclusiveDateStart}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Inclusive Date End</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.inclusiveDateEnd}</p>
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
                    <p className="text-sm font-semibold text-gray-900 mt-1">{formatCurrency(selectedRecord.amount)}</p>
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

