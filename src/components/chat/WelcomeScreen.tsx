'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface WelcomeScreenProps {
  user: User | null;
  onSendMessage: (message: string) => void;
}

export default function WelcomeScreen({ user, onSendMessage }: WelcomeScreenProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            こんにちは、<span className="bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">{user?.user_metadata?.full_name?.split(' ')[0] || 'ゲスト'}</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            プレゼンテーションの内容について教えてください
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-lg mb-8">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="プレゼンテーションのテーマや内容を入力してください..."
            className="w-full bg-transparent border-none focus-visible:ring-0 resize-none text-base leading-relaxed min-h-[80px]"
            rows={3}
          />

          <div className="flex items-center justify-end pt-3 border-t border-border">
            <Button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="gap-2"
            >
              送信
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground text-xs">
            AIがプレゼンテーションの構成をサポートします
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            ©株式会社Dexall
          </p>
        </div>
      </div>
    </div>
  );
}
