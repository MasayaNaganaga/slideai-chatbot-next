/**
 * Unsplash API Service
 * スライドに挿入する画像を検索・取得するサービス
 */

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;  // 1080px width - スライドに最適
    small: string;    // 400px width
    thumb: string;    // 200px width
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
  };
  links: {
    html: string;
  };
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export interface SlideImage {
  url: string;
  thumbnailUrl: string;
  altText: string;
  credit: string;
  creditUrl: string;
}

// ビジネスプレゼン向けの検索キーワードマッピング
const KEYWORD_TRANSLATIONS: Record<string, string> = {
  // 日本語 → 英語（Unsplashは英語検索が効果的）
  'ビジネス': 'business meeting',
  '会議': 'business meeting',
  'チーム': 'team collaboration',
  '成長': 'business growth',
  'データ': 'data analytics',
  '分析': 'data analysis',
  'グラフ': 'chart graph',
  'テクノロジー': 'technology',
  'DX': 'digital transformation',
  'デジタル': 'digital technology',
  'イノベーション': 'innovation',
  '戦略': 'strategy planning',
  '目標': 'goal achievement',
  'マーケティング': 'marketing',
  '営業': 'sales business',
  '顧客': 'customer service',
  '品質': 'quality control',
  '効率': 'efficiency productivity',
  'コスト': 'cost reduction',
  '人材': 'human resources',
  '教育': 'education training',
  '研修': 'corporate training',
  'プロジェクト': 'project management',
  'スケジュール': 'timeline schedule',
  '計画': 'planning strategy',
  '成功': 'success achievement',
  '未来': 'future vision',
  '環境': 'environment sustainability',
  'SDGs': 'sustainability',
  'AI': 'artificial intelligence',
  '自動化': 'automation',
  'クラウド': 'cloud computing',
  'セキュリティ': 'cybersecurity',
  '組織': 'organization team',
  'リーダーシップ': 'leadership',
  'コミュニケーション': 'communication',
};

/**
 * 日本語キーワードを英語に変換
 */
function translateKeyword(keyword: string): string {
  // 完全一致
  if (KEYWORD_TRANSLATIONS[keyword]) {
    return KEYWORD_TRANSLATIONS[keyword];
  }

  // 部分一致
  for (const [jp, en] of Object.entries(KEYWORD_TRANSLATIONS)) {
    if (keyword.includes(jp)) {
      return en;
    }
  }

  // 変換できない場合はそのまま（英語の可能性）
  return keyword;
}

/**
 * Unsplash APIで画像を検索
 */
export async function searchImages(
  query: string,
  options: {
    perPage?: number;
    orientation?: 'landscape' | 'portrait' | 'squarish';
  } = {}
): Promise<SlideImage[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn('UNSPLASH_ACCESS_KEY is not set');
    return [];
  }

  const { perPage = 3, orientation = 'landscape' } = options;

  // キーワードを英語に変換
  const translatedQuery = translateKeyword(query);

  try {
    const params = new URLSearchParams({
      query: translatedQuery,
      per_page: String(perPage),
      orientation,
      content_filter: 'high', // 安全なコンテンツのみ
    });

    const response = await fetch(
      `https://api.unsplash.com/search/photos?${params}`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
          'Accept-Version': 'v1',
        },
      }
    );

    if (!response.ok) {
      console.error('Unsplash API error:', response.status, response.statusText);
      return [];
    }

    const data: UnsplashSearchResponse = await response.json();

    return data.results.map((photo) => ({
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.small,
      altText: photo.alt_description || photo.description || query,
      credit: photo.user.name,
      creditUrl: photo.links.html,
    }));
  } catch (error) {
    console.error('Failed to search Unsplash images:', error);
    return [];
  }
}

/**
 * スライドタイトルから適切な画像を取得
 */
export async function getImageForSlide(
  title: string,
  keywords?: string[]
): Promise<SlideImage | null> {
  // キーワードが指定されていればそれを使用、なければタイトルから抽出
  const searchTerms = keywords && keywords.length > 0
    ? keywords
    : extractKeywords(title);

  // 各キーワードで検索し、最初に見つかった画像を返す
  for (const term of searchTerms) {
    const images = await searchImages(term, { perPage: 1 });
    if (images.length > 0) {
      return images[0];
    }
  }

  // フォールバック: ビジネス一般の画像
  const fallbackImages = await searchImages('business professional', { perPage: 1 });
  return fallbackImages[0] || null;
}

/**
 * タイトルからキーワードを抽出
 */
function extractKeywords(title: string): string[] {
  const keywords: string[] = [];

  // KEYWORD_TRANSLATIONSのキーに含まれるものを抽出
  for (const keyword of Object.keys(KEYWORD_TRANSLATIONS)) {
    if (title.includes(keyword)) {
      keywords.push(keyword);
    }
  }

  // 見つからない場合はタイトル全体を使用
  if (keywords.length === 0) {
    keywords.push(title);
  }

  return keywords;
}

// 画像を挿入すべきレイアウト
const IMAGE_LAYOUTS = ['section', 'standard', 'summary', 'caseStudy'];

// 画像を挿入しないレイアウト（図解優先）
const NO_IMAGE_LAYOUTS = ['stats', 'comparison', 'flow', 'verticalFlow', 'timeline',
  'parallel', 'grid', 'matrix', 'pyramid', 'cycle', 'funnel', 'table', 'venn', 'tree', 'qa'];

/**
 * 複数スライド用の画像を一括取得（最小限・重複なし）
 */
export async function getImagesForSlides(
  slides: Array<{ title: string; layout?: string; imageKeywords?: string[] }>,
  options: { maxImages?: number } = {}
): Promise<Map<number, SlideImage>> {
  const { maxImages = 3 } = options; // デフォルト最大3枚
  const imageMap = new Map<number, SlideImage>();
  const usedImageUrls = new Set<string>(); // 重複防止用
  let imageCount = 0;

  // 画像を入れるべきスライドをフィルタリング
  const targetSlides: Array<{ index: number; slide: typeof slides[0] }> = [];

  slides.forEach((slide, index) => {
    const layout = slide.layout || 'standard';

    // sectionレイアウトを優先
    if (layout === 'section') {
      targetSlides.unshift({ index, slide }); // 先頭に追加
    } else if (IMAGE_LAYOUTS.includes(layout) && !NO_IMAGE_LAYOUTS.includes(layout)) {
      targetSlides.push({ index, slide });
    }
  });

  // 最大枚数まで画像を取得
  for (const { index, slide } of targetSlides) {
    if (imageCount >= maxImages) break;

    try {
      // 複数の画像候補を取得して重複を避ける
      const images = await searchImages(
        slide.imageKeywords?.[0] || slide.title,
        { perPage: 5 }
      );

      // 未使用の画像を探す
      const unusedImage = images.find(img => !usedImageUrls.has(img.url));

      if (unusedImage) {
        imageMap.set(index, unusedImage);
        usedImageUrls.add(unusedImage.url);
        imageCount++;
        console.log(`Image ${imageCount}/${maxImages} for slide ${index}: ${slide.title}`);
      }
    } catch (error) {
      console.error(`Failed to get image for slide ${index}:`, error);
    }

    // レート制限対策
    if (imageCount < maxImages) {
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }

  console.log(`Total images fetched: ${imageCount} for ${slides.length} slides`);
  return imageMap;
}
