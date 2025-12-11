import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// Letter Records
export const letterService = {
  async addLetter(letterData: any) {
    try {
      const lettersRef = collection(db, 'letters');
      const docRef = await addDoc(lettersRef, {
        ...letterData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding letter:', error);
      throw error;
    }
  },

  async getLetters() {
    try {
      const lettersRef = collection(db, 'letters');
      const q = query(lettersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting letters:', error);
      throw error;
    }
  },

  async updateLetter(letterId: string, letterData: any) {
    try {
      const letterRef = doc(db, 'letters', letterId);
      await updateDoc(letterRef, {
        ...letterData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating letter:', error);
      throw error;
    }
  },

  async deleteLetter(letterId: string) {
    try {
      const letterRef = doc(db, 'letters', letterId);
      await deleteDoc(letterRef);
    } catch (error) {
      console.error('Error deleting letter:', error);
      throw error;
    }
  }
};

// Leave Records
export const leaveService = {
  async addLeave(leaveData: any) {
    try {
      const leavesRef = collection(db, 'leaves');
      const docRef = await addDoc(leavesRef, {
        ...leaveData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding leave:', error);
      throw error;
    }
  },

  async getLeaves() {
    try {
      const leavesRef = collection(db, 'leaves');
      const q = query(leavesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting leaves:', error);
      throw error;
    }
  },

  async updateLeave(leaveId: string, leaveData: any) {
    try {
      const leaveRef = doc(db, 'leaves', leaveId);
      await updateDoc(leaveRef, {
        ...leaveData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating leave:', error);
      throw error;
    }
  },

  async deleteLeave(leaveId: string) {
    try {
      const leaveRef = doc(db, 'leaves', leaveId);
      await deleteDoc(leaveRef);
    } catch (error) {
      console.error('Error deleting leave:', error);
      throw error;
    }
  }
};

// Locator Records
export const locatorService = {
  async addLocator(locatorData: any) {
    try {
      const locatorsRef = collection(db, 'locators');
      const docRef = await addDoc(locatorsRef, {
        ...locatorData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding locator:', error);
      throw error;
    }
  },

  async getLocators() {
    try {
      const locatorsRef = collection(db, 'locators');
      const q = query(locatorsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting locators:', error);
      throw error;
    }
  },

  async updateLocator(locatorId: string, locatorData: any) {
    try {
      const locatorRef = doc(db, 'locators', locatorId);
      await updateDoc(locatorRef, {
        ...locatorData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating locator:', error);
      throw error;
    }
  },

  async deleteLocator(locatorId: string) {
    try {
      const locatorRef = doc(db, 'locators', locatorId);
      await deleteDoc(locatorRef);
    } catch (error) {
      console.error('Error deleting locator:', error);
      throw error;
    }
  }
};

// Admin to PGO Records
export const adminToPGOService = {
  async addRecord(recordData: any) {
    try {
      const recordsRef = collection(db, 'adminToPGO');
      const docRef = await addDoc(recordsRef, {
        ...recordData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  async getRecords() {
    try {
      const recordsRef = collection(db, 'adminToPGO');
      const q = query(recordsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting records:', error);
      throw error;
    }
  },

  async updateRecord(recordId: string, recordData: any) {
    try {
      const recordRef = doc(db, 'adminToPGO', recordId);
      await updateDoc(recordRef, {
        ...recordData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  async deleteRecord(recordId: string) {
    try {
      const recordRef = doc(db, 'adminToPGO', recordId);
      await deleteDoc(recordRef);
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

// Others Records
export const othersService = {
  async addRecord(recordData: any) {
    try {
      const recordsRef = collection(db, 'others');
      const docRef = await addDoc(recordsRef, {
        ...recordData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  async getRecords() {
    try {
      const recordsRef = collection(db, 'others');
      const q = query(recordsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting records:', error);
      throw error;
    }
  },

  async updateRecord(recordId: string, recordData: any) {
    try {
      const recordRef = doc(db, 'others', recordId);
      await updateDoc(recordRef, {
        ...recordData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  async deleteRecord(recordId: string) {
    try {
      const recordRef = doc(db, 'others', recordId);
      await deleteDoc(recordRef);
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

// Designations
export const designationService = {
  async getDesignations() {
    try {
      const designationsRef = collection(db, 'designations');
      const querySnapshot = await getDocs(designationsRef);
      const docs = querySnapshot.docs;
      
      if (docs.length === 0) {
        return [];
      }
      
      // Get the first document which contains the array of designations
      const data = docs[0].data();
      return data.list || [];
    } catch (error) {
      console.error('Error getting designations:', error);
      throw error;
    }
  },

  async setDesignations(designations: string[]) {
    try {
      const designationsRef = collection(db, 'designations');
      const querySnapshot = await getDocs(designationsRef);
      
      if (querySnapshot.docs.length === 0) {
        // Create new document if it doesn't exist
        await addDoc(designationsRef, {
          list: designations,
          updatedAt: Timestamp.now()
        });
      } else {
        // Update existing document
        const docRef = doc(db, 'designations', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          list: designations,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error setting designations:', error);
      throw error;
    }
  },

  async addDesignation(designation: string) {
    try {
      const currentDesignations = await this.getDesignations();
      const updated = [...currentDesignations, designation];
      await this.setDesignations(updated);
      return updated;
    } catch (error) {
      console.error('Error adding designation:', error);
      throw error;
    }
  },

  async updateDesignation(oldDesignation: string, newDesignation: string) {
    try {
      const currentDesignations = await this.getDesignations();
      const updated = currentDesignations.map((d: string) => d === oldDesignation ? newDesignation : d);
      await this.setDesignations(updated);
      return updated;
    } catch (error) {
      console.error('Error updating designation:', error);
      throw error;
    }
  },

  async deleteDesignation(designation: string) {
    try {
      const currentDesignations = await this.getDesignations();
      const updated = currentDesignations.filter((d: string) => d !== designation);
      await this.setDesignations(updated);
      return updated;
    } catch (error) {
      console.error('Error deleting designation:', error);
      throw error;
    }
  }
};
