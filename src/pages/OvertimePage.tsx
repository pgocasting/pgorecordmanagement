import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { overtimeService, designationService } from '@/services/firebaseService';

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
import {
  Menu,
  Search,
  LogOut,
  User,
  Plus
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ActionButtons } from '@/components/ActionButtons';
import SuccessModal from '@/components/SuccessModal';
import TimeOutModal from '@/components/TimeOutModal';

interface Overtime {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designation: string;
  inclusiveDateStart?: string;
  inclusiveDateEnd?: string;
  inclusiveTimeStart?: string;
  inclusiveTimeEnd?: string;
  purpose: string;
  placeOfAssignment: string;
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

export default function OvertimePage() {
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
  const [overtimes, setOvertimes] = useState<Overtime[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
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
    remarks: '',
    remarksHistory: [] as Array<{
      remarks: string;
      status: string;
      timestamp: string;
      updatedBy: string;
    }>
  });

  const viewRemarksHistory = (overtime: Overtime) => {
    setCurrentRemarksHistory(overtime.remarksHistory || []);
    setRemarksHistoryOpen(true);
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

  const filteredOvertimes = overtimes.filter(overtime =>
    overtime.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    overtime.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    overtime.receivedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      setIsLoading(true);
      try {
        const now = new Date().toISOString();
        const currentUser = user?.name || 'Unknown';
        const existingOvertime = overtimes.find(o => o.id === editingId);
        const newRemarksHistory = [
          ...(existingOvertime?.remarksHistory || []),
          {
            remarks: formData.remarks,
            status: 'Edited',
            timestamp: now,
            updatedBy: currentUser
          }
        ];
        const updateData = {
          ...formData,
          remarks: formData.remarks || '',
          remarksHistory: newRemarksHistory,
          updatedAt: now
        };
        await overtimeService.updateOvertime(editingId, updateData);
        setSuccess('Overtime updated successfully');
        setEditingId(null);

        const updatedOvertimes = overtimes.map(o => o.id === editingId ? { ...o, ...updateData } : o);
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
          remarks: '',
          remarksHistory: []
        });
        setIsDialogOpen(false);
        setSuccessModalOpen(true);
      } catch (err) {
        console.error('Failed to update overtime:', err);
        setSuccess('Error updating overtime');
        setSuccessModalOpen(true);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newOvertime = {
        trackingId: generateTrackingId(),
        receivedBy: currentUser,
        ...formData,
        remarks: formData.remarks || 'Overtime request created',
        remarksHistory: [{
          remarks: formData.remarks || 'Overtime request created',
          status: 'Pending',
          timestamp: now,
          updatedBy: currentUser
        }],
        status: 'Pending',
        createdAt: now,
        updatedAt: now
      };
      const result = await overtimeService.addOvertime(newOvertime);
      setSuccess('Overtime added successfully');
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
        remarks: '',
        remarksHistory: []
      });
      setIsDialogOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save overtime:', err);
      setSuccess('Error saving overtime');
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
        inclusiveDateStart: overtime.inclusiveDateStart || '',
        inclusiveDateEnd: overtime.inclusiveDateEnd || '',
        inclusiveTimeStart: overtime.inclusiveTimeStart || '',
        inclusiveTimeEnd: overtime.inclusiveTimeEnd || '',
        purpose: overtime.purpose,
        placeOfAssignment: overtime.placeOfAssignment,
        remarks: overtime.remarks || '',
        remarksHistory: overtime.remarksHistory || []
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
        remarks: '',
        remarksHistory: []
      });
    }
  };

  const handleTimeOut = (id: string) => {
    setOvertimeToTimeOut(id);
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
    setRejectData({ remarks: '' });
    setDeleteConfirmOpen(true);
  };

  const confirmRejectOvertime = async () => {
    if (!overtimeToDelete) return;

    if (!rejectData.remarks.trim()) {
      setSuccess('Error: Rejection remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const overtime = overtimes.find(o => o.id === overtimeToDelete);
      if (!overtime) return;
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = rejectData.remarks;
      const updatedRemarksHistory = [
        ...(overtime.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Rejected',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      
      await overtimeService.updateOvertime(overtimeToDelete, { status: 'Rejected', remarks: newRemarks, remarksHistory: updatedRemarksHistory, updatedAt: now });
      const updatedOvertimes = overtimes.map(o => o.id === overtimeToDelete ? { ...o, status: 'Rejected', remarks: newRemarks, remarksHistory: updatedRemarksHistory, updatedAt: now } : o);
      setOvertimes(updatedOvertimes);
      setSuccess('Overtime request rejected successfully');
      setOvertimeToDelete(null);
      setRejectData({ remarks: '' });
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

    if (!timeOutData.timeOutRemarks.trim()) {
      setSuccess('Error: Time out remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      // Verify the document exists before attempting to update
      const currentOvertimes = await overtimeService.getOvertimes();
      const overtimeExists = currentOvertimes.some((o: any) => o.id === overtimeToTimeOut);
      
      if (!overtimeExists) {
        throw new Error('Overtime record not found. It may have been deleted or the data is out of sync.');
      }

      const overtime = overtimes.find(o => o.id === overtimeToTimeOut);
      if (!overtime) return;
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = timeOutData.timeOutRemarks;
      const updatedRemarksHistory = [
        ...(overtime.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Completed',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      
      await overtimeService.updateOvertime(overtimeToTimeOut, {
        dateTimeOut: timeOutData.dateTimeOut,
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        timeOutRemarks: newRemarks,
        status: 'Completed',
        updatedAt: now
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
      <div className="hidden md:block bg-white border-r border-gray-200 shadow-sm">
        <Sidebar recordTypes={recordTypes} onNavigate={undefined} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Request for Overtime Records</h1>
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
                <h2 className="text-xl font-bold text-gray-900">Overtime Requests</h2>
                <p className="text-sm text-gray-600">Manage and view all overtime request records</p>
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
                        inclusiveDateStart: '',
                        inclusiveDateEnd: '',
                        inclusiveTimeStart: '',
                        inclusiveTimeEnd: '',
                        purpose: '',
                        placeOfAssignment: '',
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
                    <DialogTitle>{editingId ? 'Edit' : 'Add New'} Overtime Request</DialogTitle>
                    <DialogDescription>
                      Fill in the form to {editingId ? 'update' : 'add'} an overtime request
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="trackingId">Tracking ID</Label>
                      <Input
                        id="trackingId"
                        value={editingId ? overtimes.find((r: any) => r.id === editingId)?.trackingId || '' : generateTrackingId()}
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
                        <Label htmlFor="placeOfAssignment">Place of Assignment *</Label>
                        <Input
                          id="placeOfAssignment"
                          name="placeOfAssignment"
                          placeholder="Enter place of assignment"
                          value={formData.placeOfAssignment}
                          onChange={handleInputChange}
                          required
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
                      <Label htmlFor="purpose">Purpose *</Label>
                      <Input
                        id="purpose"
                        name="purpose"
                        placeholder="Enter purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="remarks">Remarks</Label>
                      <Input
                        id="remarks"
                        name="remarks"
                        placeholder="Enter remarks"
                        value={formData.remarks}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddOvertime}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? 'Saving...' : editingId ? 'Update Overtime' : 'Add Overtime'}
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
                    <TableHead className="font-semibold py-1 px-1 text-center text-xs">Received By</TableHead>
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
                  {filteredOvertimes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-4 text-gray-500 text-xs wrap-break-word whitespace-normal">
                        {overtimes.length === 0 ? 'No overtime requests found. Click "Add Overtime Request" to create one.' : 'No overtime requests match your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOvertimes.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{item.receivedBy || '-'}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center font-bold italic text-indigo-600 wrap-break-word whitespace-normal">{item.trackingId}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{formatDateTimeWithoutSeconds(item.dateTimeIn)}</TableCell>
                        <TableCell className={`text-xs py-1 px-1 text-center wrap-break-word whitespace-normal ${item.status === 'Completed' ? 'text-green-600 font-medium' : 'text-red-600'}`}>{item.dateTimeOut ? formatDateTimeWithoutSeconds(item.dateTimeOut) : '-'}</TableCell>
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
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell 
                          className="py-1 px-1 text-center wrap-break-word whitespace-normal text-xs cursor-pointer hover:bg-gray-50"
                          onClick={() => viewRemarksHistory(item)}
                        >
                          {item.remarks ? (
                            <div className="space-y-1 relative">
                              {item.status === 'Pending' && item.remarksHistory?.some(h => h.status === 'Edited') && (
                                <span className="absolute -top-2 -right-1 bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded-full">
                                  Edited
                                </span>
                              )}
                              <div className="text-black">
                                {item.remarksHistory?.length > 0 ? item.remarksHistory[0].remarks : item.remarks}
                              </div>
                              {item.remarksHistory?.length > 0 && (
                                <div className={`${item.status === 'Completed' ? 'text-green-600' : item.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                                  {item.remarksHistory[0]?.timestamp && item.status !== 'Completed' && item.status !== 'Pending' && (
                                    <span>[{formatDateTimeWithoutSeconds(item.remarksHistory[0].timestamp)}] </span>
                                  )}
                                  [{item.status} by {item.receivedBy}]
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
                            onView={() => handleViewOvertime(item.id)}
                            onEdit={() => handleEditOvertime(item.id)}
                            onTimeOut={() => handleTimeOut(item.id)}
                            onReject={() => handleRejectOvertime(item.id)}
                            hidden={item.status === 'Rejected'}
                            canEdit={user?.role === 'admin' || (!!item.dateTimeOut === false && item.status === 'Pending')}
                            canReject={user?.role === 'admin' || (!!item.dateTimeOut === false && item.status === 'Pending')}
                            showTimeOut={!item.dateTimeOut}
                            showEdit={item.status !== 'Completed'}
                            showReject={item.status !== 'Completed'}
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">Confirm Reject</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject this overtime request? The status will be changed to "Rejected".
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
                setOvertimeToDelete(null);
                setRejectData({ remarks: '' });
              }}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRejectOvertime}
              className="px-6 bg-red-600 hover:bg-red-700 text-white"
            >
              Reject
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
          setOvertimeToTimeOut(null);
        }}
        dateTimeOut={timeOutData.dateTimeOut}
        onDateTimeOutChange={(value) => setTimeOutData({ ...timeOutData, dateTimeOut: value })}
        remarks={timeOutData.timeOutRemarks}
        onRemarksChange={(value) => setTimeOutData({ ...timeOutData, timeOutRemarks: value })}
        isLoading={isLoading}
      />

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
              <div>
                <p className="text-gray-600 font-medium">Received By</p>
                <p className="text-gray-900">{selectedOvertime.receivedBy || '-'}</p>
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
                <p className="text-gray-900">{formatDateTimeWithoutSeconds(selectedOvertime.dateTimeIn)}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Date/Time OUT</p>
                <p className="text-gray-900">{selectedOvertime.dateTimeOut ? formatDateTimeWithoutSeconds(selectedOvertime.dateTimeOut) : '-'}</p>
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-600 font-medium">Inclusive Date Start</p>
                  <p className="text-gray-900">{selectedOvertime.inclusiveDateStart || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Inclusive Date End</p>
                  <p className="text-gray-900">{selectedOvertime.inclusiveDateEnd || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-600 font-medium">Inclusive Time Start</p>
                  <p className="text-gray-900">{selectedOvertime.inclusiveTimeStart || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Inclusive Time End</p>
                  <p className="text-gray-900">{selectedOvertime.inclusiveTimeEnd || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Remarks</p>
                <p className="text-gray-900">{selectedOvertime.remarks || selectedOvertime.timeOutRemarks || '-'}</p>
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

