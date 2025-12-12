import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { othersService } from '@/services/firestoreService';
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
import { Plus, Menu, Settings, LogOut, BarChart3, FileText } from 'lucide-react';
import { ActionButtons } from '@/components/ActionButtons';

interface Others {
  id: string;
  trackingId: string;
  dateTimeIn: string;
  dateTimeOut: string;
  fullName: string;
  designationOffice: string;
  inclusiveDateStart: string;
  inclusiveDateEnd: string;
  inclusiveTimeStart: string;
  inclusiveTimeEnd: string;
  purpose: string;
  amount: string;
  status: string;
  remarks: string;
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
        const data = await othersService.getRecords();
        setRecords(data as Others[]);
      } catch (error) {
        console.error('Error loading records:', error);
        setSuccess('Error loading records');
        setSuccessModalOpen(true);
      }
    };
    loadRecords();
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
      !formData.inclusiveDateEnd ||
      !formData.purpose
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
        ...formData,
        status: 'Pending',
      };
      await othersService.addRecord(newRecord);
      setSuccess('Record added successfully');

      // Reload from Firestore
      const updatedRecords = await othersService.getRecords();
      setRecords(updatedRecords as Others[]);

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

      // Reload from Firestore
      const updatedRecords = await othersService.getRecords();
      setRecords(updatedRecords as Others[]);

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

  const handleDeleteRecord = (id: string) => {
    setRecordToDelete(id);
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

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    
    try {
      await othersService.deleteRecord(recordToDelete);
      // Reload from Firestore
      const updatedRecords = await othersService.getRecords();
      setRecords(updatedRecords as Others[]);
      setSuccess('Record deleted successfully');
      setRecordToDelete(null);
      setDeleteConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to delete record:', err);
      setSuccess('Error deleting record');
      setSuccessModalOpen(true);
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

    setIsLoading(true);
    try {
      // Verify the document exists before attempting to update
      const currentRecords = await othersService.getRecords();
      const recordExists = currentRecords.some((r: any) => r.id === recordToTimeOut);
      
      if (!recordExists) {
        throw new Error('Other record not found. It may have been deleted or the data is out of sync.');
      }

      await othersService.updateRecord(recordToTimeOut, {
        dateTimeOut: timeOutData.dateTimeOut,
        status: 'Completed',
        timeOutRemarks: timeOutData.timeOutRemarks
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
          <OthersSidebar recordTypes={['Leave', 'Letter', 'Locator', 'Obligation Request', 'Purchase Request', 'Request for Overtime', 'Travel Order', 'Voucher', 'Admin to PGO', 'Others']} onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 shadow-sm">
        <OthersSidebar recordTypes={['Leave', 'Letter', 'Locator', 'Obligation Request', 'Purchase Request', 'Request for Overtime', 'Travel Order', 'Voucher', 'Admin to PGO', 'Others']} onNavigate={undefined} />
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

                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter full name"
                      />
                    </div>

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
                      <Label htmlFor="purpose" className="text-sm font-medium text-gray-700">Purpose *</Label>
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
                  {records.filter(r => r.status === 'Pending').length > 0 ? (
                    records.filter(r => r.status === 'Pending').map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50">
                        <TableCell className="font-bold italic wrap-break-word whitespace-normal text-center text-xs text-indigo-600">{record.trackingId}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{new Date(record.dateTimeIn).toLocaleString()}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs text-red-600">{record.dateTimeOut ? new Date(record.dateTimeOut).toLocaleString() : '-'}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs uppercase">{record.fullName}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{record.designationOffice}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{record.purpose}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            record.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            record.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {record.status}
                          </span>
                        </TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{record.remarks || '-'}</TableCell>
                        <TableCell className="text-center">
                          <ActionButtons
                            onView={() => handleViewRecord(record.id)}
                            onEdit={() => handleEditRecord(record.id)}
                            onTimeOut={() => handleTimeOut(record.id)}
                            onDelete={() => handleDeleteRecord(record.id)}
                            canEdit={user?.role === 'admin' || (!!record.dateTimeOut === false && record.status === 'Pending')}
                            canDelete={user?.role === 'admin' || (!!record.dateTimeOut === false && record.status === 'Pending')}
                            showTimeOut={!record.dateTimeOut}
                            editDisabledReason={user?.role !== 'admin' && (!!record.dateTimeOut || record.status !== 'Pending') ? 'Users can only edit pending records' : undefined}
                            deleteDisabledReason={user?.role !== 'admin' && (!!record.dateTimeOut || record.status !== 'Pending') ? 'Users can only delete pending records' : undefined}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500 wrap-break-word whitespace-normal">
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
                      'bg-blue-100 text-blue-800'
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Are you sure you want to delete this record? This action cannot be undone.</p>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteRecord}
            >
              Delete
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
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-700">{success}</p>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setSuccessModalOpen(false)}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface OthersSidebarProps {
  recordTypes: string[];
  onNavigate?: () => void;
}

function OthersSidebar({ recordTypes, onNavigate }: OthersSidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-indigo-600">PGO</h2>
        <p className="text-xs text-gray-500">Record Management</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              onNavigate?.();
              navigate(item.href);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}

        {/* Records Menu */}
        <div className="space-y-1">
          <div className="flex items-center gap-3 px-4 py-2 text-gray-700">
            <FileText className="h-5 w-5" />
            <span className="text-sm font-medium">Records</span>
          </div>
          <div className="pl-8 space-y-1">
            {recordTypes.map((type) => (
              <button
                key={type}
                onClick={() => {
                  onNavigate?.();
                  if (type === 'Locator') {
                    navigate('/locator');
                  } else if (type === 'Admin to PGO') {
                    navigate('/admin-to-pgo');
                  } else if (type === 'Leave') {
                    navigate('/leave');
                  } else if (type === 'Letter') {
                    navigate('/letter');
                  } else if (type === 'Request for Overtime') {
                    navigate('/overtime');
                  } else if (type === 'Travel Order') {
                    navigate('/travel-order');
                  } else if (type === 'Voucher') {
                    navigate('/voucher');
                  } else if (type === 'Others') {
                    navigate('/others');
                  }
                }}
                className="w-full block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* User Info - Bottom */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-indigo-600">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {user?.role === 'admin' && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            onClick={() => {
              onNavigate?.();
              navigate('/settings');
            }}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        )}
        {user?.role !== 'admin' && (
          <></>
        )}
      </div>
    </div>
  );
}
