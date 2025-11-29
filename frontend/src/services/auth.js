import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

/**
 * Sign in with Google using Firebase Auth
 * @returns {Promise<{uid: string, displayName: string, email: string, photoURL: string}>}
 */
export const signInWithGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();

        // Optional: Add custom parameters
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Extract user data
        const userData = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
        };

        // Store in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');

        return userData;
    } catch (error) {
        console.error('Error signing in with Google:', error);

        // Handle specific error codes
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Sign-in popup was closed. Please try again.');
        } else if (error.code === 'auth/cancelled-popup-request') {
            throw new Error('Sign-in was cancelled.');
        } else {
            throw new Error('Failed to sign in with Google. Please try again.');
        }
    }
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export const signOutUser = async () => {
    try {
        await signOut(auth);

        // Clear localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
    } catch (error) {
        console.error('Error signing out:', error);
        throw new Error('Failed to sign out. Please try again.');
    }
};

/**
 * Get user from localStorage
 * @returns {Object|null}
 */
export const getUserFromStorage = () => {
    const userStr = localStorage.getItem('user');
    const isAuth = localStorage.getItem('isAuthenticated');

    if (userStr && isAuth === 'true') {
        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
            return null;
        }
    }

    return null;
};
