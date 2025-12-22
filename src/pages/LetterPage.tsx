import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { letterService, designationService } from '@/services/firebaseService';
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
import { ActionButtons } from '@/components/ActionButtons';
import { Sidebar } from '@/components/Sidebar';
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

interface Letter {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designationOffice: string;
  particulars: string;
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

export default function LetterPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [letterToDelete, setLetterToDelete] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [timeOutModalOpen, setTimeOutModalOpen] = useState(false);
  const [letterToTimeOut, setLetterToTimeOut] = useState<string | null>(null);
  const [timeOutDateTime, setTimeOutDateTime] = useState('');
  const [timeOutRemarks, setTimeOutRemarks] = useState('');
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

  // Form states
  const [formData, setFormData] = useState({
    dateTimeIn: '',
    dateTimeOut: '',
    fullName: '',
    designationOffice: '',
    particulars: '',
    remarks: '',
    remarksHistory: [] as Array<{
      remarks: string;
      status: string;
      timestamp: string;
      updatedBy: string;
    }>
  });

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

  // Load letters from Firestore on mount
  useEffect(() => {
    const loadLetters = async () => {
      try {
        console.log('📂 Loading letters from Firestore...');
        const data = await letterService.getLetters();
        console.log(`✅ Letters loaded: ${data.length} records`);
        setLetters(data as Letter[]);
      } catch (error) {
        console.error('❌ Error loading letters:', error);
        setSuccess('Error loading letters. Please try again.');
        setSuccessModalOpen(true);
      }
    };
    
    loadLetters();
    const interval = setInterval(loadLetters, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredLetters = letters.filter(letter =>
    letter.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    letter.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    letter.receivedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateTrackingId = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const sequenceNumber = String(letters.length + 1).padStart(3, '0');
    return `(L) ${year}/${month}/${day} - ${sequenceNumber}`;
  };

  const viewRemarksHistory = (letter: Letter) => {
    setCurrentRemarksHistory(letter.remarksHistory || []);
    setRemarksHistoryOpen(true);
  };

  const handleAddOrUpdate = async () => {
    if (!formData.dateTimeIn || !formData.fullName || !formData.designationOffice || !formData.particulars) {
      setSuccess('Please fill in all required fields');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      
      if (editingId) {
        // Update existing letter in Firestore
        const existingLetter = letters.find(l => l.id === editingId);
        const newRemarksHistory = [
          ...(existingLetter?.remarksHistory || []),
          {
            remarks: formData.remarks,
            status: 'Edited',
            timestamp: now,
            updatedBy: currentUser
          }
        ];
        
        const updateData = {
          dateTimeIn: formData.dateTimeIn,
          dateTimeOut: formData.dateTimeOut,
          fullName: formData.fullName,
          designationOffice: formData.designationOffice,
          particulars: formData.particulars,
          remarks: formData.remarks,
          remarksHistory: newRemarksHistory,
          updatedAt: now
        };
        await letterService.updateLetter(editingId, updateData);
        setSuccess('Letter updated successfully');
        setLetters(letters.map(l => 
          l.id === editingId 
            ? { 
                ...l, 
                ...updateData
              } 
            : l
        ));
      } else {
        // Add new letter to Firestore
        const nextTrackingId = generateTrackingId();
        const newLetter = {
          trackingId: nextTrackingId,
          receivedBy: currentUser,
          ...formData,
          status: 'Pending',
          remarks: formData.remarks || 'Letter record created',
          remarksHistory: [{
            remarks: formData.remarks || 'Letter record created',
            status: 'Pending',
            timestamp: now,
            updatedBy: currentUser
          }],
          timeOutRemarks: '',
          createdAt: now,
          updatedAt: now
        };
        const result = await letterService.addLetter(newLetter);
        setSuccess('Letter added successfully');
        setLetters([result as Letter, ...letters]);
      }

      // Reset form
      setFormData({
        dateTimeIn: '',
        dateTimeOut: '',
        fullName: '',
        designationOffice: '',
        particulars: '',
        remarks: '',
        remarksHistory: []
      });
      setEditingId(null);
      setIsDialogOpen(false);
      setSuccessModalOpen(true);
    } catch (error) {
      console.error('Error saving letter:', error);
      setSuccess('Error saving letter');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLetter = (letter: Letter) => {
    setFormData({
      dateTimeIn: letter.dateTimeIn,
      dateTimeOut: letter.dateTimeOut || '',
      fullName: letter.fullName,
      designationOffice: letter.designationOffice,
      particulars: letter.particulars,
      remarks: letter.remarks || '',
      remarksHistory: letter.remarksHistory || []
    });
    setEditingId(letter.id);
    setIsDialogOpen(true);
  };

  const handleReject = async () => {
    if (letterToDelete) {
      if (!rejectData.remarks.trim()) {
        setSuccess('Error: Rejection remarks are required');
        setSuccessModalOpen(true);
        return;
      }

      try {
        const letter = letters.find(l => l.id === letterToDelete);
        if (!letter) return;
        
        const now = new Date().toISOString();
        const currentUser = user?.name || 'Unknown';
        const newRemarks = rejectData.remarks;
        
        const updatedRemarksHistory = [
          ...(letter.remarksHistory || []),
          {
            remarks: newRemarks,
            status: 'Rejected',
            timestamp: now,
            updatedBy: currentUser
          }
        ];
        
        await letterService.updateLetter(letterToDelete, { 
          status: 'Rejected', 
          remarks: newRemarks,
          remarksHistory: updatedRemarksHistory,
          updatedAt: now
        });
        
        const updatedLetters = letters.map(l => 
          l.id === letterToDelete 
            ? { 
                ...l, 
                status: 'Rejected', 
                remarks: newRemarks,
                remarksHistory: updatedRemarksHistory,
                updatedAt: now
              } 
            : l
        );
        setLetters(updatedLetters);
        setLetterToDelete(null);
        setRejectData({ remarks: '' });
        setDeleteConfirmOpen(false);
        setSuccess('Letter rejected successfully');
        setSuccessModalOpen(true);
      } catch (error) {
        console.error('Error rejecting letter:', error);
        setSuccess('Error rejecting letter');
        setSuccessModalOpen(true);
      }
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
        designationOffice: '',
        particulars: '',
        remarks: '',
        remarksHistory: []
      });
    }
  };

  const handleView = (letter: Letter) => {
    setSelectedLetter(letter);
    setViewModalOpen(true);
  };

  const handleTimeOut = (letterId: string) => {
    setLetterToTimeOut(letterId);
    setTimeOutDateTime('');
    setTimeOutRemarks('');
    setTimeOutModalOpen(true);
  };

  const confirmTimeOut = async () => {
    if (!letterToTimeOut || !timeOutDateTime) return;

    if (!timeOutRemarks.trim()) {
      setSuccess('Error: Time out remarks are required');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      // Verify the document exists before attempting to update
      const currentLetters = await letterService.getLetters();
      const letterExists = currentLetters.some((l: any) => l.id === letterToTimeOut);
      
      if (!letterExists) {
        throw new Error('Letter record not found. It may have been deleted or the data is out of sync.');
      }

      const letter = letters.find(l => l.id === letterToTimeOut);
      if (!letter) return;
      
      const now = new Date().toISOString();
      const currentUser = user?.name || 'Unknown';
      const newRemarks = timeOutRemarks;
      
      const updatedRemarksHistory = [
        ...(letter.remarksHistory || []),
        {
          remarks: newRemarks,
          status: 'Completed',
          timestamp: now,
          updatedBy: currentUser
        }
      ];
      
      await letterService.updateLetter(letterToTimeOut, {
        dateTimeOut: timeOutDateTime,
        status: 'Completed',
        remarks: newRemarks,
        remarksHistory: updatedRemarksHistory,
        timeOutRemarks: newRemarks,
        updatedAt: now
      });
      // Reload letters from Firestore
      const updatedLetters = await letterService.getLetters();
      setLetters(updatedLetters as Letter[]);
      setLetterToTimeOut(null);
      setTimeOutDateTime('');
      setTimeOutRemarks('');
      setTimeOutModalOpen(false);
      setSuccess('Time out recorded successfully');
      setSuccessModalOpen(true);
    } catch (error) {
      console.error('Error recording time out:', error);
      setSuccess(error instanceof Error ? error.message : 'Error recording time out');
      setSuccessModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
            <h1 className="text-2xl font-bold text-gray-900">Letter Records</h1>
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
                <h2 className="text-xl font-bold text-gray-900">Letters</h2>
                <p className="text-sm text-gray-600">Manage and view all letter records</p>
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
                          designationOffice: '',
                          particulars: '',
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
                    <DialogTitle>{editingId ? 'Edit' : 'Add New'} Letter</DialogTitle>
                    <DialogDescription>
                      Fill in the form to {editingId ? 'update' : 'add'} a letter record
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="trackingId">Tracking ID</Label>
                      <Input
                        id="trackingId"
                        value={editingId ? letters.find(l => l.id === editingId)?.trackingId || '' : generateTrackingId()}
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
                          value={formData.dateTimeIn}
                          onChange={(e) => setFormData({ ...formData, dateTimeIn: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Full Name"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="designationOffice">Office *</Label>
                        <Select value={formData.designationOffice} onValueChange={(value) => setFormData({ ...formData, designationOffice: value })}>
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
                        <Label htmlFor="particulars">Particulars *</Label>
                        <Input
                          id="particulars"
                          value={formData.particulars}
                          onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                          placeholder="Particulars"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="remarks">Remarks</Label>
                      <Input
                        id="remarks"
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        placeholder="Enter remarks"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddOrUpdate}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? 'Saving...' : editingId ? 'Update Letter' : 'Add Letter'}
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
                    <TableHead className="text-center">Received By</TableHead>
                    <TableHead className="text-center">Tracking ID</TableHead>
                    <TableHead className="text-center">Date/Time IN</TableHead>
                    <TableHead className="text-center">Date/Time OUT</TableHead>
                    <TableHead className="text-center">Full Name</TableHead>
                    <TableHead className="text-center">Office</TableHead>
                    <TableHead className="text-center">Particulars</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Remarks</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLetters.length > 0 ? (
                    filteredLetters.map((letter) => (
                      <TableRow key={letter.id} className="hover:bg-gray-50">
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{letter.receivedBy || '-'}</TableCell>
                        <TableCell className="font-bold italic wrap-break-word whitespace-normal text-center text-xs text-indigo-600">{letter.trackingId}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{new Date(letter.dateTimeIn).toLocaleString()}</TableCell>
                        <TableCell className={`wrap-break-word whitespace-normal text-center text-xs ${letter.status === 'Completed' ? 'text-green-600 font-medium' : 'text-red-600'}`}>{letter.dateTimeOut ? new Date(letter.dateTimeOut).toLocaleString() : '-'}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs uppercase">{letter.fullName}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{letter.designationOffice}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{letter.particulars}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            letter.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            letter.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            letter.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {letter.status}
                          </span>
                        </TableCell>
                        <TableCell 
  className="wrap-break-word whitespace-normal text-xs cursor-pointer hover:bg-gray-50"
  onClick={() => viewRemarksHistory(letter)}
>
  {letter.remarks ? (
    <div className="space-y-1 relative">
      {letter.status === 'Pending' && letter.remarksHistory?.some(h => h.status === 'Edited') && (
        <span className="absolute -top-2 -right-1 bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded-full">
          Edited
        </span>
      )}
      <div className="text-black">
        {letter.remarks}
      </div>
      {letter.remarksHistory?.length > 0 && (
        <div className={`${letter.status === 'Completed' ? 'text-green-600' : letter.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
          {letter.remarksHistory[0]?.timestamp && letter.status !== 'Completed' && (
            <span>[{new Date(letter.remarksHistory[0].timestamp).toLocaleString()}] </span>
          )}
          [{letter.status} by {letter.receivedBy}]
        </div>
      )}
      <div className="text-xs text-blue-600 mt-1">
        Click to view full history
      </div>
    </div>
  ) : '-'}
</TableCell>
                        <TableCell className="text-center">
                          <ActionButtons
                            onView={() => handleView(letter)}
                            onEdit={() => handleEditLetter(letter)}
                            onTimeOut={() => handleTimeOut(letter.id)}
                            onReject={() => {
                              setLetterToDelete(letter.id);
                              setRejectData({ remarks: '' });
                              setDeleteConfirmOpen(true);
                            }}
                            hidden={letter.status === 'Rejected'}
                            showTimeOut={letter.status !== 'Completed'}
                            showEdit={letter.status !== 'Completed'}
                            showReject={letter.status !== 'Completed'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500 wrap-break-word whitespace-normal">
                        No letters found. Add one to get started.
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
            <DialogTitle className="text-2xl">Letter Details</DialogTitle>
          </DialogHeader>
          {selectedLetter && (
            <div className="space-y-6">
              {/* Header Row - Tracking ID, Status, Date/Time IN */}
              <div className="grid grid-cols-3 gap-6 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tracking ID</p>
                  <p className="text-lg font-bold text-indigo-600 mt-1">{selectedLetter.trackingId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</p>
                  <p className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedLetter.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      selectedLetter.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedLetter.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedLetter.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date/Time In</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{new Date(selectedLetter.dateTimeIn).toLocaleString()}</p>
                </div>
              </div>

              {/* Received By */}
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Received By</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedLetter.receivedBy || '-'}</p>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Full Name</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLetter.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Designation/Office</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLetter.designationOffice}</p>
                  </div>
                </div>
              </div>

              {/* Date/Time Out */}
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Date/Time Out</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLetter.dateTimeOut ? new Date(selectedLetter.dateTimeOut).toLocaleString() : '-'}</p>
              </div>

              {/* Details */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Details</h3>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Particulars</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 whitespace-pre-wrap">{selectedLetter.particulars}</p>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Remarks</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedLetter.remarks || selectedLetter.timeOutRemarks || '-'}</p>
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
          <DialogTitle className="text-lg font-semibold">Confirm Reject</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject this letter? The status will be changed to "Rejected".
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
                setLetterToDelete(null);
                setRejectData({ remarks: '' });
              }}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              className="px-6 bg-red-600 hover:bg-red-700 text-white"
            >
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Out Modal */}
      <TimeOutModal
        open={timeOutModalOpen}
        onOpenChange={setTimeOutModalOpen}
        onConfirm={confirmTimeOut}
        onCancel={() => {
          setTimeOutModalOpen(false);
          setLetterToTimeOut(null);
          setTimeOutDateTime('');
          setTimeOutRemarks('');
        }}
        dateTimeOut={timeOutDateTime}
        onDateTimeOutChange={setTimeOutDateTime}
        remarks={timeOutRemarks}
        onRemarksChange={setTimeOutRemarks}
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
