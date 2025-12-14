import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { overtimeService } from '@/services/firebaseService';

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

interface Overtime {
  id: string;
  trackingId: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designation: string;
  inclusiveDateStart: string;
  inclusiveDateEnd: string;
  inclusiveTimeStart: string;
  inclusiveTimeEnd: string;
  purpose: string;
  placeOfAssignment: string;
  status: string;
  remarks: string;
  timeOutRemarks?: string;
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

export default function OvertimePage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [overtimes, setOvertimes] = useState<Overtime[]>([]);
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [timeOutConfirmOpen, setTimeOutConfirmOpen] = useState(false);
  const [overtimeToTimeOut, setOvertimeToTimeOut] = useState<string | null>(null);
  const [timeOutData, setTimeOutData] = useState({
    dateTimeOut: '',
    timeOutRemarks: '',
  });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOvertime, setSelectedOvertime] = useState<Overtime | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [overtimeToDelete, setOvertimeToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    dateTimeIn: '',
    dateTimeOut: '',
    fullName: '',
    designation: '',
    inclusiveDateStart: '',
    inclusiveDateEnd: '',
    inclusiveTimeStart: '',
    inclusiveTimeEnd: '',
    purpose: '',
    placeOfAssignment: '',
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

  const [designationOptions] = useState<string[]>(['Admin', 'Manager', 'Staff', 'Officer']);

  useEffect(() => {
    const loadOvertimes = async () => {
      try {
        console.log('📂 Loading overtimes from Firestore...');
        const data = await overtimeService.getOvertimes();
        console.log(`✅ Overtimes loaded: ${data.length} records`);
        setOvertimes(data as Overtime[]);
      } catch (error) {
        console.error('❌ Error loading overtimes:', error);
        setSuccess('Error loading overtimes. Please try again.');
        setSuccessModalOpen(true);
      }
    };
    
    loadOvertimes();
    const interval = setInterval(loadOvertimes, 30000);
    return () => clearInterval(interval);
  }, []);


  const generateTrackingId = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const count = String(overtimes.length + 1).padStart(3, '0');
    return `(OT) ${year}/${month}/${day}-${count}`;
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

  const handleAddOvertime = async () => {
    setSuccess('');

    if (
      !formData.dateTimeIn ||
      !formData.fullName ||
      !formData.designation ||
      !formData.inclusiveDateStart ||
      !formData.inclusiveDateEnd ||
      !formData.purpose ||
      !formData.placeOfAssignment
    ) {
      return;
    }

    if (editingId) {
      setEditConfirmOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const newOvertime = {
        trackingId: generateTrackingId(),
        ...formData,
        status: 'Pending',
        remarks: '',
        timeOutRemarks: '',
      };
      const result = await overtimeService.addOvertime(newOvertime);
      setSuccess('Overtime request added successfully');

      setOvertimes([result as Overtime, ...overtimes]);

      setFormData({
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        designation: '',
        inclusiveDateStart: '',
        inclusiveDateEnd: '',
        inclusiveTimeStart: '',
        inclusiveTimeEnd: '',
        purpose: '',
        placeOfAssignment: '',
      });
      setIsDialogOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save overtime:', err);
      setSuccess('Error saving overtime request');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmEditOvertime = async () => {
    if (!editingId) return;

    setIsLoading(true);
    try {
      await overtimeService.updateOvertime(editingId, formData);
      setSuccess('Overtime request updated successfully');
      setEditingId(null);

      const updatedOvertimes = overtimes.map(o => o.id === editingId ? { ...o, ...formData } : o);
      setOvertimes(updatedOvertimes);

      setFormData({
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        designation: '',
        inclusiveDateStart: '',
        inclusiveDateEnd: '',
        inclusiveTimeStart: '',
        inclusiveTimeEnd: '',
        purpose: '',
        placeOfAssignment: '',
      });
      setIsDialogOpen(false);
      setEditConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save overtime:', err);
      setSuccess('Error updating overtime request');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditOvertime = (id: string) => {
    const overtime = overtimes.find((item) => item.id === id);
    if (overtime) {
      setFormData({
        dateTimeIn: overtime.dateTimeIn,
        dateTimeOut: overtime.dateTimeOut || '',
        fullName: overtime.fullName,
        designation: overtime.designation,
        inclusiveDateStart: overtime.inclusiveDateStart,
        inclusiveDateEnd: overtime.inclusiveDateEnd,
        inclusiveTimeStart: overtime.inclusiveTimeStart,
        inclusiveTimeEnd: overtime.inclusiveTimeEnd,
        purpose: overtime.purpose,
        placeOfAssignment: overtime.placeOfAssignment,
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
        designation: '',
        inclusiveDateStart: '',
        inclusiveDateEnd: '',
        inclusiveTimeStart: '',
        inclusiveTimeEnd: '',
        purpose: '',
        placeOfAssignment: '',
      });
    }
  };

  const handleTimeOut = (id: string) => {
    setOvertimeToTimeOut(id);
    setTimeOutData({
      dateTimeOut: '',
      timeOutRemarks: '',
    });
    setTimeOutConfirmOpen(true);
  };

  const handleViewOvertime = (id: string) => {
    const overtime = overtimes.find((item) => item.id === id);
    if (overtime) {
      setSelectedOvertime(overtime);
      setViewModalOpen(true);
    }
  };

  const handleRejectOvertime = (id: string) => {
    setOvertimeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmRejectOvertime = async () => {
    if (!overtimeToDelete) return;

    setIsLoading(true);
    try {
      await overtimeService.updateOvertime(overtimeToDelete, { status: 'Rejected' });
      const updatedOvertimes = overtimes.map(o => o.id === overtimeToDelete ? { ...o, status: 'Rejected' } : o);
      setOvertimes(updatedOvertimes);
      setSuccess('Overtime request rejected successfully');
      setOvertimeToDelete(null);
      setDeleteConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to reject overtime:', err);
      setSuccess(err instanceof Error ? err.message : 'Error rejecting overtime request');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmTimeOut = async () => {
    if (!overtimeToTimeOut || !timeOutData.dateTimeOut) return;

    setIsLoading(true);
    try {
      // Verify the document exists before attempting to update
      const currentOvertimes = await overtimeService.getOvertimes();
      const overtimeExists = currentOvertimes.some((o: any) => o.id === overtimeToTimeOut);
      
      if (!overtimeExists) {
        throw new Error('Overtime record not found. It may have been deleted or the data is out of sync.');
      }

      await overtimeService.updateOvertime(overtimeToTimeOut, {
        dateTimeOut: timeOutData.dateTimeOut,
        timeOutRemarks: timeOutData.timeOutRemarks,
        status: 'Completed'
      });
      
      const updatedOvertimes = await overtimeService.getOvertimes();
      setOvertimes(updatedOvertimes as Overtime[]);
      
      setSuccess('Time out recorded successfully');
      setTimeOutConfirmOpen(false);
      setOvertimeToTimeOut(null);
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
            <h1 className="text-2xl font-bold text-gray-900">Request for Overtime Records</h1>
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
                <h2 className="text-xl font-bold text-gray-900">Overtime Requests</h2>
                <p className="text-sm text-gray-600">Manage and view all overtime request records</p>
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
                        inclusiveDateStart: '',
                        inclusiveDateEnd: '',
                        inclusiveTimeStart: '',
                        inclusiveTimeEnd: '',
                        purpose: '',
                        placeOfAssignment: '',
                      });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Overtime Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg z-50 max-h-[90vh] overflow-y-auto overflow-x-hidden">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">{editingId ? 'Edit Overtime Request' : 'Add New Overtime Request'}</DialogTitle>
                    <DialogDescription>
                      {editingId ? 'Update the overtime request details' : 'Fill in the form to add a new overtime request'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {!editingId && (
                      <div className="space-y-1">
                        <Label htmlFor="trackingId" className="text-xs font-medium text-gray-700">Tracking ID</Label>
                        <Input
                          id="trackingId"
                          type="text"
                          value={generateTrackingId()}
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
                          className="h-8 text-xs"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label htmlFor="designation" className="text-xs font-medium text-gray-700">Designation/Office *</Label>
                      <Select value={formData.designation} onValueChange={(value) => handleSelectChange('designation', value)}>
                        <SelectTrigger 
                          id="designation" 
                          className="w-full h-8 text-xs"
                          title={formData.designation || "Select designation"}
                        >
                          <SelectValue placeholder="Select">
                            {formData.designation ? getAcronym(formData.designation) : 'Select'}
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="inclusiveDateStart" className="text-xs font-medium text-gray-700">Date Start *</Label>
                        <Input
                          id="inclusiveDateStart"
                          name="inclusiveDateStart"
                          type="date"
                          value={formData.inclusiveDateStart}
                          onChange={handleInputChange}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="inclusiveDateEnd" className="text-xs font-medium text-gray-700">Date End *</Label>
                        <Input
                          id="inclusiveDateEnd"
                          name="inclusiveDateEnd"
                          type="date"
                          value={formData.inclusiveDateEnd}
                          onChange={handleInputChange}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="inclusiveTimeStart" className="text-xs font-medium text-gray-700">Time Start</Label>
                        <Input
                          id="inclusiveTimeStart"
                          name="inclusiveTimeStart"
                          type="time"
                          value={formData.inclusiveTimeStart}
                          onChange={handleInputChange}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="inclusiveTimeEnd" className="text-xs font-medium text-gray-700">Time End</Label>
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
                      <Label htmlFor="purpose">Purpose *</Label>
                      <Input
                        id="purpose"
                        name="purpose"
                        placeholder="Enter purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placeOfAssignment">Place of Assignment *</Label>
                      <Input
                        id="placeOfAssignment"
                        name="placeOfAssignment"
                        placeholder="Enter place of assignment"
                        value={formData.placeOfAssignment}
                        onChange={handleInputChange}
                      />
                    </div>

                    <Button
                      onClick={handleAddOvertime}
                      disabled={isLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isLoading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Request' : 'Add Request')}
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
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Designation</TableHead>
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Purpose</TableHead>
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Place of Assignment</TableHead>
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Status</TableHead>
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Remarks</TableHead>
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overtimes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-4 text-gray-500 text-xs wrap-break-word whitespace-normal">
                        No overtime requests found. Click "Add Overtime Request" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    overtimes.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs py-1 px-1 text-center font-bold italic text-indigo-600 wrap-break-word whitespace-normal">{item.trackingId}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{new Date(item.dateTimeIn).toLocaleString()}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal text-red-600">{item.dateTimeOut ? new Date(item.dateTimeOut).toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{item.fullName}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{item.designation}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{item.purpose}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{item.placeOfAssignment}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">
                          <span
                            className={`px-1 py-0.5 rounded text-xs font-medium ${
                              item.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'Approved'
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : item.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {item.status || 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{item.status === 'Completed' ? (item.timeOutRemarks || item.remarks || '-') : (item.remarks || '-')}</TableCell>
                        <TableCell className="py-1 px-1 text-center wrap-break-word whitespace-normal">
                          <ActionButtons
                            onView={() => handleViewOvertime(item.id)}
                            onEdit={() => handleEditOvertime(item.id)}
                            onTimeOut={() => handleTimeOut(item.id)}
                            onReject={() => handleRejectOvertime(item.id)}
                            canEdit={user?.role === 'admin' || (!!item.dateTimeOut === false && item.status === 'Pending')}
                            canReject={user?.role === 'admin' || (!!item.dateTimeOut === false && item.status === 'Pending')}
                            showTimeOut={!item.dateTimeOut}
                            editDisabledReason={user?.role !== 'admin' && (!!item.dateTimeOut || item.status !== 'Pending') ? 'Users can only edit pending records' : undefined}
                            rejectDisabledReason={user?.role !== 'admin' && (!!item.dateTimeOut || item.status !== 'Pending') ? 'Users can only reject pending records' : undefined}
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
          <DialogDescription>
            Are you sure you want to update this overtime request? This action cannot be undone.
          </DialogDescription>
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
              onClick={confirmEditOvertime}
              disabled={isLoading}
              className="px-6 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this overtime request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmRejectOvertime}
              disabled={isLoading}
            >
              {isLoading ? 'Rejecting...' : 'Reject'}
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
              Enter the date/time out and any remarks for this overtime record.
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
              onClick={() => setTimeOutConfirmOpen(false)}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Overtime Request Details</DialogTitle>
          </DialogHeader>
          {selectedOvertime && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-600 font-medium">Tracking ID</p>
                  <p className="text-gray-900">{selectedOvertime.trackingId}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Status</p>
                  <p className="text-gray-900">{selectedOvertime.status}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-600 font-medium">Full Name</p>
                  <p className="text-gray-900">{selectedOvertime.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Designation</p>
                  <p className="text-gray-900">{selectedOvertime.designation}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Date/Time IN</p>
                <p className="text-gray-900">{new Date(selectedOvertime.dateTimeIn).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Date/Time OUT</p>
                <p className="text-gray-900">{selectedOvertime.dateTimeOut ? new Date(selectedOvertime.dateTimeOut).toLocaleString() : '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-600 font-medium">Inclusive Date Start</p>
                  <p className="text-gray-900">{selectedOvertime.inclusiveDateStart}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Inclusive Date End</p>
                  <p className="text-gray-900">{selectedOvertime.inclusiveDateEnd}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Purpose</p>
                <p className="text-gray-900">{selectedOvertime.purpose}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Place of Assignment</p>
                <p className="text-gray-900">{selectedOvertime.placeOfAssignment}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Remarks</p>
                <p className="text-gray-900">{selectedOvertime.remarks || '-'}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setViewModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-700">
              Close
            </Button>
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
    </div>
  );
}

