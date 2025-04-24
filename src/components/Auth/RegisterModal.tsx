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
import { useAuthStore, RegisterData } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onOpenLogin }) => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    nickname: '',
    first_name: '',
    last_name: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  
  const router = useRouter();
  const { register, isLoading, error, isAuthenticated, redirectToPath, clearRedirect, clearError } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && redirectToPath) {
      console.log(`Redirecting to ${redirectToPath} after successful registration`);
      router.push(redirectToPath);
      clearRedirect(); // Clear the redirect flag after navigation
      onClose(); // Close the modal
    }
  }, [isAuthenticated, redirectToPath, router, clearRedirect, onClose]);

  useEffect(() => {
    if (redirectToPath === '/login') {
      console.log('Registration successful, showing login modal');
      clearRedirect(); // Clear the redirect flag
      onClose(); // Close the registration modal
      
      // Small delay to ensure registration modal is fully closed before showing login
      setTimeout(() => {
        // Trigger login modal to open
        // You'll need to implement a way to show the login modal here
        // This could be through a global state manager or event emitter
        const event = new CustomEvent('open-login-modal');
        window.dispatchEvent(event);
      }, 300);
    }
  }, [redirectToPath, clearRedirect, onClose]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Check if passwords match when confirm password changes
    if (name === 'password') {
      setPasswordsMatch(confirmPassword === '' || confirmPassword === value);
    }
  };

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordsMatch(value === formData.password);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (formData.password !== confirmPassword) {
      setPasswordsMatch(false);
      return;
    }
    
    try {
      await register(formData);
      // Reset form data
      setFormData({
        email: '',
        password: '',
        nickname: '',
        first_name: '',
        last_name: '',
      });
      setConfirmPassword('');
    } catch {
      // Error is already handled in the store
      // No need to do anything here as the error state is managed by the auth store
    }
  };

  const handleSwitchToLogin = () => {
    clearError();
    onClose();
    onOpenLogin();
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
          <DialogTitle className="text-xl">Create an Account</DialogTitle>
          <DialogDescription>
            Join TheoForge to access exclusive features.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                name="first_name"
                type="text"
                placeholder="First name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                name="last_name"
                type="text"
                placeholder="Last name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nickname">Display Name</Label>
            <Input
              id="nickname"
              name="nickname"
              type="text"
              placeholder="Choose a display name"
              value={formData.nickname}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
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
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
              className={!passwordsMatch ? "border-red-500" : ""}
            />
            {!passwordsMatch && (
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}
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
              onClick={handleSwitchToLogin}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Already have an account?
            </Button>
            
            <Button 
              type="submit" 
              className="w-full sm:w-auto order-1 sm:order-2"
              disabled={isLoading || !passwordsMatch}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;
