// スライド生成用の型定義

export interface SlideContent {
  title: string;           // スライドタイトル
  message?: string;        // キーメッセージ（このスライドで伝えたい1文）
  body?: string;           // 本文（説明文）
  bullets?: string[];      // 箇条書きポイント
  highlights?: string[];   // 強調ポイント（数値やキーワード）
  notes?: string;          // 発表者ノート
}

export interface SlideData {
  title: string;
  subtitle?: string;       // サブタイトル
  slides: SlideContent[];
  theme?: 'light' | 'dark' | 'corporate';
}

export interface GenerateSlideRequest {
  slideData: SlideData;
  templateId?: string;
}

export interface GenerateSlideResponse {
  success: boolean;
  slideUrl?: string;
  slideId?: string;
  error?: string;
}
