'use client';

import { useState, useEffect } from 'react';
import UserMenu from './UserMenu';
import { searchConversations, type Conversation } from '@/lib/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Menu, Search, X, Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface ChatHeaderProps {
  user: User | null;
  onMenuClick?: () => void;
  onSelectConversation?: (id: string) => void;
}

export default function ChatHeader({ user, onMenuClick, onSelectConversation }: ChatHeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<Conversation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchValue.trim() && user) {
        setIsSearching(true);
        try {
          const results = await searchConversations(user.id, searchValue);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchValue, user]);

  const handleSelectResult = (id: string) => {
    if (onSelectConversation) {
      onSelectConversation(id);
    }
    setSearchValue('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  return (
    <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground hidden sm:block">Slide AI</h1>
          </div>

          <div className="flex-1 max-w-2xl relative">
            <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <Input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="会話履歴を検索..."
                className="pl-12 pr-10"
              />
              {searchValue && (
                <button
                  onClick={() => {
                    setSearchValue('');
                    setSearchResults([]);
                  }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {isSearchFocused && searchValue && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectResult(conv.id)}
                      className="w-full px-4 py-3 text-left hover:bg-muted transition-colors cursor-pointer border-b border-border last:border-b-0"
                    >
                      <p className="text-foreground text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-muted-foreground text-xs mt-1">{formatDate(conv.updated_at)}</p>
                    </button>
                  ))
                ) : !isSearching ? (
                  <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                    検索結果がありません
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
