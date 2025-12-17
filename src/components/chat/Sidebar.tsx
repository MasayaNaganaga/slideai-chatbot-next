'use client';

import { useState } from 'react';
import { type Conversation } from '@/lib/database';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const handleDeleteClick = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(conv);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteConversation(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
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

          <div className="flex-1 overflow-y-auto p-2">
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
                    className={cn(
                      "group px-2 py-2 rounded-lg cursor-pointer transition-all",
                      currentConversationId === conv.id
                        ? 'bg-sidebar-accent border border-sidebar-border'
                        : 'hover:bg-sidebar-accent/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 min-w-0 overflow-hidden"
                        onClick={() => onSelectConversation(conv.id)}
                      >
                        <p className="text-sm truncate font-medium text-sidebar-foreground">
                          {conv.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(conv.updated_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        onClick={(e) => handleDeleteClick(conv, e)}
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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

      {/* 削除確認ダイアログ */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>会話を削除しますか？</DialogTitle>
            <DialogDescription>
              「{deleteTarget?.title}」を削除します。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelDelete}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
