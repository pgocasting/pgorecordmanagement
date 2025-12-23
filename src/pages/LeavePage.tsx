import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { leaveService, designationService } from '@/services/firebaseService';

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, Menu, LogOut, Search, User } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import SuccessModal from '@/components/SuccessModal';
import TimeOutModal from '@/components/TimeOutModal';

interface Leave {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designation: string;
  leaveType: string;
  inclusiveDateStart: string;
  inclusiveDateEnd: string;
  purpose: string;
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

export default function LeavePage() {
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

  // Helper function to get acronym from designation
  const getDesignationAcronym = (designation: string): string => {
    const acronymMap: { [key: string]: string } = {
      'Office of the Provincial Governor (PGO)': 'PGO',
      'Office of the Vice Governor (OVG)': 'OVG',
      "Provincial Administrator's Office (PAO)": 'PAO',
      'Provincial Legal Office (PLO)': 'PLO',
      'Provincial Treasury Office (PTO)': 'PTO',
      'Provincial Accounting Office (PAccO)': 'PAccO',
      'Provincial Budget Office (PBO)': 'PBO',
      "Provincial Assessor's Office (PAO)": 'PAO',
      'Provincial Engineer\'s Office (PEO)': 'PEO',
      'Provincial Health Office (PHO)': 'PHO',
      'Provincial Social Welfare and Development Office (PSWDO)': 'PSWDO',
      'Provincial Agriculture Office (PAgrO)': 'PAgrO',
      'Provincial Veterinary Office (PVO)': 'PVO',
      'Provincial Environment and Natural Resources Office (PENRO)': 'PENRO',
      'Provincial Planning and Development Office (PPDO)': 'PPDO',
      'Provincial Human Resource Management Office (PHRMO)': 'PHRMO',
      'Provincial General Services Office (PGSO)': 'PGSO',
      'Provincial Information and Communications Technology Office (PICTO)': 'PICTO',
      'Provincial Disaster Risk Reduction and Management Office (PDRRMO)': 'PDRRMO',
      'Provincial Tourism Office (PTO)': 'PTO',
      'Provincial Youth, Sports, and Development Office (PYSDO)': 'PYSDO',
      'Sangguniang Panlalawigan Secretariat (SPS)': 'SPS',
      'Admin': 'Admin',
      'Manager': 'Manager',
      'Staff': 'Staff',
      'Officer': 'Officer'
    };
    
    // If the full designation is in the map, return its acronym
    if (acronymMap[designation]) {
      return acronymMap[designation];
    }
    
    // If it's already an acronym, return as is
    const acronyms = Object.values(acronymMap);
    if (acronyms.includes(designation)) {
      return designation;
    }
    
    // Extract acronym from parentheses if present
    const match = designation.match(/\(([^)]+)\)/);
    if (match) {
      return match[1];
    }
    
    // Default: return first letters of words (max 4 chars)
    const words = designation.split(' ');
    const acronym = words.slice(0, 4).map(word => word.charAt(0)).join('').toUpperCase();
    return acronym;
  };

  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [timeOutConfirmOpen, setTimeOutConfirmOpen] = useState(false);
  const [leaveToTimeOut, setLeaveToTimeOut] = useState<string | null>(null);
  const [timeOutData, setTimeOutData] = useState({
    dateTimeOut: '',
    timeOutRemarks: '',
  });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
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

  const [designationOptions, setDesignationOptions] = useState<string[]>([]);
  const [designationDropdownOpen, setDesignationDropdownOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    dateTimeIn: '',
    dateTimeOut: '',
    fullName: '',
    designation: '',
    leaveType: '',
    inclusiveDateStart: '',
    inclusiveDateEnd: '',
    purpose: '',
    status: '',
    remarks: '',
    remarksHistory: [] as Array<{
      remarks: string;
      status: string;
      timestamp: string;
      updatedBy: string;
    }>
  });

  useEffect(() => {
    const loadDesignations = async () => {
      try {
        const designations = await designationService.getDesignations();
        setDesignationOptions(designations);
      } catch (error) {
        console.error('Error loading designations:', error);
        setDesignationOptions([
          'Office of the Provincial Governor (PGO)',
          'Office of the Vice Governor (OVG)',
          'Provincial Administrator\'s Office (PAO)',
          'Provincial Legal Office (PLO)',
          'Provincial Treasury Office (PTO)',
          'Provincial Accounting Office (PAccO)',
          'Provincial Budget Office (PBO)',
          'Provincial Assessor\'s Office (PAO)',
          'Provincial Engineer\'s Office (PEO)',
          'Provincial Health Office (PHO)',
          'Provincial Social Welfare and Development Office (PSWDO)',
          'Provincial Agriculture Office (PAgrO)',
          'Provincial Veterinary Office (PVO)',
          'Provincial Environment and Natural Resources Office (PENRO)',
          'Provincial Planning and Development Office (PPDO)',
          'Provincial Human Resource Management Office (PHRMO)',
          'Provincial General Services Office (PGSO)',
          'Provincial Information and Communications Technology Office (PICTO)',
          'Provincial Disaster Risk Reduction and Management Office (PDRRMO)',
          'Provincial Tourism Office (PTO)',
          'Provincial Youth, Sports, and Development Office (PYSDO)',
          'Sangguniang Panlalawigan Secretariat (SPS)',
          'Admin',
          'Manager',
          'Staff',
          'Officer'
        ]);
      }
    };
    loadDesignations();
  }, []);

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

  const leaveTypeOptions = [
    'Vacation Leave',
    'Sick Leave',
    'Emergency Leave',
    'Maternity Leave',
    'Paternity Leave',
    'Study Leave',
    'Bereavement Leave',
    'Other',
  ];

  // Load leaves from Firestore on mount
  useEffect(() => {
    const loadLeaves = async () => {
      try {
        console.log('📂 Loading leaves from Firestore...');
        const data = await leaveService.getLeaves();
        console.log(`✅ Leaves loaded: ${data.length} records`);
        setLeaves(data as Leave[]);
      } catch (error) {
        console.error('❌ Error loading leaves:', error);
        setSuccess('Error loading leaves. Please try again.');
        setSuccessModalOpen(true);
      }
    };
    
    // Load data immediately
    loadLeaves();
    
    // Reload data every 30 seconds to ensure sync
    const interval = setInterval(loadLeaves, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredLeaves = leaves.filter(leave =>
    leave.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.receivedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateTrackingId = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const count = String(leaves.length + 1).padStart(3, '0');
    return `(LV) ${year}/${month}/${day}-${count}`;
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

  const viewRemarksHistory = (leave: Leave) => {
    setCurrentRemarksHistory(leave.remarksHistory || []);
    setRemarksHistoryOpen(true);
  };

  const handleAddLeave = async () => {
    setSuccess('');

    if (
      !formData.dateTimeIn ||
      !formData.fullName ||
      !formData.designation ||
      !formData.leaveType ||
      !formData.inclusiveDateStart ||
      !formData.inclusiveDateEnd
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
      const newLeave = {
        trackingId: generateTrackingId(),
        receivedBy: currentUser,
        ...formData,
        status: 'Pending',
        remarks: formData.remarks || 'Leave record created',
        remarksHistory: [{
          remarks: formData.remarks || 'Leave record created',
          status: 'Pending',
          timestamp: now,
          updatedBy: currentUser
        }],
        timeOutRemarks: '',
        createdAt: now,
        updatedAt: now
      };
      const result = await leaveService.addLeave(newLeave);
      console.log('Leave added successfully with ID:', result);
      setSuccess('Leave record added successfully');

      setLeaves([result as Leave, ...leaves]);

      setFormData({
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        designation: '',
        leaveType: '',
        inclusiveDateStart: '',
        inclusiveDateEnd: '',
        purpose: '',
        status: '',
        remarks: '',
        remarksHistory: []
      });
      setIsDialogOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save leave:', err);
      console.error('Error details:', (err as any).code, (err as any).message);
      setSuccess(`Error saving leave record: ${(err as any).message || 'Unknown error'}`);
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmEditLeave = async () => {
    if (!editingId) return;

    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const existingLeave = leaves.find(l => l.id === editingId);
      
      const newRemarksHistory = [
        ...(existingLeave?.remarksHistory || []),
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
      
      await leaveService.updateLeave(editingId, updateData);
      setSuccess('Leave record updated successfully');
      setEditingId(null);

      const updatedLeaves = leaves.map(l => 
        l.id === editingId 
          ? { 
              ...l, 
              ...formData,
              remarksHistory: newRemarksHistory,
              updatedAt: now
            } 
          : l
      );
      setLeaves(updatedLeaves);

      setFormData({
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        designation: '',
        leaveType: '',
        inclusiveDateStart: '',
        inclusiveDateEnd: '',
        purpose: '',
        status: '',
        remarks: '',
        remarksHistory: []
      });
      setIsDialogOpen(false);
      setEditConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to save leave:', err);
      setSuccess('Error updating leave record');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLeave = (id: string) => {
    const leave = leaves.find((item) => item.id === id);
    if (leave) {
      setFormData({
        dateTimeIn: leave.dateTimeIn,
        dateTimeOut: leave.dateTimeOut || '',
        fullName: leave.fullName,
        designation: leave.designation,
        leaveType: leave.leaveType,
        inclusiveDateStart: leave.inclusiveDateStart,
        inclusiveDateEnd: leave.inclusiveDateEnd,
        purpose: leave.purpose,
        status: leave.status || '',
        remarks: leave.remarks || '',
        remarksHistory: leave.remarksHistory || []
      });
      setEditingId(id);
      setIsDialogOpen(true);
    }
  };

  const handleRejectLeave = (id: string) => {
    setLeaveToDelete(id);
    setRejectData({ remarks: '' });
    setDeleteConfirmOpen(true);
  };

  const confirmRejectLeave = async () => {
    if (!leaveToDelete) return;

    if (!rejectData.remarks.trim()) {
      setSuccess('Error: Rejection remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    try {
      const leave = leaves.find(l => l.id === leaveToDelete);
      if (!leave) return;
      
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = rejectData.remarks;
      
      const updatedRemarksHistory = [
        ...(leave.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Rejected',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      
      await leaveService.updateLeave(leaveToDelete, { 
        status: 'Rejected', 
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        updatedAt: now
      });
      
      const updatedLeaves = leaves.map(l => 
        l.id === leaveToDelete 
          ? { 
              ...l, 
              status: 'Rejected', 
              remarks: newRemarks,
              remarksHistory: updatedRemarksHistory,
              updatedAt: now
            } 
          : l
      );
      setLeaves(updatedLeaves);
      setLeaveToDelete(null);
      setRejectData({ remarks: '' });
      setDeleteConfirmOpen(false);
      setSuccess('Leave rejected successfully');
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to reject leave:', err);
      setSuccess('Error rejecting leave record');
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
        leaveType: '',
        inclusiveDateStart: '',
        inclusiveDateEnd: '',
        purpose: '',
        status: '',
        remarks: '',
        remarksHistory: []
      });
    }
  };

  const handleTimeOut = (id: string) => {
    setLeaveToTimeOut(id);
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

  const handleViewLeave = (id: string) => {
    const leave = leaves.find((item) => item.id === id);
    if (leave) {
      setSelectedLeave(leave);
      setViewModalOpen(true);
    }
  };

  const confirmTimeOut = async () => {
    if (!leaveToTimeOut || !timeOutData.dateTimeOut) return;

    if (!timeOutData.timeOutRemarks.trim()) {
      setSuccess('Error: Time out remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const leave = leaves.find(l => l.id === leaveToTimeOut);
      if (!leave) return;
      
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const formattedDateTimeOut = formatDateTimeWithoutSeconds(timeOutData.dateTimeOut);
      const newRemarks = `${timeOutData.timeOutRemarks}\n\nTime Out: ${formattedDateTimeOut}`;
      
      console.log('Debug - Time Out Data:', timeOutData);
      console.log('Debug - Formatted DateTime Out:', formattedDateTimeOut);
      console.log('Debug - New Remarks:', newRemarks);
      
      const updatedRemarksHistory = [
        ...(leave.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Completed',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      
      const result = await leaveService.updateLeave(leaveToTimeOut, {
        dateTimeOut: timeOutData.dateTimeOut,
        status: 'Completed',
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        timeOutRemarks: newRemarks,
        updatedAt: now
      });
      
      if (!result) {
        throw new Error('Leave record not found. It may have been deleted or the data is out of sync.');
      }
      
      // Reload from Firestore
      const updatedLeaves = await leaveService.getLeaves();
      setLeaves(updatedLeaves as Leave[]);
      
      setSuccess('Time out recorded successfully');
      setTimeOutConfirmOpen(false);
      setLeaveToTimeOut(null);
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
    <div className="flex h-screen bg-background">
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
      <div className="hidden md:block bg-card border-r shadow-sm">
        <Sidebar recordTypes={recordTypes} onNavigate={undefined} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Leave Records</h1>
              <p className="text-sm text-muted-foreground">Welcome back</p>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex items-center gap-2">
              {user?.name && (
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg border">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize">{user.role}</p>
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 h-9"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-muted/30">
          <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Leaves</h2>
                <p className="text-sm text-muted-foreground">Manage and view all leave records</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
        leaveType: '',
        inclusiveDateStart: '',
        inclusiveDateEnd: '',
        purpose: '',
        status: 'Pending',
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
                    <DialogTitle>{editingId ? 'Edit' : 'Add New'} Leave</DialogTitle>
                    <DialogDescription>
                      Fill in the form to {editingId ? 'update' : 'add'} a leave record
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="trackingId">Tracking ID</Label>
                      <Input
                        id="trackingId"
                        value={editingId ? leaves.find(l => l.id === editingId)?.trackingId || '' : generateTrackingId()}
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
                        <Popover open={designationDropdownOpen} onOpenChange={setDesignationDropdownOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={designationDropdownOpen}
                              className="w-full justify-between truncate"
                            >
                              <span className="truncate flex-1 text-left">
                                {formData.designation || "Select office..."}
                              </span>
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search office..." />
                              <CommandList>
                                <CommandEmpty>No office found.</CommandEmpty>
                                <CommandGroup>
                                  {designationOptions.map((option) => (
                                    <CommandItem
                                      key={option}
                                      value={option}
                                      onSelect={(currentValue) => {
                                        handleSelectChange('designation', currentValue);
                                        setDesignationDropdownOpen(false);
                                      }}
                                    >
                                      {option}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="leaveType">Leave Type *</Label>
                        <Select value={formData.leaveType} onValueChange={(value) => handleSelectChange('leaveType', value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {leaveTypeOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purpose">Purpose</Label>
                      <Input
                        id="purpose"
                        name="purpose"
                        placeholder="Purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="remarks">Remarks</Label>
                      <Input
                        id="remarks"
                        name="remarks"
                        placeholder="Remarks"
                        value={formData.remarks}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddLeave}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? 'Saving...' : editingId ? 'Update Leave' : 'Add Leave'}
                  </Button>
                </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Received By</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Tracking ID</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Date/Time IN</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Date/Time OUT</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Full Name</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Designation</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Leave Type</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Dates</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Purpose</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Status</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Remarks</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaves.length === 0 ? (
                    <TableRow key="empty-state">
                      <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                        {leaves.length === 0 ? 'No leaves found. Click "Add Leave" to create one.' : 'No leaves match your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeaves.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-sm py-3 px-4 text-center">{item.receivedBy || '-'}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center font-bold text-primary">{item.trackingId}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">{formatDateTimeWithoutSeconds(item.dateTimeIn)}</TableCell>
                        <TableCell className={`text-sm py-3 px-4 text-center ${item.status === 'Completed' ? 'text-green-600 font-medium' : 'text-red-600'}`}>{item.dateTimeOut ? formatDateTimeWithoutSeconds(item.dateTimeOut) : '-'}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">{item.fullName}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">
                          <div className="group relative inline-block">
                            <span className="text-primary font-medium hover:underline cursor-default">
                              {getDesignationAcronym(item.designation)}
                            </span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              <div className="font-medium">{item.designation}</div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">{item.leaveType}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">{item.inclusiveDateStart} to {item.inclusiveDateEnd}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">{item.purpose}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">
                          <Badge 
                            variant={
                              item.status === 'Rejected' ? 'destructive' : 'secondary'
                            }
                            className={`${
                              item.status === 'Completed' || item.status === 'Approved' ? 
                              'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' : 
                              item.status === 'Pending' || (!item.status || item.status === 'Pending') ? 
                              'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200' : ''
                            }`}
                          >
                            {item.status || 'Pending'}
                          </Badge>
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
                                {item.remarksHistory?.length > 0 ? item.remarksHistory[0].remarks : item.remarks}
                              </div>
                              {item.remarksHistory?.length > 0 && (
                                <div className={`${item.status === 'Completed' ? 'text-green-600' : item.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                                  {item.remarksHistory[0]?.timestamp && item.status !== 'Completed' && item.status !== 'Pending' && (
                                    <span>[{formatDateTimeWithoutSeconds(item.remarksHistory[0].timestamp)}] </span>
                                  )}
                                  [{item.status === 'Pending' ? `${item.status} - Created by ${item.receivedBy}` : `${item.status} by ${item.receivedBy}`}]
                                </div>
                              )}
                              <div className="text-xs text-blue-600 mt-1">
                                Click to view full history
                              </div>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-sm py-3 px-4">
                          <div className="flex flex-col items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewLeave(item.id)}
                              className="h-8 w-16 text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                              View
                            </Button>
                            {item.status === 'Pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditLeave(item.id)}
                                  className="h-8 w-16 text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                              onClick={() => handleRejectLeave(item.id)}
                              className="h-8 w-16 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              Reject
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTimeOut(item.id)}
                              className="h-8 w-16 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                            >
                              Out
                            </Button>
                          </>
                        )}
                        {item.status === 'Approved' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditLeave(item.id)}
                              className="h-8 w-16 text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTimeOut(item.id)}
                              className="h-8 w-16 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                            >
                              Out
                            </Button>
                          </>
                        )}
                      </div>
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
            Are you sure you want to update this leave record? This action cannot be undone.
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
              onClick={confirmEditLeave}
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
              Enter the date/time out and any remarks for this leave record.
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
                setLeaveToTimeOut(null);
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

      {/* Reject Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">Confirm Reject</DialogTitle>
          <p className="text-sm text-gray-600 mt-4">
            Are you sure you want to reject this leave record? The status will be changed to "Rejected".
          </p>
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
                setLeaveToDelete(null);
                setRejectData({ remarks: '' });
              }}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRejectLeave}
              className="px-6 bg-red-600 hover:bg-red-700 text-white"
            >
              Reject
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
        <DialogContent className="w-[90vw] h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">Leave Details</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  View complete information about this leave record
                </DialogDescription>
              </div>
              {selectedLeave && (
                <Badge 
                  variant={
                    selectedLeave.status === 'Rejected' ? 'destructive' : 'secondary'
                  }
                  className={`${
                    selectedLeave.status === 'Completed' || selectedLeave.status === 'Approved' ? 
                    'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' : 
                    selectedLeave.status === 'Pending' || (!selectedLeave.status || selectedLeave.status === 'Pending') ? 
                    'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200' : ''
                  } px-3 py-1 shrink-0`}
                >
                  {selectedLeave.status || 'Pending'}
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          {/* Scrollable Content Area */}
          <div className="overflow-y-auto px-1 flex-1 min-h-0">
            {selectedLeave && (
              <div className="space-y-4">
                {/* Additional Information */}
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tracking ID</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedLeave.trackingId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Received By</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedLeave.receivedBy || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Date/Time In</p>
                        <p className="text-sm text-gray-900 mt-1">{formatDateTimeWithoutSeconds(selectedLeave.dateTimeIn)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Created Date</p>
                        <p className="text-sm text-gray-900 mt-1">{formatDateTimeWithoutSeconds(selectedLeave.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Full Name</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedLeave.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Designation</p>
                        <div className="mt-1">
                          <div className="group relative inline-block">
                            <span className="text-primary font-medium hover:underline cursor-default">
                              {getDesignationAcronym(selectedLeave.designation)}
                            </span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              <div className="font-medium">{selectedLeave.designation}</div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Leave Type</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedLeave.leaveType}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Status</p>
                        <div className="mt-1">
                          <Badge 
                            variant={
                              selectedLeave.status === 'Rejected' ? 'destructive' : 'secondary'
                            }
                            className={`${
                              selectedLeave.status === 'Completed' || selectedLeave.status === 'Approved' ? 
                              'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' : 
                              selectedLeave.status === 'Pending' || (!selectedLeave.status || selectedLeave.status === 'Pending') ? 
                              'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200' : ''
                            } text-xs`}
                          >
                            {selectedLeave.status || 'Pending'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Start Date</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedLeave.inclusiveDateStart || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">End Date</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedLeave.inclusiveDateEnd}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Purpose and Remarks */}
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Purpose Column */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Purpose</p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 px-3 py-2 rounded-md border border-gray-200 min-h-[100px]">
                          {selectedLeave.purpose || 'No purpose specified'}
                        </p>
                      </div>
                      
                      {/* Remarks Column */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Remarks</p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 px-3 py-2 rounded-md border border-gray-200 min-h-[100px]">
                          {selectedLeave.remarks || 'No remarks'}
                        </p>
                        {selectedLeave.timeOutRemarks && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-600 mb-2">Time Out Details</p>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Date/Time Out</p>
                                <p className="text-sm text-gray-900 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                  {selectedLeave.dateTimeOut ? formatDateTimeWithoutSeconds(selectedLeave.dateTimeOut) : '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Time Out Remarks</p>
                                <p className="text-sm text-gray-900 whitespace-pre-wrap bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                  {selectedLeave.timeOutRemarks}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          
          <DialogFooter className="pt-4 border-t border-gray-200 shrink-0">
            <Button
              variant="outline"
              onClick={() => setViewModalOpen(false)}
              className="px-6"
            >
              Close
            </Button>
          </DialogFooter>
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
          setLeaveToTimeOut(null);
          setTimeOutData({ dateTimeOut: '', timeOutRemarks: '' });
        }}
        dateTimeOut={timeOutData.dateTimeOut}
        onDateTimeOutChange={(value) => setTimeOutData({ ...timeOutData, dateTimeOut: value })}
        remarks={timeOutData.timeOutRemarks}
        onRemarksChange={(value) => setTimeOutData({ ...timeOutData, timeOutRemarks: value })}
        isLoading={isLoading}
      />

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

