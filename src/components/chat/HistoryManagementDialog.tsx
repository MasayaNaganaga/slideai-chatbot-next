'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteAllConversations, getConversationsWithMessages } from '@/lib/database';
import { Trash2, Download, Loader2, AlertTriangle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface HistoryManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onHistoryDeleted?: () => void;
}

export default function HistoryManagementDialog({
  open,
  onOpenChange,
  user,
  onHistoryDeleted,
}: HistoryManagementDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAll = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      await deleteAllConversations(user.id);
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onHistoryDeleted?.();
    } catch (error) {
      console.error('Failed to delete all conversations:', error);
      alert('履歴の削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async (format: 'json' | 'text') => {
    if (!user) return;

    setIsExporting(true);
    try {
      const data = await getConversationsWithMessages(user.id);

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename = `slide-ai-history-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        content = data
          .map((conv) => {
            const header = `=== ${conv.title} ===\n日時: ${new Date(conv.created_at).toLocaleString('ja-JP')}\n\n`;
            const messages = conv.messages
              .map((msg) => `[${msg.role === 'user' ? 'あなた' : 'AI'}]\n${msg.content}`)
              .join('\n\n');
            return header + messages;
          })
          .join('\n\n' + '='.repeat(50) + '\n\n');
        filename = `slide-ai-history-${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export history:', error);
      alert('履歴のエクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) setShowDeleteConfirm(false);
        onOpenChange(isOpen);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              全履歴を削除しますか？
            </DialogTitle>
            <DialogDescription>
              すべての会話履歴が完全に削除されます。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  削除中...
                </>
              ) : (
                '完全に削除する'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>履歴管理</DialogTitle>
          <DialogDescription>
            会話履歴のエクスポートや削除ができます
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">エクスポート</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleExport('json')}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                JSON形式
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleExport('text')}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                テキスト形式
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              会話履歴をファイルとしてダウンロードします
            </p>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground">データ削除</h3>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              全履歴を削除
            </Button>
            <p className="text-xs text-muted-foreground">
              すべての会話履歴を完全に削除します。この操作は取り消せません。
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
