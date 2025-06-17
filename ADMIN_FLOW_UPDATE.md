# Admin App Flow Update

## Overview
The admin app has been updated to follow the same flow as the main classified app (`@/create-ad`), including:

1. **Ad Type Selection** - Choose between Free and Premium ads
2. **Photo Upload** - Real Firebase Storage integration with watermarking
3. **Payment Bypass** - Admin users can create both types without payment

## Updated Flow

### Step 0: Ad Type Selection
- **Free Ad**: 24-hour duration, basic features
- **Premium Ad**: 30-day duration, enhanced features, priority placement
- Admin can choose either type without payment processing

### Step 1: Add Information
- Same form as main app
- All fields properly validated
- Location selection with states and cities

### Step 2: Add Photos
- **Real Firebase Storage integration**
- **Automatic watermarking** with Skluva logo
- **Progress indicators** during upload
- **Error handling** for failed uploads
- **2MB file size limit** validation
- **Up to 10 photos** supported

### Step 3: Finish
- **Ad type-specific information** displayed
- **Payment bypass** for admin users
- **Automatic activation** regardless of type
- **Proper expiration dates** based on ad type

## Key Features Added

### Photo Upload System
- **Watermarking**: Automatically adds Skluva logo to uploaded images
- **Cloud Storage**: Images uploaded to Firebase Storage
- **Progress Tracking**: Real-time upload progress indicators
- **Error Handling**: Proper error messages for failed uploads
- **File Validation**: Size and type validation before upload

### Ad Type Handling
- **Free Ads**: 24-hour expiration, basic features
- **Premium Ads**: 30-day expiration, enhanced features, promoted status
- **Admin Override**: No payment required for either type
- **Proper Flags**: Sets `isPremium`, `isPromoted` based on selection

### Firebase Integration
- **Authentication**: Uses Firebase Auth for proper permissions
- **Storage**: Real cloud storage for images
- **Database**: Proper Firestore document structure
- **Security**: Follows same security rules as main app

## Technical Changes

### New Files Added
- `src/lib/image-utils.ts` - Image processing and upload utilities
- `public/assets/skluva_logo.png` - Watermark logo
- `public/assets/addemomockupp.png` - Ad type selection demo image

### Updated Components
- `create-ad-form.tsx` - Restored ad type selection step
- `ad-type-selection.tsx` - Admin-specific ad type selection
- `ad-form-step2.tsx` - Complete photo upload system
- `ad-form-step3.tsx` - Ad type-aware creation logic

### Firebase Configuration
- `src/lib/firebase.ts` - Enhanced with fallback values
- `src/contexts/AuthContext.tsx` - Firebase Auth integration
- Image upload with proper folder structure

## Usage Instructions

1. **Login** with super admin credentials:
   - Email: `skluva.com@gmail.com`
   - Password: `SuperAdmin123!`

2. **Navigate** to Dashboard → Create Ad (Admin)

3. **Select Ad Type**:
   - Choose Free (24 hours) or Premium (30 days)
   - Both types work without payment for admin

4. **Fill Form**:
   - Complete all required fields
   - Add location information

5. **Upload Photos**:
   - Drag & drop or click to browse
   - Watch progress indicators
   - Photos automatically watermarked

6. **Finish**:
   - Review ad type information
   - Accept terms and create ad
   - Ad automatically activated

## Benefits

### For Admin Users
- **Full Control**: Can create both free and premium ads
- **No Payment**: Bypass payment gateway entirely
- **Professional**: Same quality as main app
- **Efficient**: Real-time feedback and progress

### For the Platform
- **Consistency**: Same data structure as main app
- **Quality**: Watermarked images, proper validation
- **Security**: Proper Firebase authentication
- **Scalability**: Cloud storage for images

## Next Steps

The admin app now provides a complete ad creation experience that matches the main classified app while providing admin-specific benefits like payment bypass and immediate activation. 