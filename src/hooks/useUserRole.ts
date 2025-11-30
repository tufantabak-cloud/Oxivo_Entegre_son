/**
 * User Role Management Hook
 * Detects user role from Basic Auth and provides permission checks
 * 
 * Roles:
 * - admin: Full CRUD access
 * - viewer: Read-only access
 */

import { useState, useEffect } from 'react';

export type UserRole = 'admin' | 'viewer' | 'unknown';

export interface UserPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
}

export interface UserInfo {
  username: string;
  role: UserRole;
  permissions: UserPermissions;
}

/**
 * Detect username from browser's Basic Auth
 * Browser stores credentials after successful authentication
 */
function detectUsernameFromAuth(): string | null {
  try {
    // Check cookies first
    const cookies = document.cookie.split('; ');
    const userCookie = cookies.find(row => row.startsWith('oxivo_user='));
    if (userCookie) {
      const username = userCookie.split('=')[1];
      console.log('🔐 Found username in cookie:', username);
      return username;
    }

    // Check localStorage
    const stored = localStorage.getItem('oxivo_username');
    if (stored) {
      console.log('🔐 Found username in localStorage:', stored);
      return stored;
    }

    // Try to prompt user
    console.log('⚠️ Username not found, will prompt user');
    return null;
  } catch (error) {
    console.error('❌ Error detecting username:', error);
    return null;
  }
}

/**
 * Get current user info
 */
function getCurrentUser(username: string): UserInfo {
  const role: UserRole = username === 'viewer' ? 'viewer' : 'admin';

  const permissions: UserPermissions = {
    canCreate: role === 'admin',
    canEdit: role === 'admin',
    canDelete: role === 'admin',
    canExport: true, // Both can export
    canImport: role === 'admin',
  };

  return { username, role, permissions };
}

/**
 * Hook to manage user role and permissions
 */
export function useUserRole() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const initializeUser = () => {
      // Detect username
      const username = detectUsernameFromAuth();
      
      if (username) {
        // Save to localStorage
        localStorage.setItem('oxivo_username', username);
        localStorage.setItem('oxivo_role', username === 'viewer' ? 'viewer' : 'admin');
        
        // Set user info
        setUserInfo(getCurrentUser(username));
        setIsInitialized(true);
        
        console.log('✅ User initialized:', username);
      } else {
        // Show user selection prompt
        console.log('⚠️ Showing user selection prompt');
        setShowPrompt(true);
      }
    };

    // Delay initialization slightly to ensure cookies are set
    setTimeout(initializeUser, 100);

    // Listen for storage changes
    const handleStorageChange = () => {
      const username = localStorage.getItem('oxivo_username');
      if (username) {
        setUserInfo(getCurrentUser(username));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle manual user selection
  const selectUser = (username: 'admin' | 'viewer') => {
    localStorage.setItem('oxivo_username', username);
    localStorage.setItem('oxivo_role', username === 'viewer' ? 'viewer' : 'admin');
    setUserInfo(getCurrentUser(username));
    setShowPrompt(false);
    setIsInitialized(true);
    console.log('✅ User selected:', username);
  };

  /**
   * Set user role manually
   */
  const setRole = (username: string) => {
    localStorage.setItem('oxivo_username', username);
    localStorage.setItem('oxivo_role', username === 'viewer' ? 'viewer' : 'admin');
    setUserInfo(getCurrentUser(username));
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return userInfo?.permissions[permission] ?? false;
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return userInfo?.role === 'admin';
  };

  /**
   * Check if user is viewer (read-only)
   */
  const isViewer = (): boolean => {
    return userInfo?.role === 'viewer';
  };

  return {
    userInfo: userInfo || getCurrentUser('admin'), // Fallback to admin
    isInitialized,
    showPrompt,
    selectUser,
    setRole,
    hasPermission,
    isAdmin,
    isViewer,
  };
}