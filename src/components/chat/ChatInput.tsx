'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm">
      <div className={`relative transition-all duration-300 ${isFocused ? 'ring-2 ring-primary/30' : ''} rounded-lg`}>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力してください... (Shift + Enter で改行)"
          className="min-h-[56px] max-h-[200px] resize-none border-0 focus-visible:ring-0 bg-muted/50"
          rows={1}
        />

        <div className="flex items-center justify-end mt-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {value.length} / 4000
            </span>
            <Button
              onClick={onSend}
              disabled={!value.trim() || disabled}
              className="gap-2"
            >
              送信
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end mt-3 text-xs text-muted-foreground">
        <span>Powered by Gemini</span>
      </div>
    </div>
  );
}
