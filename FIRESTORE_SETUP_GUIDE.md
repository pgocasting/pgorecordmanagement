# Firestore Setup Guide

## Overview
The application is now configured to use Firestore for data persistence. The admin user will be automatically created in Firestore on first app load.

## What Happens on App Start

1. **Firestore Initialization** (`initializeFirestore()`)
   - Checks if admin user exists in Firestore
   - Creates admin user if it doesn't exist
   - Logs success/error messages to console

2. **Admin User Created**
   - Username: `admin`
   - Email: `pgocasting@gmail.com`
   - Password: `admin123`
   - Role: `admin`

## Firestore Collections

The application uses the following Firestore collections:

### 1. `users` Collection
Stores user accounts with the following fields:
```
{
  username: string (unique)
  email: string
  name: string
  role: 'admin' | 'user'
  password: string (for demo only)
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 2. `letters` Collection
Stores letter records with timestamps

### 3. `leaves` Collection
Stores leave records with timestamps

### 4. `locators` Collection
Stores locator records with timestamps

### 5. `adminToPGO` Collection
Stores admin to PGO records with timestamps

### 6. `others` Collection
Stores other records with timestamps

## How to Verify Data in Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `record-management-system-db083`
3. Go to **Firestore Database**
4. Click on the **`users`** collection
5. You should see the admin user document

## Current Data Flow

### Authentication
- ✅ Login uses localStorage (fallback mechanism)
- ✅ Admin user auto-created in Firestore on app start
- ✅ User management (add/delete) works with localStorage

### Records
- ⚠️ Records still use localStorage
- 🔄 Ready to migrate to Firestore services

## Services Available

### Firestore Init Service
**File:** `src/services/firestoreInit.ts`

Functions:
- `initializeFirestore()` - Initialize with default admin user
- `addUserToFirestore()` - Add new user to Firestore
- `getUsersFromFirestore()` - Get all users from Firestore
- `deleteUserFromFirestore()` - Delete user from Firestore

### Firestore Record Services
**File:** `src/services/firestoreService.ts`

Services for each record type:
- `letterService` - Letter records
- `leaveService` - Leave records
- `locatorService` - Locator records
- `adminToPGOService` - Admin to PGO records
- `othersService` - Other records

Each service has:
- `add()` - Add new record
- `get()` - Get all records
- `update()` - Update record
- `delete()` - Delete record

## Next Steps

1. ✅ Admin user will be created in Firestore automatically
2. 📋 Verify data appears in Firebase Console
3. 🔄 Migrate record pages to use Firestore services
4. 🔐 Set up Firestore security rules
5. 🚀 Deploy to production

## Troubleshooting

### Admin user not appearing in Firestore
1. Check browser console for errors
2. Verify Firebase credentials in `src/config/firebase.ts`
3. Check Firebase Console for permission errors
4. Ensure Firestore database is created in Firebase project

### Data not syncing
1. Check network tab in browser DevTools
2. Verify Firestore security rules allow write access
3. Check browser console for error messages
4. Ensure Firebase is properly initialized

## Console Logs

When the app starts, you should see:
```
✅ Admin user created in Firestore
// or
✅ Admin user already exists in Firestore
```

If you see errors, check the browser console for details.
