'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  TrashIcon,
  UserCircleIcon,
  LockClosedIcon,
  ChevronDoubleRightIcon,
  LightBulbIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { getGuestId } from '@/lib/guestIdentifier';
import { API_URL } from '@/utils/axiosConfig';
import axios from 'axios';
import Paragraph from '../Common/Paragraph';
import { Tooltip, TooltipContent } from '../ui/tooltip';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { TooltipProvider } from '@radix-ui/react-tooltip';

interface Question {
  id: string;
  question: string;
}

// Guest info collected
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

interface Interaction {
  event: string,
  timestamp: string,
}

// Guest stored in database
interface Guest {
  additional_notes?: string;
  budget?: string;
  company?: string;
  contact_info?: string;
  created_at?: string;
  current_tech?: string[];
  first_visit_timestamp?: string;
  id: string | null;
  industry?: string;
  interaction_events?: string[];
  interaction_history?: Interaction[];
  name?: string;
  page_views?: string[];
  pain_points?: string[];
  project_type?: string[];
  session_id?: string;
  status?: 'NEW' | 'CONTACTED' | 'CONVERTED';
  timeline?: string;
  updated_at?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

type Theme = 'light' | 'dark';

// AI setup
const AI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const SYSTEM_PROMPT = "You are a helpful, friendly AI assistant for Theoforge, a company that specializes in ETL Solutions, Knowledge Graphs, and Custom LLM Training. Your goal is to be helpful, gather information about the guest to better assist them, and ultimately help convert them to customers. Ask questions one at a time to learn about their needs. Be concise but friendly.";
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

// Questions to ask guests
const GUEST_QUESTIONS: Question[] = [
  { id: 'intro', question: "Hello! I'm your AI assistant from Theoforge. Before we get started, could you tell me about you and your company?"},
  { id: 'name', question: "Before we continue, may I know your name?" },
  { id: 'company', question: "Could you tell me what company are you with?" },
  { id: 'industry', question: "What industry are you in?"},
  { id: 'project_type', question: "What type of projects are you interested in?"},
  { id: 'budget', question: "What is your current budget?"},
  { id: 'timeline', question: "Please tell me more about the timeline of your project."},
  { id: 'contact_info', question: "May I get your contact info?"},
  { id: 'pain_points', question: "What specific data or AI challenges is your company facing that brought you here today?" },
  { id: 'current_tech', question: "What tech is your company into?" },
  { id: 'additional_notes', question: "Is there any additional info that might be helpful to know about you or your company?"}
];

// Generate a unique ID for messages
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Initial welcome message
const INITIAL_MESSAGES: Message[] = [
  {
    id: generateId(),
    role: 'system',
    content: SYSTEM_PROMPT,
    timestamp: new Date().toISOString()
  },
  {
    id: generateId(),
    role: 'assistant',
    content: GUEST_QUESTIONS[0].question,
    timestamp: new Date().toISOString()
  }
];

export function GuestChat() {
  // Guest identification
  const guestId = useRef<string | null>(null);
  const CHAT_STORAGE_KEY = useRef<string | null>(null);
  const GUEST_INFO_KEY = useRef<string | null>(null);
  const initialized = useRef(false);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  
  // Guest info state
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({id: '', sessionCount: 0, questionsAnswered: []});

  // Chat state management
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIntroduction, setShowIntroduction] = useState(true);
  const [theme, setTheme] = useState<Theme>('light');

  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the latest message
    useEffect(() => {
      if (!showIntroduction) messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }, [visibleMessages]);
  
  // Filter out system messages for display
  useEffect(() => {
    setVisibleMessages(messages.filter(msg => msg.role !== 'system'));
  }, [messages]);
  const loadGuest = async() => {
    // Create guest if new user
    guestId.current = await getGuestId();
    if(guestId.current) {
      try {
        // Load guest info
        const res = await axios.get(`${API_URL}/guests/${guestId.current}`);
        const guest: Guest = res.data;
        // Make sure guest exists on backend(sync)
        if(guest && guest.id === guestId.current){
          CHAT_STORAGE_KEY.current = 'chat_'+guest.id;
          GUEST_INFO_KEY.current = 'guest_'+guest.id;
          const storedGuestInfo = localStorage.getItem(GUEST_INFO_KEY.current);
          const remoteGuestInfo = {
            id: guest.id,
            name: guest.name,
            company: guest.company,
            industry: guest.industry,
            project_type: guest.project_type,
            budget: guest.budget,
            timeline: guest.timeline,
            contact_info: guest.contact_info,
            pain_points: guest.pain_points,
            current_tech: guest.current_tech,
            additional_notes: guest.additional_notes,
            status: guest.status
          }
          // Load guest info
          if (storedGuestInfo) {
            try {
              const data: GuestInfo = JSON.parse(storedGuestInfo);
              setGuestInfo({
                ...remoteGuestInfo,
                sessionCount: data.sessionCount + 1,
                questionsAnswered: data.questionsAnswered
              });
            } catch (error) {
              console.error("Failed to parse guest info:", error);
            }
          } else {
            localStorage.setItem(GUEST_INFO_KEY.current, JSON.stringify({
              ...remoteGuestInfo,
              sessionCount: guestInfo.sessionCount + 1,
              questionsAnswered: guestInfo.questionsAnswered
            }));
          }
          // Load chat history
          const stored = localStorage.getItem(CHAT_STORAGE_KEY.current);
          if (stored) {
            try {
              const data = JSON.parse(stored);
              if (Array.isArray(data) && data.length > 0) {
                // Ensure we have a system prompt
                if (!data.some(msg => msg.role === 'system')) {
                  data.unshift({
                    id: generateId(),
                    role: 'system',
                    content: SYSTEM_PROMPT,
                    timestamp: new Date().toISOString()
                  });
                }
                setMessages(data);
                if(data.length > 2) setShowIntroduction(false);
              }
            } catch (error) {
              console.error("Failed to parse chat history:", error);
            }
          } else {
            localStorage.setItem(CHAT_STORAGE_KEY.current, JSON.stringify(messages));
          }
          setIsStorageLoaded(true);
        } else {
          throw Error('Out of sync with backend');
        }
      } catch {
        console.error('Failed to retrieve guest');
        // If out of sync, remove guest and recreate when guest returns
        if(guestId.current) {
          localStorage.removeItem('theoforge_guest_id');
          localStorage.removeItem('chat_'+guestId.current);
          localStorage.removeItem('guest_'+guestId.current);
        }
      }
    }
  }
  
  // Load chat history and guest info on mount
  useEffect(() => {
    // Prevent react strict mode remount from making API call twice in development
    if(!initialized.current){
      initialized.current = true;
      loadGuest();
    }
  }, []);

  // Persist chat history on every update
  useEffect(() => {
    if (isStorageLoaded) {
      try {
        if (CHAT_STORAGE_KEY.current) localStorage.setItem(CHAT_STORAGE_KEY.current, JSON.stringify(messages));
        else console.warn('Could not load messages');
      } catch (e) {
        console.warn("Could not save to localStorage:", e);
      }
    }
  }, [messages]);
  
  // Persist and sync guest info with backend with every update
  useEffect(() => {
    if (isStorageLoaded) {
      try {
        axios.put(`${API_URL}/guests/${guestId.current}`, guestInfo);
        dispatchEvent(new CustomEvent("infoUpdate", {detail: guestInfo}));
        if(GUEST_INFO_KEY.current) localStorage.setItem(GUEST_INFO_KEY.current, JSON.stringify(guestInfo));
        else console.warn('No guest info key');
      } catch (e) {
        console.warn("Could not save guest info:", e);
      }
    }
  }, [guestInfo]);

  // Get AI response using sendMessage
  const getAIResponse = async (context: Message[], updatedMessages: Message[]): Promise<string> => {
    setIsThinking(true);
    setError(null);
    
    try {      
      // Prepare messages for the API
      const apiMessages = context.map(m => ({ 
        role: m.role, 
        content: m.content 
      }));
      
      // COLLECT GUEST INFO
      // Add this context to the first system message
      apiMessages[0].content = `You are an AI assistant that collects information about guests and generates JSON.
      The following info has already been filled out.
      info: """${JSON.stringify(guestInfo)}"""
      Examine the messages for information about the guest and correct the info if needed. Additional notes must be under 100 characters.`;
      apiMessages[0].role = 'system';
      
      const response = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: apiMessages,
          max_tokens: 500,
          temperature: 0.7,
          response_format: {
            "type": "json_schema",
            "json_schema": {
              "name": "guestInfo",
              "strict": true,
              "schema": {
                "type": "object",
                "properties":{
                  "name": {
                    "description": "Guest's full name",
                    "type": ["string", "null"]
                  },
                  "company": {
                    "description": "Company associated with the guest",
                    "type": ["string", "null"]
                  },
                  "industry": {
                    "description": "Industry of the guest",
                    "type": ["string", "null"]
                  },
                  "project_type": {
                    "description": "Type of project guest is interested in",
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  },
                  "budget": {
                    "description": "Estimated budget for the project",
                    "type": ["string", "null"]
                  },
                  "timeline": {
                    "description": "Project timeline",
                    "type": ["string", "null"]
                  },
                  "contact_info": {
                    "description": "Guest's contact information",
                    "type": ["string", "null"]
                  },
                  "pain_points": {
                    "description": "Challenges or problems the guest is facing",
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  },
                  "current_tech": {
                    "description": "Guest's current technology stack",
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  },
                  "additional_notes": {
                    "description": "Any short and important additional notes",
                    "type": ["string", "null"]
                  }
                },
                "required": ["name", "company", "industry", "project_type", "budget", "timeline", "contact_info", "pain_points", "current_tech", "additional_notes"],
                "additionalProperties": false
              }
            }
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      setGuestInfo(JSON.parse(data.choices[0].message.content));
      // Create response
      // Add system prompt and context to the first system message
      apiMessages[0].content = `${SYSTEM_PROMPT}
      The following guest info has been collected.
      info: """${JSON.stringify(guestInfo)}"""`;
      apiMessages[0].role = 'system';
      // Use openai streaming api
      const streamResponse = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: apiMessages,
          max_tokens: 500,
          temperature: 0.7,
          stream: true
        })
      });
      if (!streamResponse.body){
        throw new Error('Failed to get response body');
      }
      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiResponse = "";
      // Read until stream is done
      while(true) {
        const {done, value} = await reader.read();
        if(done) {
          break;
        }
        // While streaming, decode the stream
        const decodedChunk = decoder.decode(value);
        const lines = decodedChunk.split("\n");
        // Parse the result
        const parsedLines = lines.map(
          (line) => line.replace(/^data: /, "").trim()
        ).filter(
          (line) => line !== "" && line !== "[DONE]"
        ).map((line) => JSON.parse(line));
        for (const parsedLine of parsedLines) {
          // Extract the content
          const content = parsedLine.choices[0].delta.content;
          if (content) {
            setMessages([...updatedMessages, {
              id: generateId(),
              role: 'assistant',
              content: aiResponse+content,
              timestamp: new Date().toISOString()
            }]);
            aiResponse+=content;
          }
        }
      }
      return 'Done'
    } catch (error: any) {
      console.error("Error generating AI response:", error);
      setError(error.message || "Failed to get response from AI service");
      return "I'm sorry, I encountered an error while processing your request. Please try again later.";
    } finally {
      setIsThinking(false);
    }
  };

  // Clear the chat history
  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      setMessages(INITIAL_MESSAGES);
      setShowIntroduction(true);
      try {
        if(CHAT_STORAGE_KEY.current) localStorage.removeItem(CHAT_STORAGE_KEY.current);
      } catch (e) {
        console.warn("Could not access localStorage:", e);
      }
    }
  };

  // Handler for sending text messages
  const handleSend = async (manualInput?: string) => {
    const textToSend = manualInput || input.trim();
    if (!textToSend) return;
    
    // Hide introduction once user starts chatting
    if (showIntroduction) {
      setShowIntroduction(false);
    }
    
    setInput('');
    
    // Create a new user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };
    
    // Update messages state with user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Context limitation - use last 15 messages for context (including system prompt)
    const context = updatedMessages.slice(-15);
    
    // Ensure system prompt is included
    if (!context.some(msg => msg.role === 'system')) {
      context.unshift({
        id: generateId(),
        role: 'system',
        content: SYSTEM_PROMPT,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get AI response
    await getAIResponse(context, updatedMessages);
  };

  // Allow sending message with Enter key (without Shift)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick replies/suggestions
  const handleQuickReply = (text: string) => {
    setInput(text);
    setTimeout(() => handleSend(text), 100);
  };

  // Quick reply suggestions based on context
  const getSuggestions = () => {
    if (visibleMessages.length <= 1) {
      return [
        `Tell me about Theoforge`,
        "What services do you offer?",
        "How can I schedule a demo?"
      ];
    }
    
    if (guestInfo.pain_points?.length) {
      return [
        `How do you handle ${guestInfo.pain_points[0]}?`,
        "What are your pricing options?",
        "Can you share some case studies?"
      ];
    }
    
    return [
      "Tell me about your Knowledge Graph solutions",
      "What makes your ETL solutions unique?",
      "Do you offer custom LLM training?"
    ];
  };

  return (
    <Card className={`w-full rounded-none py-0 gap-0 ${theme === "dark" ? "dark" : ""}`}>
      <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm rounded-b-none">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="relative mr-3">
              <img 
                src={"/characters/theophrastus.png"} 
                alt={`Theoforge Logo`} 
                className="h-9 w-9 rounded-full border-2 border-white shadow-sm" 
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold font-poppins text-gray-900 dark:text-white">
                Theoforge AI
              </h2>
            </div>
          </div>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <button
                  onClick={() => {
                    setTheme(theme === "light" ? "dark" : "light");
                    dispatchEvent(new CustomEvent("themeChange", {detail: theme === 'light' ? 'dark' as Theme : 'light' as Theme}));
                  }}
                  className="h-8 w-8 rounded-full hover:bg-white/20 transition-all justify-items-center"
                >
                  <LightBulbIcon className="h-5 w-5" color="teal"/>
                </button>
                <TooltipContent>Change Theme</TooltipContent>
              </Tooltip>
              <Tooltip>
                <button
                  onClick={clearChat}
                  className="h-8 w-8 rounded-full hover:bg-white/20 transition-all justify-items-center"
                >
                  <TrashIcon className="h-5 w-5" color="teal"/>
                </button>
                <TooltipContent>Clear chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={`flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900 relative scroll-smooth space-y-4`}
      >
        {/* Introduction Panel - only shown at first */}
        {showIntroduction && (
          <div className={`mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border text-gray-800 dark:text-gray-200 shadow-sm`}>
            <div className="flex items-center mb-3">
              <SparklesIcon className={`h-5 w-5 text-teal-500 mr-2`} />
              <h1 className={`font-semibold text-xl`}>Meet Theophrastus</h1>
            </div>
            <Paragraph variant="body1" className={`mb-0`}>
              Our AI assistant that can answer your questions, collect your information, and connect you with our team.
            </Paragraph>
            <Paragraph variant="body1" className={`mb-3 w-full text-center`}>
              Feel free to ask about:
            </Paragraph>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {["ETL Solutions", "Knowledge Graphs", "Custom LLM Training", "Case Studies & Pricing"].map(
                (service) => (
                  <div
                    className={`p-2 rounded border border-teal-200 flex items-center bg-white/80 dark:bg-gray-800/80`}
                    key={service}
                  >
                    <div className={`mr-2 p-1 rounded-full bg-teal-100 dark:bg-teal-900`}>
                      <ChevronDoubleRightIcon className={`h-3 w-3 text-teal-500`} />
                    </div>
                    <Paragraph variant="body1" className={`font-medium`}>{service}</Paragraph>
                  </div>
                )
              )}
            </div>
            <div className="flex items-center mt-2">
              <LockClosedIcon className="h-3 w-3 mr-1 text-gray-400" />
              <Paragraph variant="body1" className="text-xs text-gray-500">
                Your conversations are stored locally on your device only
              </Paragraph>
            </div>
          </div>
        )}
        
        {/* Guest info chip - only show once info is collected */}
        {guestInfo.name && (
          <div className="flex justify-center mb-4">
            <Card
              color="teal"
              className={`px-3 py-1.5 dark:bg-gray-800 dark:text-white`}
            >
              <div className={`flex items-center gap-2`}>
                <UserCircleIcon className="h-4 w-4" />
                <p className="dark:text-white">{guestInfo.name+(guestInfo.company ? " from "+guestInfo.company : "")}</p>
              </div>
            </Card>
          </div>
        )}
        
        {visibleMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] p-4 rounded-xl shadow-md ${
                msg.role === 'user' 
                  ? 'bg-primary text-white ml-2 shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm'
              }`}
            >
              {msg === visibleMessages[visibleMessages.length - 1] && isThinking 
                ? <p className="whitespace-pre-wrap">{msg.content}<span className="animate-pulse">▌</span></p>
                : <p className="whitespace-pre-wrap">{msg.content}</p>
              }
              <Paragraph 
                variant="body1" 
                className={`mt-1 text-xs ${
                  msg.role === 'user' 
                    ? 'text-teal-100 dark:text-teal-200' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Paragraph>
            </div>
          </div>
        ))}
        
        {error && (
          <div className="flex justify-center">
            <div className="max-w-[90%] p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <Paragraph variant="body1" className="font-medium">{error}</Paragraph>
                  <Button 
                    size="sm" 
                    color="red" 
                    className="p-0 mt-1" 
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Quick Replies */}
        {!isThinking && (
          <div className="pt-2 flex flex-col gap-4 items-center">
            {getSuggestions().map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(suggestion)}
                className={`flex items-center justify-between w-full text-left px-4 py-3 rounded-md 
                    bg-white dark:bg-gray-800 hover:bg-primary/5 dark:hover:bg-primary/10 
                    text-gray-800 dark:text-gray-100 transition-all duration-200 
                    border border-gray-200 dark:border-gray-600 
                    shadow-sm hover:shadow-md transform hover:-translate-y-px
                    font-poppins`}
              >
                <span className="font-medium mr-2">{suggestion}</span>
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <ArrowRightIcon className="w-3.5 h-3.5 text-primary dark:text-primary-light" />
                </div>
              </button>
            ))}
          </div>
        )}
        <div ref={messageEndRef} />
      </CardContent>
      <CardFooter className={`p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm`}>
        <div className="w-full flex space-x-2">
          <input
            type="text"
            autoComplete="invalid"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className={`flex-1 p-2 px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white disabled:opacity-50`}
            aria-label="Message input"
            disabled={isThinking}
          />
          <Button
            type="submit"
            disabled={isThinking || !input.trim()}
            className="p-2 rounded-full disabled:opacity-50"
            aria-label="Send message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
