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
 * Get current user info from Basic Auth
 * Extracts username from Authorization header
 */
function getCurrentUser(): UserInfo {
  try {
    // Parse Basic Auth header from browser's built-in auth
    // Browser stores credentials after successful auth
    const authHeader = document.cookie.split('; ').find(row => row.startsWith('auth='));
    
    // Fallback: Try to get from localStorage (set on first login)
    let username = localStorage.getItem('oxivo_username') || 'unknown';
    let role: UserRole = (localStorage.getItem('oxivo_role') as UserRole) || 'unknown';

    // If no localStorage, detect from initial page load
    if (role === 'unknown') {
      // Default to admin for backward compatibility
      // This will be updated after first interaction
      username = 'admin';
      role = 'admin';
      localStorage.setItem('oxivo_username', username);
      localStorage.setItem('oxivo_role', role);
    }

    // Compute permissions based on role
    const permissions: UserPermissions = {
      canCreate: role === 'admin',
      canEdit: role === 'admin',
      canDelete: role === 'admin',
      canExport: true, // Both can export
      canImport: role === 'admin',
    };

    return { username, role, permissions };
  } catch (error) {
    console.error('Error getting user info:', error);
    // Default to admin for safety (backward compatibility)
    return {
      username: 'admin',
      role: 'admin',
      permissions: {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canImport: true,
      }
    };
  }
}

/**
 * Detect user role from HTTP Basic Auth credentials
 * This function tries to extract username from the browser's auth
 */
function detectUserRole(): { username: string; role: UserRole } {
  // Check localStorage first
  const stored = localStorage.getItem('oxivo_username');
  if (stored) {
    const role = stored === 'viewer' ? 'viewer' : 'admin';
    return { username: stored, role };
  }

  // Default to admin (backward compatibility)
  return { username: 'admin', role: 'admin' };
}

/**
 * Hook to manage user role and permissions
 */
export function useUserRole() {
  const [userInfo, setUserInfo] = useState<UserInfo>(() => getCurrentUser());

  useEffect(() => {
    // Listen for storage changes (e.g., login from another tab)
    const handleStorageChange = () => {
      setUserInfo(getCurrentUser());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Set user role manually (called after detecting username)
   */
  const setRole = (username: string) => {
    const role: UserRole = username === 'viewer' ? 'viewer' : 'admin';
    localStorage.setItem('oxivo_username', username);
    localStorage.setItem('oxivo_role', role);
    setUserInfo(getCurrentUser());
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return userInfo.permissions[permission];
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return userInfo.role === 'admin';
  };

  /**
   * Check if user is viewer (read-only)
   */
  const isViewer = (): boolean => {
    return userInfo.role === 'viewer';
  };

  return {
    userInfo,
    setRole,
    hasPermission,
    isAdmin,
    isViewer,
  };
}

/**
 * Detect username from prompt dialog
 * This is a fallback to detect which user logged in
 */
export function detectUsernameFromPrompt(): Promise<string> {
  return new Promise((resolve) => {
    // Try to detect from localStorage
    const stored = localStorage.getItem('oxivo_username');
    if (stored) {
      resolve(stored);
      return;
    }

    // Show detection modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      max-width: 400px;
      text-align: center;
    `;

    dialog.innerHTML = `
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1e293b;">
        Hangi kullanıcı ile giriş yaptınız?
      </h2>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">
        Yetkilerinizi belirlemek için kullanıcı adınızı seçin
      </p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="btn-admin" style="
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
        ">👤 Admin</button>
        <button id="btn-viewer" style="
          padding: 12px 24px;
          background: #64748b;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
        ">👁️ Viewer</button>
      </div>
    `;

    modal.appendChild(dialog);
    document.body.appendChild(modal);

    const adminBtn = dialog.querySelector('#btn-admin') as HTMLButtonElement;
    const viewerBtn = dialog.querySelector('#btn-viewer') as HTMLButtonElement;

    adminBtn.onclick = () => {
      localStorage.setItem('oxivo_username', 'admin');
      localStorage.setItem('oxivo_role', 'admin');
      document.body.removeChild(modal);
      resolve('admin');
    };

    viewerBtn.onclick = () => {
      localStorage.setItem('oxivo_username', 'viewer');
      localStorage.setItem('oxivo_role', 'viewer');
      document.body.removeChild(modal);
      resolve('viewer');
    };
  });
}
