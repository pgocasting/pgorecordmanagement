import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// Voucher Records
export const voucherService = {
  async addVoucher(voucherData: any) {
    try {
      const voucherId = Date.now().toString();
      const voucherRef = doc(db, 'vouchers', voucherId);
      await setDoc(voucherRef, {
        id: voucherId,
        ...voucherData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return voucherId;
    } catch (error) {
      console.error('Error adding voucher:', error);
      throw error;
    }
  },

  async getVouchers() {
    try {
      const vouchersRef = collection(db, 'vouchers');
      const q = query(vouchersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure id field matches the document ID
          ...(data.id !== doc.id && { id: doc.id })
        };
      });
    } catch (error) {
      console.error('Error getting vouchers:', error);
      throw error;
    }
  },

  async updateVoucher(voucherId: string, voucherData: any) {
    try {
      const voucherRef = doc(db, 'vouchers', voucherId);
      await setDoc(voucherRef, {
        id: voucherId,
        ...voucherData,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (error: any) {
      console.error('Error updating voucher:', error);
      throw error;
    }
  },

  async deleteVoucher(voucherId: string) {
    try {
      const voucherRef = doc(db, 'vouchers', voucherId);
      await deleteDoc(voucherRef);
    } catch (error: any) {
      // Silently handle "not-found" errors since the document is already gone
      if (error.code === 'not-found') {
        console.warn(`Voucher with ID ${voucherId} does not exist. Continuing with deletion.`);
        return;
      }
      console.error('Error deleting voucher:', error);
      throw error;
    }
  }
};

// Letter Records
export const letterService = {
  async addLetter(letterData: any) {
    try {
      const letterId = Date.now().toString();
      const letterRef = doc(db, 'letters', letterId);
      await setDoc(letterRef, {
        id: letterId,
        ...letterData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return letterId;
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
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          ...(data.id !== doc.id && { id: doc.id })
        };
      });
    } catch (error) {
      console.error('Error getting letters:', error);
      throw error;
    }
  },

  async updateLetter(letterId: string, letterData: any) {
    try {
      const letterRef = doc(db, 'letters', letterId);
      await setDoc(letterRef, {
        id: letterId,
        ...letterData,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (error: any) {
      console.error('Error updating letter:', error);
      throw error;
    }
  },

  async deleteLetter(letterId: string) {
    try {
      const letterRef = doc(db, 'letters', letterId);
      await deleteDoc(letterRef);
    } catch (error: any) {
      if (error.code === 'not-found') {
        console.warn(`Letter with ID ${letterId} does not exist. Continuing with deletion.`);
        return;
      }
      console.error('Error deleting letter:', error);
      throw error;
    }
  }
};

// Leave Records
export const leaveService = {
  async addLeave(leaveData: any) {
    try {
      const leaveId = Date.now().toString();
      const leaveRef = doc(db, 'leaves', leaveId);
      await setDoc(leaveRef, {
        id: leaveId,
        ...leaveData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return leaveId;
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
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          ...(data.id !== doc.id && { id: doc.id })
        };
      });
    } catch (error) {
      console.error('Error getting leaves:', error);
      throw error;
    }
  },

  async updateLeave(leaveId: string, leaveData: any) {
    try {
      const leaveRef = doc(db, 'leaves', leaveId);
      await setDoc(leaveRef, {
        id: leaveId,
        ...leaveData,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (error: any) {
      console.error('Error updating leave:', error);
      throw error;
    }
  },

  async deleteLeave(leaveId: string) {
    try {
      const leaveRef = doc(db, 'leaves', leaveId);
      await deleteDoc(leaveRef);
    } catch (error: any) {
      if (error.code === 'not-found') {
        console.warn(`Leave with ID ${leaveId} does not exist. Continuing with deletion.`);
        return;
      }
      console.error('Error deleting leave:', error);
      throw error;
    }
  }
};

// Locator Records
export const locatorService = {
  async addLocator(locatorData: any) {
    try {
      const locatorId = Date.now().toString();
      const locatorRef = doc(db, 'locators', locatorId);
      await setDoc(locatorRef, {
        id: locatorId,
        ...locatorData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return locatorId;
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
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          ...(data.id !== doc.id && { id: doc.id })
        };
      });
    } catch (error) {
      console.error('Error getting locators:', error);
      throw error;
    }
  },

  async updateLocator(locatorId: string, locatorData: any) {
    try {
      const locatorRef = doc(db, 'locators', locatorId);
      await setDoc(locatorRef, {
        id: locatorId,
        ...locatorData,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (error: any) {
      console.error('Error updating locator:', error);
      throw error;
    }
  },

  async deleteLocator(locatorId: string) {
    try {
      const locatorRef = doc(db, 'locators', locatorId);
      await deleteDoc(locatorRef);
    } catch (error: any) {
      if (error.code === 'not-found') {
        console.warn(`Locator with ID ${locatorId} does not exist. Continuing with deletion.`);
        return;
      }
      console.error('Error deleting locator:', error);
      throw error;
    }
  }
};

// Admin to PGO Records
export const adminToPGOService = {
  async addRecord(recordData: any) {
    try {
      const recordId = Date.now().toString();
      const recordRef = doc(db, 'adminToPGO', recordId);
      await setDoc(recordRef, {
        id: recordId,
        ...recordData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return recordId;
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
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          ...(data.id !== doc.id && { id: doc.id })
        };
      });
    } catch (error) {
      console.error('Error getting records:', error);
      throw error;
    }
  },

  async updateRecord(recordId: string, recordData: any) {
    try {
      const recordRef = doc(db, 'adminToPGO', recordId);
      await setDoc(recordRef, {
        id: recordId,
        ...recordData,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (error: any) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  async deleteRecord(recordId: string) {
    try {
      const recordRef = doc(db, 'adminToPGO', recordId);
      await deleteDoc(recordRef);
    } catch (error: any) {
      if (error.code === 'not-found') {
        console.warn(`Record with ID ${recordId} does not exist. Continuing with deletion.`);
        return;
      }
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

// Others Records
export const othersService = {
  async addRecord(recordData: any) {
    try {
      const recordId = Date.now().toString();
      const recordRef = doc(db, 'others', recordId);
      await setDoc(recordRef, {
        id: recordId,
        ...recordData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return recordId;
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
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          ...(data.id !== doc.id && { id: doc.id })
        };
      });
    } catch (error) {
      console.error('Error getting records:', error);
      throw error;
    }
  },

  async updateRecord(recordId: string, recordData: any) {
    try {
      const recordRef = doc(db, 'others', recordId);
      await setDoc(recordRef, {
        id: recordId,
        ...recordData,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (error: any) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  async deleteRecord(recordId: string) {
    try {
      const recordRef = doc(db, 'others', recordId);
      await deleteDoc(recordRef);
    } catch (error: any) {
      if (error.code === 'not-found') {
        console.warn(`Record with ID ${recordId} does not exist. Continuing with deletion.`);
        return;
      }
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

// Travel Order Records
export const travelOrderService = {
  async addTravelOrder(travelOrderData: any) {
    try {
      const travelOrderId = Date.now().toString();
      const travelOrderRef = doc(db, 'travelOrders', travelOrderId);
      await setDoc(travelOrderRef, {
        id: travelOrderId,
        ...travelOrderData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return travelOrderId;
    } catch (error) {
      console.error('Error adding travel order:', error);
      throw error;
    }
  },

  async getTravelOrders() {
    try {
      const travelOrderRef = collection(db, 'travelOrders');
      const q = query(travelOrderRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          ...(data.id !== doc.id && { id: doc.id })
        };
      });
    } catch (error) {
      console.error('Error getting travel orders:', error);
      throw error;
    }
  },

  async updateTravelOrder(travelOrderId: string, travelOrderData: any) {
    try {
      const travelOrderRef = doc(db, 'travelOrders', travelOrderId);
      await setDoc(travelOrderRef, {
        id: travelOrderId,
        ...travelOrderData,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (error: any) {
      console.error('Error updating travel order:', error);
      throw error;
    }
  },

  async deleteTravelOrder(travelOrderId: string) {
    try {
      const travelOrderRef = doc(db, 'travelOrders', travelOrderId);
      await deleteDoc(travelOrderRef);
    } catch (error: any) {
      if (error.code === 'not-found') {
        console.warn(`Travel order with ID ${travelOrderId} does not exist. Continuing with deletion.`);
        return;
      }
      console.error('Error deleting travel order:', error);
      throw error;
    }
  }
};

// Request for Overtime Records
export const overtimeService = {
  async addOvertime(overtimeData: any) {
    try {
      const overtimeId = Date.now().toString();
      const overtimeRef = doc(db, 'overtimes', overtimeId);
      await setDoc(overtimeRef, {
        id: overtimeId,
        ...overtimeData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return overtimeId;
    } catch (error) {
      console.error('Error adding overtime:', error);
      throw error;
    }
  },

  async getOvertimes() {
    try {
      const overtimeRef = collection(db, 'overtimes');
      const q = query(overtimeRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          ...(data.id !== doc.id && { id: doc.id })
        };
      });
    } catch (error) {
      console.error('Error getting overtimes:', error);
      throw error;
    }
  },

  async updateOvertime(overtimeId: string, overtimeData: any) {
    try {
      const overtimeRef = doc(db, 'overtimes', overtimeId);
      await setDoc(overtimeRef, {
        id: overtimeId,
        ...overtimeData,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (error: any) {
      console.error('Error updating overtime:', error);
      throw error;
    }
  },

  async deleteOvertime(overtimeId: string) {
    try {
      const overtimeRef = doc(db, 'overtimes', overtimeId);
      await deleteDoc(overtimeRef);
    } catch (error: any) {
      if (error.code === 'not-found') {
        console.warn(`Overtime with ID ${overtimeId} does not exist. Continuing with deletion.`);
        return;
      }
      console.error('Error deleting overtime:', error);
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
        const designationId = 'default';
        const docRef = doc(db, 'designations', designationId);
        await setDoc(docRef, {
          id: designationId,
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
