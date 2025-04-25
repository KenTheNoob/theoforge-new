import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser, generateToken } from '../users/storage';

export async function POST(request: NextRequest) {
  try {
    // Parse form data or JSON
    let userData: any;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      userData = await request.json();
    } else {
      const formData = await request.formData();
      userData = {
        email: formData.get('email'),
        password: formData.get('password'),
        nickname: formData.get('nickname') || formData.get('email')?.toString().split('@')[0],
        first_name: formData.get('first_name') || '',
        last_name: formData.get('last_name') || ''
      };
    }
    
    // Check if email already exists
    if (getUserByEmail(userData.email)) {
      return NextResponse.json(
        { detail: 'Email already registered' },
        { status: 409 }
      );
    }
    
    // Create new user with our storage system
    const newUser = createUser({
      email: userData.email,
      password: userData.password, // In a real app, this would be hashed
      nickname: userData.nickname,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: 'USER', // Default role for new registrations
      subscription_plan: 'FREE' // Default plan
    });
    
    console.log('New user registered:', newUser.email);
    
    // Return success response (without password)
    const { password, ...userResponse } = newUser;
    return NextResponse.json(
      {
        detail: 'User registered successfully',
        user: userResponse
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
