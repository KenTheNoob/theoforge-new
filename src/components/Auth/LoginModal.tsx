'use client';

import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Button from '@/components/Common/Button';
import { useAuthStore } from '@/lib/store/authStore';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onOpenRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoading, error, isAuthenticated, redirectToPath, clearRedirect, clearError } = useAuthStore();
  const router = useRouter();

  // Check for redirect after successful authentication
  useEffect(() => {
    if (isAuthenticated && redirectToPath) {
      console.log(`Redirecting to ${redirectToPath} after successful login`);
      router.push(redirectToPath);
      clearRedirect(); // Clear the redirect flag after navigation
      onClose(); // Close the modal
    }
  }, [isAuthenticated, redirectToPath, router, clearRedirect, onClose]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      // Reset form fields
      setEmail('');
      setPassword('');
    } catch {
      // Error is already handled in the store
      // No need to do anything here as the error state is managed by the auth store
    }
  };

  const handleSwitchToRegister = () => {
    clearError();
    onClose();
    onOpenRegister();
  };

  // Clear error when modal is closed
  const handleClose = () => {
    clearError();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Log In</DialogTitle>
          <DialogDescription>
            Sign in to your TheoForge account.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 font-medium">
              {error}
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSwitchToRegister}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Create an account
            </Button>
            
            <Button 
              type="submit" 
              className="w-full sm:w-auto order-1 sm:order-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
