# Login Setup - Username/Password Authentication

## Admin Account Created

**Username:** `admin`  
**Password:** `admin123`  
**Email:** `pgocasting@gmail.com`  
**Role:** Admin

## Changes Made

### 1. Authentication System Updated
- Changed from email-based login to **username-based login**
- Updated `AuthContext.tsx` to use username for authentication
- Simplified login flow to use localStorage (no Firebase auth required for login)

### 2. User Interface Updated
- **LoginPage.tsx**: Changed email input to username input
- **SettingsPage.tsx**: Updated user creation form to use username instead of email
- Users table now displays username and name columns

### 3. User Model Updated
- Added `username` field to User interface
- Email is now optional and auto-generated if not provided
- Format: `{username}@pgo.local` if no email provided

### 4. Firebase Configuration
- Firebase credentials are configured in `src/config/firebase.ts`
- Using pgocasting@gmail.com for Firebase authentication
- Ready for Firestore integration

## How to Login

1. Go to the login page
2. Enter username: `admin`
3. Enter password: `admin123`
4. Click "Sign In"

## Creating New Users

1. Login as admin
2. Go to Settings (click Settings button in sidebar)
3. Click "Add User" button
4. Fill in:
   - **Username**: Unique username (required)
   - **Full Name**: User's display name (required)
   - **Password**: Minimum 6 characters (required)
   - **Role**: Admin or User
5. Click "Add User"

## User Roles

### Admin
- Can manage users (add/delete)
- Can manage designations
- Can view system settings
- Full access to all records

### User
- Can only change their own password
- Limited record management access
- Cannot manage system settings

## Files Modified

1. `src/contexts/AuthContext.tsx` - Updated authentication logic
2. `src/pages/LoginPage.tsx` - Changed to username input
3. `src/pages/SettingsPage.tsx` - Updated user management form
4. `src/config/firebase.ts` - Firebase credentials configured

## Notes

- All user data is stored in localStorage
- Firebase integration is ready for future use
- Username must be unique across the system
- Passwords are stored in plain text (for demo purposes only)
