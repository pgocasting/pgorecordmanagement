# Firebase Integration Setup Guide

## Overview
The PGO Record Management System is now integrated with Firebase for authentication and data storage. The system uses a hybrid approach with localStorage as a fallback for offline functionality.

## Firebase Configuration

### Credentials
- **Project ID**: record-management-system-db083
- **Auth Domain**: record-management-system-db083.firebaseapp.com
- **Storage Bucket**: record-management-system-db083.firebasestorage.app

The Firebase configuration is stored in `src/config/firebase.ts`

## Features Integrated

### 1. Authentication (Firebase Auth)
- Email/password authentication
- User registration
- User login/logout
- Session management

**File**: `src/contexts/AuthContext.tsx`

### 2. Database (Firestore)
- User data storage
- User roles management
- Record metadata storage

**Collections**:
- `users` - Stores user profiles with roles
- `records` - Stores record metadata (optional)

### 3. Storage (Firebase Storage)
- File uploads for attachments
- Document storage

## Setup Instructions

### 1. Install Dependencies
```bash
npm install firebase
```

### 2. Firestore Setup

#### Create Collections in Firebase Console:

**Collection: `users`**
- Document structure:
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "role": "admin" | "user",
  "uid": "firebase-uid",
  "createdAt": "timestamp"
}
```

**Collection: `records`** (Optional)
- Document structure:
```json
{
  "trackingId": "tracking-id",
  "dateTimeIn": "ISO-8601 datetime",
  "dateTimeOut": "ISO-8601 datetime",
  "fullName": "Name",
  "designationOffice": "Designation",
  "status": "Pending" | "Completed",
  "remarks": "Notes",
  "createdAt": "timestamp",
  "createdBy": "user-id"
}
```

### 3. Security Rules

Set the following Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - authenticated users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    // Records collection - authenticated users can read/write
    match /records/{recordId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Authentication Rules

In Firebase Console > Authentication > Settings:
- Enable Email/Password authentication
- Set password requirements as needed

## Usage

### Login
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { login } = useAuth();

// Login with email and password
await login('user@example.com', 'password');
```

### Create User
```typescript
const { addUser } = useAuth();

// Add new user
await addUser('newuser@example.com', 'password', 'User Name', 'user');
```

### Logout
```typescript
const { logout } = useAuth();

logout();
```

## Fallback Mechanism

The system includes a fallback mechanism to localStorage:
- If Firebase is unavailable, the app uses localStorage
- Default test users are always available:
  - **admin@pgo.com** / password (Admin)
  - **user@pgo.com** / password (User)
  - **manager@pgo.com** / password (Admin)

## Testing

### Test Credentials (Firebase)
Create these users in Firebase Console:
- Email: `admin@pgo.com`, Password: `password`, Role: `admin`
- Email: `user@pgo.com`, Password: `password`, Role: `user`

### Test Credentials (Fallback)
These are automatically available in localStorage:
- Email: `admin@pgo.com`, Password: `password`
- Email: `user@pgo.com`, Password: `password`

## Environment Variables

No additional environment variables are needed. The Firebase config is hardcoded in `src/config/firebase.ts`.

For production, consider moving credentials to environment variables:

```typescript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};
```

## Troubleshooting

### Firebase Connection Issues
- Check internet connection
- Verify Firebase project is active
- Check security rules allow your operations
- Check browser console for detailed error messages

### Authentication Fails
- Verify email/password are correct
- Check if user exists in Firestore
- Check Firebase Authentication is enabled
- System will fallback to localStorage automatically

### Records Not Syncing
- Check Firestore security rules
- Verify user has write permissions
- Check browser console for errors
- Records are always stored in localStorage as backup

## Future Enhancements

1. **Real-time Sync**: Implement Firestore listeners for real-time updates
2. **Cloud Functions**: Add backend validation and processing
3. **File Storage**: Implement Firebase Storage for document uploads
4. **Analytics**: Enable Firebase Analytics for usage tracking
5. **Offline Support**: Implement Firestore offline persistence
6. **Backup**: Set up automated Firestore backups

## Files Modified

- `src/config/firebase.ts` - Firebase configuration
- `src/contexts/AuthContext.tsx` - Firebase integration
- `package.json` - Added firebase dependency
