'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import axios from 'axios';

// Create a random ID function instead of relying on uuid
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// API URL
const API_BASE_URL = '/api';

// Define message types
interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  options?: string[];
}

// Guest Data Interface (matching the structure you provided)
interface GuestData {
  name?: string;
  contact_info?: string;
  company?: string;
  industry?: string;
  project_type?: string[];
  budget?: string;
  timeline?: string;
  pain_points?: string[];
  current_tech?: string[];
  additional_notes?: string;
  session_id: string;
  status: string;
  interaction_events: string[];
  interaction_history: {
    event: string;
    timestamp: string;
  }[];
  page_views: string[];
}

const ChatBox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [guestData, setGuestData] = useState<GuestData>({
    session_id: generateId(),
    status: 'NEW',
    interaction_events: [],
    interaction_history: [],
    page_views: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatCompleted, setChatCompleted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Chat questions sequence - wrapped in useMemo to prevent unnecessary re-creation
  const chatFlow = useMemo(() => [
    { 
      id: 'welcome', 
      message: "👋 Hi there! I'm TheoBot, your digital assistant at TheoForge. I'm here to understand your project needs better. May I ask for your name?",
      field: 'name',
      type: 'text'
    },
    { 
      id: 'email', 
      message: "Great to meet you! What's the best email to reach you at?",
      field: 'contact_info',
      type: 'email'
    },
    { 
      id: 'company', 
      message: "Thanks! What company are you with?",
      field: 'company',
      type: 'text'
    },
    { 
      id: 'industry', 
      message: "And what industry is your company in?",
      field: 'industry',
      type: 'text',
      options: ['Software', 'E-commerce', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Other']
    },
    { 
      id: 'project_type', 
      message: "What type of project are you looking to build?",
      field: 'project_type',
      type: 'select',
      options: ['Web Development', 'Mobile App', 'E-commerce', 'Enterprise Software', 'UI/UX Design', 'Other']
    },
    { 
      id: 'budget', 
      message: "What's your approximate budget range for this project?",
      field: 'budget',
      type: 'select',
      options: ['Less than $10,000', '$10,000 - $20,000', '$20,000 - $50,000', '$50,000 - $100,000', '$100,000+', 'Not sure yet']
    },
    { 
      id: 'timeline', 
      message: "When are you looking to start or complete this project?",
      field: 'timeline',
      type: 'select',
      options: ['As soon as possible', 'Next month', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Next year', 'Just exploring']
    },
    { 
      id: 'current_tech', 
      message: "What technologies are you currently using? (You can list multiple)",
      field: 'current_tech',
      type: 'text'
    },
    { 
      id: 'pain_points', 
      message: "What challenges are you trying to solve with this project? (You can list multiple)",
      field: 'pain_points',
      type: 'text'
    },
    { 
      id: 'additional_notes', 
      message: "Is there anything else you'd like to share about your project?",
      field: 'additional_notes',
      type: 'text'
    },
    { 
      id: 'thankyou', 
      message: "Thank you for sharing your project details! One of our team members will reach out to you soon to discuss further. Is there a specific time that works best for a follow-up call?",
      field: 'follow_up_time',
      type: 'text',
      final: true
    }
  ], []);

  // Add a new message - wrapped in useCallback to prevent unnecessary re-creation
  const addMessage = useCallback((text: string, isBot: boolean, options?: string[]) => {
    const newMessage: Message = {
      id: generateId(),
      text,
      isBot,
      timestamp: new Date(),
      options
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    
    // Add to interaction history
    if (!isBot) {
      const newEvent = {
        event: `chat_message_${chatFlow[currentQuestion-1]?.id || 'initial'}`,
        timestamp: new Date().toISOString()
      };
      
      setGuestData(prev => ({
        ...prev,
        interaction_history: [...prev.interaction_history, newEvent],
        interaction_events: [...prev.interaction_events, newEvent.event]
      }));
    }
  }, [currentQuestion, chatFlow]);

  // Handle user input
  const handleSendMessage = () => {
    if (input.trim() === '') return;
    
    // Add user message to chat
    addMessage(input, false);
    
    // Process user's answer
    handleAnswer(input);
    
    // Clear input field
    setInput('');
  };

  // Process user's answer and move to next question
  const handleAnswer = (answer: string) => {
    const currentStep = chatFlow[currentQuestion - 1];
    
    if (!currentStep) return;
    
    // Update guest data with the answer
    if (currentStep.field) {
      // Handle array fields vs string fields
      if (
        currentStep.field === 'pain_points' || 
        currentStep.field === 'current_tech' || 
        currentStep.field === 'project_type'
      ) {
        // Split the answer by commas for array fields
        const answers = answer.split(',').map(a => a.trim()).filter(a => a);
        setGuestData(prev => ({
          ...prev,
          [currentStep.field]: answers
        }));
      } else {
        // For normal string fields
        setGuestData(prev => ({
          ...prev,
          [currentStep.field]: answer
        }));
      }
    }
    
    // Move to next question
    setTimeout(() => {
      if (currentQuestion < chatFlow.length) {
        const nextQuestion = chatFlow[currentQuestion];
        addMessage(nextQuestion.message, true, nextQuestion.options);
        setCurrentQuestion(currentQuestion + 1);
        
        // If this is the final question, submit the data
        if (nextQuestion.final) {
          submitGuestData();
        }
      }
    }, 500);
  };

  // Handle option selection for multiple choice questions
  const handleOptionSelect = (option: string) => {
    addMessage(option, false);
    handleAnswer(option);
  };

  // Submit guest data to API
  const submitGuestData = async () => {
    setIsSubmitting(true);
    
    try {
      // Add current page to page_views
      const currentPage = window.location.pathname;
      const updatedGuestData = {
        ...guestData,
        page_views: [...guestData.page_views, currentPage],
        status: 'NEW'
      };
      
      // Submit to API - remove trailing slash to match our API route
      console.log('Submitting guest data:', updatedGuestData);
      const response = await axios.post(`${API_BASE_URL}/guests`, updatedGuestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200 || response.status === 201) {
        console.log('Guest data submitted successfully:', response.data);
        setChatCompleted(true);
        
        // Add final thank you message
        setTimeout(() => {
          addMessage("Perfect! I've saved all your information. Someone from our team will be in touch soon. Feel free to explore our website in the meantime!", true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error submitting guest data:', error);
      
      // Detailed error logging
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      
      addMessage("I'm sorry, there was an error saving your information. Please try again later or contact us directly at contact@theoforge.com", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Track page views
  useEffect(() => {
    // Add current page to page_views when component mounts
    const currentPage = window.location.pathname;
    setGuestData(prev => ({
      ...prev,
      page_views: [...prev.page_views, currentPage]
    }));
    
    // Listen for page changes (for SPA)
    const handleRouteChange = () => {
      const newPage = window.location.pathname;
      setGuestData(prev => ({
        ...prev,
        page_views: [...prev.page_views, newPage]
      }));
    };
    
    // Add event listeners for SPA navigation
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start the chat with first message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const firstQuestion = chatFlow[0];
      addMessage(firstQuestion.message, true);
      setCurrentQuestion(1);
      
      // Record chat open event
      const openEvent = {
        event: 'chat_opened',
        timestamp: new Date().toISOString()
      };
      
      setGuestData(prev => ({
        ...prev,
        interaction_history: [...prev.interaction_history, openEvent],
        interaction_events: [...prev.interaction_events, 'chat_opened']
      }));
    }
  }, [isOpen, messages.length, addMessage, chatFlow]);

  // Toggle chat open/closed
  const toggleChat = () => {
    if (!isOpen) {
      setIsMinimized(false);
    }
    setIsOpen(!isOpen);
  };

  // Toggle chat minimized/maximized
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    
    // Record minimize/maximize event
    const event = {
      event: isMinimized ? 'chat_maximized' : 'chat_minimized',
      timestamp: new Date().toISOString()
    };
    
    setGuestData(prev => ({
      ...prev,
      interaction_history: [...prev.interaction_history, event],
      interaction_events: [...prev.interaction_events, event.event]
    }));
  };

  return (
    <>
      {/* Chat button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-4 right-4 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Open chat"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div 
          className={`fixed bottom-4 right-4 z-50 flex flex-col w-96 ${
            isMinimized ? 'h-16' : 'h-[32rem]'
          } bg-white rounded-lg shadow-xl transition-all duration-300 overflow-hidden border border-gray-200`}
        >
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
            <div className="flex items-center">
              <MessageSquare size={20} className="mr-2" />
              <h3 className="font-medium">TheoForge Assistant</h3>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={toggleMinimize} 
                className="text-white hover:text-gray-200"
                aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}
              >
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button 
                onClick={toggleChat} 
                className="text-white hover:text-gray-200"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Chat messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 max-w-[80%] ${
                      message.isBot
                        ? 'mr-auto bg-gray-100 text-gray-800 rounded-tr-xl rounded-br-xl rounded-bl-xl'
                        : 'ml-auto bg-blue-600 text-white rounded-tl-xl rounded-bl-xl rounded-br-xl'
                    } p-3 shadow-sm`}
                  >
                    <p>{message.text}</p>
                    {message.options && message.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => handleOptionSelect(option)}
                            className="px-3 py-1 text-xs bg-white text-blue-600 rounded-full border border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
                
                {/* Loading indicator when submitting */}
                {isSubmitting && (
                  <div className="flex items-center justify-center my-2">
                    <div className="animate-pulse flex space-x-2">
                      <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat input */}
              {!chatCompleted && (
                <div className="border-t border-gray-200 p-3">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r-full disabled:bg-blue-400 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBox;
