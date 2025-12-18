// スライド生成用の型定義

export type SlideLayout =
  | 'standard'
  | 'section'
  | 'stats'
  | 'comparison'
  | 'twoColumn'
  | 'quote'
  | 'summary'
  | 'flow'
  | 'pyramid'
  | 'matrix'
  | 'parallel'
  | 'timeline'
  | 'cycle'
  | 'funnel'
  | 'table'
  | 'verticalFlow'
  | 'grid'
  | 'venn'
  | 'tree'
  | 'qa'
  | 'caseStudy';

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

// flow layout
export interface FlowStep {
  title: string;
  description?: string;
}

// pyramid layout
export interface PyramidLayer {
  title: string;
  description?: string;
}

// matrix layout
export interface MatrixCell {
  title: string;
  description?: string;
}

export interface MatrixData {
  xAxisLabel?: string;
  yAxisLabel?: string;
  topLeft?: MatrixCell;
  topRight?: MatrixCell;
  bottomLeft?: MatrixCell;
  bottomRight?: MatrixCell;
}

// parallel layout
export interface ParallelColumn {
  title: string;
  icon?: string;
  description?: string;
  bullets?: string[];
}

// timeline layout
export interface TimelineItem {
  date: string;
  title: string;
  description?: string;
}

// cycle layout
export interface CycleItem {
  title: string;
  description?: string;
}

// funnel layout
export interface FunnelStep {
  title: string;
  value?: string;
  description?: string;
}

// table layout
export interface TableData {
  headers: string[];
  rows: string[][];
}

// grid layout
export interface GridItem {
  icon?: string;
  title: string;
  description?: string;
}

// venn layout
export interface VennData {
  left: { title: string; items?: string[] };
  right: { title: string; items?: string[] };
  center?: { title: string; items?: string[] };
}

// tree layout
export interface TreeNode {
  title: string;
  children?: TreeNode[];
}

// qa layout
export interface QAItem {
  question: string;
  answer: string;
}

// caseStudy layout
export interface CaseStudyData {
  company?: string;
  challenge: string;
  solution: string;
  result: string;
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
  // flow layout
  flow?: FlowStep[];
  // pyramid layout
  pyramid?: PyramidLayer[];
  // matrix layout
  matrix?: MatrixData;
  // parallel layout
  parallel?: ParallelColumn[];
  // timeline layout
  timeline?: TimelineItem[];
  // cycle layout
  cycle?: CycleItem[];
  // funnel layout
  funnel?: FunnelStep[];
  // table layout
  tableData?: TableData;
  // grid layout
  grid?: GridItem[];
  // venn layout
  venn?: VennData;
  // tree layout
  tree?: TreeNode;
  // qa layout
  qaItems?: QAItem[];
  // caseStudy layout
  caseStudy?: CaseStudyData;
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
