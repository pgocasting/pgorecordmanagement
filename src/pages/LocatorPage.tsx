import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { locatorService, designationService } from '@/services/firebaseService';
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
  Menu,
  Search,
  LogOut,
  Plus,
  MapPin
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/Sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import SuccessModal from '@/components/SuccessModal';
import TimeOutModal from '@/components/TimeOutModal';

const getCurrentDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getPhilippinesDateKey = (dateInput: Date | string): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const philippinesTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const year = philippinesTime.getFullYear();
  const month = String(philippinesTime.getMonth() + 1).padStart(2, '0');
  const day = String(philippinesTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
    const normalizedDesignation = (designation ?? '').trim();
    if (!normalizedDesignation) return 'N/A';
    if (normalizedDesignation.toUpperCase() === 'N/A') return 'N/A';
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
    if (acronymMap[normalizedDesignation]) {
      return acronymMap[normalizedDesignation];
    }
    
    // If it's already an acronym, return as is
    const acronyms = Object.values(acronymMap);
    if (acronyms.includes(normalizedDesignation)) {
      return normalizedDesignation;
    }
    
    // Extract acronym from parentheses if present
    const match = normalizedDesignation.match(/\(([^)]+)\)/);
    if (match) {
      return match[1];
    }
    
    // Default: return first letters of words (max 4 chars)
    const words = normalizedDesignation.split(' ');
    const acronym = words.slice(0, 4).map(word => word.charAt(0)).join('').toUpperCase();
    return acronym;
  };

  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [locators, setLocators] = useState<Locator[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed' | 'Rejected'>('Pending');
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
  const [returnConfirmOpen, setReturnConfirmOpen] = useState(false);
  const [locatorToReturn, setLocatorToReturn] = useState<string | null>(null);
  const [returnData, setReturnData] = useState({
    remarks: '',
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
    trackingId: '',
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

  const filteredLocators = locators
    .filter((locator) => {
      if ((locator.status || 'Pending') !== activeTab) return false;

      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;

      const designationAcronym = getDesignationAcronym(locator.designation || '');

      const searchableFields = [
        locator.trackingId,
        locator.fullName,
        locator.receivedBy,
        locator.designation,
        designationAcronym,
        locator.purpose,
        locator.placeOfAssignment,
        locator.remarks,
        locator.timeOutRemarks,
      ];

      return searchableFields
        .filter((v) => typeof v === 'string' && v.trim().length > 0)
        .some((v) => (v as string).toLowerCase().includes(term));
    })
    .sort((a, b) => (b.dateTimeIn || '').localeCompare(a.dateTimeIn || ''));

  const generateTrackingId = (): string => {
    const now = new Date();
    const philippinesTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const year = philippinesTime.getFullYear();
    const month = String(philippinesTime.getMonth() + 1).padStart(2, '0');
    const day = String(philippinesTime.getDate()).padStart(2, '0');

    const todayKey = getPhilippinesDateKey(philippinesTime);
    const todaysCount = locators.filter(r => r.dateTimeIn && getPhilippinesDateKey(r.dateTimeIn) === todayKey).length;
    const count = String(todaysCount + 1).padStart(3, '0');
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
      const { trackingId, ...restFormData } = formData;
      const newLocator = {
        ...restFormData,
        trackingId: trackingId || generateTrackingId(),
        status: 'Pending',
        timeOutRemarks: '',
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
        trackingId: '',
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
        trackingId: '',
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
        trackingId: locator.trackingId,
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
        trackingId: '',
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

  const handleViewLocator = (id: string) => {
    const locator = locators.find((item) => item.id === id);
    if (locator) {
      setSelectedLocator(locator);
      setViewModalOpen(true);
    }
  };

  const handleReturnLocator = (id: string) => {
    setLocatorToReturn(id);
    setReturnData({ remarks: '' });
    setReturnConfirmOpen(true);
  };

  const confirmReturnLocator = async () => {
    if (!locatorToReturn) return;

    if (!returnData.remarks.trim()) {
      setSuccess('Error: Return remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const locator = locators.find(l => l.id === locatorToReturn);
      if (!locator) return;
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = returnData.remarks;
      const updatedRemarksHistory = [
        ...(locator.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Returned',
          timestamp: now,
          updatedBy: currentUser
        }
      ];

      await locatorService.updateLocator(locatorToReturn, {
        status: 'Pending',
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        dateTimeOut: '',
        timeOutRemarks: ''
      });

      const updated = locators.map(l => l.id === locatorToReturn ? {
        ...l,
        status: 'Pending',
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        dateTimeOut: '',
        timeOutRemarks: ''
      } : l);
      setLocators(updated);
      setSuccess('Locator returned successfully');
      setLocatorToReturn(null);
      setReturnData({ remarks: '' });
      setReturnConfirmOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to return locator:', err);
      setSuccess('Error returning locator');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
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
        <div className="bg-white border-b shadow-sm pl-14 pr-4 sm:px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">Locator Records</h1>
                <p className="text-sm text-gray-500">Track employee locations and movements</p>
              </div>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex flex-wrap items-center gap-3">
              {user?.name && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <Avatar className="h-8 w-8 ring-2 ring-purple-100">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs font-semibold">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-10 px-4"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-gray-50">
          <div className="border-0 shadow-md rounded-lg bg-white overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Locators</h2>
                <p className="text-sm text-gray-500 mt-1">Manage and view all locator records</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search locators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button
                      className="gap-2 bg-purple-600 hover:bg-purple-700 w-full sm:w-auto h-10"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          trackingId: generateTrackingId(),
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
                        name="trackingId"
                        value={editingId ? formData.trackingId : generateTrackingId()}
                        onChange={handleInputChange}
                        disabled={!editingId || user?.role !== 'admin'}
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

      {/* Return Confirmation Modal */}
      <Dialog open={returnConfirmOpen} onOpenChange={setReturnConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return Locator</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Provide a reason for returning this locator record. The status will be set back to "Pending".</p>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="returnRemarks" className="text-sm font-medium text-gray-700">Return Remarks *</Label>
              <textarea
                id="returnRemarks"
                placeholder="Enter return remarks (required)"
                value={returnData.remarks}
                onChange={(e) => setReturnData({ remarks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setReturnConfirmOpen(false);
                setLocatorToReturn(null);
                setReturnData({ remarks: '' });
              }}
            >
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={confirmReturnLocator}>
              Return
            </Button>
          </div>
        </DialogContent>
      </Dialog>
              </div>
            </div>

            <div className="flex gap-2 mt-4 border-b border-gray-200 px-4 sm:px-6">
              <button
                onClick={() => setActiveTab('Pending')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'Pending'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({locators.filter(r => (r.status || 'Pending') === 'Pending').length})
              </button>
              <button
                onClick={() => setActiveTab('Completed')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'Completed'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed ({locators.filter(r => r.status === 'Completed').length})
              </button>
              <button
                onClick={() => setActiveTab('Rejected')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'Rejected'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Rejected ({locators.filter(r => r.status === 'Rejected').length})
              </button>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden flex-1 flex flex-col">
              <div className="flex-1 overflow-auto">
                <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 sticky top-0 z-10">
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Received / Created By</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Tracking ID</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs whitespace-normal wrap-break-word max-w-[120px]">Date/Time IN</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs whitespace-normal wrap-break-word max-w-[120px]">Date/Time OUT</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Full Name</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Designation</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs whitespace-normal wrap-break-word max-w-[240px]">Purpose</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Place of Assignment</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Status</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Remarks</TableHead>
                    <TableHead className="font-semibold py-3 px-4 text-center text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        {locators.length === 0 ? 'No locators found. Click "Add Locator" to create one.' : 'No locators match your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLocators.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-sm py-3 px-4 text-center">{item.receivedBy || '-'}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center font-bold text-primary">{item.trackingId}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center whitespace-normal wrap-break-word max-w-[120px]">{formatDateTimeWithoutSeconds(item.dateTimeIn)}</TableCell>
                        <TableCell className={`text-sm py-3 px-4 text-center whitespace-normal wrap-break-word max-w-[120px] ${item.status === 'Completed' ? 'text-green-600 font-medium' : 'text-red-600'}`}>{item.dateTimeOut ? formatDateTimeWithoutSeconds(item.dateTimeOut) : '-'}</TableCell>
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
                        <TableCell className="text-sm py-3 px-4 text-center whitespace-normal wrap-break-word max-w-[240px]">{item.purpose}</TableCell>
                        <TableCell className="text-sm py-3 px-4 text-center">{item.placeOfAssignment}</TableCell>
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
                          className="wrap-break-word whitespace-normal text-sm cursor-pointer hover:bg-gray-50"
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
                              onClick={() => handleViewLocator(item.id)}
                              className="h-8 w-16 text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                              View
                            </Button>
                            {(item.status === 'Pending' || item.status === 'Approved' || user?.role === 'admin') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditLocator(item.id)}
                                className="h-8 w-16 text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700"
                              >
                                Edit
                              </Button>
                            )}
                            {item.status === 'Pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectLocator(item.id)}
                                className="h-8 w-16 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                Reject
                              </Button>
                            )}
                            {(item.status === 'Pending' || item.status === 'Approved') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTimeOut(item.id)}
                                className="h-8 w-16 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                              >
                                Out
                              </Button>
                            )}
                            {(item.status === 'Completed' || item.status === 'Rejected') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReturnLocator(item.id)}
                                className="h-8 w-16 text-purple-600 border-purple-600 hover:bg-purple-50 hover:text-purple-700"
                              >
                                Return
                              </Button>
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
              <Label htmlFor="rejectRemarks" className="text-sm font-medium">Rejection Remarks *</Label>
              <textarea
                id="rejectRemarks"
                placeholder="Enter rejection remarks (required)"
                value={rejectData.remarks}
                onChange={(e) => setRejectData({ remarks: e.target.value })}
                className="w-full min-h-[80px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="w-[90vw] h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground">Locator Details</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  View complete information about this locator record
                </DialogDescription>
              </div>
              {selectedLocator && (
                <Badge 
                  variant={
                    selectedLocator.status === 'Rejected' ? 'destructive' : 'secondary'
                  }
                  className={`${
                    selectedLocator.status === 'Completed' || selectedLocator.status === 'Approved' ? 
                    'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' : 
                    selectedLocator.status === 'Pending' || (!selectedLocator.status || selectedLocator.status === 'Pending') ? 
                    'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200' : ''
                  } px-3 py-1 shrink-0`}
                >
                  {selectedLocator.status || 'Pending'}
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          {/* Scrollable Content Area */}
          <div className="overflow-y-auto px-1 flex-1 min-h-0">
            {selectedLocator && (
              <div className="space-y-4">
                {/* Additional Information */}
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tracking ID</p>
                        <p className="text-sm text-foreground mt-1">{selectedLocator.trackingId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Received / Created By</p>
                        <p className="text-sm text-foreground mt-1">{selectedLocator.receivedBy || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date/Time In</p>
                        <p className="text-sm text-foreground mt-1">{formatDateTimeWithoutSeconds(selectedLocator.dateTimeIn)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                        <p className="text-sm text-foreground mt-1">{formatDateTimeWithoutSeconds(selectedLocator.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                        <p className="text-sm text-foreground mt-1">{selectedLocator.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Designation</p>
                        <p className="text-sm text-foreground mt-1">
                          <div className="group relative inline-block">
                            <span className="text-primary font-medium hover:underline cursor-default">
                              {getDesignationAcronym(selectedLocator.designation)}
                            </span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              <div className="font-medium">{selectedLocator.designation}</div>
                              <div className="text-xs text-gray-300 mt-1">Click to copy</div>
                            </div>
                          </div>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                        <p className="text-sm text-foreground mt-1">{selectedLocator.purpose}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Place of Assignment</p>
                        <p className="text-sm text-foreground mt-1">{selectedLocator.placeOfAssignment}</p>
                      </div>
                      {selectedLocator.inclusiveDateStart && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                          <p className="text-sm text-foreground mt-1">{selectedLocator.inclusiveDateStart}</p>
                        </div>
                      )}
                      {selectedLocator.inclusiveDateEnd && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">End Date</p>
                          <p className="text-sm text-foreground mt-1">{selectedLocator.inclusiveDateEnd}</p>
                        </div>
                      )}
                      {selectedLocator.inclusiveTimeStart && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Start Time</p>
                          <p className="text-sm text-foreground mt-1">{selectedLocator.inclusiveTimeStart}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date/Time Out</p>
                        <p className="text-sm text-foreground mt-1">{selectedLocator.dateTimeOut ? formatDateTimeWithoutSeconds(selectedLocator.dateTimeOut) : '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Remarks */}
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Remarks Column */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Remarks</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap bg-secondary px-3 py-2 rounded-md border min-h-[100px]">
                          {selectedLocator.remarks || 'No remarks'}
                        </p>
                        {selectedLocator.timeOutRemarks && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Time Out Details</p>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Date/Time Out</p>
                                <p className="text-sm text-foreground bg-secondary px-2 py-1 rounded border">
                                  {selectedLocator.dateTimeOut ? formatDateTimeWithoutSeconds(selectedLocator.dateTimeOut) : '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Time Out Remarks</p>
                                <p className="text-sm text-foreground whitespace-pre-wrap bg-secondary px-2 py-1 rounded border">
                                  {selectedLocator.timeOutRemarks}
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
          
          <DialogFooter className="pt-4 shrink-0">
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
                    item.status === 'Completed' ? 'border-l-green-500' :
                    item.status === 'Rejected' ? 'border-l-red-500' :
                    'border-l-blue-500'
                  } pl-4 py-3 bg-muted/50 rounded-r-lg`}>
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
                    <div className="text-sm text-foreground bg-card p-3 rounded-md border shadow-sm">
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

