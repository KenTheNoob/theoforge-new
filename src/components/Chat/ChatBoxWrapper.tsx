// filepath: src/components/Chat/ChatBoxWrapper.tsx
"use client";

import dynamic from 'next/dynamic';

// Import ChatBox with dynamic loading and disable SSR
const ChatBox = dynamic(() => import('./ChatBox'), {
  ssr: false,
  loading: () => null // Optional: you can add a loading indicator here
});

export default function ChatBoxWrapper() {
  return <ChatBox />;
}