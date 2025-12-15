// Local Storage Service - Replaces Firestore for data persistence

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
  status: 'Pending' | 'Completed';
  dateTimeIn: string;
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

// Helper functions
const getStorageKey = (collection: string) => `pgo_${collection}`;
const getCurrentTimestamp = () => new Date().toISOString();

// Generic storage operations
const getItems = <T>(collection: string): T[] => {
  try {
    const data = localStorage.getItem(getStorageKey(collection));
    if (!data) return [];
    
    const items = JSON.parse(data);
    
    // Ensure all items have unique IDs - assign them if missing and persist
    let needsSave = false;
    const updatedItems = items.map((item: any) => {
      if (!item.id) {
        item.id = `${collection}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        needsSave = true;
      }
      return item;
    });
    
    // Persist ID assignments back to storage to ensure consistency
    if (needsSave) {
      localStorage.setItem(getStorageKey(collection), JSON.stringify(updatedItems));
    }
    
    return updatedItems;
  } catch (error) {
    console.error(`Error getting ${collection}:`, error);
    return [];
  }
};

const saveItems = <T>(collection: string, items: T[]): void => {
  try {
    localStorage.setItem(getStorageKey(collection), JSON.stringify(items));
  } catch (error) {
    console.error(`Error saving ${collection}:`, error);
  }
};

const addItem = <T extends { id?: string }>(collection: string, item: T): T & { id: string } => {
  const items = getItems<T>(collection);
  const newItem = {
    ...item,
    id: item.id || `${collection}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp()
  } as T & { id: string };
  items.push(newItem);
  saveItems(collection, items);
  return newItem;
};

const updateItem = <T extends { id: string }>(collection: string, id: string, updates: Partial<T>): T | null => {
  const items = getItems<T>(collection);
  const index = items.findIndex(item => item.id === id);
  
  if (index === -1) {
    console.warn(`Item with id ${id} not found in ${collection}`);
    return null;
  }
  
  items[index] = {
    ...items[index],
    ...updates,
    updatedAt: getCurrentTimestamp()
  };
  
  saveItems(collection, items);
  return items[index];
};

const deleteItem = (collection: string, id: string): boolean => {
  const items = getItems<any>(collection);
  const filteredItems = items.filter(item => item.id !== id);
  
  if (filteredItems.length === items.length) {
    console.warn(`Item with id ${id} not found in ${collection}`);
    return false;
  }
  
  saveItems(collection, filteredItems);
  return true;
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

// Designation Service
export const designationService = {
  async getDesignations() {
    try {
      const data = localStorage.getItem('pgo_designations');
      return data ? JSON.parse(data) : ['Admin', 'Manager', 'Staff', 'Officer'];
    } catch (error) {
      console.error('Error getting designations:', error);
      return ['Admin', 'Manager', 'Staff', 'Officer'];
    }
  },

  async setDesignations(designations: string[]) {
    try {
      localStorage.setItem('pgo_designations', JSON.stringify(designations));
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
        designations.push(designation);
        await this.setDesignations(designations);
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
      const filteredDesignations = designations.filter((d: string) => d !== designation);
      await this.setDesignations(filteredDesignations);
      return true;
    } catch (error) {
      console.error('Error deleting designation:', error);
      return false;
    }
  }
};

// Utility functions for data management
export const localStorageUtils = {
  // Clear all data
  clearAllData() {
    const collections = ['vouchers', 'letters', 'leaves', 'locators', 'adminToPGO', 'others', 'travelOrders', 'overtimes'];
    collections.forEach(collection => {
      localStorage.removeItem(getStorageKey(collection));
    });
  },

  // Export data
  exportData() {
    const collections = ['vouchers', 'letters', 'leaves', 'locators', 'adminToPGO', 'others', 'travelOrders', 'overtimes'];
    const data: any = {};
    collections.forEach(collection => {
      data[collection] = getItems(collection);
    });
    return data;
  },

  // Import data
  importData(data: any) {
    Object.keys(data).forEach(collection => {
      saveItems(collection, data[collection]);
    });
  },

  // Get statistics
  getStats() {
    const collections = ['vouchers', 'letters', 'leaves', 'locators', 'adminToPGO', 'others', 'travelOrders', 'overtimes'];
    const stats: any = {};
    collections.forEach(collection => {
      const items = getItems(collection);
      stats[collection] = {
        total: items.length,
        pending: items.filter((item: any) => item.status === 'Pending').length,
        completed: items.filter((item: any) => item.status === 'Completed').length
      };
    });
    return stats;
  }
};
