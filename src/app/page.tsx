'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ChatHeader,
  ChatHistory,
  ChatInput,
  Sidebar,
  WelcomeScreen,
} from '@/components/chat';
import {
  getConversations,
  createConversation,
  deleteConversation,
  getMessages,
  saveMessage,
  updateConversationTitle,
  type Conversation,
} from '@/lib/database';
import { Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Check authentication
  useEffect(() => {
    const supabase = createClient();

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const convs = await getConversations(user.id);
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  // Load messages
  const loadMessages = async (conversationId: string) => {
    try {
      const msgs = await getMessages(conversationId);
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at),
        }))
      );
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSelectConversation = async (id: string) => {
    setCurrentConversationId(id);
    await loadMessages(id);
    setIsSidebarOpen(false);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const convertToGeminiHistory = (msgs: Message[]): ChatMessage[] => {
    return msgs.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));
  };

  const generateTitle = (content: string): string => {
    const maxLength = 30;
    const cleaned = content.replace(/\n/g, ' ').trim();
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.substring(0, maxLength) + '...';
  };

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputValue;
    if (!messageToSend.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setStreamingContent('');

    try {
      let convId = currentConversationId;
      if (!convId) {
        const newConv = await createConversation(user.id, generateTitle(messageToSend));
        convId = newConv.id;
        setCurrentConversationId(convId);
        setConversations((prev) => [newConv, ...prev]);
      }

      await saveMessage(convId, 'user', messageToSend);

      const history = convertToGeminiHistory(messages);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend, history }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullResponse += data.content;
                setStreamingContent(fullResponse);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      await saveMessage(convId, 'assistant', fullResponse);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setStreamingContent('');

      if (messages.length === 0) {
        await updateConversationTitle(convId, generateTitle(messageToSend));
        await loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'エラーが発生しました。APIキーが正しく設定されているか確認してください。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent('');
    } finally {
      setIsTyping(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          user={user}
          onMenuClick={() => setIsSidebarOpen(true)}
          onSelectConversation={handleSelectConversation}
        />

        <main className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto px-4 py-6">
          {messages.length === 0 && !currentConversationId ? (
            <WelcomeScreen user={user} onSendMessage={handleSendMessage} />
          ) : (
            <>
              <ChatHistory
                messages={messages}
                isTyping={isTyping}
                messagesEndRef={messagesEndRef}
                streamingContent={streamingContent}
                user={user}
              />

              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendMessage}
                disabled={isTyping}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
