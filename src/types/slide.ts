// スライド生成用の型定義

export type SlideLayout =
  | 'standard'
  | 'section'
  | 'stats'
  | 'comparison'
  | 'twoColumn'
  | 'quote'
  | 'summary';

export interface StatItem {
  value: string;
  label: string;
}

export interface ComparisonData {
  beforeTitle?: string;
  beforeItems?: string[];
  afterTitle?: string;
  afterItems?: string[];
}

export interface ColumnData {
  title?: string;
  bullets?: string[];
}

export interface SlideContent {
  layout?: SlideLayout;
  title: string;
  message?: string;
  body?: string;
  bullets?: string[];
  highlights?: string[];
  notes?: string;
  // stats layout
  stats?: StatItem[];
  // comparison layout
  comparison?: ComparisonData;
  // twoColumn layout
  leftColumn?: ColumnData;
  rightColumn?: ColumnData;
  // quote layout
  quote?: string;
  source?: string;
  // flags
  isSection?: boolean;
  isSummary?: boolean;
}

export interface SlideData {
  title: string;
  subtitle?: string;
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
