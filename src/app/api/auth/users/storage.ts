// Auth users storage
import { NextRequest } from 'next/server';

// User interface
export interface AuthUser {
  id: string;
  email: string;
  password: string;
  nickname: string;
  first_name: string;
  last_name: string;
  role: 'USER' | 'ADMIN';
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  card_number?: string;
  subscription_plan?: string;
}

// Global storage
declare global {
  var storedAuthUsers: AuthUser[];
}

// Initialize storage
if (!global.storedAuthUsers) {
  global.storedAuthUsers = [];
}

// Helper functions
export function getUsers(): AuthUser[] {
  return global.storedAuthUsers;
}

export function getUserById(id: string): AuthUser | undefined {
  return global.storedAuthUsers.find(user => user.id === id);
}

export function getUserByEmail(email: string): AuthUser | undefined {
  return global.storedAuthUsers.find(user => user.email === email.toLowerCase());
}

export function createUser(userData: Partial<AuthUser>): AuthUser {
  // Create a new user ID if not provided
  const id = userData.id || `user_${Date.now()}`;
  
  const newUser: AuthUser = {
    id,
    email: (userData.email || '').toLowerCase(),
    password: userData.password || '',
    nickname: userData.nickname || '',
    first_name: userData.first_name || '',
    last_name: userData.last_name || '',
    role: userData.role || 'USER',
    email_verified: userData.email_verified || false,
    created_at: userData.created_at || new Date().toISOString(),
    updated_at: userData.updated_at || new Date().toISOString(),
    phone_number: userData.phone_number,
    address: userData.address,
    city: userData.city,
    state: userData.state,
    zip_code: userData.zip_code,
    card_number: userData.card_number,
    subscription_plan: userData.subscription_plan || 'FREE'
  };
  
  global.storedAuthUsers.push(newUser);
  return newUser;
}

export function updateUser(id: string, userData: Partial<AuthUser>): AuthUser | null {
  const index = global.storedAuthUsers.findIndex(user => user.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const updatedUser = {
    ...global.storedAuthUsers[index],
    ...userData,
    updated_at: new Date().toISOString()
  };
  
  global.storedAuthUsers[index] = updatedUser;
  return updatedUser;
}

export function deleteUser(id: string): boolean {
  const initialLength = global.storedAuthUsers.length;
  global.storedAuthUsers = global.storedAuthUsers.filter(user => user.id !== id);
  return global.storedAuthUsers.length < initialLength;
}

// Token generation and validation
export function generateToken(user: AuthUser): string {
  // Simple token generation for development
  // In production, use a proper JWT library
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  }));
  const signature = btoa(`${user.id}_${user.email}_${new Date().toISOString()}`);
  
  return `${header}.${payload}.${signature}`;
}

// Ensure at least one admin user exists
export function ensureAdminUser() {
  if (global.storedAuthUsers.length === 0 || 
      !global.storedAuthUsers.some(user => user.role === 'ADMIN')) {
    
    // No users or no admin, create a temporary admin
    if (!getUserByEmail('admin@example.com')) {
      createUser({
        email: 'admin@example.com',
        password: 'Admin123!', // This should be changed immediately in production
        nickname: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        role: 'ADMIN',
        email_verified: true
      });
    }
  }
}

// Call this when the module is first loaded
ensureAdminUser();
