# Firestore Migration Guide - Remove localStorage

This guide shows how to migrate each record page from localStorage to Firestore.

## Pattern Applied

### 1. Import Firestore Service
```typescript
import { letterService } from '@/services/firestoreService';
// or
import { leaveService } from '@/services/firestoreService';
import { locatorService } from '@/services/firestoreService';
import { adminToPGOService } from '@/services/firestoreService';
import { othersService } from '@/services/firestoreService';
```

### 2. Update State Initialization
**Before:**
```typescript
const [letters, setLetters] = useState<Letter[]>(() => {
  try {
    const stored = localStorage.getItem('letters');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
});
```

**After:**
```typescript
const [letters, setLetters] = useState<Letter[]>([]);
```

### 3. Replace localStorage Save with Firestore Load
**Before:**
```typescript
// Save letters to localStorage whenever they change
useEffect(() => {
  try {
    localStorage.setItem('letters', JSON.stringify(letters));
  } catch (error) {
    console.error('Error saving letters to localStorage:', error);
  }
}, [letters]);
```

**After:**
```typescript
// Load letters from Firestore on mount
useEffect(() => {
  const loadLetters = async () => {
    try {
      const data = await letterService.getLetters();
      setLetters(data as Letter[]);
    } catch (error) {
      console.error('Error loading letters:', error);
      setSuccess('Error loading letters');
      setSuccessModalOpen(true);
    }
  };
  loadLetters();
}, []);
```

### 4. Update Add/Edit Function
**Before:**
```typescript
const handleAddOrUpdate = async () => {
  // ... validation ...
  try {
    if (editingId) {
      // Update local state
      setLetters(letters.map(letter =>
        letter.id === editingId
          ? { ...letter, ...formData }
          : letter
      ));
    } else {
      // Add to local state
      const newLetter = {
        id: Date.now().toString(),
        trackingId: generateTrackingId(),
        ...formData
      };
      setLetters([...letters, newLetter]);
    }
    // Reset form...
  }
};
```

**After:**
```typescript
const handleAddOrUpdate = async () => {
  // ... validation ...
  setIsLoading(true);
  try {
    if (editingId) {
      // Update in Firestore
      await letterService.updateLetter(editingId, formData);
      setSuccess('Letter updated successfully');
    } else {
      // Add to Firestore
      const newLetter = {
        trackingId: generateTrackingId(),
        ...formData
      };
      await letterService.addLetter(newLetter);
      setSuccess('Letter added successfully');
    }
    
    // Reload from Firestore
    const updatedLetters = await letterService.getLetters();
    setLetters(updatedLetters as Letter[]);
    
    // Reset form...
    setFormData({ /* reset values */ });
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
```

### 5. Update Delete Function
**Before:**
```typescript
const handleDelete = () => {
  if (letterToDelete) {
    setLetters(letters.filter(letter => letter.id !== letterToDelete));
    setLetterToDelete(null);
    setDeleteConfirmOpen(false);
    setSuccess('Letter deleted successfully');
    setSuccessModalOpen(true);
  }
};
```

**After:**
```typescript
const handleDelete = async () => {
  if (letterToDelete) {
    try {
      await letterService.deleteLetter(letterToDelete);
      // Reload from Firestore
      const updatedLetters = await letterService.getLetters();
      setLetters(updatedLetters as Letter[]);
      setLetterToDelete(null);
      setDeleteConfirmOpen(false);
      setSuccess('Letter deleted successfully');
      setSuccessModalOpen(true);
    } catch (error) {
      console.error('Error deleting letter:', error);
      setSuccess('Error deleting letter');
      setSuccessModalOpen(true);
    }
  }
};
```

### 6. Update Time Out Function (if applicable)
**Before:**
```typescript
const confirmTimeOut = () => {
  if (letterToTimeOut && timeOutDateTime) {
    setLetters(letters.map(letter =>
      letter.id === letterToTimeOut
        ? { ...letter, dateTimeOut: timeOutDateTime, status: 'Completed' }
        : letter
    ));
    // ... reset state ...
  }
};
```

**After:**
```typescript
const confirmTimeOut = async () => {
  if (letterToTimeOut && timeOutDateTime) {
    try {
      await letterService.updateLetter(letterToTimeOut, {
        dateTimeOut: timeOutDateTime,
        status: 'Completed',
        remarks: timeOutRemarks
      });
      // Reload from Firestore
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
      setSuccess('Error recording time out');
      setSuccessModalOpen(true);
    }
  }
};
```

## Pages to Migrate

### ✅ Completed
- [x] LetterPage.tsx

### In Progress
- [ ] LeavePage.tsx - (Partially done, need to update CRUD functions)
- [ ] LocatorPage.tsx
- [ ] AdminToPGOPage.tsx
- [ ] OthersPage.tsx

## Service Methods Available

### Letter Service
```typescript
await letterService.addLetter(letterData)
await letterService.getLetters()
await letterService.updateLetter(letterId, letterData)
await letterService.deleteLetter(letterId)
```

### Leave Service
```typescript
await leaveService.addLeave(leaveData)
await leaveService.getLeaves()
await leaveService.updateLeave(leaveId, leaveData)
await leaveService.deleteLeave(leaveId)
```

### Locator Service
```typescript
await locatorService.addLocator(locatorData)
await locatorService.getLocators()
await locatorService.updateLocator(locatorId, locatorData)
await locatorService.deleteLocator(locatorId)
```

### Admin to PGO Service
```typescript
await adminToPGOService.addRecord(recordData)
await adminToPGOService.getRecords()
await adminToPGOService.updateRecord(recordId, recordData)
await adminToPGOService.deleteRecord(recordId)
```

### Others Service
```typescript
await othersService.addRecord(recordData)
await othersService.getRecords()
await othersService.updateRecord(recordId, recordData)
await othersService.deleteRecord(recordId)
```

## Firestore Collections

All data is stored in Firestore with the following collections:
- `letters` - Letter records
- `leaves` - Leave records
- `locators` - Locator records
- `adminToPGO` - Admin to PGO records
- `others` - Other records

Each document includes:
- All record fields
- `createdAt` - Timestamp when created
- `updatedAt` - Timestamp when last updated

## Notes

- No more localStorage for record data
- All data is persisted in Firestore
- Designations are still stored in localStorage (can be migrated separately)
- Error handling includes try-catch blocks
- Data is reloaded from Firestore after each operation
