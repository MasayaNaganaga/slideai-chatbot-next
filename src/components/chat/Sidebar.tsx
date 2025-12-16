'use client';

import { useState } from 'react';
import { type Conversation } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}: SidebarProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      onDeleteConversation(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-50 transform transition-transform duration-300",
          isOpen ? 'translate-x-0' : '-translate-x-full',
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-sidebar-border">
            <Button
              onClick={onNewConversation}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              新しい会話
            </Button>
          </div>

          <ScrollArea className="flex-1 p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                会話履歴がありません
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={cn(
                      "group px-3 py-3 rounded-lg cursor-pointer transition-all",
                      currentConversationId === conv.id
                        ? 'bg-sidebar-accent border border-sidebar-border'
                        : 'hover:bg-sidebar-accent/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate font-medium text-sidebar-foreground">
                          {conv.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(conv.updated_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                          deleteConfirm === conv.id && "opacity-100 text-destructive"
                        )}
                        onClick={(e) => handleDelete(conv.id, e)}
                        title={deleteConfirm === conv.id ? 'もう一度クリックで削除' : '削除'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground text-center">
              {conversations.length} 件の会話
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              ©株式会社Dexall
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
