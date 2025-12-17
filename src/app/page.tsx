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
import { Loader2, Presentation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User } from '@supabase/supabase-js';
import type { GenerateSlideResponse } from '@/types/slide';

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

// Mock user for development when Supabase is not configured
const MOCK_USER: User = {
  id: 'mock-user-id',
  email: 'test@dexall.co.jp',
  user_metadata: {
    full_name: 'テストユーザー',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

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
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isGeneratingSlide, setIsGeneratingSlide] = useState(false);
  const [slideResult, setSlideResult] = useState<GenerateSlideResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<Window | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        // Development mode - use mock user
        console.log('Demo mode: Supabase not configured');
        setUser(MOCK_USER);
        setIsDemoMode(true);
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          router.push('/login');
          return;
        }

        setUser(user);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth error:', error);
        // Fallback to demo mode on error
        setUser(MOCK_USER);
        setIsDemoMode(true);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user || isDemoMode) {
      setIsLoading(false);
      return;
    }
    try {
      const convs = await getConversations(user.id);
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  // Load messages
  const loadMessages = async (conversationId: string) => {
    if (isDemoMode) return;
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
    if (isDemoMode) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
      return;
    }
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

  // ポップアップウィンドウからのメッセージを受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'slideGenerated') {
        if (event.data.success && event.data.slideUrl) {
          setSlideResult({
            success: true,
            slideUrl: event.data.slideUrl,
          });
        } else {
          setSlideResult({
            success: false,
            error: event.data.error || 'スライド生成に失敗しました',
          });
        }
        setIsGeneratingSlide(false);
      }
      // ポップアップを閉じるリクエスト
      if (event.data?.type === 'closePopup') {
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
          popupRef.current = null;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGenerateSlide = async () => {
    if (messages.length === 0) return;

    setIsGeneratingSlide(true);
    setSlideResult(null);

    try {
      const history = convertToGeminiHistory(messages);

      // Step 1: サーバーでスライド構造を生成
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history }),
      });

      const result = await response.json();

      // クライアントサイドからGASを呼び出す（フォーム送信方式）
      const gasUrl = 'https://script.google.com/macros/s/AKfycbyR6ywPSmSPDMLWIYIw_zamALAk-NZQ1QzSX8k1C019rk3_hCVym0TKjBoddg7s94dG/exec';
      if (result.slideData && gasUrl) {
        // Step 2: フォームを作成してPOST送信
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = gasUrl;
        form.target = 'slideGenerator';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'data';
        input.value = JSON.stringify({ slideData: result.slideData });
        form.appendChild(input);

        document.body.appendChild(form);

        // ポップアップウィンドウを先に開く
        const popup = window.open('about:blank', 'slideGenerator', 'width=500,height=400,scrollbars=yes');

        if (!popup) {
          setSlideResult({
            success: false,
            error: 'ポップアップがブロックされました。ポップアップを許可してください。',
          });
          setIsGeneratingSlide(false);
          document.body.removeChild(form);
          return;
        }

        // ポップアップの参照を保存（親から閉じるため）
        popupRef.current = popup;

        // フォームを送信
        form.submit();
        document.body.removeChild(form);

        // 結果はpostMessageで受信（useEffectで処理）
      } else if (result.success && result.slideUrl) {
        setSlideResult(result as GenerateSlideResponse);
        window.open(result.slideUrl, '_blank');
        setIsGeneratingSlide(false);
      } else {
        setSlideResult(result as GenerateSlideResponse);
        setIsGeneratingSlide(false);
      }
    } catch (error) {
      console.error('Error generating slide:', error);
      setSlideResult({ success: false, error: 'スライド生成に失敗しました' });
      setIsGeneratingSlide(false);
    }
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

      // Skip database operations in demo mode
      if (!isDemoMode && !convId) {
        const newConv = await createConversation(user.id, generateTitle(messageToSend));
        convId = newConv.id;
        setCurrentConversationId(convId);
        setConversations((prev) => [newConv, ...prev]);
        await saveMessage(convId, 'user', messageToSend);
      } else if (isDemoMode && !convId) {
        // Create a mock conversation for demo mode
        const mockConv: Conversation = {
          id: `demo-${Date.now()}`,
          user_id: user.id,
          title: generateTitle(messageToSend),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        convId = mockConv.id;
        setCurrentConversationId(convId);
        setConversations((prev) => [mockConv, ...prev]);
      }

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

      if (!isDemoMode && convId) {
        await saveMessage(convId, 'assistant', fullResponse);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setStreamingContent('');

      if (!isDemoMode && messages.length === 0 && convId) {
        await updateConversationTitle(convId, generateTitle(messageToSend));
        await loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isDemoMode
          ? 'デモモード: OpenRouter APIキーが設定されていません。.env.localファイルにOPENROUTER_API_KEYを設定してください。'
          : 'エラーが発生しました。APIキーが正しく設定されているか確認してください。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent('');
    } finally {
      setIsTyping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">認証が必要です</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex">
      {isDemoMode && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 text-center py-1 text-sm z-[100]">
          デモモード - Supabase未設定
        </div>
      )}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className={`flex-1 flex flex-col min-w-0 ${isDemoMode ? 'pt-7' : ''}`}>
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

              {/* スライド生成セクション */}
              {messages.length >= 2 && (
                <div className="mb-4 p-4 bg-card border rounded-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">スライド生成</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        この会話をもとにプレゼンテーションを作成します
                      </p>
                    </div>
                    <Button
                      onClick={handleGenerateSlide}
                      disabled={isGeneratingSlide || isTyping}
                      className="gap-2"
                      variant="outline"
                    >
                      {isGeneratingSlide ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Presentation className="h-4 w-4" />
                          スライドを生成
                        </>
                      )}
                    </Button>
                  </div>

                  {slideResult && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${
                      slideResult.success
                        ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                        : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                    }`}>
                      {slideResult.success ? (
                        slideResult.slideUrl ? (
                          <a
                            href={slideResult.slideUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            スライドを開く
                          </a>
                        ) : slideResult.error ? (
                          slideResult.error
                        ) : (
                          'スライドが生成されました。Google Driveを確認してください。'
                        )
                      ) : (
                        slideResult.error || 'エラーが発生しました'
                      )}
                    </div>
                  )}
                </div>
              )}

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
