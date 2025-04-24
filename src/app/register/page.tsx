'use client';

import { AuthForm } from '@/components/Auth/AuthForm';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { isAuthenticated, redirectToPath } = useAuthStore();
  const router = useRouter();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectToPath || '/dashboard');
    }
  }, [isAuthenticated, redirectToPath, router]);
  
  return <AuthForm type="register" />;
}
