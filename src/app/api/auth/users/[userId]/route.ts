import { NextRequest, NextResponse } from 'next/server';

// Mock user data for demonstration
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@admin.com',
    password: 'Password123!', // In a real app, this would be hashed
    nickname: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    role: 'ADMIN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    phone_number: '555-123-4567',
    address: '123 Admin St',
    city: 'Admin City',
    state: 'AS',
    zip_code: '12345',
    card_number: '',
    subscription_plan: 'PREMIUM'
  },
  {
    id: '2',
    email: 'user@example.com',
    password: 'Password123!', // In a real app, this would be hashed
    nickname: 'user',
    first_name: 'Regular',
    last_name: 'User',
    role: 'USER',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    phone_number: '555-987-6543',
    address: '456 User Ave',
    city: 'User City',
    state: 'US',
    zip_code: '54321',
    card_number: '',
    subscription_plan: 'FREE'
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    console.log(`Getting user data for ID: ${userId}`);
    
    // Find user by ID
    const user = MOCK_USERS.find(u => u.id === userId);
    
    if (!user) {
      return NextResponse.json(
        { detail: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user data without password
    const { password, ...userData } = user;
    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
