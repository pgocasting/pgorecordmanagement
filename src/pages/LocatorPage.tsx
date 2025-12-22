import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { locatorService, designationService } from '@/services/firebaseService';

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
import { Plus, Menu, LogOut, Search } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ActionButtons } from '@/components/ActionButtons';
import SuccessModal from '@/components/SuccessModal';
import TimeOutModal from '@/components/TimeOutModal';

interface Locator {
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

export default function LocatorPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [locators, setLocators] = useState<Locator[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [locatorToDelete, setLocatorToDelete] = useState<string | null>(null);
  const [rejectData, setRejectData] = useState({
    remarks: '',
  });
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeOutConfirmOpen, setTimeOutConfirmOpen] = useState(false);
  const [locatorToTimeOut, setLocatorToTimeOut] = useState<string | null>(null);
  const [timeOutData, setTimeOutData] = useState({
    dateTimeOut: '',
    timeOutRemarks: '',
  });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLocator, setSelectedLocator] = useState<Locator | null>(null);

  const [remarksHistoryOpen, setRemarksHistoryOpen] = useState(false);
  const [currentRemarksHistory, setCurrentRemarksHistory] = useState<Array<{
    remarks: string;
    status: string;
    timestamp: string;
    updatedBy: string;
  }>>([]);

  // Form states
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
    receivedBy: '',
    remarks: '',
    remarksHistory: [] as Array<{
      remarks: string;
      status: string;
      timestamp: string;
      updatedBy: string;
    }>
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

  // Load locators from Firestore on mount
  useEffect(() => {
    const loadLocators = async () => {
      try {
        console.log('📂 Loading locators from Firestore...');
        const data = await locatorService.getLocators();
        console.log(`✅ Locators loaded: ${data.length} records`);
        setLocators(data as Locator[]);
      } catch (error) {
        console.error('❌ Error loading locators:', error);
        setSuccess('Error loading locators. Please try again.');
        setSuccessModalOpen(true);
      }
    };
    
    loadLocators();
    const interval = setInterval(loadLocators, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredLocators = locators.filter(locator =>
    locator.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locator.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locator.receivedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateTrackingId = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const count = String(locators.length + 1).padStart(3, '0');
    return `(LOC) ${year}/${month}/${day}-${count}`;
  };

  const viewRemarksHistory = (locator: Locator) => {
    setCurrentRemarksHistory(locator.remarksHistory || []);
    setRemarksHistoryOpen(true);
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

  const handleAddLocator = async () => {
    setSuccess('');

    if (
      !formData.dateTimeIn ||
      !formData.fullName ||
      !formData.designation ||
      !formData.inclusiveDateStart ||
      !formData.inclusiveDateEnd ||
      !formData.placeOfAssignment
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
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newLocator = {
        trackingId: generateTrackingId(),
        status: 'Pending',
        timeOutRemarks: '',
        ...formData,
        receivedBy: formData.receivedBy || currentUser,
        remarks: formData.remarks || 'Locator record created',
        remarksHistory: [{
          remarks: formData.remarks || 'Locator record created',
          status: 'Pending',
          timestamp: now,
          updatedBy: currentUser
        }],
        createdAt: now,
        updatedAt: now
      };
      const result = await locatorService.addLocator(newLocator);
      setSuccess('Locator added successfully');

      setLocators([result as Locator, ...locators]);

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
        receivedBy: '',
        remarks: '',
        remarksHistory: []
      });
      setIsDialogOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save locator:', err);
      setSuccess('Error saving locator');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmEditLocator = async () => {
    if (!editingId) return;

    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const existingLocator = locators.find(l => l.id === editingId);
      
      const newRemarksHistory = [
        ...(existingLocator?.remarksHistory || []),
        {
          remarks: formData.remarks,
          status: 'Edited',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      
      const updateData = {
        ...formData,
        remarksHistory: newRemarksHistory,
        updatedAt: now
      };
      
      await locatorService.updateLocator(editingId, updateData);
      setSuccess('Locator updated successfully');
      setEditingId(null);

      const updatedLocators = locators.map(l => 
        l.id === editingId 
          ? { 
              ...l, 
              ...updateData
            } 
          : l
      );
      setLocators(updatedLocators);

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
        receivedBy: '',
        remarks: '',
        remarksHistory: []
      });
      setIsDialogOpen(false);
      setEditConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save locator:', err);
      setSuccess('Error updating locator');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLocator = (id: string) => {
    const locator = locators.find((item) => item.id === id);
    if (locator) {
      setFormData({
        dateTimeIn: locator.dateTimeIn,
        dateTimeOut: locator.dateTimeOut || '',
        fullName: locator.fullName,
        designation: locator.designation,
        inclusiveDateStart: locator.inclusiveDateStart || '',
        inclusiveDateEnd: locator.inclusiveDateEnd || '',
        inclusiveTimeStart: locator.inclusiveTimeStart || '',
        inclusiveTimeEnd: locator.inclusiveTimeEnd || '',
        purpose: locator.purpose,
        placeOfAssignment: locator.placeOfAssignment,
        receivedBy: locator.receivedBy || '',
        remarks: locator.remarks || '',
        remarksHistory: locator.remarksHistory || []
      });
      setEditingId(id);
      setIsDialogOpen(true);
    }
  };

  const handleRejectLocator = (id: string) => {
    setLocatorToDelete(id);
    setRejectData({ remarks: '' });
    setDeleteConfirmOpen(true);
  };

  const confirmRejectLocator = async () => {
    if (!locatorToDelete) return;
    
    if (!rejectData.remarks.trim()) {
      setSuccess('Error: Rejection remarks are required');
      setSuccessModalOpen(true);
      return;
    }
    
    try {
      const locator = locators.find(l => l.id === locatorToDelete);
      if (!locator) return;
      
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = rejectData.remarks;
      
      const updatedRemarksHistory = [
        ...(locator.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Rejected',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      
      await locatorService.updateLocator(locatorToDelete, { 
        status: 'Rejected', 
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        updatedAt: now
      });
      
      const updatedLocators = locators.map(l => 
        l.id === locatorToDelete 
          ? { 
              ...l, 
              status: 'Rejected', 
              remarks: newRemarks,
              remarksHistory: updatedRemarksHistory,
              updatedAt: now
            } 
          : l
      );
      setLocators(updatedLocators);
      setSuccess('Locator rejected successfully');
      setDeleteConfirmOpen(false);
      setLocatorToDelete(null);
      setRejectData({ remarks: '' });
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to reject locator:', err);
      setSuccess('Error rejecting locator');
      setSuccessModalOpen(true);
    }
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
        designation: '',
        inclusiveDateStart: '',
        inclusiveDateEnd: '',
        inclusiveTimeStart: '',
        inclusiveTimeEnd: '',
        purpose: '',
        placeOfAssignment: '',
        receivedBy: '',
        remarks: '',
        remarksHistory: []
      });
    }
  };

  const handleTimeOut = (id: string) => {
    setLocatorToTimeOut(id);
    setTimeOutData({
      dateTimeOut: '',
      timeOutRemarks: '',
    });
    setTimeOutConfirmOpen(true);
  };

  const handleViewLocator = (id: string) => {
    const locator = locators.find((item) => item.id === id);
    if (locator) {
      setSelectedLocator(locator);
      setViewModalOpen(true);
    }
  };

  const confirmTimeOut = async () => {
    if (!locatorToTimeOut || !timeOutData.dateTimeOut) return;

    if (!timeOutData.timeOutRemarks.trim()) {
      setSuccess('Error: Time out remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      // Verify the document exists before attempting to update
      const currentLocators = await locatorService.getLocators();
      const locatorExists = currentLocators.some((l: any) => l.id === locatorToTimeOut);
      
      if (!locatorExists) {
        throw new Error('Locator record not found. It may have been deleted or the data is out of sync.');
      }

      const locator = locators.find(l => l.id === locatorToTimeOut);
      if (!locator) return;
      
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = timeOutData.timeOutRemarks;
      
      const updatedRemarksHistory = [
        ...(locator.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Completed',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      
      await locatorService.updateLocator(locatorToTimeOut, {
        dateTimeOut: timeOutData.dateTimeOut,
        status: 'Completed',
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        timeOutRemarks: newRemarks,
        updatedAt: now
      });
      
      // Reload from Firestore
      const updatedLocators = await locatorService.getLocators();
      setLocators(updatedLocators as Locator[]);
      
      setSuccess('Time out recorded successfully');
      setTimeOutConfirmOpen(false);
      setLocatorToTimeOut(null);
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
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Locator Records</h1>
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
                <h2 className="text-xl font-bold text-gray-900">Locators</h2>
                <p className="text-sm text-gray-600">Manage and view all locator records</p>
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
                          receivedBy: '',
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
                    <DialogTitle>{editingId ? 'Edit' : 'Add New'} Locator</DialogTitle>
                    <DialogDescription>
                      Fill in the form to {editingId ? 'update' : 'add'} a locator record
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="trackingId">Tracking ID</Label>
                      <Input
                        id="trackingId"
                        value={editingId ? locators.find(l => l.id === editingId)?.trackingId || '' : generateTrackingId()}
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
                      <Label htmlFor="purpose">Purpose</Label>
                      <Input
                        id="purpose"
                        name="purpose"
                        placeholder="Enter purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
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
                    onClick={handleAddLocator}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? 'Saving...' : editingId ? 'Update Locator' : 'Add Locator'}
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
                  {filteredLocators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-4 text-gray-500 text-xs wrap-break-word whitespace-normal">
                        {locators.length === 0 ? 'No locators found. Click "Add Locator" to create one.' : 'No locators match your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLocators.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{item.receivedBy || '-'}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center font-bold italic text-indigo-600 wrap-break-word whitespace-normal">{item.trackingId}</TableCell>
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">{new Date(item.dateTimeIn).toLocaleString()}</TableCell>
                        <TableCell className={`text-xs py-1 px-1 text-center wrap-break-word whitespace-normal ${item.status === 'Completed' ? 'text-green-600 font-medium' : 'text-red-600'}`}>{item.dateTimeOut ? new Date(item.dateTimeOut).toLocaleString() : '-'}</TableCell>
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
                        <TableCell 
                          className="wrap-break-word whitespace-normal text-xs cursor-pointer hover:bg-gray-50"
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
                                {item.remarks}
                              </div>
                              {item.remarksHistory?.length > 0 && (
                                <div className={`${item.status === 'Completed' ? 'text-green-600' : item.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                                  {item.remarksHistory[0]?.timestamp && item.status !== 'Completed' && item.status !== 'Pending' && (
                                    <span>[{new Date(item.remarksHistory[0].timestamp).toLocaleString()}] </span>
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
                        <TableCell className="text-xs py-1 px-1 text-center wrap-break-word whitespace-normal">
                          <ActionButtons
                            onView={() => handleViewLocator(item.id)}
                            onEdit={() => handleEditLocator(item.id)}
                            onTimeOut={() => handleTimeOut(item.id)}
                            onReject={() => handleRejectLocator(item.id)}
                            hidden={item.status === 'Rejected'}
                            canEdit={item.status !== 'Rejected'}
                            canReject={item.status !== 'Rejected'}
                            showTimeOut={item.status !== 'Completed' && item.status !== 'Rejected'}
                            showEdit={item.status !== 'Completed'}
                            showReject={item.status !== 'Completed'}
                            editDisabledReason={item.status === 'Rejected' ? 'Cannot edit rejected records' : undefined}
                            rejectDisabledReason={item.status === 'Rejected' ? 'Record already rejected' : (user?.role !== 'admin' && (!!item.dateTimeOut || item.status !== 'Pending') ? 'Users can only reject pending records' : undefined)}
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
            Are you sure you want to update this locator record? This action cannot be undone.
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
              onClick={confirmEditLocator}
              disabled={isLoading}
              className="px-6 bg-amber-600 hover:bg-amber-700 text-white"
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
          setLocatorToTimeOut(null);
        }}
        dateTimeOut={timeOutData.dateTimeOut}
        onDateTimeOutChange={(value) => setTimeOutData({ ...timeOutData, dateTimeOut: value })}
        remarks={timeOutData.timeOutRemarks}
        onRemarksChange={(value) => setTimeOutData({ ...timeOutData, timeOutRemarks: value })}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">Confirm Reject</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject this locator? The status will be changed to "Rejected".
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
                setLocatorToDelete(null);
                setRejectData({ remarks: '' });
              }}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRejectLocator}
              className="px-6 bg-red-600 hover:bg-red-700 text-white"
            >
              Reject
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

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Locator Details</DialogTitle>
          </DialogHeader>
          {selectedLocator && (
            <div className="space-y-6">
              {/* Header Row - Tracking ID, Status, Date/Time IN */}
              <div className="grid grid-cols-3 gap-6 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tracking ID</p>
                  <p className="text-lg font-bold text-indigo-600 mt-1">{selectedLocator.trackingId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</p>
                  <p className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedLocator.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      selectedLocator.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedLocator.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedLocator.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date/Time In</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{new Date(selectedLocator.dateTimeIn).toLocaleString()}</p>
                </div>
              </div>

              {/* Received By */}
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Received By</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedLocator.receivedBy || '-'}</p>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Full Name</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLocator.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Designation</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLocator.designation}</p>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Duration</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Inclusive Date Start</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLocator.inclusiveDateStart}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Inclusive Date End</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLocator.inclusiveDateEnd}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Inclusive Time Start</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLocator.inclusiveTimeStart || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Inclusive Time End</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLocator.inclusiveTimeEnd || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Date/Time Out */}
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Date/Time Out</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLocator.dateTimeOut ? new Date(selectedLocator.dateTimeOut).toLocaleString() : '-'}</p>
              </div>

              {/* Assignment Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Assignment Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Purpose</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLocator.purpose}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Place of Assignment</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLocator.placeOfAssignment}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Remarks</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLocator.remarks || '-'}</p>
                  </div>
                  {selectedLocator.timeOutRemarks && (
                    <div>
                      <p className="text-xs font-semibold text-blue-600 uppercase">Time Out Remarks</p>
                      <p className="text-sm font-semibold text-blue-900 mt-1">{selectedLocator.timeOutRemarks}</p>
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

