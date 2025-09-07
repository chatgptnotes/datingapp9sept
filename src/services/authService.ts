import { User } from '@supabase/supabase-js';

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface UserWithRole extends User {
  role?: UserRole;
}

// Define authorized admin users and their roles
const AUTHORIZED_USERS: Record<string, UserRole> = {
  'bkmurali683@gmail.com': 'superadmin',
  // Add more admin users here as needed
  // 'admin@example.com': 'admin',
};

export class AuthService {
  /**
   * Get user role based on email address
   */
  static getUserRole(user: User | null): UserRole {
    if (!user?.email) {
      return 'user';
    }

    return AUTHORIZED_USERS[user.email.toLowerCase()] || 'user';
  }

  /**
   * Check if user has admin privileges
   */
  static isAdmin(user: User | null): boolean {
    const role = this.getUserRole(user);
    return role === 'admin' || role === 'superadmin';
  }

  /**
   * Check if user has superadmin privileges
   */
  static isSuperAdmin(user: User | null): boolean {
    const role = this.getUserRole(user);
    return role === 'superadmin';
  }

  /**
   * Check if user can access specific admin features
   */
  static canAccess(user: User | null, feature: AdminFeature): boolean {
    const role = this.getUserRole(user);
    
    switch (feature) {
      case 'content-management':
        return role === 'admin' || role === 'superadmin';
      
      case 'user-management':
        return role === 'superadmin';
      
      case 'system-settings':
        return role === 'superadmin';
      
      case 'analytics':
        return role === 'admin' || role === 'superadmin';
      
      default:
        return false;
    }
  }

  /**
   * Get user display info with role
   */
  static getUserDisplayInfo(user: User | null): {
    name: string;
    email: string;
    role: UserRole;
    roleLabel: string;
    canAccessAdmin: boolean;
  } {
    const role = this.getUserRole(user);
    
    const roleLabels: Record<UserRole, string> = {
      user: 'User',
      admin: 'Admin',
      superadmin: 'Super Admin'
    };

    return {
      name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
      email: user?.email || '',
      role,
      roleLabel: roleLabels[role],
      canAccessAdmin: this.isAdmin(user)
    };
  }

  /**
   * Validate admin access and throw error if unauthorized
   */
  static requireAdmin(user: User | null): void {
    if (!this.isAdmin(user)) {
      throw new Error('Access denied. Admin privileges required.');
    }
  }

  /**
   * Validate superadmin access and throw error if unauthorized
   */
  static requireSuperAdmin(user: User | null): void {
    if (!this.isSuperAdmin(user)) {
      throw new Error('Access denied. Super admin privileges required.');
    }
  }

  /**
   * Get all authorized admin users (superadmin only)
   */
  static getAuthorizedUsers(user: User | null): Record<string, UserRole> {
    this.requireSuperAdmin(user);
    return AUTHORIZED_USERS;
  }

  /**
   * Add new admin user (superadmin only)
   */
  static addAuthorizedUser(currentUser: User | null, email: string, role: UserRole): void {
    this.requireSuperAdmin(currentUser);
    // In a real app, this would update the database
    // For now, we'll just log it
    console.log(`Super admin ${currentUser?.email} added ${email} with role: ${role}`);
  }

  /**
   * Remove admin user (superadmin only)
   */
  static removeAuthorizedUser(currentUser: User | null, email: string): void {
    this.requireSuperAdmin(currentUser);
    if (email === currentUser?.email) {
      throw new Error('Cannot remove yourself from admin privileges');
    }
    // In a real app, this would update the database
    console.log(`Super admin ${currentUser?.email} removed ${email} from admin privileges`);
  }
}

export type AdminFeature = 
  | 'content-management' 
  | 'user-management' 
  | 'system-settings' 
  | 'analytics';

// Admin feature permissions
export const ADMIN_FEATURES: Record<AdminFeature, {
  label: string;
  description: string;
  icon: string;
  requiredRole: UserRole[];
}> = {
  'content-management': {
    label: 'Content Management',
    description: 'Manage styles, locations, jewelry, and other creative options',
    icon: '🎨',
    requiredRole: ['admin', 'superadmin']
  },
  'user-management': {
    label: 'User Management',
    description: 'Manage admin users and permissions',
    icon: '👥',
    requiredRole: ['superadmin']
  },
  'system-settings': {
    label: 'System Settings',
    description: 'Configure system-wide settings and preferences',
    icon: '⚙️',
    requiredRole: ['superadmin']
  },
  'analytics': {
    label: 'Analytics & Reports',
    description: 'View usage statistics and generate reports',
    icon: '📊',
    requiredRole: ['admin', 'superadmin']
  }
};