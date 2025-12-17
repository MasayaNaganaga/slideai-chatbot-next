'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, History, LogOut } from 'lucide-react';
import SettingsDialog from './SettingsDialog';
import HistoryManagementDialog from './HistoryManagementDialog';
import type { User } from '@supabase/supabase-js';

interface UserMenuProps {
  user: User | null;
  onHistoryDeleted?: () => void;
}

export default function UserMenu({ user, onHistoryDeleted }: UserMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      return names.length > 1
        ? names[0].charAt(0) + names[names.length - 1].charAt(0)
        : names[0].charAt(0);
    }
    return user?.email?.charAt(0).toUpperCase() || '?';
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email || 'ユーザー';
  };

  const getUserEmail = () => {
    return user?.email || '';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenSettings = () => {
    setIsMenuOpen(false);
    setIsSettingsOpen(true);
  };

  const handleOpenHistory = () => {
    setIsMenuOpen(false);
    setIsHistoryOpen(true);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full transition-all hover:scale-105"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="User avatar" />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-xl overflow-hidden animate-fadeIn z-50">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt="User avatar" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-foreground font-medium text-sm truncate">{getUserDisplayName()}</p>
                  <p className="text-muted-foreground text-xs truncate">{getUserEmail()}</p>
                </div>
              </div>
            </div>

            <div className="py-2">
              <button
                onClick={handleOpenSettings}
                className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-3 cursor-pointer"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>設定</span>
              </button>
              <button
                onClick={handleOpenHistory}
                className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-3 cursor-pointer"
              >
                <History className="h-4 w-4 text-muted-foreground" />
                <span>履歴管理</span>
              </button>
            </div>

            <div className="border-t border-border py-2">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-muted transition-colors flex items-center gap-3 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <HistoryManagementDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        user={user}
        onHistoryDeleted={onHistoryDeleted}
      />
    </>
  );
}
