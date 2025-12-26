'use client';

import { RefObject } from 'react';
import MessageCard from './MessageCard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface MessageImage {
  base64: string;
  mimeType: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: MessageImage[];
}

interface ChatHistoryProps {
  messages: Message[];
  isTyping: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  streamingContent?: string;
  user: User | null;
}

export default function ChatHistory({ messages, isTyping, messagesEndRef, streamingContent, user }: ChatHistoryProps) {
  return (
    <div className="flex-1 overflow-y-auto mb-6 space-y-4 scrollbar-thin">
      {messages.map((message) => (
        <MessageCard key={message.id} message={message} user={user} />
      ))}

      {isTyping && streamingContent && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-foreground font-medium text-sm">Slide AI</span>
                <span className="text-muted-foreground text-xs">生成中...</span>
              </div>
              <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {streamingContent}
                <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse"></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTyping && !streamingContent && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-foreground font-medium text-sm">Slide AI</span>
                <span className="text-muted-foreground text-xs">考え中...</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
