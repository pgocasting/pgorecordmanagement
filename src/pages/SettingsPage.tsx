import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { designationService } from '@/services/firebaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Menu, LogOut, Trash2 } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import LoadingScene from '@/components/LoadingScene';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { addUser, getAllUsers, user, logout } = useAuth();
  const [users, setUsers] = useState(getAllUsers());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    logout();
    navigate('/login');
  };

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'admin' | 'user',
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

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        const { deleteUser } = useAuth();
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
    if (!newDesignation.trim()) {
      setError('Designation name is required');
      return;
    }
    if (designations.includes(newDesignation)) {
      setError('This designation already exists');
      return;
    }
    setError('');
    setConfirmAction({ type: 'add', value: newDesignation });
    setConfirmDialogOpen(true);
  };

  const handleEditDesignation = (oldDesignation: string) => {
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
    setError('');
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
        await designationService.addDesignation(confirmAction.value);
        const updated = await designationService.getDesignations();
        setDesignations(updated);
        setSuccess('Designation added successfully!');
        setNewDesignation('');
        setDesignationDialogOpen(false);
        setEditingDesignation(null);
      } else if (confirmAction.type === 'edit' && confirmAction.value && editingDesignation) {
        await designationService.updateDesignation(editingDesignation, confirmAction.value);
        const updated = await designationService.getDesignations();
        setDesignations(updated);
        setSuccess('Designation updated successfully!');
        setNewDesignation('');
        setEditingDesignation(null);
        setDesignationDialogOpen(false);
      } else if (confirmAction.type === 'delete' && confirmAction.value) {
        await designationService.deleteDesignation(confirmAction.value);
        const updated = await designationService.getDesignations();
        setDesignations(updated);
        setSuccess('Designation deleted successfully!');
      }
      window.dispatchEvent(new Event('designationsUpdated'));
    } catch (err) {
      console.error('Error updating designation:', err);
      setError('Failed to update designation');
    } finally {
      setIsLoading(false);
      setConfirmDialogOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  if (isLoggingOut) {
    return <LoadingScene message="Signing out..." />;
  }

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
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600 mt-1">
                {user?.role === 'admin' ? 'Manage system settings and users' : 'Manage your account'}
              </p>
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-linear-to-br from-gray-100 via-gray-50 to-gray-100" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}>
          <div className="max-w-6xl mx-auto space-y-4">
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
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-1 max-w-md">
              <TabsTrigger value="password">Change Password</TabsTrigger>
            </TabsList>

            {/* Change Password Tab */}
            <TabsContent value="password" className="space-y-4">
              <Card className="max-w-md">
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
            <TabsList className="grid w-full grid-cols-3 max-w-2xl">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="designations">Designations</TabsTrigger>
              <TabsTrigger value="system">System Settings</TabsTrigger>
            </TabsList>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">User Management</CardTitle>
                      <CardDescription className="text-xs">Add and manage system users</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2 h-8 text-xs">
                          <Plus className="h-3 w-3" />
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
            </div>
          </CardHeader>
          <CardContent>
            {/* Users Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Username</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(user?.role === 'admin' ? users : users.filter(u => u.username !== 'admin')).length > 0 ? (
                    (user?.role === 'admin' ? users : users.filter(u => u.username !== 'admin')).map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50">
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
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
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

            {/* Designations Tab */}
            <TabsContent value="designations" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
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
                            {editingDesignation ? 'Update the designation name' : 'Add a new department, office, or designation'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="designationName">Designation Name</Label>
                            <Input
                              id="designationName"
                              placeholder="e.g., Senior Manager, Finance Department"
                              value={newDesignation}
                              onChange={(e) => setNewDesignation(e.target.value)}
                              disabled={isLoading}
                            />
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
                <CardContent>
                  {/* Designations List */}
                  <div className="space-y-2">
                    {designations.length > 0 ? (
                      designations.map((designation) => (
                        <div
                          key={designation}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition gap-2"
                        >
                          <span className="text-sm font-medium text-gray-900 truncate min-w-0">{designation}</span>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setNewDesignation(designation);
                                setEditingDesignation(designation);
                                setDesignationDialogOpen(true);
                              }}
                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Edit"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDesignation(designation)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No designations yet. Add one to get started.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Settings Tab */}
            <TabsContent value="system" className="space-y-4">
              <Card className="max-w-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">System Settings</CardTitle>
                  <CardDescription className="text-xs">Configure system-wide settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pb-3">
                  <div className="space-y-1">
                    <Label className="text-xs">System Name</Label>
                    <Input defaultValue="PGO Record Management System" disabled className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Version</Label>
                    <Input defaultValue="1.0.0" disabled className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Last Updated</Label>
                    <Input defaultValue={new Date().toLocaleDateString()} disabled className="h-8 text-xs" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
          </div>
        </div>
      </div>

      {/* Password Change Confirmation Dialog */}
      <Dialog open={isConfirmPasswordOpen} onOpenChange={setIsConfirmPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Password Change</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-4">
            Are you sure you want to change your password? This action cannot be undone.
          </p>
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
    </div>
  );
}

