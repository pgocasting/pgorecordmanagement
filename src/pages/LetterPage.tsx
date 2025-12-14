import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { letterService } from '@/services/firebaseService';

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
import { ActionButtons } from '@/components/ActionButtons';
import { Sidebar } from '@/components/Sidebar';

interface Letter {
  id: string;
  trackingId: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designationOffice: string;
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

export default function LetterPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [letters, setLetters] = useState<Letter[]>([]);
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

  // Form states
  const [formData, setFormData] = useState({
    dateTimeIn: '',
    dateTimeOut: '',
    fullName: '',
    designationOffice: '',
    particulars: '',
  });

  const [designationOptions] = useState<string[]>(['Admin', 'Manager', 'Staff', 'Officer']);

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

  const generateTrackingId = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const sequenceNumber = String(letters.length + 1).padStart(3, '0');
    return `(L) ${year}/${month}/${day} - ${sequenceNumber}`;
  };

  const handleAddOrUpdate = async () => {
    if (!formData.dateTimeIn || !formData.fullName || !formData.designationOffice || !formData.particulars) {
      setSuccess('Please fill in all required fields');
      setSuccessModalOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      if (editingId) {
        // Update existing letter in Firestore
        const updateData = {
          dateTimeIn: formData.dateTimeIn,
          dateTimeOut: formData.dateTimeOut,
          fullName: formData.fullName,
          designationOffice: formData.designationOffice,
          particulars: formData.particulars,
        };
        await letterService.updateLetter(editingId, updateData);
        setSuccess('Letter updated successfully');
        setLetters(letters.map(l => l.id === editingId ? { ...l, ...updateData } : l));
      } else {
        // Add new letter to Firestore
        const newLetter = {
          trackingId: generateTrackingId(),
          dateTimeIn: formData.dateTimeIn,
          dateTimeOut: formData.dateTimeOut,
          fullName: formData.fullName,
          designationOffice: formData.designationOffice,
          particulars: formData.particulars,
          status: 'Pending',
          remarks: '',
          timeOutRemarks: '',
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
    });
    setEditingId(letter.id);
    setIsDialogOpen(true);
  };

  const handleReject = async () => {
    if (letterToDelete) {
      try {
        await letterService.updateLetter(letterToDelete, { status: 'Rejected' });
        const updatedLetters = letters.map(l => l.id === letterToDelete ? { ...l, status: 'Rejected' } : l);
        setLetters(updatedLetters);
        setLetterToDelete(null);
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

    setIsLoading(true);
    try {
      // Verify the document exists before attempting to update
      const currentLetters = await letterService.getLetters();
      const letterExists = currentLetters.some((l: any) => l.id === letterToTimeOut);
      
      if (!letterExists) {
        throw new Error('Letter record not found. It may have been deleted or the data is out of sync.');
      }

      await letterService.updateLetter(letterToTimeOut, {
        dateTimeOut: timeOutDateTime,
        timeOutRemarks: timeOutRemarks,
        status: 'Completed'
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
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 shadow-sm">
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
                      });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Letter
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg z-50 max-h-[90vh] overflow-y-auto overflow-x-hidden">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                      {editingId ? 'Edit Letter' : 'Add New Letter'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingId ? 'Update the letter record details' : 'Fill in the form to add a new letter record'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {/* Tracking ID - Display Only */}
                    {!editingId && (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">Tracking ID</Label>
                        <Input
                          type="text"
                          value={generateTrackingId()}
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
                          type="datetime-local"
                          value={formData.dateTimeIn}
                          onChange={(e) => setFormData({ ...formData, dateTimeIn: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Full Name */}
                      <div className="space-y-1">
                        <Label htmlFor="fullName" className="text-xs font-medium text-gray-700">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Full Name"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    {editingId && user?.role === 'admin' && (
                      <div className="space-y-1">
                        <Label htmlFor="dateTimeOut" className="text-xs font-medium text-gray-700">Date/Time OUT</Label>
                        <Input
                          id="dateTimeOut"
                          type="datetime-local"
                          value={formData.dateTimeOut || ''}
                          onChange={(e) => setFormData({ ...formData, dateTimeOut: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {/* Designation / Office */}
                      <div className="space-y-1">
                        <Label htmlFor="designationOffice" className="text-xs font-medium text-gray-700">Designation / Office *</Label>
                        <Select value={formData.designationOffice} onValueChange={(value) => setFormData({ ...formData, designationOffice: value })}>
                          <SelectTrigger 
                            id="designationOffice" 
                            className="w-full h-8 text-xs"
                            title={formData.designationOffice || "Select designation"}
                          >
                            <SelectValue placeholder="Select">
                              {formData.designationOffice ? getAcronym(formData.designationOffice) : 'Select'}
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

                      {/* Particulars */}
                      <div className="space-y-1">
                        <Label htmlFor="particulars" className="text-xs font-medium text-gray-700">Particulars *</Label>
                        <Input
                          id="particulars"
                          value={formData.particulars}
                          onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                          placeholder="Particulars"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* Add/Update Button - Full Width */}
                    <Button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 mt-2 h-9 text-sm"
                      onClick={handleAddOrUpdate}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : editingId ? 'Update Letter' : 'Add Letter'}
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
                    <TableHead className="text-center">Particulars</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Remarks</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {letters.length > 0 ? (
                    letters.map((letter) => (
                      <TableRow key={letter.id} className="hover:bg-gray-50">
                        <TableCell className="font-bold italic wrap-break-word whitespace-normal text-center text-xs text-indigo-600">{letter.trackingId}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{new Date(letter.dateTimeIn).toLocaleString()}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs text-red-600">{letter.dateTimeOut ? new Date(letter.dateTimeOut).toLocaleString() : '-'}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs uppercase">{letter.fullName}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{letter.designationOffice}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{letter.particulars}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            letter.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            letter.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {letter.status}
                          </span>
                        </TableCell>
                        <TableCell className="wrap-break-word whitespace-normal text-center text-xs">{letter.status === 'Completed' ? (letter.timeOutRemarks || letter.remarks || '-') : (letter.remarks || '-')}</TableCell>
                        <TableCell className="text-center">
                          <ActionButtons
                            onView={() => handleView(letter)}
                            onEdit={() => handleEditLetter(letter)}
                            onTimeOut={() => handleTimeOut(letter.id)}
                            onReject={() => {
                              setLetterToDelete(letter.id);
                              setDeleteConfirmOpen(true);
                            }}
                            showTimeOut={letter.status !== 'Completed'}
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
              {/* Header Row - Tracking ID, Date/Time IN */}
              <div className="grid grid-cols-2 gap-6 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tracking ID</p>
                  <p className="text-lg font-bold text-indigo-600 mt-1">{selectedLetter.trackingId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date/Time In</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{new Date(selectedLetter.dateTimeIn).toLocaleString()}</p>
                </div>
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
          <p className="text-sm text-gray-600">Are you sure you want to reject this letter? The status will be changed to "Rejected".</p>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleReject}
            >
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Out Modal */}
      <Dialog open={timeOutModalOpen} onOpenChange={setTimeOutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Record Time Out</DialogTitle>
            <DialogDescription>
              Enter the date/time out and any remarks for this letter record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="timeOutDateTime" className="text-sm font-medium text-gray-700">Date/Time OUT *</Label>
              <Input
                id="timeOutDateTime"
                type="datetime-local"
                value={timeOutDateTime}
                onChange={(e) => setTimeOutDateTime(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="timeOutRemarks" className="text-sm font-medium text-gray-700">Remarks</Label>
              <Textarea
                id="timeOutRemarks"
                value={timeOutRemarks}
                onChange={(e) => setTimeOutRemarks(e.target.value)}
                className="mt-2"
                placeholder="Enter time out remarks (optional)"
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setTimeOutModalOpen(false);
                  setLetterToTimeOut(null);
                  setTimeOutDateTime('');
                  setTimeOutRemarks('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={confirmTimeOut}
                disabled={!timeOutDateTime || isLoading}
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

