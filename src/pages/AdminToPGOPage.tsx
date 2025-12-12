import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { adminToPGOService } from '@/services/firestoreService';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Menu, Settings, LogOut, BarChart3, FileText } from 'lucide-react';
import { ActionButtons } from '@/components/ActionButtons';

interface AdminToPGO {
  id: string;
  trackingId: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  officeAddress: string;
  particulars: string;
  status: string;
  remarks: string;
  timeOutRemarks?: string;
}

const getAcronym = (text: string): string => {
  if (!text) return '';
  // Check if text has acronym in parentheses
  const acronymMatch = text.match(/\(([^)]+)\)/);
  if (acronymMatch) {
    return acronymMatch[1];
  }
  // If no parentheses, create acronym from first letters
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('');
};

export default function AdminToPGOPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [records, setRecords] = useState<AdminToPGO[]>([]);
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  const [selectedRecord, setSelectedRecord] = useState<AdminToPGO | null>(null);
  const [designationOptions] = useState<string[]>(['Admin', 'Manager', 'Staff', 'Officer']);

  // Form states
  const [formData, setFormData] = useState({
    dateTimeIn: '',
    dateTimeOut: '',
    fullName: '',
    officeAddress: '',
    particulars: '',
    remarks: '',
  });

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

  // Load records from Firestore on mount
  useEffect(() => {
    const loadRecords = async () => {
      try {
        const data = await adminToPGOService.getRecords();
        setRecords(data as AdminToPGO[]);
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
    return `(ATP) ${year}/${month}/${day}-${count}`;
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
      !formData.officeAddress ||
      !formData.particulars
    ) {
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
      const newRecord: AdminToPGO = {
        id: Date.now().toString(),
        trackingId: nextTrackingId,
        ...formData,
        status: 'Pending',
      };
      
      // Save to Firestore
      await adminToPGOService.addRecord(newRecord);
      
      setRecords((prev) => [newRecord, ...prev]);
      setSuccess('Record added successfully');

      setFormData({
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        officeAddress: '',
        particulars: '',
        remarks: '',
      });
      setIsDialogOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save record:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmEditRecord = async () => {
    if (!editingId) return;

    setIsLoading(true);
    try {
      // Update in Firestore
      await adminToPGOService.updateRecord(editingId, formData);
      
      setRecords((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, ...formData }
            : item
        )
      );
      setSuccess('Record updated successfully');
      setEditingId(null);

      setFormData({
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        officeAddress: '',
        particulars: '',
        remarks: '',
      });
      setIsDialogOpen(false);
      setEditConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save record:', err);
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
        officeAddress: record.officeAddress,
        particulars: record.particulars,
        remarks: record.remarks,
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
      // Clear editing state when dialog closes
      setEditingId(null);
      setFormData({
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        officeAddress: '',
        particulars: '',
        remarks: '',
      });
    }
  };

  const confirmDeleteRecord = () => {
    if (!recordToDelete) return;
    
    setRecords((prev) => prev.filter((item) => item.id !== recordToDelete));
    setSuccess('Record deleted successfully');
    setDeleteConfirmOpen(false);
    setRecordToDelete(null);
    setSuccessModalOpen(true);
  };

  const handleTimeOut = (id: string) => {
    setRecordToTimeOut(id);
    setTimeOutData({
      dateTimeOut: '',
      timeOutRemarks: '',
    });
    setTimeOutConfirmOpen(true);
  };

  const confirmTimeOut = async () => {
    if (!recordToTimeOut || !timeOutData.dateTimeOut) return;

    setIsLoading(true);
    try {
      // Verify the document exists before attempting to update
      const currentRecords = await adminToPGOService.getRecords();
      const recordExists = currentRecords.some((r: any) => r.id === recordToTimeOut);
      
      if (!recordExists) {
        throw new Error('Admin to PGO record not found. It may have been deleted or the data is out of sync.');
      }

      // Update in Firestore
      await adminToPGOService.updateRecord(recordToTimeOut, {
        dateTimeOut: timeOutData.dateTimeOut,
        timeOutRemarks: timeOutData.timeOutRemarks,
        status: 'Completed'
      });

      // Reload from Firestore to ensure consistency
      const updatedRecords = await adminToPGOService.getRecords();
      setRecords(updatedRecords as AdminToPGO[]);
      
      setSuccess('Time out recorded successfully');
      setTimeOutConfirmOpen(false);
      setRecordToTimeOut(null);
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

  const handleViewRecord = (id: string) => {
    const record = records.find((item) => item.id === id);
    if (record) {
      setSelectedRecord(record);
      setViewModalOpen(true);
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
          <AdminToPGOSidebar recordTypes={recordTypes} onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 shadow-sm">
        <AdminToPGOSidebar recordTypes={recordTypes} onNavigate={undefined} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin to PGO Records</h1>
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
                <h2 className="text-xl font-bold text-gray-900">Admin to PGO</h2>
                <p className="text-sm text-gray-600">Manage and view all admin to PGO records</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4" />
                    Add Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg z-50 max-h-[90vh] overflow-y-auto overflow-x-hidden">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">{editingId ? 'Edit Record' : 'Add New Record'}</DialogTitle>
                    <DialogDescription>
                      {editingId ? 'Update the record details' : 'Fill in the form to add a new record'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {!editingId && (
                      <div className="space-y-1">
                        <Label htmlFor="trackingId" className="text-xs font-medium text-gray-700">Tracking ID</Label>
                        <Input
                          id="trackingId"
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

                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Enter full name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="officeAddress">Office / Address *</Label>
                      <Select value={formData.officeAddress} onValueChange={(value) => handleSelectChange('officeAddress', value)}>
                        <SelectTrigger 
                          id="officeAddress" 
                          className="w-full"
                          title={formData.officeAddress || "Select office or designation"}
                        >
                          <SelectValue placeholder="Select office or designation">
                            {formData.officeAddress ? getAcronym(formData.officeAddress) : 'Select office or designation'}
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

                    <div className="space-y-2">
                      <Label htmlFor="particulars">Particulars *</Label>
                      <textarea
                        id="particulars"
                        name="particulars"
                        placeholder="Enter particulars"
                        value={formData.particulars}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleAddRecord}
                      disabled={isLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isLoading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Record' : 'Add Record')}
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
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Tracking ID</TableHead>
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Date/Time IN</TableHead>
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Date/Time OUT</TableHead>
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Full Name</TableHead>
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Office</TableHead>
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Particulars</TableHead>
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Status</TableHead>
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Remarks</TableHead>
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.filter(r => r.status === 'Pending').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4 text-gray-500 text-xs">
                        No pending records. Click "Add Record" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.filter(r => r.status === 'Pending').map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs py-1 px-1 text-center font-bold italic text-indigo-600 wrap-break-word whitespace-normal">{record.trackingId}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{new Date(record.dateTimeIn).toLocaleString()}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal text-red-600">{record.dateTimeOut ? new Date(record.dateTimeOut).toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{record.fullName}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{record.officeAddress}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{record.particulars}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">
                          <span
                            className={`px-1 py-0.5 rounded text-xs font-medium ${
                              record.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : record.status === 'Approved'
                                ? 'bg-green-100 text-green-800'
                                : record.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : record.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {record.status || 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{record.remarks}</TableCell>
                        <TableCell className="py-1 px-1 text-center wrap-break-word whitespace-normal">
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
                  )}
                </TableBody>
              </Table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Confirmation Modal */}
      <Dialog open={editConfirmOpen} onOpenChange={setEditConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">Confirm Update</DialogTitle>
          <p className="text-sm text-gray-600 mt-4">
            Are you sure you want to update this record? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setEditConfirmOpen(false);
              }}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEditRecord}
              disabled={isLoading}
              className="px-6 bg-amber-600 hover:bg-amber-700 text-white"
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
            <DialogTitle>Record Time Out</DialogTitle>
            <DialogDescription>
              Enter the date/time out and any remarks for this Admin to PGO record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timeOutDateTime">Date/Time OUT *</Label>
              <Input
                id="timeOutDateTime"
                type="datetime-local"
                value={timeOutData.dateTimeOut}
                onChange={(e) => setTimeOutData({ ...timeOutData, dateTimeOut: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeOutRemarks">Remarks</Label>
              <textarea
                id="timeOutRemarks"
                placeholder="Enter time out remarks (optional)"
                value={timeOutData.timeOutRemarks}
                onChange={(e) => setTimeOutData({ ...timeOutData, timeOutRemarks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setTimeOutConfirmOpen(false);
                setRecordToTimeOut(null);
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">Confirm Delete</DialogTitle>
          <p className="text-sm text-gray-600 mt-4">
            You are about to permanently remove this record. All associated data will be lost. Please confirm this action.
          </p>
          <div className="flex gap-3 justify-end pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setRecordToDelete(null);
              }}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteRecord}
              className="px-6 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
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
              onClick={() => setSuccessModalOpen(false)}
              className="bg-green-600 hover:bg-green-700"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Admin to PGO Details</DialogTitle>
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
                    <p className="text-xs font-medium text-gray-600 uppercase">Office Address</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.officeAddress}</p>
                  </div>
                </div>
              </div>

              {/* Date/Time Out */}
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Date/Time Out</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.dateTimeOut ? new Date(selectedRecord.dateTimeOut).toLocaleString() : '-'}</p>
              </div>

              {/* Particulars */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Details</h3>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Particulars</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 whitespace-pre-wrap">{selectedRecord.particulars}</p>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Remarks</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.remarks || '-'}</p>
                  </div>
                  {selectedRecord.timeOutRemarks && (
                    <div>
                      <p className="text-xs font-semibold text-blue-600 uppercase">Time Out Remarks</p>
                      <p className="text-sm font-semibold text-blue-900 mt-1">{selectedRecord.timeOutRemarks}</p>
                    </div>
                  )}
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
    </div>
  );
}

interface AdminToPGOSidebarProps {
  recordTypes: string[];
  onNavigate?: () => void;
}

function AdminToPGOSidebar({ recordTypes, onNavigate }: AdminToPGOSidebarProps) {
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
                  if (type === 'Admin to PGO') {
                    navigate('/admin-to-pgo');
                  } else if (type === 'Locator') {
                    navigate('/locator');
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
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        )}
      </div>
    </div>
  );
}
