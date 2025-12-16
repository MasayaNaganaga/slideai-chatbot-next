'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, ShieldCheck, Mic, Wrench } from 'lucide-react';
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

  const suggestedPrompts = [
    'Reactでコンポーネントの状態管理について教えてください',
    'TypeScriptの型定義のベストプラクティスは？',
    'Tailwind CSSでレスポンシブデザインを実装する方法',
    'パフォーマンス最適化のテクニックを教えてください'
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            こんにちは、<span className="bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">{user?.user_metadata?.full_name?.split(' ')[0] || 'ゲスト'}</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            どのようなご質問でもお気軽にお聞きください
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-2 shadow-lg mb-8">
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 pt-1">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Gemini へのプロンプトを入力"
                className="w-full bg-transparent border-none focus-visible:ring-0 resize-none text-base leading-relaxed min-h-[60px]"
                rows={2}
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9" title="ツール">
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </Button>
              <span className="text-muted-foreground text-sm">ツール</span>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                思考モード
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" title="音声入力">
                <Mic className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestedPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onSendMessage(prompt)}
              className="bg-card hover:bg-muted border border-border hover:border-primary/30 rounded-xl p-4 text-left transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <Lightbulb className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                </div>
                <p className="text-muted-foreground group-hover:text-foreground text-sm leading-relaxed transition-colors">
                  {prompt}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-xs">
            Gemini は不正確な情報を表示することがあります
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            ©株式会社Dexall
          </p>
        </div>
      </div>
    </div>
  );
}
