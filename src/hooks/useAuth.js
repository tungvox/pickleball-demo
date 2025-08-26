import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User logged in: ${user.email}` : 'No user logged in');
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('Attempting Google sign in...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign in successful:', result.user.email);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const signUpWithPhone = async (phoneNumber, password, displayName) => {
    try {
      console.log('Attempting sign up with phone:', phoneNumber);
      
      // Convert phone number to email format for Firebase
      const email = `${phoneNumber}@pickleball.local`;
      
      // Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }
      
      console.log('User created successfully');
      return userCredential;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber, password) => {
    try {
      console.log('Attempting sign in with phone:', phoneNumber);
      
      // Convert phone number to email format for Firebase
      const email = `${phoneNumber}@pickleball.local`;
      
      // Sign in with email/password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in successfully');
      
      return userCredential;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const resetPassword = async (phoneNumber) => {
    try {
      console.log('Attempting password reset for phone:', phoneNumber);
      
      // Convert phone number to email format for Firebase
      const email = `${phoneNumber}@pickleball.local`;
      
      // Send password reset email
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signUpWithPhone,
    signInWithPhone,
    resetPassword,
    logout
  };
};
