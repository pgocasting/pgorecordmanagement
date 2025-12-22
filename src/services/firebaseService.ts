import { db } from '@/config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

// Interfaces
interface Voucher {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  dvNo: string;
  payee: string;
  particulars: string;
  designationOffice: string;
  amount: number;
  voucherType: string;
  funds: string;
  status: string;
  remarks?: string;
  timeOutRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

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
  timeOutRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface Leave {
  id: string;
  trackingId: string;
  receivedBy: string;
  fullName: string;
  designation: string;
  leaveType: string;
  inclusiveDateStart: string;
  inclusiveDateEnd: string;
  purpose: string;
  status: 'Pending' | 'Completed' | 'Rejected';
  dateTimeIn: string;
  dateTimeOut?: string;
  remarks?: string;
  timeOutRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface Locator {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designation: string;
  inclusiveDateStart: string;
  inclusiveDateEnd: string;
  inclusiveTimeStart: string;
  inclusiveTimeEnd: string;
  purpose: string;
  placeOfAssignment: string;
  status: string;
  remarks: string;
  timeOutRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminToPGO {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  officeAddress: string;
  particulars: string;
  status: string;
  remarks: string;
  timeOutRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface Others {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designationOffice: string;
  inclusiveDateStart?: string;
  inclusiveDateEnd?: string;
  inclusiveTimeStart?: string;
  inclusiveTimeEnd?: string;
  purpose: string;
  amount?: string;
  linkAttachments?: string;
  status: string;
  remarks?: string;
  timeOutRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface ObligationRequest {
  id: string;
  trackingId: string;
  receivedBy: string;
  type?: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designation?: string;
  obligationType?: string;
  amount: number;
  particulars?: string;
  status: string;
  remarks: string;
  timeOutRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface PurchaseRequest {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designation: string;
  itemDescription: string;
  quantity: number;
  estimatedCost: number;
  purpose: string;
  status: string;
  remarks: string;
  timeOutRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface TravelOrder {
  id: string;
  trackingId: string;
  receivedBy?: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designation: string;
  inclusiveDateStart: string;
  inclusiveDateEnd: string;
  inclusiveTimeStart: string;
  inclusiveTimeEnd: string;
  purpose: string;
  placeOfAssignment: string;
  status: string;
  remarks: string;
  timeOutRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface Overtime {
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
  timeOutRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

const getCurrentTimestamp = () => new Date().toISOString();

// Generic CRUD operations
const addItem = async <T extends { id?: string }>(collectionName: string, item: T): Promise<T & { id: string }> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...item,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    });
    return {
      ...item,
      id: docRef.id,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    } as T & { id: string };
  } catch (error) {
    console.error(`Error adding item to ${collectionName}:`, error);
    throw error;
  }
};

const getItems = async <T extends { id: string }>(collectionName: string): Promise<T[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as T));
  } catch (error) {
    console.error(`Error getting items from ${collectionName}:`, error);
    return [];
  }
};

const updateItem = async <T extends { id: string }>(collectionName: string, id: string, updates: Partial<T>): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: getCurrentTimestamp()
    });
    const updatedDoc = await getDocs(collection(db, collectionName));
    const updated = updatedDoc.docs.find(d => d.id === id);
    return updated ? { ...updated.data(), id: updated.id } as T : null;
  } catch (error) {
    console.error(`Error updating item in ${collectionName}:`, error);
    throw error;
  }
};

const deleteItem = async (collectionName: string, id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (error) {
    console.error(`Error deleting item from ${collectionName}:`, error);
    return false;
  }
};

// Voucher Service
export const voucherService = {
  async addVoucher(voucherData: any) {
    return addItem<Voucher>('vouchers', voucherData);
  },

  async getVouchers() {
    return getItems<Voucher>('vouchers');
  },

  async updateVoucher(voucherId: string, voucherData: any) {
    return updateItem<Voucher>('vouchers', voucherId, voucherData);
  },

  async deleteVoucher(voucherId: string) {
    return deleteItem('vouchers', voucherId);
  }
};

// Letter Service
export const letterService = {
  async addLetter(letterData: any) {
    return addItem<Letter>('letters', letterData);
  },

  async getLetters() {
    return getItems<Letter>('letters');
  },

  async updateLetter(letterId: string, letterData: any) {
    return updateItem<Letter>('letters', letterId, letterData);
  },

  async deleteLetter(letterId: string) {
    return deleteItem('letters', letterId);
  }
};

// Leave Service
export const leaveService = {
  async addLeave(leaveData: any) {
    return addItem<Leave>('leaves', leaveData);
  },

  async getLeaves() {
    return getItems<Leave>('leaves');
  },

  async updateLeave(leaveId: string, leaveData: any) {
    return updateItem<Leave>('leaves', leaveId, leaveData);
  },

  async deleteLeave(leaveId: string) {
    return deleteItem('leaves', leaveId);
  }
};

// Locator Service
export const locatorService = {
  async addLocator(locatorData: any) {
    return addItem<Locator>('locators', locatorData);
  },

  async getLocators() {
    return getItems<Locator>('locators');
  },

  async updateLocator(locatorId: string, locatorData: any) {
    return updateItem<Locator>('locators', locatorId, locatorData);
  },

  async deleteLocator(locatorId: string) {
    return deleteItem('locators', locatorId);
  }
};

// Admin to PGO Service
export const adminToPGOService = {
  async addRecord(recordData: any) {
    return addItem<AdminToPGO>('adminToPGO', recordData);
  },

  async getRecords() {
    return getItems<AdminToPGO>('adminToPGO');
  },

  async updateRecord(recordId: string, recordData: any) {
    return updateItem<AdminToPGO>('adminToPGO', recordId, recordData);
  },

  async deleteRecord(recordId: string) {
    return deleteItem('adminToPGO', recordId);
  }
};

// Others Service
export const othersService = {
  async addRecord(recordData: any) {
    return addItem<Others>('others', recordData);
  },

  async getRecords() {
    return getItems<Others>('others');
  },

  async updateRecord(recordId: string, recordData: any) {
    return updateItem<Others>('others', recordId, recordData);
  },

  async deleteRecord(recordId: string) {
    return deleteItem('others', recordId);
  }
};

// Travel Order Service
export const travelOrderService = {
  async addTravelOrder(travelOrderData: any) {
    return addItem<TravelOrder>('travelOrders', travelOrderData);
  },

  async getTravelOrders() {
    return getItems<TravelOrder>('travelOrders');
  },

  async updateTravelOrder(travelOrderId: string, travelOrderData: any) {
    return updateItem<TravelOrder>('travelOrders', travelOrderId, travelOrderData);
  },

  async deleteTravelOrder(travelOrderId: string) {
    return deleteItem('travelOrders', travelOrderId);
  }
};

// Overtime Service
export const overtimeService = {
  async addOvertime(overtimeData: any) {
    return addItem<Overtime>('overtimes', overtimeData);
  },

  async getOvertimes() {
    return getItems<Overtime>('overtimes');
  },

  async updateOvertime(overtimeId: string, overtimeData: any) {
    return updateItem<Overtime>('overtimes', overtimeId, overtimeData);
  },

  async deleteOvertime(overtimeId: string) {
    return deleteItem('overtimes', overtimeId);
  }
};

// Obligation Request Service
export const obligationRequestService = {
  async addObligationRequest(obligationRequestData: any) {
    return addItem<ObligationRequest>('obligationRequests', obligationRequestData);
  },

  async getObligationRequests() {
    return getItems<ObligationRequest>('obligationRequests');
  },

  async updateObligationRequest(obligationRequestId: string, obligationRequestData: any) {
    return updateItem<ObligationRequest>('obligationRequests', obligationRequestId, obligationRequestData);
  },

  async deleteObligationRequest(obligationRequestId: string) {
    return deleteItem('obligationRequests', obligationRequestId);
  }
};

// Purchase Request Service
export const purchaseRequestService = {
  async addPurchaseRequest(purchaseRequestData: any) {
    return addItem<PurchaseRequest>('purchaseRequests', purchaseRequestData);
  },

  async getPurchaseRequests() {
    return getItems<PurchaseRequest>('purchaseRequests');
  },

  async updatePurchaseRequest(purchaseRequestId: string, purchaseRequestData: any) {
    return updateItem<PurchaseRequest>('purchaseRequests', purchaseRequestId, purchaseRequestData);
  },

  async deletePurchaseRequest(purchaseRequestId: string) {
    return deleteItem('purchaseRequests', purchaseRequestId);
  }
};

// Processing Service
export const processingService = {
  async addRecord(recordData: any) {
    return addItem<Processing>('processings', recordData);
  },

  async getRecords() {
    return getItems<Processing>('processings');
  },

  async updateRecord(recordId: string, recordData: any) {
    return updateItem<Processing>('processings', recordId, recordData);
  },

  async deleteRecord(recordId: string) {
    return deleteItem('processings', recordId);
  }
};

// Designation Service
interface Processing {
  id: string;
  trackingId: string;
  receivedBy: string;
  dateTimeIn: string;
  dateTimeOut?: string;
  fullName: string;
  designationOffice: string;
  purpose: string;
  amount?: number;
  status: string;
  remarks: string;
  remarksHistory: Array<{
    remarks: string;
    status: string;
    timestamp: string;
    updatedBy: string;
  }>;
  timeOutRemarks?: string;
  linkAttachments?: string;
  createdAt: string;
  updatedAt: string;
}

interface Designation {
  id: string;
  name: string;
}

export const designationService = {
  async getDesignations() {
    try {
      const designations = await getItems<Designation>('designations');
      return designations.length > 0 ? designations.map(d => d.name) : ['Admin', 'Manager', 'Staff', 'Officer'];
    } catch (error) {
      console.error('Error getting designations:', error);
      return ['Admin', 'Manager', 'Staff', 'Officer'];
    }
  },

  async setDesignations(designations: string[]) {
    try {
      const existingDocs = await getItems<Designation>('designations');
      for (const existingDoc of existingDocs) {
        await deleteItem('designations', existingDoc.id);
      }
      for (const designation of designations) {
        await addItem<Designation>('designations', { name: designation } as any);
      }
      return true;
    } catch (error) {
      console.error('Error setting designations:', error);
      return false;
    }
  },

  async addDesignation(designation: string) {
    try {
      const designations = await this.getDesignations();
      if (!designations.includes(designation)) {
        await addItem<Designation>('designations', { name: designation } as any);
      }
      return true;
    } catch (error) {
      console.error('Error adding designation:', error);
      return false;
    }
  },

  async updateDesignation(oldDesignation: string, newDesignation: string) {
    try {
      const designations = await this.getDesignations();
      const index = designations.indexOf(oldDesignation);
      if (index !== -1) {
        designations[index] = newDesignation;
        await this.setDesignations(designations);
      }
      return true;
    } catch (error) {
      console.error('Error updating designation:', error);
      return false;
    }
  },

  async deleteDesignation(designation: string) {
    try {
      const designations = await this.getDesignations();
      const filtered = designations.filter(d => d !== designation);
      await this.setDesignations(filtered);
      return true;
    } catch (error) {
      console.error('Error deleting designation:', error);
      return false;
    }
  }
};
