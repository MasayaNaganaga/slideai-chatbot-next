'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Copy, Check, Share2, MoreHorizontal, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageCardProps {
  message: Message;
  user: User | null;
}

export default function MessageCard({ message, user }: MessageCardProps) {
  const [isCopied, setIsCopied] = useState(false);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString('ja-JP');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'ユーザー';
  };

  const getUserInitials = () => {
    const name = user?.user_metadata?.full_name;
    if (name) {
      const parts = name.split(' ');
      if (parts.length > 1) {
        return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
      }
      return name.substring(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group",
      isUser && "ml-auto max-w-3xl"
    )}>
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10 flex-shrink-0">
          {isUser ? (
            <>
              <AvatarImage src={user?.user_metadata?.avatar_url} alt="User avatar" />
              <AvatarFallback className="bg-blue-500 text-white font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </>
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium text-sm">
                {isUser ? getUserDisplayName() : 'Slide AI'}
              </span>
              <span className="text-muted-foreground text-xs">{formatTime(message.timestamp)}</span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopy}
                title="コピー"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="共有"
              >
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="その他"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>

          {!isUser && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <ThumbsUp className="h-3 w-3" />
                <span>役に立った</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <ThumbsDown className="h-3 w-3" />
                <span>改善が必要</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <RefreshCw className="h-3 w-3" />
                <span>再生成</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
