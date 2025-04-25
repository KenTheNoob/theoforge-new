import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, generateToken, ensureAdminUser } from '../users/storage';

// Ensure we have at least one admin user available
ensureAdminUser();

// Login helper function to validate credentials
function validateCredentials(email: string, password: string) {
  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return null;
  }
  return user;
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    
    console.log(`Login attempt for: ${username}`);
    
    // Find and validate user by credentials
    const user = validateCredentials(username, password);
    
    // Check if credentials are valid
    if (!user) {
      return NextResponse.json(
        { detail: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return successful response with token
    return NextResponse.json(
      { 
        access_token: token,
        token_type: 'bearer'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
