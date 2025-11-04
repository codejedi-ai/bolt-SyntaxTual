// Direct Firebase Authentication - Following Firebase documentation pattern
import { 
  getAuth, 
  getRedirectResult, 
  GoogleAuthProvider,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

// Custom user type
export interface User {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
}

// Convert Firebase user to our custom format
export const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
  return {
    name: firebaseUser.displayName || undefined,
    email: firebaseUser.email || undefined,
    picture: firebaseUser.photoURL || undefined,
    sub: firebaseUser.uid,
  };
};

// Check redirect result after Google sign-in


// Sign in with redirect
export const signInWithGoogle = async () => {
    try {
      const auth = getAuth();
  
      getRedirectResult(auth)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access Google APIs.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
    
        // The signed-in user info.
        const user = result.user;
        // IdP data available using getAdditionalUserInfo(result)
        // ...
      }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
      
      return null;
    } catch (error: any) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData?.email;
      const credential = GoogleAuthProvider.credentialFromError(error);
      
      console.error('❌ Auth: Error getting redirect result');
      console.error('Error code:', errorCode);
      console.error('Error message:', errorMessage);
      console.error('Error email:', email);
      
      // Handle account-exists-with-different-credential errors
      if (errorCode === 'auth/account-exists-with-different-credential') {
        console.error('⚠️ An account already exists with the same email address but different sign-in credentials');
      }
      
      throw error;
    }
  };
// Sign out
export const signOutUser = async () => {
    const auth = getAuth();
  try {
    await signOut(auth);
    console.log('✅ Auth: User signed out successfully');
  } catch (error: any) {
    console.error('❌ Auth: Sign out error:', error);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      console.log('✅ Auth: onAuthStateChanged - User authenticated!');
      console.log('👤 Firebase User:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified
      });
      
      // Get Firebase ID token
      try {
        const token = await firebaseUser.getIdToken();
        console.log('🎫 Auth: Received Firebase ID token from onAuthStateChanged');
        console.log('🔑 Firebase ID Token (first 20 chars):', token.substring(0, 20) + '...');
        console.log('🔑 Full Firebase ID Token:', token);
      } catch (err) {
        console.error('❌ Auth: Error getting ID token:', err);
      }
      
      callback(convertFirebaseUser(firebaseUser));
    } else {
      console.log('ℹ️ Auth: onAuthStateChanged - No user (logged out)');
      callback(null);
    }
  });
};

