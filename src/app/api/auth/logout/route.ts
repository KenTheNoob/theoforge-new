import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // In a real application, you might invalidate the token on the server
    // For this mock implementation, we'll just return a success response
    // since the actual logout is handled client-side by clearing the token
    
    console.log('User logged out');
    
    return NextResponse.json(
      { detail: 'Successfully logged out' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
