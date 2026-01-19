'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, ImagePlus, X } from 'lucide-react';

export interface UploadedImage {
  file: File;
  preview: string;
  base64: string;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  images?: UploadedImage[];
  onImagesChange?: (images: UploadedImage[]) => void;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  images = [],
  onImagesChange,
}: ChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    // Macでは compositionend 後に keydown が発火するため遅延を入れる
    setTimeout(() => {
      isComposingRef.current = false;
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // IME変換中は送信しない
    // keyCode 229 はIME処理中を示す（Mac対策）
    if (isComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;

    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSend();
    }
  };

  const processFile = async (file: File): Promise<UploadedImage | null> => {
    if (!file.type.startsWith('image/')) {
      return null;
    }

    // 10MB制限
    if (file.size > 10 * 1024 * 1024) {
      alert('画像サイズは10MB以下にしてください');
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        resolve({
          file,
          preview: URL.createObjectURL(file),
          base64: base64.split(',')[1], // data:image/...;base64, を除去
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || !onImagesChange) return;

    const newImages: UploadedImage[] = [];
    for (let i = 0; i < Math.min(files.length, 5 - images.length); i++) {
      const processed = await processFile(files[i]);
      if (processed) {
        newImages.push(processed);
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    if (!onImagesChange) return;
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    await handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div
      className={`bg-card border rounded-xl p-4 shadow-sm transition-colors ${
        isDragOver ? 'border-primary bg-primary/5' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 画像プレビュー */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <img
                src={img.preview}
                alt={`アップロード画像 ${index + 1}`}
                className="h-20 w-20 object-cover rounded-lg border"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={`relative transition-all duration-300 ${isFocused ? 'ring-2 ring-primary/30' : ''} rounded-lg`}>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={images.length > 0
            ? "画像について説明を追加... (Shift + Enter で改行)"
            : "メッセージを入力してください... (Shift + Enter で改行)"
          }
          className="min-h-[56px] max-h-[200px] resize-none border-0 focus-visible:ring-0 bg-muted/50"
          rows={1}
        />

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || images.length >= 5}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ImagePlus className="h-4 w-4" />
              <span className="text-xs">画像を追加</span>
            </Button>
            {images.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {images.length}/5
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {value.length} / 4000
            </span>
            <Button
              onClick={onSend}
              disabled={(!value.trim() && images.length === 0) || disabled}
              className="gap-2"
            >
              送信
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span className="text-muted-foreground/60">
          ドラッグ&ドロップで画像を追加
        </span>
        <span>Powered by Gemini</span>
      </div>
    </div>
  );
}
