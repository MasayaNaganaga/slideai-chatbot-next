'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, ImagePlus, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface UploadedImage {
  file: File;
  preview: string;
  base64: string;
  mimeType: string;
}

interface WelcomeScreenProps {
  user: User | null;
  onSendMessage: (message: string, images?: { base64: string; mimeType: string }[]) => void;
}

export default function WelcomeScreen({ user, onSendMessage }: WelcomeScreenProps) {
  const [inputValue, setInputValue] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (inputValue.trim() || images.length > 0) {
      const imageData = images.map((img) => ({
        base64: img.base64,
        mimeType: img.mimeType,
      }));
      onSendMessage(inputValue, imageData.length > 0 ? imageData : undefined);
      setImages([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const processFile = async (file: File): Promise<UploadedImage | null> => {
    if (!file.type.startsWith('image/')) {
      return null;
    }
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
          base64: base64.split(',')[1],
          mimeType: file.type,
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    const newImages: UploadedImage[] = [];
    for (let i = 0; i < Math.min(files.length, 5 - images.length); i++) {
      const processed = await processFile(files[i]);
      if (processed) newImages.push(processed);
    }
    if (newImages.length > 0) setImages([...images, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
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

        <div
          className={`bg-card border rounded-2xl p-4 shadow-lg mb-8 transition-colors ${
            isDragOver ? 'border-primary bg-primary/5' : 'border-border'
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

          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={images.length > 0
              ? "画像について説明を追加..."
              : "プレゼンテーションのテーマや内容を入力してください..."
            }
            className="w-full bg-transparent border-none focus-visible:ring-0 resize-none text-base leading-relaxed min-h-[80px]"
            rows={3}
          />

          <div className="flex items-center justify-between pt-3 border-t border-border">
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
                disabled={images.length >= 5}
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
            <Button
              onClick={handleSubmit}
              disabled={!inputValue.trim() && images.length === 0}
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
