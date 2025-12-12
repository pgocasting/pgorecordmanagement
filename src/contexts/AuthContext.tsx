import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signOut
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc,
  query,
  where
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { initializeFirestore } from '@/services/firestoreInit';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addUser: (email: string, password: string, name: string, role: 'admin' | 'user') => Promise<void>;
  getAllUsers: () => User[];
  deleteUser: (userId: string) => Promise<void>;
  getRecords: () => Record[];
  addRecord: (title: string, category: string, status: 'active' | 'archived' | 'pending') => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  updateRecord: (recordId: string, updates: Partial<Record>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default users - hardcoded for reliability
const DEFAULT_USERS: User[] = [
  { id: '1', username: 'admin', email: 'pgocasting@gmail.com', name: 'Admin', role: 'admin', password: 'admin123' }
];

// Default records
const DEFAULT_RECORDS: Record[] = [
  { id: '1', title: 'Record 001', date: '2024-01-15', status: 'active', category: 'Personnel' },
  { id: '2', title: 'Record 002', date: '2024-01-14', status: 'active', category: 'Finance' },
  { id: '3', title: 'Record 003', date: '2024-01-13', status: 'archived', category: 'Personnel' },
];

// In-memory storage for users and records
let inMemoryUsers = DEFAULT_USERS;
let inMemoryRecords = DEFAULT_RECORDS;

const getStoredUsers = (): User[] => {
  return inMemoryUsers;
};

const saveStoredUsers = (users: User[]): void => {
  inMemoryUsers = users;
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
    localStorage.setItem('currentUser', JSON.stringify(user));
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

  // Initialize on mount
  useEffect(() => {
    // Initialize Firestore with default admin user
    initializeFirestore().catch(error => {
      console.error('Failed to initialize Firestore:', error);
      // Fallback to localStorage
      saveStoredUsers(DEFAULT_USERS);
    });

    // Reset to default users on initialization
    saveStoredUsers(DEFAULT_USERS);

    // Load current user from localStorage
    const currentUser = getStoredCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      // Fallback to localStorage authentication using username
      const allUsers = getStoredUsers();
      const foundUser = allUsers.find((u: User) => u.username === username && u.password === password);
      
      if (foundUser) {
        setUser(foundUser);
        saveStoredCurrentUser(foundUser);
      } else {
        throw new Error('Invalid username or password');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Firebase logout error:', error);
    }
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const addUser = async (username: string, password: string, name: string, role: 'admin' | 'user', email?: string): Promise<void> => {
    try {
      // Fallback to localStorage
      const allUsers = getStoredUsers();
      
      if (allUsers.some(u => u.username === username)) {
        throw new Error('Username already exists');
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        username,
        email: email || `${username}@pgo.local`,
        name,
        role,
        password
      };
      
      const updatedUsers = [...allUsers, newUser];
      saveStoredUsers(updatedUsers);
    } catch (error) {
      throw error;
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    try {
      // Try to delete from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'users', querySnapshot.docs[0].id);
        await deleteDoc(docRef);
      }
    } catch (firebaseError) {
      // Fallback to localStorage
      const allUsers = getStoredUsers();
      const updatedUsers = allUsers.filter(u => u.id !== userId);
      
      if (updatedUsers.length === allUsers.length) {
        throw new Error('User not found');
      }
      
      saveStoredUsers(updatedUsers);
    }
  };

  const getAllUsers = () => getStoredUsers();

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
      login, 
      logout, 
      addUser, 
      getAllUsers,
      deleteUser,
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
