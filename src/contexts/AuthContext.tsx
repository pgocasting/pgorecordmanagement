import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  password: string;
}

interface Record {
  id: string;
  title: string;
  date: string;
  status: 'active' | 'archived' | 'pending';
  category: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addUser: (email: string, password: string, name: string, role: 'admin' | 'user') => Promise<void>;
  getAllUsers: () => User[];
  deleteUser: (userId: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  getRecords: () => Record[];
  addRecord: (title: string, category: string, status: 'active' | 'archived' | 'pending') => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  updateRecord: (recordId: string, updates: Partial<Record>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default users - hardcoded for reliability
const DEFAULT_USERS: User[] = [
  { id: '1', username: 'admin', email: 'admin@pgocasting.com', name: 'Administrator', role: 'admin', password: 'admin123' }
];

// Default records
const DEFAULT_RECORDS: Record[] = [
  { id: '1', title: 'Record 001', date: '2024-01-15', status: 'active', category: 'Personnel' },
  { id: '2', title: 'Record 002', date: '2024-01-14', status: 'active', category: 'Finance' },
  { id: '3', title: 'Record 003', date: '2024-01-13', status: 'archived', category: 'Personnel' },
];

// In-memory storage for users and records
let inMemoryUsers = [...DEFAULT_USERS];
let inMemoryRecords = DEFAULT_RECORDS;

// Force admin user to have admin role
inMemoryUsers = inMemoryUsers.map(u => 
  u.username === 'admin' ? { ...u, role: 'admin' as const } : u
);

const getStoredUsers = (): User[] => {
  // Ensure admin user always has admin role and correct name
  const users = inMemoryUsers.map(u => 
    u.username === 'admin' ? { ...u, role: 'admin' as const, name: 'Administrator' } : u
  );
  return users;
};

const saveStoredUsers = (users: User[]): void => {
  // Ensure admin user always has admin role before saving
  const ensuredUsers = users.map(u => 
    u.username === 'admin' ? { ...u, role: 'admin' as const } : u
  );
  inMemoryUsers = ensuredUsers;
};

const getStoredCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveStoredCurrentUser = (user: User): void => {
  try {
    // Ensure admin user always has admin role and correct name
    const userToSave = user.username === 'admin' ? { ...user, role: 'admin' as const, name: 'Administrator' } : user;
    localStorage.setItem('currentUser', JSON.stringify(userToSave));
  } catch {
    console.error('Failed to save current user to localStorage');
  }
};

const getStoredRecords = (): Record[] => {
  return inMemoryRecords;
};

const saveStoredRecords = (records: Record[]): void => {
  inMemoryRecords = records;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    const initializeUsers = async () => {
      try {
        // Try to load users from Firebase
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        if (!querySnapshot.empty) {
          const firebaseUsers: User[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as User));
          // Merge Firebase users with default admin user to ensure admin always exists
          const mergedUsers = [...DEFAULT_USERS, ...firebaseUsers.filter(u => u.username !== 'admin')];
          
          // Ensure admin user always has admin role
          const ensuredUsers = mergedUsers.map(u => 
            u.username === 'admin' ? { ...u, role: 'admin' as const } : u
          );
          
          saveStoredUsers(ensuredUsers);
        } else {
          // If no users in Firebase, use default users
          saveStoredUsers(DEFAULT_USERS);
        }
      } catch (error) {
        console.warn('Failed to load users from Firebase, using default users:', error);
        // Fallback to default users
        saveStoredUsers(DEFAULT_USERS);
      }

      // Load current user from localStorage
      let currentUser = getStoredCurrentUser();
      if (currentUser) {
        // Ensure admin user always has admin role
        if (currentUser.username === 'admin' && currentUser.role !== 'admin') {
          currentUser.role = 'admin';
          saveStoredCurrentUser(currentUser);
        }
        setUser(currentUser);
      }
      
      // Also ensure all stored users have correct admin role
      const allStoredUsers = getStoredUsers();
      const adminUser = allStoredUsers.find(u => u.username === 'admin');
      if (adminUser && adminUser.role !== 'admin') {
        const correctedUsers = allStoredUsers.map(u => 
          u.username === 'admin' ? { ...u, role: 'admin' as const } : u
        );
        saveStoredUsers(correctedUsers);
      }
      
      // Mark loading as complete
      setIsLoading(false);
    };

    initializeUsers();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      const normalizedUsername = username.toLowerCase().trim();
      
      // First check in-memory users (includes default admin)
      const allUsers = getStoredUsers();
      let foundUser = allUsers.find((u: User) => u && u.username && u.username.toLowerCase() === normalizedUsername && u.password === password);
      
      if (foundUser) {
        setUser(foundUser);
        saveStoredCurrentUser(foundUser);
        return;
      }

      // Then try Firebase if not found in memory
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', normalizedUsername));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const firebaseUser = querySnapshot.docs[0].data();
          if (firebaseUser && firebaseUser.password === password) {
            const firebaseFoundUser: User = {
              id: querySnapshot.docs[0].id,
              username: firebaseUser.username || normalizedUsername,
              email: firebaseUser.email || `${normalizedUsername}@pgocasting.com`,
              name: firebaseUser.name || normalizedUsername,
              role: firebaseUser.role || 'user',
              password: firebaseUser.password
            };
            setUser(firebaseFoundUser);
            saveStoredCurrentUser(firebaseFoundUser);
            return;
          }
        }
      } catch (firebaseError) {
        console.warn('Firebase login attempt failed:', firebaseError);
      }
      
      // No user found
      throw new Error('Invalid username or password');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const addUser = async (username: string, password: string, name: string, role: 'admin' | 'user', email?: string): Promise<void> => {
    try {
      // Check if user already exists in Firebase
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Username already exists');
      }
      
      // Follow same format as admin: proper email structure and consistent fields
      const newUser = {
        username: username.toLowerCase(), // Normalize username to lowercase like admin
        email: email || `${username.toLowerCase()}@pgocasting.com`, // Use consistent domain like admin
        name: name.trim(), // Trim whitespace
        role,
        password,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firebase
      const docRef = await addDoc(usersRef, newUser);
      
      // Also save to in-memory storage for immediate access
      const allUsers = getStoredUsers();
      const userWithId: User = {
        id: docRef.id,
        ...newUser
      };
      const updatedUsers = [...allUsers, userWithId];
      saveStoredUsers(updatedUsers);
      
      console.log('User created successfully in Firebase:', docRef.id);
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    try {
      // Delete from Firebase
      await deleteDoc(doc(db, 'users', userId));
      
      // Also remove from in-memory storage
      const allUsers = getStoredUsers();
      const updatedUsers = allUsers.filter(u => u.id !== userId);
      
      if (updatedUsers.length === allUsers.length) {
        throw new Error('User not found');
      }
      
      saveStoredUsers(updatedUsers);
      console.log('User deleted successfully from Firebase:', userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      // Prevent changing the admin user's role
      if (userId === '1' && updates.role && updates.role !== 'admin') {
        throw new Error('Cannot change the Administrator role');
      }
      
      // Update in-memory storage
      const allUsers = getStoredUsers();
      const userIndex = allUsers.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      const updatedUser = { ...allUsers[userIndex], ...updates };
      allUsers[userIndex] = updatedUser;
      saveStoredUsers(allUsers);
      
      // Update in Firebase
      try {
        await updateDoc(doc(db, 'users', userId), updates);
        console.log('User updated in Firebase:', userId);
      } catch (firebaseError) {
        console.warn('Failed to update user in Firebase, but in-memory storage updated:', firebaseError);
      }
      
      // If updating the current logged-in user, update the user state
      if (user && user.id === userId) {
        setUser(updatedUser);
        saveStoredCurrentUser(updatedUser);
      }
      
      console.log('User updated successfully:', userId);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const getAllUsers = () => {
    // Return users from in-memory storage (which is synced with Firebase)
    return getStoredUsers();
  };

  const getRecords = () => getStoredRecords();

  const addRecord = async (title: string, category: string, status: 'active' | 'archived' | 'pending'): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allRecords = getStoredRecords();
        const newRecord: Record = {
          id: Date.now().toString(),
          title,
          category,
          status,
          date: new Date().toISOString().split('T')[0]
        };
        
        const updatedRecords = [newRecord, ...allRecords];
        saveStoredRecords(updatedRecords);
        resolve();
      }, 500);
    });
  };

  const deleteRecord = async (recordId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const allRecords = getStoredRecords();
        const updatedRecords = allRecords.filter(r => r.id !== recordId);
        
        if (updatedRecords.length === allRecords.length) {
          reject(new Error('Record not found'));
          return;
        }
        
        saveStoredRecords(updatedRecords);
        resolve();
      }, 500);
    });
  };

  const updateRecord = async (recordId: string, updates: Partial<Record>): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const allRecords = getStoredRecords();
        const recordIndex = allRecords.findIndex(r => r.id === recordId);
        
        if (recordIndex === -1) {
          reject(new Error('Record not found'));
          return;
        }
        
        allRecords[recordIndex] = { ...allRecords[recordIndex], ...updates };
        saveStoredRecords(allRecords);
        resolve();
      }, 500);
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user,
      isLoading,
      login, 
      logout, 
      addUser, 
      getAllUsers,
      deleteUser,
      updateUser,
      getRecords,
      addRecord,
      deleteRecord,
      updateRecord
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
