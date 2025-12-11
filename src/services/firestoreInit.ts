import { collection, addDoc, getDocs, query, where, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Initialize Firestore with default admin user
 */
export async function initializeFirestore() {
  try {
    // Check if admin user already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', 'admin'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Add default admin user
      await addDoc(usersRef, {
        username: 'admin',
        email: 'pgocasting@gmail.com',
        name: 'Admin',
        role: 'admin',
        password: 'admin123',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log('✅ Admin user created in Firestore');
    } else {
      console.log('✅ Admin user already exists in Firestore');
    }
  } catch (error) {
    console.error('Error initializing Firestore:', error);
  }
}

/**
 * Add user to Firestore
 */
export async function addUserToFirestore(userData: any) {
  try {
    const usersRef = collection(db, 'users');
    const docRef = await addDoc(usersRef, {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding user to Firestore:', error);
    throw error;
  }
}

/**
 * Get all users from Firestore
 */
export async function getUsersFromFirestore() {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users from Firestore:', error);
    throw error;
  }
}

/**
 * Delete user from Firestore
 */
export async function deleteUserFromFirestore(userId: string) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('id', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(db, 'users', querySnapshot.docs[0].id);
      await deleteDoc(docRef);
    }
  } catch (error) {
    console.error('Error deleting user from Firestore:', error);
    throw error;
  }
}
