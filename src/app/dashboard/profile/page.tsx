'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import PageContainer from '@/components/Layout/PageContainer';
import Button from '@/components/Common/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import axios from 'axios';

// API base URL - should match the one in authStore
const API_BASE_URL = '/api';

// User Profile interface
interface UserProfile {
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  card_number: string;
  ccv: string;
  security_code: string;
  subscription_plan: string;
}

// Subscription plan options
const SUBSCRIPTION_PLANS = [
  { value: 'FREE', label: 'Free Plan' },
  { value: 'BASIC', label: 'Basic Plan' },
  { value: 'PREMIUM', label: 'Premium Plan' }
];

export default function ProfilePage() {
  const router = useRouter();
  const { token, user, updateUserProfile } = useAuthStore();
  
  // State for profile data
  const [profile, setProfile] = useState<UserProfile>({
    phone_number: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    card_number: '',
    ccv: '',
    security_code: '',
    subscription_plan: 'FREE'
  });
  
  // Track original profile data to detect changes
  const [originalProfile, setOriginalProfile] = useState<UserProfile>({
    phone_number: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    card_number: '',
    security_code: '',
    ccv: '',
    subscription_plan: 'FREE'
  });
  
  // Track which fields have been changed
  const [changedFields, setChangedFields] = useState<Set<keyof UserProfile>>(new Set());
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('personal');

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token || !user) {
        return;
      }

      setIsLoading(true);
      setError(null);

      // If user already has profile data in the auth store, use it directly
      if (user) {
        console.log("Setting profile from user data in auth store:", user);
        
        // Always set empty string rather than null/undefined
        setProfile({
          phone_number: user.phone_number || '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          zip_code: user.zip_code || '',
          card_number: user.card_number || '',
          security_code: '',
          ccv: '',
          subscription_plan: user.subscription_plan || 'FREE'
        });
        
        // Save the original profile for change tracking
        setOriginalProfile({
          phone_number: user.phone_number || '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          zip_code: user.zip_code || '',
          card_number: user.card_number || '',
          security_code: '',
          ccv: '',
          subscription_plan: user.subscription_plan || 'FREE'
        });
        
        setIsLoading(false);
        return;
      }

      // Try different potential identifiers in order of preference
      const possibleIds = [
        user?.id, // Standard UUID format
        user?.email, // Try email as a fallback
        user?.nickname // Last resort
      ].filter(Boolean); // Remove any undefined/null values

      console.log("Possible user identifiers:", possibleIds);

      let successfullyFetched = false;
      
      // Try each possible ID in sequence
      for (const id of possibleIds) {
        if (successfullyFetched) break;
        
        try {
          console.log(`Attempting to fetch profile with ID: ${id}`);
          
          const response = await axios.get(`${API_BASE_URL}/auth/users/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (response.status === 200) {
            console.log(`Successfully fetched profile with ID: ${id}`, response.data);
            successfullyFetched = true;
            
            // Update profile state with user data
            const userData = response.data;
            setProfile({
              phone_number: userData.phone_number || '',
              address: userData.address || '',
              city: userData.city || '',
              state: userData.state || '',
              zip_code: userData.zip_code || '',
              card_number: userData.card_number || '',
              security_code: '',
              ccv: '',
              subscription_plan: userData.subscription_plan || 'FREE'
            });
            
            // Save the original profile for change tracking
            setOriginalProfile({
              phone_number: userData.phone_number || '',
              address: userData.address || '',
              city: userData.city || '',
              state: userData.state || '',
              zip_code: userData.zip_code || '',
              card_number: userData.card_number || '',
              security_code: '',
              ccv: '',
              subscription_plan: userData.subscription_plan || 'FREE'
            });
            
            // Reset changed fields
            setChangedFields(new Set());
          }
        } catch (err) {
          console.error(`Error fetching profile with ID ${id}:`, err);
          // Continue to the next ID
        }
      }
      
      if (!successfullyFetched) {
        console.error("All profile fetch attempts failed");
        setError('Unable to load your profile. Please log out and try again.');
      }
      
      setIsLoading(false);
    };

    if (token && user) {
      fetchProfile();
    }
  }, [token, user]);

  // Protect the profile route - redirect to home if not authenticated
  useEffect(() => {
    if (!token) {
      router.push('/');
    }
  }, [token, router]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Update the profile state
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Track which fields have changed from their original values
    const originalValue = originalProfile[name as keyof UserProfile];
    const newChangedFields = new Set(changedFields);
    
    if (value !== originalValue) {
      newChangedFields.add(name as keyof UserProfile);
    } else {
      newChangedFields.delete(name as keyof UserProfile);
    }
    
    setChangedFields(newChangedFields);
  };

  // Helper function to check if a field has been changed
  const hasFieldChanged = (fieldName: keyof UserProfile): boolean => {
    return changedFields.has(fieldName);
  };
  
  // Helper to generate field class based on whether it's been changed
  const getFieldClass = (fieldName: keyof UserProfile): string => {
    return hasFieldChanged(fieldName) 
      ? "border-blue-400 dark:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400" 
      : "";
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!token) {
      setError('You must be logged in to update your profile.');
      return;
    }
    
    // Only proceed if there are changes
    if (changedFields.size === 0) {
      setError('No changes detected. Please modify at least one field.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    // Debug what fields were tracked as changed
    console.log("Fields marked as changed:", Array.from(changedFields));
    console.log("Original profile:", originalProfile);
    console.log("Current profile:", profile);

    // Create a new payload with ONLY explicitly modified fields
    // This is a complete rewrite of the payload creation logic
    const payload: Record<string, string> = {};
    
    // The ONLY fields we'll update are those that:
    // 1. Are in the changedFields set
    // 2. Have an actual value (not empty)
    // 3. Are different from their original values
    changedFields.forEach(fieldName => {
      const field = fieldName as keyof UserProfile;
      const currentValue = profile[field];
      const originalValue = originalProfile[field];
      
      // Only include non-empty values that are different from original
      if (currentValue && currentValue !== originalValue) {
        console.log(`Including field ${field} in update: '${originalValue}' -> '${currentValue}'`);
        
        // Apply field-specific formatting
        if (field === 'card_number') {
          payload[field] = currentValue.toString().replace(/\s+/g, '').replace(/[^0-9]/g, '');
        } else if (field === 'phone_number') {
          payload[field] = currentValue.toString().replace(/[^\d+()-]/g, '');
        } else {
          payload[field] = currentValue.toString().trim();
        }
      } else {
        console.log(`Skipping field ${field}: unchanged or empty`);
      }
    });

    // Final validation - if payload is empty, don't make the API call
    if (Object.keys(payload).length === 0) {
      setError('No valid changes to save. Fields must have values and be different from original.');
      setIsSaving(false);
      return;
    }

    console.log("FINAL UPDATE PAYLOAD:", payload);
    console.log("Fields in payload:", Object.keys(payload));
    
    try {
      // Use the update-profile endpoint which doesn't require an ID in the URL
      console.log(`Making API request to: ${API_BASE_URL}/auth/update-profile`);
      console.log(`Using auth token: ${token?.substring(0, 15)}...`);
      
      const response = await axios.put(
        `${API_BASE_URL}/auth/update-profile`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("API response status:", response.status);
      console.log("API response data:", response.data);
      
      if (response.status === 200) {
        console.log("Profile updated successfully:", response.data);
        setSuccessMessage('Profile updated successfully.');
        
        // Update the Auth Store to sync across components
        updateUserProfile(payload);
        
        // Update original profile to match new values so change tracking works
        setOriginalProfile({
          ...originalProfile,
          ...payload
        });
        
        // Reset changed fields
        setChangedFields(new Set());
        
        // Clear success message after 5 seconds but don't redirect
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        throw new Error(`Failed to update profile: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      let errorMessage = 'Failed to update profile. Please try again.';
      
      // Handle specific axios errors
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        console.error("API Error Response:", { status, data });
        
        if (status === 422) {
          // Handle validation errors
          if ('detail' in data) {
            // FastAPI format: {"detail":[{"loc":["body","field"],"msg":"error msg","type":"error_type"}]}
            if (Array.isArray(data.detail)) {
              const errors = data.detail.map((item: {loc?: string[], msg?: string}) => {
                if (item.loc && item.loc.length > 1) {
                  return `${item.loc[1]}: ${item.msg}`;
                }
                return item.msg;
              });
              errorMessage = `Validation errors: ${errors.join(', ')}`;
            } else {
              errorMessage = `Validation error: ${data.detail}`;
            }
          }
        } else if (status === 400 || status === 500) {
          // Check for database errors which often come back with more detailed message
          if (typeof data === 'object' && data !== null) {
            // Extract the error message
            if ('detail' in data && typeof data.detail === 'string') {
              const detailMessage = data.detail;
              
              // Check for specific database errors
              if (detailMessage.includes('UniqueViolationError') && detailMessage.includes('phone_number')) {
                errorMessage = 'This phone number is already in use by another account. Please use a different phone number or try updating one field at a time.';
              } else if (detailMessage.includes('UniqueViolationError')) {
                // Generic unique constraint violation
                errorMessage = 'One of the values you entered is already in use. Please check your inputs and try again.';
              } else if (detailMessage.includes('Database error')) {
                // Extract the main error from the database message
                errorMessage = 'Database error: ' + (detailMessage.split(':')[1]?.trim() || 'Unknown error');
              } else {
                errorMessage = detailMessage;
              }
            }
          }
        } else if (status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (status === 403) {
          errorMessage = 'You do not have permission to update this profile.';
        } else if (status === 404) {
          errorMessage = 'Profile not found. Please try logging out and back in.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // If we're not authenticated, don't render the content
  if (!token) {
    return null;
  }

  return (
    <PageContainer 
      title="Your Profile" 
      subtitle="Manage your profile information"
    >
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between mb-6">
            <h2 className="text-2xl font-bold">Edit Profile</h2>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
            >
              Return to Dashboard
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900 p-3 rounded-md text-red-800 dark:text-red-200 text-sm mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900 p-3 rounded-md text-green-800 dark:text-green-200 text-sm mb-4 flex items-start">
              <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          
          {/* Loading indicator */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading profile data...</span>
            </div>
          ) : (
            <>
              {/* Profile Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="personal">Personal Information</TabsTrigger>
                  <TabsTrigger value="address">Address Information</TabsTrigger>
                  <TabsTrigger value="payment">Payment Information</TabsTrigger>
                  <TabsTrigger value="subscription">Subscription</TabsTrigger>
                </TabsList>
                
                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-6">
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Your Personal Information</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Update your personal contact details.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium">
                          Phone Number
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type="text"
                            name="phone_number"
                            value={profile.phone_number || ''}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            placeholder="123-456-7890"
                            maxLength={20}
                          />
                          {profile.phone_number && (
                            <button
                              type="button"
                              onClick={() => {
                                setProfile({ ...profile, phone_number: '' });
                                changedFields.add('phone_number');
                                setChangedFields(new Set(changedFields));
                              }}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
                            >
                              <span className="text-xs">Clear</span>
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Optional. May be used for account verification.
                          <br />
                          <strong>Note:</strong> Phone numbers must be unique across accounts. If you&apos;re having issues, try leaving this blank.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Address Information Tab */}
                <TabsContent value="address" className="space-y-6">
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Your Address</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Update your address information.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                          id="address"
                          name="address"
                          value={profile.address}
                          onChange={handleInputChange}
                          placeholder="e.g., 123 Main St"
                          className={`mt-1 ${getFieldClass('address')}`}
                          maxLength={100}
                        />
                        {hasFieldChanged('address') && (
                          <p className="text-xs text-blue-500 mt-1">Changed from original value</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            name="city"
                            value={profile.city}
                            onChange={handleInputChange}
                            placeholder="e.g., New York"
                            className={`mt-1 ${getFieldClass('city')}`}
                            maxLength={50}
                          />
                          {hasFieldChanged('city') && (
                            <p className="text-xs text-blue-500 mt-1">Changed</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="state">State/Province</Label>
                          <Input
                            id="state"
                            name="state"
                            value={profile.state}
                            onChange={handleInputChange}
                            placeholder="e.g., NY"
                            className={`mt-1 ${getFieldClass('state')}`}
                            maxLength={20}
                          />
                          {hasFieldChanged('state') && (
                            <p className="text-xs text-blue-500 mt-1">Changed</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="zip_code">ZIP/Postal Code</Label>
                        <Input
                          id="zip_code"
                          name="zip_code"
                          value={profile.zip_code}
                          onChange={handleInputChange}
                          placeholder="e.g., 10001"
                          className={`mt-1 ${getFieldClass('zip_code')}`}
                          maxLength={10}
                        />
                        {hasFieldChanged('zip_code') && (
                          <p className="text-xs text-blue-500 mt-1">Changed from original value</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Payment Information Tab */}
                <TabsContent value="payment" className="space-y-6">
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Payment Information</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Update your payment details. TheoForge uses secure encryption to protect your payment information.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="card_number">Card Number</Label>
                        <Input
                          id="card_number"
                          name="card_number"
                          value={profile.card_number}
                          onChange={handleInputChange}
                          placeholder="XXXX XXXX XXXX XXXX"
                          className={`mt-1 ${getFieldClass('card_number')}`}
                          maxLength={19}
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter numbers only - spaces will be removed</p>
                        {hasFieldChanged('card_number') && (
                          <p className="text-xs text-blue-500 mt-1">Changed from original value</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ccv">CCV</Label>
                          <Input
                            id="ccv"
                            name="ccv"
                            value={profile.ccv}
                            onChange={handleInputChange}
                            placeholder="XXX"
                            className={`mt-1 ${getFieldClass('ccv')}`}
                            maxLength={4}
                          />
                          {hasFieldChanged('ccv') && (
                            <p className="text-xs text-blue-500 mt-1">Changed</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="security_code">Security Code</Label>
                          <Input
                            id="security_code"
                            name="security_code"
                            value={profile.security_code}
                            onChange={handleInputChange}
                            placeholder="XXXX"
                            className={`mt-1 ${getFieldClass('security_code')}`}
                            maxLength={10}
                          />
                          {hasFieldChanged('security_code') && (
                            <p className="text-xs text-blue-500 mt-1">Changed</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => router.push('/dashboard')}
                      >
                        Return to Dashboard
                      </Button>
                      
                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={isSaving || changedFields.size === 0}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Subscription Tab */}
                <TabsContent value="subscription" className="space-y-6">
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Subscription Plan</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Choose the subscription plan that best fits your needs.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="subscription_plan">Current Plan</Label>
                        <select
                          id="subscription_plan"
                          name="subscription_plan"
                          value={profile.subscription_plan}
                          onChange={handleInputChange}
                          className={`w-full h-10 px-3 mt-1 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 ${getFieldClass('subscription_plan')}`}
                        >
                          {SUBSCRIPTION_PLANS.map(plan => (
                            <option key={plan.value} value={plan.value}>
                              {plan.label}
                            </option>
                          ))}
                        </select>
                        {hasFieldChanged('subscription_plan') && (
                          <p className="text-xs text-blue-500 mt-1">Changed from original plan</p>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Plan Features</h4>
                        {profile.subscription_plan === 'FREE' && (
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Basic access to TheoForge tools</li>
                            <li>Limited projects</li>
                            <li>Community support</li>
                          </ul>
                        )}
                        {profile.subscription_plan === 'BASIC' && (
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Unlimited projects</li>
                            <li>Basic AI features</li>
                            <li>Email support</li>
                            <li>Monthly usage reports</li>
                          </ul>
                        )}
                        {profile.subscription_plan === 'PREMIUM' && (
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>All Basic features</li>
                            <li>Advanced AI capabilities</li>
                            <li>Priority support</li>
                            <li>Team collaboration</li>
                            <li>API access</li>
                          </ul>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
