# Admin App Setup Guide

## Issue: Ads Not Posting

The admin app was not able to post ads because of authentication issues. Here's what was happening and how to fix it:

### Problem
1. The admin app uses localStorage-based authentication
2. Firebase Firestore rules require real Firebase authentication (`request.auth != null`)
3. Admin users were not authenticated with Firebase, so ad creation was blocked

### Solution
The admin app has been updated to use Firebase Authentication while maintaining the simple admin account system.

## Setup Instructions

### Step 1: Create Admin Users in Firebase

You need to create the admin users in Firebase Authentication:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **skluva**
3. Go to **Authentication > Users**
4. Click **"Add user"** and create these accounts:

   **Super Admin:**
   - Email: `skluva.com@gmail.com`
   - Password: `SuperAdmin123!`
   
   **Regular Admin:**
   - Email: `admin@skluva.com`
   - Password: `Admin123!`

### Step 2: Test the Admin App

1. Start the admin app:
   ```bash
   cd classified_admin
   npm run dev
   ```

2. Go to `http://localhost:3001/login`

3. Login with the super admin account:
   - Email: `skluva.com@gmail.com`
   - Password: `SuperAdmin123!`

4. Navigate to **Dashboard > Create Ad (Admin)**

5. Fill out the form and submit - the ad should now be created successfully!

## What Changed

### Firebase Configuration
- Updated `src/lib/firebase.ts` to include fallback values and proper initialization
- Added debug logging to help troubleshoot connection issues

### Authentication System
- Updated `src/contexts/AuthContext.tsx` to use Firebase Authentication
- Maintains the simple admin account system
- Falls back to localStorage auth if Firebase fails (for development)

### Ad Creation
- Updated `src/components/create-ad/ad-form-step3.tsx` to use Firebase UID when available
- Added proper error handling for Firebase connection issues
- Ensures all required fields are properly set

## Troubleshooting

### If ads still don't post:
1. Check browser console for error messages
2. Verify Firebase connection in console logs
3. Ensure the admin user is properly authenticated
4. Check that all required form fields are filled

### If Firebase authentication fails:
- The app will fall back to localStorage authentication for development
- Check that Firebase configuration is correct in `src/lib/firebase.ts`
- Verify that the Firebase project is accessible

## Firebase Rules

The current Firestore rules allow:
- Anyone to read ads (public viewing)
- Authenticated users to create ads
- Users to update/delete their own ads

This is why Firebase authentication is required for ad creation.

## Next Steps

Once the admin users are created in Firebase Authentication, the admin app should work properly for creating ads without payment gateway integration. 