import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { designationService, pageVisibilityService, systemSettingsService } from '@/services/firebaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Plus, Menu, LogOut, Trash2, Camera, Upload, RefreshCw, Settings } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { addUser, getAllUsers, deleteUser, updateUser, user, logout, setUser, recoverUsers } = useAuth();
  const isSystemAdmin = user?.username === 'admin' && user?.name === 'Administrator';
  const [users, setUsers] = useState(getAllUsers());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isConfirmPasswordOpen, setIsConfirmPasswordOpen] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [designationDialogOpen, setDesignationDialogOpen] = useState(false);
  const [designations, setDesignations] = useState<string[]>([]);
  const [newDesignation, setNewDesignation] = useState('');
  const [editingDesignation, setEditingDesignation] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'add' | 'edit' | 'delete'; value?: string }>({ type: 'add' });
  const [pageVisibility, setPageVisibility] = useState<Record<string, boolean>>({});
  const [isPageVisibilityLoading, setIsPageVisibilityLoading] = useState(false);
  const [allowUserThemes, setAllowUserThemes] = useState(true);
  const [isSystemSettingsLoading, setIsSystemSettingsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Avatar view modal state
  const [isAvatarViewOpen, setIsAvatarViewOpen] = useState(false);
  const [viewingAvatar, setViewingAvatar] = useState<string>('');

  // Load designations from Firestore on mount
  useEffect(() => {
    const loadDesignations = async () => {
      try {
        const firestoreDesignations = await designationService.getDesignations();
        if (firestoreDesignations.length > 0) {
          setDesignations(firestoreDesignations);
        } else {
          // Initialize with default designations if none exist
          const defaultDesignations = ['Admin', 'Manager', 'Staff', 'Officer'];
          await designationService.setDesignations(defaultDesignations);
          setDesignations(defaultDesignations);
        }
      } catch (err) {
        console.error('Failed to load designations:', err);
        // Fallback to defaults if Firestore fails
        setDesignations(['Admin', 'Manager', 'Staff', 'Officer']);
      }
    };
    loadDesignations();
  }, []);

  useEffect(() => {
    const loadPageVisibility = async () => {
      if (!isSystemAdmin) return;
      setIsPageVisibilityLoading(true);
      try {
        const visibility = await pageVisibilityService.getPageVisibility();
        setPageVisibility(visibility || {});
      } catch (err) {
        console.error('Failed to load page visibility:', err);
        setPageVisibility({});
      } finally {
        setIsPageVisibilityLoading(false);
      }
    };

    loadPageVisibility();
  }, [isSystemAdmin]);

  useEffect(() => {
    setActiveTab((prev) => {
      if (!isSystemAdmin && (prev === 'users' || prev === 'pages' || prev === 'system')) {
        return 'profile';
      }
      return prev;
    });
  }, [isSystemAdmin]);

  useEffect(() => {
    const loadSystemSettings = async () => {
      if (!isSystemAdmin) return;
      setIsSystemSettingsLoading(true);
      try {
        const enabled = await systemSettingsService.getAllowUserThemes();
        setAllowUserThemes(enabled);
      } catch (err) {
        console.error('Failed to load system settings:', err);
      } finally {
        setIsSystemSettingsLoading(false);
      }
    };

    loadSystemSettings();
  }, [isSystemAdmin]);

  // Refresh users list when user changes
  useEffect(() => {
    setUsers(getAllUsers());
  }, [user, getAllUsers]);

  // Additional refresh for avatar updates
  useEffect(() => {
    // Force refresh users list when avatar dialog closes
    if (!isAvatarDialogOpen) {
      const timer = setTimeout(() => {
        const refreshedUsers = getAllUsers();
        setUsers(refreshedUsers);
      }, 100); // Small delay to ensure Firebase update completes
      return () => clearTimeout(timer);
    }
  }, [isAvatarDialogOpen, getAllUsers]);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTogglePageVisibility = async (pageName: string, enabled: boolean) => {
    if (!isSystemAdmin) return;
    setError('');
    setSuccess('');
    setPageVisibility(prev => ({
      ...prev,
      [pageName]: enabled,
    }));

    try {
      const ok = await pageVisibilityService.updatePageVisibility(pageName, enabled);
      if (!ok) {
        throw new Error('Failed to update page visibility');
      }
      setSuccess('Page visibility updated.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update page visibility');
      setPageVisibility(prev => ({
        ...prev,
        [pageName]: !enabled,
      }));
    }
  };

  const handleToggleAllowUserThemes = async (enabled: boolean) => {
    if (!isSystemAdmin) return;
    setError('');
    setSuccess('');
    setAllowUserThemes(enabled);

    try {
      const ok = await systemSettingsService.setAllowUserThemes(enabled);
      if (!ok) {
        throw new Error('Failed to update theme setting');
      }
      window.dispatchEvent(new Event('systemSettingsUpdated'));
      setSuccess('Theme setting updated.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update theme setting');
      setAllowUserThemes(prev => !prev);
    }
  };

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'admin' | 'user',
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as 'admin' | 'user'
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await addUser(formData.username, formData.password, formData.name, formData.role);
      setSuccess(`User ${formData.name} added successfully!`);
      setUsers(getAllUsers());
      setFormData({
        username: '',
        name: '',
        password: '',
        confirmPassword: '',
        role: 'user',
      });
      setIsDialogOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (userToEdit: any) => {
    setFormData({
      username: userToEdit.username,
      name: userToEdit.name,
      password: '',
      confirmPassword: '',
      role: userToEdit.role,
    });
    setEditingUserId(userToEdit.id);
    setIsEditDialogOpen(true);
  };

  const handleToggleAdminRole = async (userId: string, currentRole: 'admin' | 'user', userName: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'grant' : 'revoke';
    
    setIsLoading(true);
    try {
      await updateUser(userId, { role: newRole as 'admin' | 'user' });
      const updatedUsers = users.map(u => 
        u.id === userId 
          ? { ...u, role: newRole as 'admin' | 'user' }
          : u
      );
      setUsers(updatedUsers);
      setSuccess(`Admin access ${action}ed for ${userName}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} admin access`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const updatedUsers = users.map(u => 
        u.id === editingUserId 
          ? {
              ...u,
              name: formData.name,
              role: formData.role,
              ...(formData.password && { password: formData.password })
            }
          : u
      );
      
      // Update in-memory storage
      const allUsers = getAllUsers();
      const userIndex = allUsers.findIndex(u => u.id === editingUserId);
      if (userIndex !== -1) {
        allUsers[userIndex] = updatedUsers[updatedUsers.findIndex(u => u.id === editingUserId)];
      }
      
      setUsers(updatedUsers);
      setSuccess('User updated successfully!');
      setFormData({
        username: '',
        name: '',
        password: '',
        confirmPassword: '',
        role: 'user',
      });
      setIsEditDialogOpen(false);
      setEditingUserId(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await deleteUser(userId);
        setSuccess('User deleted successfully!');
        setUsers(getAllUsers());
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete user');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChangePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setChangePasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({
      ...prev,
      name: e.target.value
    }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!profileData.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      if (user) {
        await updateUser(user.id, { name: profileData.name.trim() });
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!changePasswordData.currentPassword) {
      setError('Current password is required');
      return;
    }
    if (!changePasswordData.newPassword) {
      setError('New password is required');
      return;
    }
    if (changePasswordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (changePasswordData.currentPassword === changePasswordData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    // Verify current password
    if (user?.password !== changePasswordData.currentPassword) {
      setError('Current password is incorrect');
      return;
    }

    // Show confirmation dialog
    setIsConfirmPasswordOpen(true);
  };

  const confirmChangePassword = async () => {
    setIsLoading(true);
    try {
      setSuccess('Password changed successfully!');
      setChangePasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsConfirmPasswordOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDesignation = () => {
    setError('');
    setSuccess('');
    if (!newDesignation.trim()) {
      setError('Designation name is required');
      return;
    }
    
    // Parse multiple designations from textarea (comma or line separated)
    const rawDesignations = newDesignation
      .split(/[,\n]/)
      .map(d => d.trim())
      .filter(d => d.length > 0);
    
    if (rawDesignations.length === 0) {
      setError('Please enter at least one designation');
      return;
    }
    
    // Check for duplicates with existing designations
    const duplicates = rawDesignations.filter(d => designations.includes(d));
    if (duplicates.length > 0) {
      setError(`These designations already exist: ${duplicates.join(', ')}`);
      return;
    }
    
    // Check for duplicates within the input
    const uniqueDesignations = [...new Set(rawDesignations)];
    if (uniqueDesignations.length < rawDesignations.length) {
      setError('You have duplicate designations in your input');
      return;
    }
    
    setConfirmAction({ type: 'add', value: JSON.stringify(uniqueDesignations) });
    setConfirmDialogOpen(true);
  };

  const handleEditDesignation = (oldDesignation: string) => {
    setError('');
    setSuccess('');
    if (!newDesignation.trim()) {
      setError('Designation name is required');
      return;
    }
    if (newDesignation === oldDesignation) {
      setError('New designation must be different from current');
      return;
    }
    if (designations.includes(newDesignation)) {
      setError('This designation already exists');
      return;
    }
    setConfirmAction({ type: 'edit', value: newDesignation });
    setConfirmDialogOpen(true);
  };

  const handleDeleteDesignation = (designation: string) => {
    setConfirmAction({ type: 'delete', value: designation });
    setConfirmDialogOpen(true);
  };

  const confirmDesignationAction = async () => {
    setIsLoading(true);
    try {
      if (confirmAction.type === 'add' && confirmAction.value) {
        const designationsToAdd = JSON.parse(confirmAction.value);
        for (const designation of designationsToAdd) {
          await designationService.addDesignation(designation);
        }
        const updated = await designationService.getDesignations();
        setDesignations(updated);
        setSuccess(`${designationsToAdd.length} designation(s) added successfully!`);
        setNewDesignation('');
        setDesignationDialogOpen(false);
        setEditingDesignation(null);
        setError('');
      } else if (confirmAction.type === 'edit' && confirmAction.value && editingDesignation) {
        await designationService.updateDesignation(editingDesignation, confirmAction.value);
        const updated = await designationService.getDesignations();
        setDesignations(updated);
        setSuccess('Designation updated successfully!');
        setNewDesignation('');
        setEditingDesignation(null);
        setDesignationDialogOpen(false);
        setError('');
      } else if (confirmAction.type === 'delete' && confirmAction.value) {
        await designationService.deleteDesignation(confirmAction.value);
        const updated = await designationService.getDesignations();
        setDesignations(updated);
        setSuccess('Designation deleted successfully!');
        setError('');
      }
      window.dispatchEvent(new Event('designationsUpdated'));
    } catch (err) {
      console.error('Error updating designation:', err);
      setError(err instanceof Error ? err.message : 'Failed to update designation');
    } finally {
      setIsLoading(false);
      setConfirmDialogOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('Image size must be less than 2MB');
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarChange = (userId: string) => {
    if (!isSystemAdmin) {
      setError('Only the Administrator can change avatars');
      return;
    }
    setSelectedUserId(userId);
    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser?.avatar) {
      setAvatarPreview(selectedUser.avatar);
    } else {
      setAvatarPreview('');
    }
    setAvatarFile(null);
    setIsAvatarDialogOpen(true);
  };

  const handleAvatarView = (avatarSrc: string, userName: string) => {
    if (avatarSrc) {
      setViewingAvatar(avatarSrc);
      setIsAvatarViewOpen(true);
      console.log('Viewing avatar for:', userName);
    }
  };

  const handleAvatarSave = async () => {
    if (!selectedUserId || !isSystemAdmin) return;
    
    setIsLoading(true);
    try {
      let avatarUrl = '';
      
      if (avatarFile) {
        // Convert file to base64 for storage
        avatarUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(avatarFile!);
        });
      } else if (avatarPreview) {
        avatarUrl = avatarPreview;
      }
      
      // Update with avatarUrl (empty string if no avatar, or base64 data)
      await updateUser(selectedUserId, { avatar: avatarUrl || undefined });
      
      // Update local users state immediately
      const updatedUsers = users.map(u => 
        u.id === selectedUserId 
          ? { ...u, avatar: avatarUrl || undefined }
          : u
      );
      setUsers(updatedUsers);
      
      // Update current user if they're the one being edited
      if (user?.id === selectedUserId) {
        setUser({ ...user, avatar: avatarUrl || undefined });
      }
      
      // Force refresh from AuthContext to ensure consistency
      setTimeout(() => {
        const refreshedUsers = getAllUsers();
        setUsers(refreshedUsers);
      }, 500);
      
      console.log('Avatar saved for user', selectedUserId, 'avatar length:', avatarUrl.length);
      setSuccess('Avatar updated successfully!');
      setIsAvatarDialogOpen(false);
      setAvatarFile(null);
      setAvatarPreview('');
      setSelectedUserId(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to update avatar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!selectedUserId || !isSystemAdmin) return;
    
    setIsLoading(true);
    try {
      await updateUser(selectedUserId, { avatar: undefined });
      
      // Update local users state
      const updatedUsers = users.map(u => 
        u.id === selectedUserId 
          ? { ...u, avatar: undefined }
          : u
      );
      setUsers(updatedUsers);
      
      // Update current user if they're the one being edited
      if (user?.id === selectedUserId) {
        setUser({ ...user, avatar: undefined });
      }
      
      setSuccess('Avatar removed successfully!');
      setIsAvatarDialogOpen(false);
      setAvatarFile(null);
      setAvatarPreview('');
      setSelectedUserId(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error removing avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove avatar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverUsers = () => {
    try {
      recoverUsers();
      setUsers(getAllUsers());
      setSuccess('Users recovered successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error recovering users:', err);
      setError('Failed to recover users');
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
        <div className="bg-gradient-to-br from-gray-50 to-white border-b pl-14 pr-4 sm:px-6 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 shadow-md">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">
                  Settings
                </h1>
              </div>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex flex-wrap items-center gap-2">
              {user?.name && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-lg border border-slate-200 shadow-sm">
                  <div 
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => user.avatar && handleAvatarView(user.avatar, user.name)}
                    title={user.avatar ? "Click to view full size avatar" : "No avatar to view"}
                  >
                    <Avatar className="h-8 w-8 rounded-lg ring-2 ring-slate-100">
                      <AvatarImage src={user.avatar || undefined} alt={user.name} />
                      <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 h-9 border-slate-200"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-gray-100">
          <div className="h-full">
            <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden h-full flex flex-col">
              <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-auto min-h-0">
                {/* Alerts */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                {/* Show different content based on user role */}
                {user?.role === 'user' ? (
          // User View - Tabs
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Change Password</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                  <CardDescription className="text-xs">Update your profile information</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="profileName" className="text-xs">Full Name</Label>
                      <Input
                        id="profileName"
                        type="text"
                        placeholder="Enter your full name"
                        value={profileData.name}
                        onChange={handleProfileNameChange}
                        disabled={isLoading}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => {
                          setProfileData({
                            name: user?.name || '',
                          });
                        }}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
                </Card>
              </TabsContent>

            {/* Change Password Tab */}
            <TabsContent value="password" className="space-y-4">
              <Card className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Change Password</CardTitle>
                  <CardDescription className="text-xs">Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="currentPassword" className="text-xs">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        placeholder="Enter current password"
                        value={changePasswordData.currentPassword}
                        onChange={handleChangePasswordInput}
                        disabled={isLoading}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="newPassword" className="text-xs">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={changePasswordData.newPassword}
                        onChange={handleChangePasswordInput}
                        disabled={isLoading}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="confirmPassword" className="text-xs">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={changePasswordData.confirmPassword}
                        onChange={handleChangePasswordInput}
                        disabled={isLoading}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => {
                          setChangePasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                          });
                        }}
                        disabled={isLoading}
                      >
                        Clear
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Changing...' : 'Change Password'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          // Admin View - Full Settings with Tabs
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              {isSystemAdmin && <TabsTrigger value="users">User Management</TabsTrigger>}
              <TabsTrigger value="designations">Designations</TabsTrigger>
              <TabsTrigger value="accountCodes">Account Codes</TabsTrigger>
              <TabsTrigger value="fpps">FPP</TabsTrigger>
              {isSystemAdmin && <TabsTrigger value="pages">Pages</TabsTrigger>}
              {isSystemAdmin && <TabsTrigger value="system">System Settings</TabsTrigger>}
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                  <CardDescription className="text-xs">Update your profile information</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="adminProfileName" className="text-xs">Full Name</Label>
                      <Input
                        id="adminProfileName"
                        type="text"
                        placeholder="Enter your full name"
                        value={profileData.name}
                        onChange={handleProfileNameChange}
                        disabled={isLoading}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => {
                          setProfileData({
                            name: user?.name || '',
                          });
                        }}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Management Tab */}
            {isSystemAdmin && (
              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Add and manage system users</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button className="gap-2">
                              <Plus className="h-4 w-4" />
                              Add User
                            </Button>
                          </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account for the system
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        placeholder="johndoe"
                        value={formData.username}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.role} onValueChange={handleRoleChange}>
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Adding...' : 'Add User'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleRecoverUsers}
                title="Recover users from backup"
              >
                <RefreshCw className="h-4 w-4" />
                Recover Users
              </Button>
            </div>

              {/* Edit User Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                      Update user information
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-username">Username</Label>
                      <Input
                        id="edit-username"
                        value={formData.username}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500">Username cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Full Name</Label>
                      <Input
                        id="edit-name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-password">New Password (Optional)</Label>
                      <Input
                        id="edit-password"
                        name="password"
                        type="password"
                        placeholder="Leave blank to keep current password"
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-confirmPassword">Confirm New Password</Label>
                      <Input
                        id="edit-confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Role</Label>
                      <Select value={formData.role} onValueChange={handleRoleChange}>
                        <SelectTrigger id="edit-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setIsEditDialogOpen(false);
                          setEditingUserId(null);
                          setFormData({
                            username: '',
                            name: '',
                            password: '',
                            confirmPassword: '',
                            role: 'user',
                          });
                        }}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Updating...' : 'Update User'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Avatar Dialog */}
              <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Change Avatar</DialogTitle>
                    <DialogDescription>
                      Update user avatar image
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Avatar Preview */}
                    <div className="flex justify-center">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarPreview || undefined} alt="Avatar preview" />
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg font-medium">
                          {users.find(u => u.id === selectedUserId)?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Upload Button */}
                    <div className="space-y-2">
                      <Label htmlFor="avatar-upload">Upload New Avatar</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={isLoading}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                          disabled={isLoading}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        JPG, PNG or GIF (Max 5MB)
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsAvatarDialogOpen(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      {avatarPreview && (
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={handleAvatarRemove}
                          disabled={isLoading}
                        >
                          Remove
                        </Button>
                      )}
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={handleAvatarSave}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Avatar'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Users Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Avatar</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(user?.role === 'admin' ? users : users.filter(u => u.username !== 'admin')).length > 0 ? (
                    (user?.role === 'admin' ? users : users.filter(u => u.username !== 'admin')).map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => user.avatar && handleAvatarView(user.avatar, user.name)}
                              title={user.avatar ? "Click to view full size" : "No avatar to view"}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={user.avatar || undefined} 
                                  alt={user.name}
                                  onError={(e) => {
                                    console.log('Avatar image failed to load for user:', user.name);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs font-medium">
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            {isSystemAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAvatarChange(user.id)}
                                className="h-6 w-6 p-0 text-gray-500 hover:text-indigo-600"
                                title="Change avatar"
                              >
                                <Camera className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {/* Debug: Show avatar status */}
                          <div className="text-xs text-gray-500">
                            {user.avatar ? `Avatar: ${user.avatar.length > 100 ? 'Set' : 'Set'}` : 'Avatar: None'}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium wrap-break-word whitespace-normal">{user.username}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal">{user.name}</TableCell>
                        <TableCell className="wrap-break-word whitespace-normal">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleToggleAdminRole(user.id, user.role, user.name)}
                            disabled={isLoading || user.username === 'admin'}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              user.role === 'admin'
                                ? 'bg-indigo-600 hover:bg-indigo-700'
                                : 'bg-gray-300 hover:bg-gray-400'
                            } ${user.username === 'admin' ? 'cursor-not-allowed' : ''} disabled:opacity-50`}
                            title={user.username === 'admin' ? 'Administrator access cannot be changed' : (user.role === 'admin' ? 'Click to revoke admin access' : 'Click to grant admin access')}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.role === 'admin' ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-3 justify-end items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Edit user"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.username === 'admin'}
                              className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${user.username === 'admin' ? 'cursor-not-allowed opacity-50' : ''}`}
                              title={user.username === 'admin' ? 'Administrator account cannot be deleted' : 'Delete user'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
            </Card>
            </TabsContent>
            )}

            {/* Designations Tab */}
            <TabsContent value="designations" className="space-y-4">
              <Card className="flex flex-col max-h-[70vh]">
                <CardHeader className="pb-3 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">Designations</CardTitle>
                      <CardDescription className="text-xs">Manage department/office designations</CardDescription>
                    </div>
                    <Dialog open={designationDialogOpen} onOpenChange={(open) => {
                      setDesignationDialogOpen(open);
                      if (!open) {
                        setNewDesignation('');
                        setEditingDesignation(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button className="gap-2 h-8 text-xs">
                          <Plus className="h-3 w-3" />
                          Add Designation
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{editingDesignation ? 'Edit Designation' : 'Add New Designation'}</DialogTitle>
                          <DialogDescription>
                            {editingDesignation ? 'Update the designation name' : 'Paste one or more designations (separated by commas or new lines)'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="designationName">Designation Name{!editingDesignation && 's'}</Label>
                            {editingDesignation ? (
                              <Input
                                id="designationName"
                                placeholder="e.g., Senior Manager, Finance Department"
                                value={newDesignation}
                                onChange={(e) => setNewDesignation(e.target.value)}
                                disabled={isLoading}
                              />
                            ) : (
                              <textarea
                                id="designationName"
                                placeholder="Paste designations here (comma or line separated)&#10;e.g.:&#10;Office of the Provincial Governor (PGO)&#10;Office of the Provincial Agriculturist (OPA)&#10;Provincial Tourism Office (TOURISM)"
                                value={newDesignation}
                                onChange={(e) => setNewDesignation(e.target.value)}
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                rows={6}
                              />
                            )}
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setDesignationDialogOpen(false);
                                setNewDesignation('');
                                setEditingDesignation(null);
                              }}
                              disabled={isLoading}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              className="flex-1"
                              onClick={() => {
                                if (editingDesignation) {
                                  handleEditDesignation(editingDesignation);
                                } else {
                                  handleAddDesignation();
                                }
                              }}
                              disabled={isLoading}
                            >
                              {isLoading ? (editingDesignation ? 'Updating...' : 'Adding...') : (editingDesignation ? 'Update' : 'Add')}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto min-h-0">
                  {/* Designations List */}
                  {designations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {designations.map((designation) => (
                        <div
                          key={designation}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{designation}</p>
                          </div>
                          <div className="flex gap-1 shrink-0 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setNewDesignation(designation);
                                setEditingDesignation(designation);
                                setDesignationDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDesignation(designation)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-sm font-medium">No designations yet</p>
                      <p className="text-xs mt-1">Add one to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Codes Tab */}
            <TabsContent value="accountCodes" className="space-y-4">
              <Card className="flex flex-col max-h-[70vh]">
                <CardHeader className="pb-3 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">Account Codes</CardTitle>
                      <CardDescription className="text-xs">Manage account codes for obligation requests</CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="gap-2 h-8 text-xs" onClick={() => setNewAccountCode('')}>
                          <Plus className="h-3 w-3" />
                          Add Account Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{editingAccountCode ? 'Edit Account Code' : 'Add New Account Code'}</DialogTitle>
                          <DialogDescription>
                            {editingAccountCode ? 'Update the account code' : 'Enter account code'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="accountCodeName">Account Code</Label>
                            <Input
                              id="accountCodeName"
                              placeholder="e.g., 5020301000"
                              value={newAccountCode}
                              onChange={(e) => setNewAccountCode(e.target.value)}
                              disabled={isLoading}
                            />
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setNewAccountCode('');
                                setEditingAccountCode(null);
                              }}
                              disabled={isLoading}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              className="flex-1"
                              onClick={async () => {
                                if (!newAccountCode.trim()) {
                                  setError('Account code is required');
                                  return;
                                }
                                setIsLoading(true);
                                try {
                                  if (editingAccountCode) {
                                    await accountCodeService.updateAccountCode(editingAccountCode, newAccountCode);
                                    setSuccess('Account code updated successfully!');
                                  } else {
                                    await accountCodeService.addAccountCode(newAccountCode);
                                    setSuccess('Account code added successfully!');
                                  }
                                  const updated = await accountCodeService.getAccountCodes();
                                  setAccountCodes(updated);
                                  setNewAccountCode('');
                                  setEditingAccountCode(null);
                                  window.dispatchEvent(new Event('accountCodesUpdated'));
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : 'Failed to save account code');
                                } finally {
                                  setIsLoading(false);
                                  setTimeout(() => setSuccess(''), 3000);
                                }
                              }}
                              disabled={isLoading}
                            >
                              {isLoading ? (editingAccountCode ? 'Updating...' : 'Adding...') : (editingAccountCode ? 'Update' : 'Add')}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto min-h-0">
                  {accountCodes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {accountCodes.map((accountCode) => (
                        <div
                          key={accountCode}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{accountCode}</p>
                          </div>
                          <div className="flex gap-1 shrink-0 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setNewAccountCode(accountCode);
                                setEditingAccountCode(accountCode);
                              }}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (window.confirm(`Delete account code "${accountCode}"?`)) {
                                  setIsLoading(true);
                                  try {
                                    await accountCodeService.deleteAccountCode(accountCode);
                                    const updated = await accountCodeService.getAccountCodes();
                                    setAccountCodes(updated);
                                    setSuccess('Account code deleted successfully!');
                                    window.dispatchEvent(new Event('accountCodesUpdated'));
                                  } catch (err) {
                                    setError('Failed to delete account code');
                                  } finally {
                                    setIsLoading(false);
                                    setTimeout(() => setSuccess(''), 3000);
                                  }
                                }
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm font-medium">No account codes yet</p>
                      <p className="text-xs mt-1">Add one to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* FPP Tab */}
            <TabsContent value="fpps" className="space-y-4">
              <Card className="flex flex-col max-h-[70vh]">
                <CardHeader className="pb-3 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">FPP (Financial Planning & Programming)</CardTitle>
                      <CardDescription className="text-xs">Manage FPP options for purchase requests and vouchers</CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="gap-2 h-8 text-xs" onClick={() => setNewFPP('')}>
                          <Plus className="h-3 w-3" />
                          Add FPP
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{editingFPP ? 'Edit FPP' : 'Add New FPP'}</DialogTitle>
                          <DialogDescription>
                            {editingFPP ? 'Update the FPP name' : 'Enter FPP name'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="fppName">FPP Name</Label>
                            <Input
                              id="fppName"
                              placeholder="e.g., FPP 1, FPP 2023"
                              value={newFPP}
                              onChange={(e) => setNewFPP(e.target.value)}
                              disabled={isLoading}
                            />
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setNewFPP('');
                                setEditingFPP(null);
                              }}
                              disabled={isLoading}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              className="flex-1"
                              onClick={async () => {
                                if (!newFPP.trim()) {
                                  setError('FPP name is required');
                                  return;
                                }
                                setIsLoading(true);
                                try {
                                  if (editingFPP) {
                                    await fppService.updateFPP(editingFPP, newFPP);
                                    setSuccess('FPP updated successfully!');
                                  } else {
                                    await fppService.addFPP(newFPP);
                                    setSuccess('FPP added successfully!');
                                  }
                                  const updated = await fppService.getFPPs();
                                  setFPPs(updated);
                                  setNewFPP('');
                                  setEditingFPP(null);
                                  window.dispatchEvent(new Event('fppsUpdated'));
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : 'Failed to save FPP');
                                } finally {
                                  setIsLoading(false);
                                  setTimeout(() => setSuccess(''), 3000);
                                }
                              }}
                              disabled={isLoading}
                            >
                              {isLoading ? (editingFPP ? 'Updating...' : 'Adding...') : (editingFPP ? 'Update' : 'Add')}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto min-h-0">
                  {fpps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {fpps.map((fpp) => (
                        <div
                          key={fpp}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{fpp}</p>
                          </div>
                          <div className="flex gap-1 shrink-0 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setNewFPP(fpp);
                                setEditingFPP(fpp);
                              }}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (window.confirm(`Delete FPP "${fpp}"?`)) {
                                  setIsLoading(true);
                                  try {
                                    await fppService.deleteFPP(fpp);
                                    const updated = await fppService.getFPPs();
                                    setFPPs(updated);
                                    setSuccess('FPP deleted successfully!');
                                    window.dispatchEvent(new Event('fppsUpdated'));
                                  } catch (err) {
                                    setError('Failed to delete FPP');
                                  } finally {
                                    setIsLoading(false);
                                    setTimeout(() => setSuccess(''), 3000);
                                  }
                                }
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm font-medium">No FPPs yet</p>
                      <p className="text-xs mt-1">Add one to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Settings Tab */}
            {isSystemAdmin && (
              <TabsContent value="system" className="space-y-4">
                <Card className="w-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">System Settings</CardTitle>
                    <CardDescription className="text-xs">Manage system preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="min-w-0">
                          <p className="font-medium">Allow User Themes</p>
                          <p className="text-sm text-muted-foreground">
                            {allowUserThemes ? 'Users will see their assigned theme colors.' : 'All users will be forced to the default white theme.'}
                          </p>
                        </div>
                        <Switch
                          checked={allowUserThemes}
                          onCheckedChange={(checked) => handleToggleAllowUserThemes(checked)}
                          disabled={isSystemSettingsLoading}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {isSystemAdmin && (
              <TabsContent value="pages" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Pages</CardTitle>
                    <CardDescription>Toggle which record pages appear in the sidebar (admin only)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {isPageVisibilityLoading ? (
                        <div className="text-sm text-muted-foreground">Loading page settings...</div>
                      ) : (
                        recordTypes.map((page) => {
                          const enabled = pageVisibility[page] !== false;
                          return (
                            <div key={page} className="flex items-center justify-between rounded-lg border p-3">
                              <div className="min-w-0">
                                <p className="font-medium truncate">{page}</p>
                                <p className="text-sm text-muted-foreground">
                                  {enabled ? 'Visible in sidebar' : 'Hidden in sidebar'}
                                </p>
                              </div>
                              <Switch
                                checked={enabled}
                                onCheckedChange={(checked) => handleTogglePageVisibility(page, checked)}
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isConfirmPasswordOpen} onOpenChange={setIsConfirmPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Password Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change your password? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsConfirmPasswordOpen(false)}
              disabled={isLoading}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmChangePassword}
              disabled={isLoading}
              className="px-4 bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? 'Changing...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Designation Action Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction.type === 'add' && 'Add Designation'}
              {confirmAction.type === 'edit' && 'Update Designation'}
              {confirmAction.type === 'delete' && 'Delete Designation'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-4">
            {confirmAction.type === 'add' && `Are you sure you want to add "${confirmAction.value}" as a new designation?`}
            {confirmAction.type === 'edit' && `Are you sure you want to update this designation to "${confirmAction.value}"?`}
            {confirmAction.type === 'delete' && `Are you sure you want to delete "${confirmAction.value}"? This action cannot be undone.`}
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isLoading}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDesignationAction}
              disabled={isLoading}
              className={`px-4 ${confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar View Modal */}
      <Dialog open={isAvatarViewOpen} onOpenChange={setIsAvatarViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Avatar Preview</DialogTitle>
            <DialogDescription>
              Full size avatar image
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center items-center p-4">
            <img 
              src={viewingAvatar} 
              alt="Avatar preview" 
              className="max-w-full max-h-96 rounded-lg shadow-lg object-contain"
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={() => setIsAvatarViewOpen(false)}
              className="px-4"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

