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
  DialogFooter,
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
import {
  Plus,
  Menu,
  LogOut,
  Search,
  User,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Badge } from '@/components/ui/badge';
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
  recordType?: string;
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
  const [designationDropdownOpen, setDesignationDropdownOpen] = useState(false);

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
      timeOutRemarks: '' 
    });
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
        <div className="bg-card border-b pl-14 pr-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Other Records</h1>
              <p className="text-sm text-muted-foreground">Welcome back</p>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex flex-wrap items-center gap-2">
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
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-muted/30">
          <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Others</h2>
                <p className="text-sm text-muted-foreground">Manage and view all other records</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
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
                      className="gap-2 bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="designationOffice">Office *</Label>
                          <Popover open={designationDropdownOpen} onOpenChange={setDesignationDropdownOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={designationDropdownOpen}
                                className="w-full justify-between truncate"
                              >
                                <span className="truncate flex-1 text-left">
                                  {formData.designationOffice || "Select office..."}
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
                                          handleSelectChange('designationOffice', currentValue);
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="bg-card rounded-lg border shadow-md overflow-hidden">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Received By</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Tracking ID</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Date/Time IN</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Date/Time OUT</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Full Name</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Office</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Purpose</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Status</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Remarks</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-xs wrap-break-word whitespace-normal">
                        {records.length === 0 ? 'No records found. Click "Add Record" to create one.' : 'No records match your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell className="text-sm py-3 px-4 text-center">{record.receivedBy || '-'}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center font-bold text-primary">{record.trackingId}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">{formatDateTimeWithoutSeconds(record.dateTimeIn)}</TableCell>
                        <TableCell className={`text-sm py-3 px-4 text-center ${record.status === 'Completed' ? 'text-green-600 font-medium' : 'text-red-600'}`}>{record.dateTimeOut ? formatDateTimeWithoutSeconds(record.dateTimeOut) : '-'}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center uppercase">{record.fullName}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">
                          <div className="group relative inline-block">
                            <span className="text-primary font-medium hover:underline cursor-default">
                              {getDesignationAcronym(record.designationOffice)}
                            </span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              <div className="font-medium">{record.designationOffice}</div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center wrap-break-word whitespace-normal">{record.purpose}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">
                          <Badge 
                            variant={
                              record.status === 'Rejected' ? 'destructive' : 'secondary'
                            }
                            className={`${
                              record.status === 'Completed' ? 
                              'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' : 
                              record.status === 'Pending' || (!record.status || record.status === 'Pending') ? 
                              'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200' : ''
                            }`}
                          >
                            {record.status || 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell 
                          className="text-sm py-3 px-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => viewRemarksHistory(record)}
                        >
                          {record.remarks ? (
                            <div className="space-y-1 relative">
                              {record.status === 'Pending' && record.remarksHistory?.some(h => h.status === 'Edited') && (
                                <span className="absolute -top-2 -right-1 bg-yellow-50 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded-full">
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
                                  [{record.status === 'Pending' ? `${record.status} - Created by ${record.receivedBy}` : `${record.status} by ${record.receivedBy}`}]
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
                              onClick={() => handleViewRecord(record.id)}
                              className="h-8 w-16 text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                              View
                            </Button>
                            {record.status === 'Pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditRecord(record.id)}
                                  className="h-8 w-16 text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRecordToDelete(record.id);
                                    setRejectData({ remarks: '' });
                                    setDeleteConfirmOpen(true);
                                  }}
                                  className="h-8 w-16 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  Reject
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTimeOut(record.id)}
                                  className="h-8 w-16 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                                >
                                  Out
                                </Button>
                              </>
                            )}
                            {record.status === 'Approved' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditRecord(record.id)}
                                  className="h-8 w-16 text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTimeOut(record.id)}
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

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Other Records Details</DialogTitle>
            <DialogDescription>
              View complete information about this other record
            </DialogDescription>
          </DialogHeader>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            {selectedRecord && (
              <div className="space-y-4">
                {/* Personal Information */}
                <div className="bg-card border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase">Full Name</p>
                      <p className="text-sm font-semibold mt-1">{selectedRecord?.fullName || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase">Designation/Office</p>
                      <div className="mt-1">
                        <div className="group relative inline-block">
                          <span className="text-primary font-medium hover:underline cursor-default">
                            {getDesignationAcronym(selectedRecord?.designationOffice || '')}
                          </span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            <div className="font-medium">{selectedRecord?.designationOffice || ''}</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Record Details */}
                <div className="bg-card border rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase">Date/Time In</p>
                      <p className="text-sm font-semibold mt-1">{formatDateTimeWithoutSeconds(selectedRecord.dateTimeIn)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase">Date/Time Out</p>
                      <p className="text-sm font-semibold mt-1">{selectedRecord.dateTimeOut ? formatDateTimeWithoutSeconds(selectedRecord.dateTimeOut) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase">Record Type</p>
                      <p className="text-sm font-semibold mt-1">{selectedRecord?.recordType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase">Start Date</p>
                      <p className="text-sm font-semibold mt-1">{selectedRecord?.inclusiveDateStart || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase">End Date</p>
                      <p className="text-sm font-semibold mt-1">{selectedRecord?.inclusiveDateEnd || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase">Start Time</p>
                      <p className="text-sm font-semibold mt-1">{selectedRecord?.inclusiveTimeStart || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Purpose */}
                <div className="bg-card border rounded-lg p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide mb-3">Purpose</h3>
                  <p className="text-sm font-semibold whitespace-pre-wrap">{selectedRecord?.purpose || '-'}</p>
                </div>

                {/* Remarks */}
                <div className="bg-card border rounded-lg p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide mb-3">Remarks</h3>
                  <p className="text-sm font-semibold whitespace-pre-wrap">{selectedRecord?.remarks || '-'}</p>
                  {selectedRecord?.timeOutRemarks && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase">Date/Time Out</p>
                          <p className="text-sm font-semibold mt-1">{selectedRecord?.dateTimeOut ? formatDateTimeWithoutSeconds(selectedRecord.dateTimeOut) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase">Time Out Remarks</p>
                          <p className="text-sm font-semibold mt-1 whitespace-pre-wrap">{selectedRecord?.timeOutRemarks || ''}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
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
                          item.status === 'Completed' ? 'bg-green-50 text-green-700' :
                          item.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                          item.status === 'Edited' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-blue-50 text-blue-700'
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

