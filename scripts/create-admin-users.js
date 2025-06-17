/**
 * Script to create admin users in Firebase Authentication
 * Run this script to create the required admin accounts
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  // You'll need to add your Firebase service account key here
  // Download it from Firebase Console > Project Settings > Service Accounts
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();

const adminUsers = [
  {
    email: 'admin@skluva.com',
    password: 'Admin123!',
    role: 'admin'
  },
  {
    email: 'skluva.com@gmail.com',
    password: 'SuperAdmin123!',
    role: 'super_admin'
  }
];

async function createAdminUsers() {
  for (const user of adminUsers) {
    try {
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        emailVerified: true,
      });
      
      // Set custom claims for role-based access
      await auth.setCustomUserClaims(userRecord.uid, {
        role: user.role,
        isAdmin: true
      });
      
      console.log(`✅ Created admin user: ${user.email} with role: ${user.role}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  User ${user.email} already exists`);
        
        // Try to update custom claims for existing user
        try {
          const existingUser = await auth.getUserByEmail(user.email);
          await auth.setCustomUserClaims(existingUser.uid, {
            role: user.role,
            isAdmin: true
          });
          console.log(`✅ Updated claims for existing user: ${user.email}`);
        } catch (updateError) {
          console.error(`❌ Failed to update claims for ${user.email}:`, updateError);
        }
      } else {
        console.error(`❌ Failed to create user ${user.email}:`, error);
      }
    }
  }
}

// Instructions for manual user creation
console.log(`
=== MANUAL ADMIN USER CREATION INSTRUCTIONS ===

Since this script requires Firebase Admin SDK setup, you can create the admin users manually:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: skluva
3. Go to Authentication > Users
4. Click "Add user" and create these accounts:

   Super Admin:
   - Email: skluva.com@gmail.com
   - Password: SuperAdmin123!
   
   Regular Admin:
   - Email: admin@skluva.com
   - Password: Admin123!

5. After creating the users, they should be able to sign in to the admin panel.

=== ALTERNATIVE: Use Firebase CLI ===

If you have Firebase CLI installed, you can also use the Firebase Emulator for local development.

`);

// Uncomment the line below if you have Firebase Admin SDK configured
// createAdminUsers(); 