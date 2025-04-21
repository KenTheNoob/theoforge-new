'use client';

import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/Layout/PageContainer';
import { GuestChat } from '@/components/ChatBox/GuestChat';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import Paragraph from '@/components/Common/Paragraph';
import { CheckIcon, ExclamationCircleIcon, MinusIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { API_URL } from '@/utils/axiosConfig';

interface Question {
  id: string;
  question: string;
}

interface GuestInfo {
  id: string | null;
  name?: string;
  company?: string;
  industry?: string;
  project_type?: string[];
  budget?: string;
  timeline?: string;
  contact_info?: string;
  pain_points?: string[];
  current_tech?: string[];
  additional_notes?: string;
  // Additional info not in database
  sessionCount: number;
  questionsAnswered: Question[];
  status?: 'NEW' | 'CONTACTED' | 'CONVERTED';
}

// Rebuilt Contact Page Component
const ContactPage: React.FC = () => {
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({id: '', sessionCount: 0, questionsAnswered: []});
  const [showContactForm, setShowContactForm] = useState(false);
  const [showAlert, setShowAlert] = useState({ show: false, message: "", type: "success" });
  const pageTitle = "Meet Theophrastus";
  const pageSubtitle = "Our AI assistant that can answer your questions, collect your information, and connect you with our team.";

  // Show success alert
  const showSuccessAlert = (message: string) => {
    setShowAlert({
      show: true,
      message,
      type: "success"
    });
    
    setTimeout(() => {
      setShowAlert(prev => ({ ...prev, show: false }));
    }, 3000);
  };
  
  // Show error alert
  const showErrorAlert = (message: string) => {
    setShowAlert({
      show: true,
      message,
      type: "error"
    });
    
    setTimeout(() => {
      setShowAlert(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const submitForm = async () => {
    try {
      const DISCORD_WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;
      if (DISCORD_WEBHOOK_URL) {
        let message = "New guest:"
        Object.entries(guestInfo).forEach(([key, value]) => {
          // Display string fields
          if(value && typeof value === 'string') message += `\n${key}: ${value}`;
          // Display array fields
          else if (value && value.length > 0 && Array.isArray(value)) message += `\n${key}: ${value.toString()}`;
        });
        await fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: message
          }),
        }).then(() => {
          showSuccessAlert("Contact information sent");
          setShowContactForm(false);
          axios.put(`${API_URL}/guests/${guestInfo.id}`, {status: 'CONTACTED'}).then(() => {
           setGuestInfo({...guestInfo, status: 'CONTACTED'});
          }).catch((err) => {
            console.error(err);
          });
        }).catch(() => {
          showErrorAlert("Failed to send contact information");
        });
      }
      else {
        console.log("No API key provided");
      }
    } catch (err: any) {
      console.log(err.message)
    }
  }
  
  useEffect(() => {
    addEventListener('infoUpdate', function(event: any) {
      setGuestInfo(event.detail);
      console.log(event.detail);
    });
  }, []);

  return (
    <main>
      <PageContainer 
        title={pageTitle} 
        subtitle={pageSubtitle} 
      >
        <div className="mx-auto w-full h-screen flex flex-col items-center justify-center pb-12">
          <div className="relative w-full h-full max-w-md mx-auto">
            <GuestChat />
          </div>
        </div>

        {/* Divider */}
        <hr className="my-12 md:my-16 border-border-light dark:border-border-dark" />

        {/* Contact Info Section */}
        <div className="text-center"> 
          <h2 className="font-poppins text-2xl font-semibold mb-6 text-text-primary dark:text-dark-text-primary">
            Contact Information
          </h2>
          <div className="flex flex-col space-y-3 items-center">
            <a
              href="mailto:info@yourcompany.com" 
              className="font-poppins flex items-center text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary transition-colors duration-150 ease-in-out"
            >
              <span className="ml-2">info@yourcompany.com</span> 
            </a>
            <a
              href="tel:+1234567890" 
              className="font-poppins flex items-center text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary transition-colors duration-150 ease-in-out"
            >
              <span className="ml-2">(123) 456-7890</span> 
            </a>
            {/* Add Address etc. if needed using similar structure */}
            {guestInfo.status !== 'CONTACTED' ? (
              <button
                className="text-sm font-bold px-4 py-2 rounded-lg transition-all duration-300 bg-black text-white hover:bg-black/80 shadow-sm hover:shadow-md"
                onClick={() => setShowContactForm(true)}
              >
                Contact Us
              </button>
            ) : (
              <Paragraph className="bg-black text-white p-1 rounded-lg">Contact Information Sent</Paragraph>
            )}
          </div>
        </div>
      </PageContainer>
      {showContactForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <Card className="w-full max-w-md shadow-2xl rounded-2xl border border-neutral-300 bg-white dark:bg-gray-900 relative">
            {/* Header */}
            <CardHeader className="p-6 pb-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-bold text-neutral-900 dark:text-white">
                    Contact Us
                  </h5>
                  <Paragraph variant="body1" className="text-sm text-neutral-600 dark:text-neutral-300">
                    We'd love to hear from you!
                  </Paragraph>
                </div>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  aria-label="Close form"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </CardHeader>
    
            {/* Content */}
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-6 overscroll-y-contain overflow-auto h-96 p-2">
                <Input
                  placeholder="Name"
                  value={guestInfo.name ? guestInfo.name : ''}
                  onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                />
                <Input
                  placeholder="Company"
                  value={guestInfo.company ? guestInfo.company : ''}
                  onChange={(e) => setGuestInfo({ ...guestInfo, company: e.target.value })}
                />
                <Input
                  placeholder="Industry"
                  value={guestInfo.industry ? guestInfo.industry : ''}
                  onChange={(e) => setGuestInfo({ ...guestInfo, industry: e.target.value })}
                />
                <Input
                  placeholder="Budget"
                  value={guestInfo.budget ? guestInfo.budget : ''}
                  onChange={(e) => setGuestInfo({ ...guestInfo, budget: e.target.value })}
                />
                <Input
                  placeholder="Timeline"
                  value={guestInfo.timeline ? guestInfo.timeline : ''}
                  onChange={(e) => setGuestInfo({ ...guestInfo, timeline: e.target.value })}
                />
                <Input
                  placeholder="Contact Info"
                  value={guestInfo.contact_info ? guestInfo.contact_info : ''}
                  onChange={(e) => setGuestInfo({ ...guestInfo, contact_info: e.target.value })}
                />
                <Input
                  placeholder="Additional Notes"
                  value={guestInfo.additional_notes ? guestInfo.additional_notes : ''}
                  onChange={(e) => setGuestInfo({ ...guestInfo, additional_notes: e.target.value })}
                />
                {
                  // Project type fields
                  Array.from({length: guestInfo.project_type ? guestInfo.project_type.length : 0}, (_, num) => num+1 && 
                  <Input
                    key={"Project Type "+(num+1)}
                    placeholder={"Project Type "+(num+1)}
                    value={guestInfo.project_type ? guestInfo.project_type[num] : ''}
                    onChange={(e) => setGuestInfo({ ...guestInfo, project_type: guestInfo.project_type ? guestInfo.project_type.map((value, i) => (i === num ? e.target.value : value)) : [e.target.value] })}
                  />)
                }
                <div className="inline-flex flex-row gap-6">
                  <Button
                    color="green"
                    size="sm"
                    className="w-max h-max flex items-center gap-1"
                    onClick={() => {
                      setGuestInfo({ ...guestInfo, project_type: guestInfo.project_type ? guestInfo.project_type.concat(['']) : ['']})
                    }}>
                    Add Project Type<PlusIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-max h-max flex items-center gap-1"
                    disabled={guestInfo.project_type ? (guestInfo.project_type.length === 0 ? true : false) : true}
                    onClick={() => {
                      setGuestInfo({ ...guestInfo, project_type: guestInfo.project_type ? (guestInfo.project_type.length === 1 ? undefined : guestInfo.project_type.slice(0, -1)) : undefined})
                    }}>
                    Remove Project Type<MinusIcon className="h-4 w-4" />
                  </Button>
                </div>
                {
                  // Pain point fields
                  Array.from({length: guestInfo.pain_points ? guestInfo.pain_points.length : 0}, (_, num) => num+1 && 
                  <Input
                    key={"Pain Point "+(num+1)}
                    placeholder={"Pain Point "+(num+1)}
                    value={guestInfo.pain_points ? guestInfo.pain_points[num] : ''}
                    onChange={(e) => setGuestInfo({ ...guestInfo, pain_points: guestInfo.pain_points ? guestInfo.pain_points.map((value, i) => (i === num ? e.target.value : value)) : [e.target.value] })}
                  />)
                }
                <div className="inline-flex flex-row gap-6">
                  <Button
                    color="green"
                    size="sm"
                    className="w-max h-max flex items-center gap-1"
                    onClick={() => {
                      setGuestInfo({ ...guestInfo, pain_points: guestInfo.pain_points ? guestInfo.pain_points.concat(['']) : ['']})
                    }}>
                    Add Pain Point<PlusIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-max h-max flex items-center gap-1"
                    disabled={guestInfo.pain_points ? (guestInfo.pain_points.length === 0 ? true : false) : true}
                    onClick={() => {
                      setGuestInfo({ ...guestInfo, pain_points: guestInfo.pain_points ? (guestInfo.pain_points.length === 1 ? undefined : guestInfo.pain_points.slice(0, -1)) : undefined})
                    }}>
                    Remove Pain Point<MinusIcon className="h-4 w-4" />
                  </Button>
                </div>
                {
                  // Current tech fields
                  Array.from({length: guestInfo.current_tech ? guestInfo.current_tech.length : 0}, (_, num) => num+1 && 
                  <Input
                    key={"Current Tech "+(num+1)}
                    placeholder={"Current Tech "+(num+1)}
                    value={guestInfo.current_tech ? guestInfo.current_tech[num] : ''}
                    onChange={(e) => setGuestInfo({ ...guestInfo, current_tech: guestInfo.current_tech ? guestInfo.current_tech.map((value, i) => (i === num ? e.target.value : value)) : [e.target.value] })}
                  />)
                }
                <div className="inline-flex flex-row gap-6">
                  <Button
                    color="green"
                    size="sm"
                    className="w-max h-max flex items-center gap-1"
                    onClick={() => {
                      setGuestInfo({ ...guestInfo, current_tech: guestInfo.current_tech ? guestInfo.current_tech.concat(['']) : ['']})
                    }}>
                    Add Current Tech<PlusIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-max h-max flex items-center gap-1"
                    disabled={guestInfo.current_tech ? (guestInfo.current_tech.length === 0 ? true : false) : true}
                    onClick={() => {
                      setGuestInfo({ ...guestInfo, current_tech: guestInfo.current_tech ? (guestInfo.current_tech.length === 1 ? undefined : guestInfo.current_tech.slice(0, -1)) : undefined})
                    }}>
                    Remove Current Tech<MinusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
    
            {/* Footer */}
            <CardFooter className="px-6 pb-6 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium"
                onClick={submitForm}
              >
                Submit
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      {showAlert.show && (
        <div className={`mb-5 p-4 rounded-lg flex items-start ${showAlert.type === "success" ? "bg-green-50 text-green-900 border border-green-200" : "bg-red-50 text-red-900 border border-red-200"}`}>
          <div className="flex-shrink-0 mr-3">
            {showAlert.type === "success" ? 
              <CheckIcon className="h-6 w-6 text-green-500" /> : 
              <ExclamationCircleIcon className="h-6 w-6 text-red-500" />}
          </div>
          <div>{showAlert.message}</div>
        </div>
      )}
    </main>
  );
 };

export default ContactPage;
