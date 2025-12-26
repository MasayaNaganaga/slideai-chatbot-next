/**
 * SlideAI - Google Apps Script v2.3
 *
 * 複数レイアウト対応・高品質デザイン版
 * v2.3: フォントサイズ可変対応、コンテンツ充実化
 *
 * セットアップ手順:
 * 1. script.google.com で新しいプロジェクトを作成
 * 2. このコードをコピー＆ペースト
 * 3. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択
 * 4. アクセスできるユーザー: 「全員」を選択
 * 5. デプロイ後のURLを設定
 */

// ============================================
// 定数定義
// ============================================

const PAGE_WIDTH = 720;
const PAGE_HEIGHT = 405;

// カラーパレット（Dexall HP風 - モダンでプロフェッショナル）
const COLORS = {
  // プライマリ（Dexall HP準拠）
  navy: '#0D1933',       // メインカラー - ダークネイビー
  darkBlue: '#1a2d4d',   // セカンダリネイビー
  blue: '#337ab7',       // アクセントブルー
  lightBlue: '#5a9fd4',  // ライトブルー

  // アクセント
  accent: '#337ab7',     // Dexallブルー
  green: '#28a745',      // 成功・ポジティブ
  red: '#dc3545',        // 警告・ネガティブ
  orange: '#f5a623',     // ハイライト

  // ニュートラル
  white: '#ffffff',
  offWhite: '#f8f9fa',
  lightGray: '#f2f2f2',  // Dexall背景グレー
  gray: '#6c757d',
  darkGray: '#333333',   // Dexallテキスト
  black: '#0D1933',
};

// フォント設定
const FONTS = {
  title: 'Noto Sans JP',
  body: 'Noto Sans JP',
  accent: 'Noto Sans JP',
};



// ============================================
// ヘルパー関数
// ============================================

/**
 * テキスト長に応じたフォントサイズを計算
 * @param {string} text - テキスト内容
 * @param {number} maxWidth - 利用可能な幅
 * @param {number} baseFontSize - 基本フォントサイズ
 * @param {number} minFontSize - 最小フォントサイズ
 * @returns {number} 計算されたフォントサイズ
 */
function calculateFontSize(text, maxWidth, baseFontSize, minFontSize) {
  if (!text) return baseFontSize;
  
  const textLength = text.length;
  // 1文字あたりの推定幅（日本語は約0.9em、英数字は約0.5em）
  const avgCharWidth = 0.7;
  const estimatedWidth = textLength * baseFontSize * avgCharWidth;
  
  if (estimatedWidth <= maxWidth) {
    return baseFontSize;
  }
  
  // 幅に収まるようにフォントサイズを縮小
  const ratio = maxWidth / estimatedWidth;
  const newSize = Math.floor(baseFontSize * ratio);
  
  return Math.max(newSize, minFontSize);
}

/**
 * 複数行テキスト用のフォントサイズを計算
 * @param {string} text - テキスト内容
 * @param {number} maxWidth - 利用可能な幅
 * @param {number} maxHeight - 利用可能な高さ
 * @param {number} baseFontSize - 基本フォントサイズ
 * @param {number} minFontSize - 最小フォントサイズ
 * @returns {number} 計算されたフォントサイズ
 */
function calculateMultiLineFontSize(text, maxWidth, maxHeight, baseFontSize, minFontSize) {
  if (!text) return baseFontSize;
  
  const textLength = text.length;
  const avgCharWidth = 0.7;
  const lineHeight = 1.5;
  
  // 1行あたりの文字数
  const charsPerLine = Math.floor(maxWidth / (baseFontSize * avgCharWidth));
  // 必要な行数
  const linesNeeded = Math.ceil(textLength / charsPerLine);
  // 必要な高さ
  const heightNeeded = linesNeeded * baseFontSize * lineHeight;
  
  if (heightNeeded <= maxHeight) {
    return baseFontSize;
  }
  
  // 高さに収まるようにフォントサイズを縮小
  const ratio = maxHeight / heightNeeded;
  const newSize = Math.floor(baseFontSize * ratio);
  
  return Math.max(newSize, minFontSize);
}

/**
 * コンテンツ量に応じたbulletフォントサイズを計算
 * @param {Array} bullets - bullet配列
 * @param {number} availableHeight - 利用可能な高さ
 * @param {number} maxWidth - 利用可能な幅
 * @returns {Object} {fontSize, lineHeight}
 */
function calculateBulletFontSize(bullets, availableHeight, maxWidth) {
  if (!bullets || bullets.length === 0) {
    return { fontSize: 12, lineHeight: 28 };
  }
  
  const bulletCount = bullets.length;
  const maxBulletLength = Math.max(...bullets.map(b => (b || '').length));
  
  // 基本設定
  let fontSize = 12;
  let lineHeight = 28;
  
  // bullet数に応じた調整
  if (bulletCount <= 3) {
    fontSize = 14;
    lineHeight = 36;
  } else if (bulletCount <= 5) {
    fontSize = 12;
    lineHeight = 30;
  } else if (bulletCount <= 7) {
    fontSize = 11;
    lineHeight = 26;
  } else {
    fontSize = 10;
    lineHeight = 24;
  }
  
  // テキスト長に応じた調整
  const avgCharWidth = 0.7;
  const estimatedWidth = maxBulletLength * fontSize * avgCharWidth;
  if (estimatedWidth > maxWidth * 0.9) {
    // 長いテキストがある場合はフォントを小さく
    fontSize = Math.max(fontSize - 1, 9);
  }
  
  // 高さチェック
  const totalHeight = bulletCount * lineHeight;
  if (totalHeight > availableHeight) {
    const ratio = availableHeight / totalHeight;
    fontSize = Math.max(Math.floor(fontSize * ratio), 9);
    lineHeight = Math.max(Math.floor(lineHeight * ratio), 20);
  }
  
  return { fontSize, lineHeight };
}

/**
 * メッセージテキストの必要な高さを計算
 * @param {string} text - メッセージテキスト
 * @param {number} maxWidth - 利用可能な幅
 * @param {number} fontSize - フォントサイズ
 * @returns {number} 必要な高さ
 */
function calculateMessageHeight(text, maxWidth, fontSize) {
  if (!text) return 0;

  // 日本語は幅が広いため、avgCharWidthを大きめに設定
  const avgCharWidth = 0.85;
  const lineHeight = 1.8;
  const charsPerLine = Math.floor(maxWidth / (fontSize * avgCharWidth));
  const linesNeeded = Math.ceil(text.length / charsPerLine);
  const minHeight = 36;
  const calculatedHeight = linesNeeded * fontSize * lineHeight + 8; // 余裕を追加

  return Math.max(minHeight, Math.min(calculatedHeight, 90)); // 最大90px
}

/**
 * スライド番号を追加（2桁対応）
 * @param {Slide} slide - スライド
 * @param {number} index - スライドインデックス
 */
function addSlideNumber(slide, index) {
  const numText = String(index + 1);
  const isDoubleDigit = numText.length >= 2;

  // 2桁の場合は横長に
  const width = isDoubleDigit ? 36 : 28;
  const height = 28;
  const x = PAGE_WIDTH - width - 12;
  const fontSize = isDoubleDigit ? 10 : 11;

  const numBg = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, x, 12, width, height);
  numBg.getFill().setSolidFill(COLORS.blue);
  numBg.getBorder().setTransparent();
  numBg.getText().setText(numText);
  numBg.getText().getTextStyle()
    .setFontSize(fontSize)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.accent);
  numBg.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}


// ============================================
// エントリポイント
// ============================================

function doPost(e) {
  try {
    let data;
    if (e.parameter && e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return createHtmlResponse(false, 'No data provided', null);
    }

    const slideData = data.slideData;
    if (!slideData || !slideData.title || !slideData.slides) {
      return createHtmlResponse(false, 'Invalid slide data', null);
    }

    const result = createPresentation(slideData);
    return createHtmlResponse(true, null, result.url);
  } catch (error) {
    console.error('Error in doPost:', error);
    return createHtmlResponse(false, error.message, null);
  }
}

function doGet(e) {
  try {
    const dataParam = e.parameter.data;
    if (!dataParam) {
      return createJsonResponse({
        success: true,
        message: 'SlideAI GAS API v2.2 is running',
        timestamp: new Date().toISOString()
      });
    }

    const data = JSON.parse(decodeURIComponent(dataParam));
    const slideData = data.slideData;
    if (!slideData || !slideData.title || !slideData.slides) {
      return createHtmlResponse(false, 'Invalid slide data', null);
    }

    const result = createPresentation(slideData);
    return createHtmlResponse(true, null, result.url);
  } catch (error) {
    console.error('Error in doGet:', error);
    return createHtmlResponse(false, error.message, null);
  }
}

// ============================================
// メイン処理
// ============================================

function createPresentation(slideData) {
  const presentation = SlidesApp.create(slideData.title);
  const presentationId = presentation.getId();

  // タイトルスライドを設定
  const titleSlide = presentation.getSlides()[0];
  createTitleSlide(titleSlide, slideData.title, slideData.subtitle);

  // 目次スライドを追加（スライドが5枚以上の場合）
  if (slideData.slides.length >= 5) {
    const tocSlide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    createTableOfContents(tocSlide, slideData.slides);
  }

  // コンテンツスライドを追加
  slideData.slides.forEach((content, index) => {
    const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    const layout = content.layout || detectBestLayout(content);

    switch (layout) {
      case 'section':
        createSectionSlide(slide, content, index);
        break;
      case 'twoColumn':
        createTwoColumnSlide(slide, content, index);
        break;
      case 'stats':
        createStatsSlide(slide, content, index);
        break;
      case 'comparison':
        createComparisonSlide(slide, content, index);
        break;
      case 'quote':
        createQuoteSlide(slide, content, index);
        break;
      case 'summary':
        createSummarySlide(slide, content, index);
        break;
      case 'flow':
        createFlowSlide(slide, content, index);
        break;
      case 'pyramid':
        createPyramidSlide(slide, content, index);
        break;
      case 'matrix':
        createMatrixSlide(slide, content, index);
        break;
      case 'parallel':
        createParallelSlide(slide, content, index);
        break;
      case 'timeline':
        createTimelineSlide(slide, content, index);
        break;
      case 'cycle':
        createCycleSlide(slide, content, index);
        break;
      case 'funnel':
        createFunnelSlide(slide, content, index);
        break;
      case 'table':
        createTableSlide(slide, content, index);
        break;
      case 'verticalFlow':
        createVerticalFlowSlide(slide, content, index);
        break;
      case 'grid':
        createGridSlide(slide, content, index);
        break;
      case 'venn':
        createVennSlide(slide, content, index);
        break;
      case 'tree':
        createTreeSlide(slide, content, index);
        break;
      case 'qa':
        createQASlide(slide, content, index);
        break;
      case 'caseStudy':
        createCaseStudySlide(slide, content, index);
        break;
      default:
        createStandardSlide(slide, content, index);
    }

    // スピーカーノートを追加
    if (content.notes) {
      slide.getNotesPage().getSpeakerNotesShape().getText().setText(content.notes);
    }
  });

  presentation.saveAndClose();
  return {
    id: presentationId,
    url: `https://docs.google.com/presentation/d/${presentationId}/edit`
  };
}

// 最適なレイアウトを自動判定
function detectBestLayout(content) {
  // フローデータがある場合
  if (content.flow && Array.isArray(content.flow) && content.flow.length > 0) {
    return 'flow';
  }
  // ピラミッドデータがある場合
  if (content.pyramid && Array.isArray(content.pyramid) && content.pyramid.length > 0) {
    return 'pyramid';
  }
  // マトリクスデータがある場合
  if (content.matrix && (content.matrix.topLeft || content.matrix.topRight || content.matrix.bottomLeft || content.matrix.bottomRight)) {
    return 'matrix';
  }
  // 並列データがある場合
  if (content.parallel && Array.isArray(content.parallel) && content.parallel.length >= 3) {
    return 'parallel';
  }
  // 統計データがある場合
  if (content.stats && content.stats.length > 0) {
    return 'stats';
  }
  // 比較データがある場合
  if (content.comparison) {
    return 'comparison';
  }
  // 引用がある場合
  if (content.quote) {
    return 'quote';
  }
  // セクション区切りの場合（本文なし、メッセージのみ）
  if (content.isSection || (!content.body && !content.bullets && content.message)) {
    return 'section';
  }
  // まとめスライドの場合
  if (content.isSummary || content.title?.includes('まとめ') || content.title?.includes('結論')) {
    return 'summary';
  }
  // 左右に分けるコンテンツがある場合
  if (content.leftColumn || content.rightColumn) {
    return 'twoColumn';
  }
  // タイムラインデータがある場合
  if (content.timeline && Array.isArray(content.timeline) && content.timeline.length > 0) {
    return 'timeline';
  }
  // サイクルデータがある場合
  if (content.cycle && Array.isArray(content.cycle) && content.cycle.length > 0) {
    return 'cycle';
  }
  // ファネルデータがある場合
  if (content.funnel && Array.isArray(content.funnel) && content.funnel.length > 0) {
    return 'funnel';
  }
  // テーブルデータがある場合
  if (content.tableData && content.tableData.headers && content.tableData.rows) {
    return 'table';
  }
  // グリッドデータがある場合
  if (content.grid && Array.isArray(content.grid) && content.grid.length > 0) {
    return 'grid';
  }
  // ベン図データがある場合
  if (content.venn && (content.venn.left || content.venn.right)) {
    return 'venn';
  }
  // ツリーデータがある場合
  if (content.tree && content.tree.title) {
    return 'tree';
  }
  // Q&Aデータがある場合
  if (content.qaItems && Array.isArray(content.qaItems) && content.qaItems.length > 0) {
    return 'qa';
  }
  // 事例紹介データがある場合
  if (content.caseStudy && (content.caseStudy.challenge || content.caseStudy.solution)) {
    return 'caseStudy';
  }
  return 'standard';
}

// ============================================
// タイトルスライド
// ============================================

function createTitleSlide(slide, title, subtitle) {
  // 既存のプレースホルダーを全て削除
  const shapes = slide.getShapes();
  shapes.forEach(shape => {
    try {
      shape.remove();
    } catch (e) {
      // 削除できない場合は無視
    }
  });

  // 背景：Dexall風ダークネイビー
  slide.getBackground().setSolidFill(COLORS.navy);

  // 装飾：右側の大きな半円（モダンなデザイン要素）
  const decorCircle = slide.insertShape(SlidesApp.ShapeType.ELLIPSE,
    PAGE_WIDTH - 180, -50, 350, 350);
  decorCircle.getFill().setSolidFill(COLORS.darkBlue);
  decorCircle.getBorder().setTransparent();
  decorCircle.sendToBack();

  // 装飾：下部の小さな円
  const smallCircle = slide.insertShape(SlidesApp.ShapeType.ELLIPSE,
    PAGE_WIDTH - 100, PAGE_HEIGHT - 80, 120, 120);
  smallCircle.getFill().setSolidFill(COLORS.blue);
  smallCircle.getBorder().setTransparent();
  smallCircle.sendToBack();

  // 装飾：アクセントライン（Dexallブルー）
  const accentLine = slide.insertShape(SlidesApp.ShapeType.RECTANGLE,
    50, PAGE_HEIGHT / 2 + 35, 80, 3);
  accentLine.getFill().setSolidFill(COLORS.blue);
  accentLine.getBorder().setTransparent();

  // タイトル（文字数に応じてフォントサイズを動的調整）
  const titleLength = title.length;
  let titleFontSize = 36;
  let titleBoxHeight = 70;
  if (titleLength > 40) {
    titleFontSize = 18;
    titleBoxHeight = 90;
  } else if (titleLength > 30) {
    titleFontSize = 22;
    titleBoxHeight = 85;
  } else if (titleLength > 20) {
    titleFontSize = 26;
    titleBoxHeight = 80;
  } else if (titleLength > 15) {
    titleFontSize = 30;
    titleBoxHeight = 75;
  }

  const titleBox = slide.insertTextBox(title, 50, PAGE_HEIGHT / 2 - 55, PAGE_WIDTH - 200, titleBoxHeight);
  titleBox.getText().getTextStyle()
    .setFontSize(titleFontSize)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // サブタイトル
  const subtitleText = subtitle || new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  const subtitleBox = slide.insertTextBox(subtitleText, 50, PAGE_HEIGHT / 2 + 50, PAGE_WIDTH - 200, 28);
  subtitleBox.getText().getTextStyle()
    .setFontSize(14)
    .setForegroundColor(COLORS.lightBlue)
    .setFontFamily(FONTS.body);

  // フッター（控えめに）
  const footer = slide.insertTextBox('Powered by SlideAI', PAGE_WIDTH - 150, PAGE_HEIGHT - 25, 130, 18);
  footer.getText().getTextStyle()
    .setFontSize(8)
    .setForegroundColor(COLORS.gray)
    .setFontFamily(FONTS.body);
  footer.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.END);
}

// ============================================
// 目次スライド
// ============================================

function createTableOfContents(slide, slides) {
  // 定数 - 余白を最適化
  const CONTENT_PADDING = 50;
  const BOTTOM_MARGIN = 15;

  slide.getBackground().setSolidFill(COLORS.white);

  // タイトル
  const titleBox = slide.insertTextBox('Contents', CONTENT_PADDING, 30, 180, 35);
  titleBox.getText().getTextStyle()
    .setFontSize(26)
    .setBold(true)
    .setForegroundColor(COLORS.navy)
    .setFontFamily(FONTS.title);

  // アクセントライン（Dexallブルー）
  const line = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, CONTENT_PADDING, 68, 50, 3);
  line.getFill().setSolidFill(COLORS.blue);
  line.getBorder().setTransparent();

  // 目次項目（オーバーフロー防止）
  const startY = 85;
  const availableHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN;
  const itemHeight = Math.floor(availableHeight / Math.min(slides.length, 10));
  const maxItems = Math.min(slides.length, 10);

  slides.slice(0, maxItems).forEach((content, i) => {
    const y = startY + (i * itemHeight);
    if (y + 26 > PAGE_HEIGHT - BOTTOM_MARGIN) return;

    const itemTitle = content.title || `スライド ${i + 1}`;

    // 番号（Dexallブルー）
    const numBox = slide.insertTextBox(String(i + 1).padStart(2, '0'), CONTENT_PADDING, y, 35, 26);
    numBox.getText().getTextStyle()
      .setFontSize(13)
      .setBold(true)
      .setForegroundColor(COLORS.blue)
      .setFontFamily(FONTS.accent);

    // タイトル
    const itemBox = slide.insertTextBox(itemTitle, CONTENT_PADDING + 45, y, PAGE_WIDTH - CONTENT_PADDING - 100, 26);
    itemBox.getText().getTextStyle()
      .setFontSize(13)
      .setForegroundColor(COLORS.darkGray)
      .setFontFamily(FONTS.body);
  });

  // 左のアクセントバー（Dexallネイビー）
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, 6, PAGE_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.navy);
  sideBar.getBorder().setTransparent();
}

// ============================================
// セクション区切りスライド
// ============================================

function createSectionSlide(slide, content, index) {
  // Dexall風ダークネイビー背景
  slide.getBackground().setSolidFill(COLORS.navy);

  // 装飾：右側の大きな円
  const decorCircle = slide.insertShape(SlidesApp.ShapeType.ELLIPSE,
    PAGE_WIDTH - 150, PAGE_HEIGHT / 2 - 150, 300, 300);
  decorCircle.getFill().setSolidFill(COLORS.darkBlue);
  decorCircle.getBorder().setTransparent();
  decorCircle.sendToBack();

  // セクション番号（Dexallブルー）
  const numBox = slide.insertTextBox(String(index + 1).padStart(2, '0'), 50, PAGE_HEIGHT / 2 - 70, 90, 45);
  numBox.getText().getTextStyle()
    .setFontSize(42)
    .setBold(true)
    .setForegroundColor(COLORS.blue)
    .setFontFamily(FONTS.accent);

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', 50, PAGE_HEIGHT / 2 - 15, PAGE_WIDTH - 180, 50);
  titleBox.getText().getTextStyle()
    .setFontSize(32)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // メッセージ（あれば）
  if (content.message) {
    const msgBox = slide.insertTextBox(content.message, 50, PAGE_HEIGHT / 2 + 45, PAGE_WIDTH - 180, 35);
    msgBox.getText().getTextStyle()
      .setFontSize(14)
      .setForegroundColor(COLORS.lightBlue)
      .setFontFamily(FONTS.body);
  }

  // 装飾：左側の縦線（Dexallブルー）
  const vertLine = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 35, 80, 3, PAGE_HEIGHT - 160);
  vertLine.getFill().setSolidFill(COLORS.blue);
  vertLine.getBorder().setTransparent();
}

// ============================================
// 標準スライド（メッセージ + 本文 + 箇条書き）
// ============================================

function createStandardSlide(slide, content, index) {
  slide.getBackground().setSolidFill(COLORS.white);

  // 定数定義（レイアウト調整用）
  const HEADER_HEIGHT = 55;
  const CONTENT_START_Y = 65;
  const CONTENT_PADDING = 25;
  const BOTTOM_MARGIN = 15;
  const CONTENT_WIDTH = PAGE_WIDTH - (CONTENT_PADDING * 2);
  const AVAILABLE_HEIGHT = PAGE_HEIGHT - CONTENT_START_Y - BOTTOM_MARGIN;

  // ヘッダーエリア
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル（文字数に応じてフォントサイズ調整）
  const titleText = content.title || '';
  const titleFontSize = calculateFontSize(titleText, PAGE_WIDTH - 100, 18, 14);
  const titleBox = slide.insertTextBox(titleText, CONTENT_PADDING, 12, PAGE_WIDTH - 100, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(titleFontSize)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // コンテンツ領域の計算
  const hasMessage = Boolean(content.message);
  const hasBody = Boolean(content.body);
  const hasHighlights = Array.isArray(content.highlights) && content.highlights.filter(h => h).length > 0;
  const hasBullets = content.bullets && Array.isArray(content.bullets) && content.bullets.filter(b => b).length > 0;
  const validBullets = hasBullets ? content.bullets.filter(b => b) : [];

  // 動的スペース配分
  let currentY = CONTENT_START_Y;
  
  // コンテンツ量に応じた高さ配分を計算
  const msgText = content.message || '';
  const msgFontSizeForCalc = calculateFontSize(msgText, CONTENT_WIDTH, 15, 12);
  const messageHeight = hasMessage ? calculateMessageHeight(msgText, CONTENT_WIDTH, msgFontSizeForCalc) + 10 : 0;
  const bodyText = content.body || '';
  const bodyLines = Math.ceil(bodyText.length / 40);
  const bodyHeight = hasBody ? Math.max(45, Math.min(bodyLines * 22, 100)) : 0;
  const highlightHeight = hasHighlights ? 40 : 0;
  const fixedHeight = messageHeight + bodyHeight + highlightHeight + 10;
  const bulletAvailableHeight = AVAILABLE_HEIGHT - fixedHeight;

  // bullet用のフォントサイズを計算
  const bulletStyle = calculateBulletFontSize(validBullets, bulletAvailableHeight, CONTENT_WIDTH - 20);

  // キーメッセージ（高さを動的計算）
  if (hasMessage) {
    const msgText = content.message;
    const msgFontSize = calculateFontSize(msgText, CONTENT_WIDTH, 15, 12);
    const msgHeight = calculateMessageHeight(msgText, CONTENT_WIDTH, msgFontSize);
    const msgBox = slide.insertTextBox(msgText, CONTENT_PADDING, currentY, CONTENT_WIDTH, msgHeight);
    msgBox.getText().getTextStyle()
      .setFontSize(msgFontSize)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);
    currentY += msgHeight + 10;

    const msgLine = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, CONTENT_PADDING, currentY - 6, 50, 2);
    msgLine.getFill().setSolidFill(COLORS.blue);
    msgLine.getBorder().setTransparent();
  }

  // 本文（充実した内容を表示）
  if (hasBody) {
    const bodyFontSize = calculateMultiLineFontSize(bodyText, CONTENT_WIDTH, bodyHeight, 12, 10);
    const bodyBox = slide.insertTextBox(bodyText, CONTENT_PADDING, currentY, CONTENT_WIDTH, bodyHeight);
    bodyBox.getText().getTextStyle()
      .setFontSize(bodyFontSize)
      .setForegroundColor(COLORS.darkGray)
      .setFontFamily(FONTS.body);
    currentY += bodyHeight + 8;
  }

  // ハイライト
  if (hasHighlights) {
    const validHighlights = content.highlights.filter(h => h);
    const hlCount = Math.min(validHighlights.length, 4);
    const hlWidth = Math.floor((CONTENT_WIDTH - (hlCount - 1) * 8) / hlCount);

    validHighlights.slice(0, 4).forEach((hl, i) => {
      const hlText = String(hl);
      const hlFontSize = calculateFontSize(hlText, hlWidth - 10, 10, 8);
      const hlX = CONTENT_PADDING + (i * (hlWidth + 8));
      const hlBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, hlX, currentY, hlWidth, 32);
      hlBox.getFill().setSolidFill(COLORS.lightGray);
      hlBox.getBorder().setTransparent();
      hlBox.getText().setText(hlText);
      hlBox.getText().getTextStyle()
        .setFontSize(hlFontSize)
        .setBold(true)
        .setForegroundColor(COLORS.navy)
        .setFontFamily(FONTS.body);
      hlBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    });
    currentY += 40;
  }

  // 箇条書き（フォントサイズ可変）
  if (hasBullets) {
    validBullets.forEach((bullet, i) => {
      if (currentY + bulletStyle.lineHeight > PAGE_HEIGHT - BOTTOM_MARGIN) return;

      const bulletText = String(bullet);
      const dotY = currentY + (bulletStyle.lineHeight - 6) / 2;
      const dot = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, CONTENT_PADDING + 3, dotY, 6, 6);
      dot.getFill().setSolidFill(COLORS.blue);
      dot.getBorder().setTransparent();

      const bulletFontSize = Math.min(bulletStyle.fontSize, calculateFontSize(bulletText, CONTENT_WIDTH - 25, bulletStyle.fontSize, 9));
      const bulletBox = slide.insertTextBox(bulletText, CONTENT_PADDING + 16, currentY, CONTENT_WIDTH - 20, bulletStyle.lineHeight);
      bulletBox.getText().getTextStyle()
        .setFontSize(bulletFontSize)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);

      currentY += bulletStyle.lineHeight;
    });
  }

  // 下部に余白がある場合、フッターラインを追加
  if (currentY < PAGE_HEIGHT - 40) {
    const footerY = PAGE_HEIGHT - 20;
    const footerLine = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, CONTENT_PADDING, footerY, CONTENT_WIDTH, 1);
    footerLine.getFill().setSolidFill(COLORS.lightGray);
    footerLine.getBorder().setTransparent();
  }

  // 左サイドのアクセントバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================
// 2カラムスライド
// ============================================

function createTwoColumnSlide(slide, content, index) {
  // カラムデータが不十分な場合はstandardスライドとして処理
  if (!content.leftColumn && !content.rightColumn) {
    createStandardSlide(slide, content, index);
    return;
  }

  // 定数 - 余白を最小化
  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 20;
  const BOTTOM_MARGIN = 10;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー（Dexall風）
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  const colGap = 16;
  const colWidth = Math.floor((PAGE_WIDTH - (CONTENT_PADDING * 2) - colGap) / 2);
  const startY = HEADER_HEIGHT + 10;
  const contentHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN;

  // 左カラム
  if (content.leftColumn) {
    createColumnContent(slide, content.leftColumn, CONTENT_PADDING, startY, colWidth, contentHeight);
  }

  // 中央の区切り線
  const dividerX = CONTENT_PADDING + colWidth + (colGap / 2);
  const divider = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, dividerX, startY, 2, contentHeight);
  divider.getFill().setSolidFill(COLORS.lightGray);
  divider.getBorder().setTransparent();

  // 右カラム
  if (content.rightColumn) {
    createColumnContent(slide, content.rightColumn, CONTENT_PADDING + colWidth + colGap, startY, colWidth, contentHeight);
  }

  // 左サイドのアクセントバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

function createColumnContent(slide, column, x, y, width, maxHeight) {
  if (!column) return;
  let currentY = y;
  const bottomLimit = y + maxHeight;

  // カラムタイトル
  if (column.title) {
    const colTitle = slide.insertTextBox(column.title, x, currentY, width, 28);
    colTitle.getText().getTextStyle()
      .setFontSize(14)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);
    currentY += 34;
  }

  // 箇条書き - スライド全体を使うように調整
  if (column.bullets && Array.isArray(column.bullets)) {
    const validBullets = column.bullets.filter(b => b);
    const availableHeight = bottomLimit - currentY - 10;
    // 最低32px、最大でavailableHeightを均等分配
    const bulletHeight = Math.max(32, Math.floor(availableHeight / Math.max(validBullets.length, 1)));

    validBullets.forEach((bullet, idx) => {
      if (currentY + 28 > bottomLimit) return;
      const dot = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, x + 4, currentY + 8, 6, 6);
      dot.getFill().setSolidFill(COLORS.blue);
      dot.getBorder().setTransparent();

      const bulletBox = slide.insertTextBox(String(bullet), x + 18, currentY, width - 22, bulletHeight);
      bulletBox.getText().getTextStyle()
        .setFontSize(12)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);
      currentY += bulletHeight;
    });
  }
}

// ============================================
// 統計・数値ハイライトスライド
// ============================================

function createStatsSlide(slide, content, index) {
  // 最初にstatsデータの有効性をチェック
  const stats = Array.isArray(content.stats) ? content.stats.filter(s => s && (s.value || s.label)) : [];
  const cardCount = Math.min(stats.length, 4);

  // statsが空の場合はstandardスライドとして処理
  if (cardCount === 0) {
    createStandardSlide(slide, content, index);
    return;
  }

  // 定数 - 余白を最小化
  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 20;
  const BOTTOM_MARGIN = 12;

  slide.getBackground().setSolidFill(COLORS.offWhite);

  // ヘッダー（Dexall風）
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  let startY = HEADER_HEIGHT + 10;

  // メッセージ
  if (content.message) {
    const msgBox = slide.insertTextBox(content.message, CONTENT_PADDING, startY, PAGE_WIDTH - (CONTENT_PADDING * 2), 28);
    msgBox.getText().getTextStyle()
      .setFontSize(13)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);
    startY += 35;
  }

  // カード配置 - 高さを動的に計算
  const cardGap = 12;
  const totalGap = (cardCount - 1) * cardGap;
  const cardWidth = Math.floor((PAGE_WIDTH - (CONTENT_PADDING * 2) - totalGap) / cardCount);
  const availableHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN;
  const hasBullets = Array.isArray(content.bullets) && content.bullets.length > 0;
  const cardHeight = hasBullets ? Math.min(availableHeight - 30, 160) : Math.min(availableHeight, 200);

  // Dexall風カラー（ブルー系でまとめる）
  const cardColors = [COLORS.blue, '#2d6a9f', '#4a8bc2', '#6ba3d6'];

  stats.slice(0, 4).forEach((stat, i) => {
    const x = CONTENT_PADDING + (i * (cardWidth + cardGap));
    const statValue = stat.value || '-';
    const statLabel = stat.label || '';

    // カード背景（白）
    const card = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, startY, cardWidth, cardHeight);
    card.getFill().setSolidFill(COLORS.white);
    card.getBorder().setTransparent();

    // 上部のカラーバー
    const colorBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, x, startY, cardWidth, 4);
    colorBar.getFill().setSolidFill(cardColors[i % cardColors.length]);
    colorBar.getBorder().setTransparent();

    // 数値
    const valueBox = slide.insertTextBox(statValue, x + 6, startY + 15, cardWidth - 12, 50);
    valueBox.getText().getTextStyle()
      .setFontSize(30)
      .setBold(true)
      .setForegroundColor(cardColors[i % cardColors.length])
      .setFontFamily(FONTS.accent);
    valueBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    // ラベル
    if (statLabel) {
      const labelBox = slide.insertTextBox(statLabel, x + 6, startY + 70, cardWidth - 12, cardHeight - 80);
      labelBox.getText().getTextStyle()
        .setFontSize(11)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);
      labelBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  });

  // 補足（箇条書き）
  if (hasBullets) {
    const validBullets = content.bullets.filter(b => b);
    if (validBullets.length > 0) {
      const noteY = startY + cardHeight + 8;
      if (noteY < PAGE_HEIGHT - BOTTOM_MARGIN) {
        const noteText = validBullets.slice(0, 2).map(b => `• ${String(b)}`).join('　');
        const noteBox = slide.insertTextBox(noteText, CONTENT_PADDING, noteY, PAGE_WIDTH - (CONTENT_PADDING * 2), 22);
        noteBox.getText().getTextStyle()
          .setFontSize(10)
          .setForegroundColor(COLORS.gray)
          .setFontFamily(FONTS.body);
      }
    }
  }
}

// ============================================
// 比較スライド
// ============================================

function createComparisonSlide(slide, content, index) {
  const comp = content.comparison || {};

  // comparisonデータが不十分な場合はstandardスライドとして処理
  if (!comp.beforeItems && !comp.afterItems) {
    createStandardSlide(slide, content, index);
    return;
  }

  // 定数 - 余白を最小化
  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 18;
  const BOTTOM_MARGIN = 10;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー（Dexall風）
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING + 5, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  const colGap = 28;
  const colWidth = Math.floor((PAGE_WIDTH - (CONTENT_PADDING * 2) - colGap) / 2);
  const startY = HEADER_HEIGHT + 10;
  const contentHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN;

  // Before/左側（薄いグレー背景）
  const leftBg = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, CONTENT_PADDING, startY, colWidth, contentHeight);
  leftBg.getFill().setSolidFill(COLORS.lightGray);
  leftBg.getBorder().setTransparent();

  const leftTitle = slide.insertTextBox(comp.beforeTitle || 'Before', CONTENT_PADDING + 12, startY + 10, colWidth - 24, 24);
  leftTitle.getText().getTextStyle()
    .setFontSize(13)
    .setBold(true)
    .setForegroundColor(COLORS.red)
    .setFontFamily(FONTS.title);

  if (comp.beforeItems && Array.isArray(comp.beforeItems)) {
    const itemHeight = Math.min(28, Math.floor((contentHeight - 45) / comp.beforeItems.length));
    let y = startY + 40;
    comp.beforeItems.forEach(item => {
      if (!item || y + itemHeight > PAGE_HEIGHT - BOTTOM_MARGIN) return;
      const itemText = '✕ ' + String(item);
      const itemBox = slide.insertTextBox(itemText, CONTENT_PADDING + 12, y, colWidth - 24, itemHeight);
      itemBox.getText().getTextStyle()
        .setFontSize(11)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);
      y += itemHeight;
    });
  }

  // 矢印（中央）
  const arrowX = CONTENT_PADDING + colWidth + (colGap / 2) - 10;
  const arrow = slide.insertTextBox('→', arrowX, PAGE_HEIGHT / 2 - 12, 20, 28);
  arrow.getText().getTextStyle()
    .setFontSize(20)
    .setBold(true)
    .setForegroundColor(COLORS.blue)
    .setFontFamily(FONTS.accent);

  // After/右側（ネイビー背景）
  const rightX = CONTENT_PADDING + colWidth + colGap;
  const rightBg = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, rightX, startY, colWidth, contentHeight);
  rightBg.getFill().setSolidFill(COLORS.navy);
  rightBg.getBorder().setTransparent();

  const rightTitle = slide.insertTextBox(comp.afterTitle || 'After', rightX + 12, startY + 10, colWidth - 24, 24);
  rightTitle.getText().getTextStyle()
    .setFontSize(13)
    .setBold(true)
    .setForegroundColor(COLORS.green)
    .setFontFamily(FONTS.title);

  if (comp.afterItems && Array.isArray(comp.afterItems)) {
    const itemHeight = Math.min(28, Math.floor((contentHeight - 45) / comp.afterItems.length));
    let y = startY + 40;
    comp.afterItems.forEach(item => {
      if (!item || y + itemHeight > PAGE_HEIGHT - BOTTOM_MARGIN) return;
      const itemText = '✓ ' + String(item);
      const itemBox = slide.insertTextBox(itemText, rightX + 12, y, colWidth - 24, itemHeight);
      itemBox.getText().getTextStyle()
        .setFontSize(11)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.body);
      y += itemHeight;
    });
  }
}

// ============================================
// 引用スライド
// ============================================

function createQuoteSlide(slide, content, index) {
  slide.getBackground().setSolidFill(COLORS.navy);

  // 引用符
  const quoteOpen = slide.insertTextBox('"', 40, 60, 80, 100);
  quoteOpen.getText().getTextStyle()
    .setFontSize(120)
    .setBold(true)
    .setForegroundColor(COLORS.darkBlue)
    .setFontFamily('Georgia');

  // 引用文
  const quoteText = content.quote || content.message || content.title || '　';
  const quoteBox = slide.insertTextBox(quoteText, 70, 120, PAGE_WIDTH - 140, 180);
  if (quoteText.trim()) {
    quoteBox.getText().getTextStyle()
      .setFontSize(24)
      .setItalic(true)
      .setForegroundColor(COLORS.white)
      .setFontFamily(FONTS.body);
  }

  // 出典
  if (content.source) {
    const sourceBox = slide.insertTextBox('— ' + content.source, 70, PAGE_HEIGHT - 60, PAGE_WIDTH - 140, 28);
    sourceBox.getText().getTextStyle()
      .setFontSize(14)
      .setForegroundColor(COLORS.lightBlue)
      .setFontFamily(FONTS.body);
  }

  // スライド番号
  const numBox = slide.insertTextBox(String(index + 1), PAGE_WIDTH - 45, PAGE_HEIGHT - 35, 28, 28);
  numBox.getText().getTextStyle()
    .setFontSize(11)
    .setForegroundColor(COLORS.gray)
    .setFontFamily(FONTS.accent);
}

// ============================================
// まとめスライド
// ============================================

function createSummarySlide(slide, content, index) {
  // Dexall風ダークネイビー背景
  slide.getBackground().setSolidFill(COLORS.navy);

  // 定数 - 余白を最小化
  const CONTENT_PADDING = 45;
  const BOTTOM_MARGIN = 25;

  // 装飾：右上の円
  const decorCircle = slide.insertShape(SlidesApp.ShapeType.ELLIPSE,
    PAGE_WIDTH - 120, -40, 200, 200);
  decorCircle.getFill().setSolidFill(COLORS.darkBlue);
  decorCircle.getBorder().setTransparent();
  decorCircle.sendToBack();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || 'まとめ', CONTENT_PADDING, 25, PAGE_WIDTH - (CONTENT_PADDING * 2), 40);
  titleBox.getText().getTextStyle()
    .setFontSize(26)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // アクセントライン（Dexallブルー）
  const line = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, CONTENT_PADDING, 70, 50, 3);
  line.getFill().setSolidFill(COLORS.blue);
  line.getBorder().setTransparent();

  let currentY = 85;

  // キーメッセージ
  if (content.message) {
    const msgBox = slide.insertTextBox(content.message, CONTENT_PADDING, currentY, PAGE_WIDTH - (CONTENT_PADDING * 2), 38);
    msgBox.getText().getTextStyle()
      .setFontSize(14)
      .setBold(true)
      .setForegroundColor(COLORS.lightBlue)
      .setFontFamily(FONTS.title);
    currentY += 45;
  }

  // ポイント（番号付き）- 余白を最小化
  if (content.bullets && Array.isArray(content.bullets) && content.bullets.length > 0) {
    const validBullets = content.bullets.filter(b => b);
    const availableHeight = PAGE_HEIGHT - currentY - BOTTOM_MARGIN;
    const bulletHeight = Math.min(42, Math.floor(availableHeight / validBullets.length));

    validBullets.forEach((bullet, bulletIndex) => {
      if (currentY + bulletHeight > PAGE_HEIGHT - BOTTOM_MARGIN) return;

      const bulletText = String(bullet);

      // 番号バッジ（Dexallブルー）
      const numBadge = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, CONTENT_PADDING, currentY, 24, 24);
      numBadge.getFill().setSolidFill(COLORS.blue);
      numBadge.getBorder().setTransparent();
      numBadge.getText().setText(String(bulletIndex + 1));
      numBadge.getText().getTextStyle()
        .setFontSize(11)
        .setBold(true)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.accent);
      numBadge.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

      // テキスト
      const bulletBox = slide.insertTextBox(bulletText, CONTENT_PADDING + 32, currentY + 2, PAGE_WIDTH - CONTENT_PADDING - 80, 24);
      bulletBox.getText().getTextStyle()
        .setFontSize(13)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.body);

      currentY += bulletHeight;
    });
  }

  // フッター
  const footer = slide.insertTextBox('Thank you', PAGE_WIDTH - 90, PAGE_HEIGHT - 22, 70, 18);
  footer.getText().getTextStyle()
    .setFontSize(9)
    .setItalic(true)
    .setForegroundColor(COLORS.gray)
    .setFontFamily(FONTS.body);
  footer.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.END);
}

// ============================================
// フロー図スライド（横型プロセス）
// ============================================

function createFlowSlide(slide, content, index) {
  const flowSteps = Array.isArray(content.flow) ? content.flow.filter(s => s && s.title) : [];

  // flowが空の場合はstandardスライドとして処理
  if (flowSteps.length === 0) {
    createStandardSlide(slide, content, index);
    return;
  }

  // 定数 - 余白を最小化
  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 20;
  const BOTTOM_MARGIN = 10;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー（Dexall風）
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // フローステップの配置 - 高さを動的に計算
  const stepCount = Math.min(flowSteps.length, 5);
  const arrowWidth = 18;
  const totalArrows = stepCount - 1;
  const availableWidth = PAGE_WIDTH - (CONTENT_PADDING * 2) - (totalArrows * arrowWidth);
  const stepWidth = Math.floor(availableWidth / stepCount);
  const startY = HEADER_HEIGHT + 15;
  const stepHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN; // 動的に高さを計算

  // ブルー系グラデーション
  const stepColors = ['#337ab7', '#4a8bc2', '#6ba3d6', '#8dbde8', '#afd4f2'];

  flowSteps.slice(0, 5).forEach((step, i) => {
    const x = CONTENT_PADDING + (i * (stepWidth + arrowWidth));

    // ステップボックス（角丸）
    const stepBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, startY, stepWidth, stepHeight);
    stepBox.getFill().setSolidFill(stepColors[i % stepColors.length]);
    stepBox.getBorder().setTransparent();

    // ステップ番号
    const numCircle = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, x + stepWidth / 2 - 14, startY + 12, 28, 28);
    numCircle.getFill().setSolidFill(COLORS.white);
    numCircle.getBorder().setTransparent();
    numCircle.getText().setText(String(i + 1));
    numCircle.getText().getTextStyle()
      .setFontSize(13)
      .setBold(true)
      .setForegroundColor(stepColors[i % stepColors.length])
      .setFontFamily(FONTS.accent);
    numCircle.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    // ステップタイトル
    const stepTitle = slide.insertTextBox(step.title || '', x + 6, startY + 48, stepWidth - 12, 35);
    stepTitle.getText().getTextStyle()
      .setFontSize(11)
      .setBold(true)
      .setForegroundColor(COLORS.white)
      .setFontFamily(FONTS.title);
    stepTitle.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    // ステップ説明
    if (step.description) {
      const stepDesc = slide.insertTextBox(step.description, x + 6, startY + 88, stepWidth - 12, stepHeight - 100);
      stepDesc.getText().getTextStyle()
        .setFontSize(9)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.body);
      stepDesc.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }

    // 矢印（最後のステップ以外）
    if (i < stepCount - 1) {
      const arrowX = x + stepWidth + 1;
      const arrowY = startY + stepHeight / 2 - 10;
      const arrowShape = slide.insertTextBox('→', arrowX, arrowY, arrowWidth, 20);
      arrowShape.getText().getTextStyle()
        .setFontSize(16)
        .setBold(true)
        .setForegroundColor(COLORS.blue)
        .setFontFamily(FONTS.accent);
    }
  });

  // 左サイドのアクセントバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================
// ピラミッドスライド
// ============================================

function createPyramidSlide(slide, content, index) {
  const pyramidLayers = Array.isArray(content.pyramid) ? content.pyramid.filter(l => l && l.title) : [];

  // pyramidが空の場合はstandardスライドとして処理
  if (pyramidLayers.length === 0) {
    createStandardSlide(slide, content, index);
    return;
  }

  // 定数 - 余白を最小化
  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 25;
  const BOTTOM_MARGIN = 10;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー（Dexall風）
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // ピラミッドの配置 - 高さを動的に計算
  const layerCount = Math.min(pyramidLayers.length, 5);
  const pyramidWidth = 420;
  const startX = (PAGE_WIDTH - pyramidWidth) / 2;
  const startY = HEADER_HEIGHT + 15;
  const pyramidHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN; // 動的に高さを計算
  const layerHeight = Math.floor(pyramidHeight / layerCount);

  // ブルー系グラデーション（上から濃い）
  const layerColors = ['#0D1933', '#1a2d4d', '#337ab7', '#5a9fd4', '#8dbde8'];

  pyramidLayers.slice(0, 5).forEach((layer, i) => {
    // 台形の幅を計算（上が狭く、下が広い）
    const topWidthRatio = 0.2 + (i * 0.16);
    const bottomWidthRatio = 0.2 + ((i + 1) * 0.16);
    const topWidth = pyramidWidth * topWidthRatio;
    const bottomWidth = pyramidWidth * bottomWidthRatio;

    const y = startY + (i * layerHeight);
    const topX = startX + (pyramidWidth - topWidth) / 2;
    const bottomX = startX + (pyramidWidth - bottomWidth) / 2;

    // 台形をRound Rectangleで近似
    const layerBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE,
      bottomX, y, bottomWidth, layerHeight - 2);
    layerBox.getFill().setSolidFill(layerColors[i % layerColors.length]);
    layerBox.getBorder().setTransparent();

    // レイヤータイトル
    const layerTitle = slide.insertTextBox(layer.title || '', bottomX + 8, y + 4, bottomWidth - 16, 22);
    layerTitle.getText().getTextStyle()
      .setFontSize(11)
      .setBold(true)
      .setForegroundColor(COLORS.white)
      .setFontFamily(FONTS.title);
    layerTitle.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    // レイヤー説明（スペースがあれば）
    if (layer.description && layerHeight > 40) {
      const layerDesc = slide.insertTextBox(layer.description, bottomX + 8, y + 26, bottomWidth - 16, layerHeight - 32);
      layerDesc.getText().getTextStyle()
        .setFontSize(9)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.body);
      layerDesc.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  });

  // 左サイドのアクセントバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================
// マトリクススライド（2x2）
// ============================================

function createMatrixSlide(slide, content, index) {
  const matrix = content.matrix || {};

  // matrixが空の場合はstandardスライドとして処理
  if (!matrix.topLeft && !matrix.topRight && !matrix.bottomLeft && !matrix.bottomRight) {
    createStandardSlide(slide, content, index);
    return;
  }

  // 定数 - 余白を最小化
  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 20;
  const AXIS_WIDTH = 28;
  const BOTTOM_MARGIN = 18;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー（Dexall風）
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // マトリクスの配置 - 高さを動的に計算
  const matrixStartX = CONTENT_PADDING + AXIS_WIDTH + 8;
  const matrixStartY = HEADER_HEIGHT + 15;
  const cellWidth = (PAGE_WIDTH - matrixStartX - CONTENT_PADDING - 8) / 2;
  const cellHeight = (PAGE_HEIGHT - matrixStartY - BOTTOM_MARGIN) / 2;
  const cellGap = 6;

  // セルの色
  const cellColors = {
    topLeft: COLORS.blue,
    topRight: '#5a9fd4',
    bottomLeft: '#8dbde8',
    bottomRight: COLORS.lightGray
  };

  // X軸ラベル
  if (matrix.xAxisLabel) {
    const xLabel = slide.insertTextBox(matrix.xAxisLabel, matrixStartX, PAGE_HEIGHT - BOTTOM_MARGIN + 2, cellWidth * 2 + cellGap, 16);
    xLabel.getText().getTextStyle()
      .setFontSize(9)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);
    xLabel.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  }

  // Y軸ラベル（縦書き風に配置）
  if (matrix.yAxisLabel) {
    const yLabel = slide.insertTextBox(matrix.yAxisLabel, CONTENT_PADDING, matrixStartY + cellHeight - 18, AXIS_WIDTH, 36);
    yLabel.getText().getTextStyle()
      .setFontSize(9)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);
  }

  // 各セルを描画
  const cells = [
    { key: 'topLeft', x: matrixStartX, y: matrixStartY },
    { key: 'topRight', x: matrixStartX + cellWidth + cellGap, y: matrixStartY },
    { key: 'bottomLeft', x: matrixStartX, y: matrixStartY + cellHeight + cellGap },
    { key: 'bottomRight', x: matrixStartX + cellWidth + cellGap, y: matrixStartY + cellHeight + cellGap }
  ];

  cells.forEach(cell => {
    const cellData = matrix[cell.key];
    if (!cellData) return;

    // セル背景
    const cellBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, cell.x, cell.y, cellWidth, cellHeight - cellGap);
    cellBox.getFill().setSolidFill(cellColors[cell.key]);
    cellBox.getBorder().setTransparent();

    // セルタイトル
    const textColor = cell.key === 'bottomRight' ? COLORS.navy : COLORS.white;
    if (cellData.title) {
      const cellTitle = slide.insertTextBox(cellData.title, cell.x + 8, cell.y + 8, cellWidth - 16, 22);
      cellTitle.getText().getTextStyle()
        .setFontSize(11)
        .setBold(true)
        .setForegroundColor(textColor)
        .setFontFamily(FONTS.title);
    }

    // セル説明
    if (cellData.description) {
      const cellDesc = slide.insertTextBox(cellData.description, cell.x + 8, cell.y + 32, cellWidth - 16, cellHeight - cellGap - 42);
      cellDesc.getText().getTextStyle()
        .setFontSize(9)
        .setForegroundColor(textColor)
        .setFontFamily(FONTS.body);
    }
  });

  // 左サイドのアクセントバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================
// 並列スライド（3-4列）
// ============================================

function createParallelSlide(slide, content, index) {
  const columns = Array.isArray(content.parallel) ? content.parallel.filter(c => c && c.title) : [];

  // parallelが空の場合はstandardスライドとして処理
  if (columns.length < 2) {
    createStandardSlide(slide, content, index);
    return;
  }

  // 定数 - 余白を最小化
  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 16;
  const BOTTOM_MARGIN = 10;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー（Dexall風）
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // カラムの配置 - 高さを動的に計算
  const colCount = Math.min(columns.length, 4);
  const colGap = 10;
  const totalGap = (colCount - 1) * colGap;
  const colWidth = Math.floor((PAGE_WIDTH - (CONTENT_PADDING * 2) - totalGap) / colCount);
  const startY = HEADER_HEIGHT + 10;
  const colHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN;

  // ブルー系グラデーション
  const colColors = ['#337ab7', '#4a8bc2', '#6ba3d6', '#8dbde8'];

  columns.slice(0, 4).forEach((col, i) => {
    const x = CONTENT_PADDING + (i * (colWidth + colGap));

    // カラム背景
    const colBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, startY, colWidth, colHeight);
    colBox.getFill().setSolidFill(COLORS.offWhite);
    colBox.getBorder().setTransparent();

    // カラムヘッダー（色付き）
    const colHeader = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, startY, colWidth, 48);
    colHeader.getFill().setSolidFill(colColors[i % colColors.length]);
    colHeader.getBorder().setTransparent();

    // アイコン（あれば）
    if (col.icon) {
      const iconBox = slide.insertTextBox(col.icon, x + colWidth / 2 - 10, startY + 4, 20, 20);
      iconBox.getText().getTextStyle()
        .setFontSize(14)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.body);
      iconBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }

    // カラムタイトル
    const colTitle = slide.insertTextBox(col.title || '', x + 4, startY + (col.icon ? 24 : 10), colWidth - 8, 24);
    colTitle.getText().getTextStyle()
      .setFontSize(10)
      .setBold(true)
      .setForegroundColor(COLORS.white)
      .setFontFamily(FONTS.title);
    colTitle.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    // カラム説明
    let currentY = startY + 54;
    if (col.description) {
      const colDesc = slide.insertTextBox(col.description, x + 6, currentY, colWidth - 12, 38);
      colDesc.getText().getTextStyle()
        .setFontSize(9)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);
      currentY += 42;
    }

    // 箇条書き
    if (col.bullets && Array.isArray(col.bullets)) {
      const bulletHeight = Math.min(22, Math.floor((startY + colHeight - currentY - 6) / col.bullets.length));
      col.bullets.slice(0, 6).forEach(bullet => {
        if (!bullet || currentY + bulletHeight > startY + colHeight - 6) return;

        const dot = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, x + 8, currentY + 5, 4, 4);
        dot.getFill().setSolidFill(colColors[i % colColors.length]);
        dot.getBorder().setTransparent();

        const bulletBox = slide.insertTextBox(String(bullet), x + 16, currentY, colWidth - 22, bulletHeight);
        bulletBox.getText().getTextStyle()
          .setFontSize(9)
          .setForegroundColor(COLORS.darkGray)
          .setFontFamily(FONTS.body);
        currentY += bulletHeight;
      });
    }
  });

  // 左サイドのアクセントバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================

// ============================================
// タイムラインスライド
// ============================================

function createTimelineSlide(slide, content, index) {
  const timelineItems = Array.isArray(content.timeline) ? content.timeline.filter(t => t && t.title) : [];

  if (timelineItems.length === 0) {
    createStandardSlide(slide, content, index);
    return;
  }

  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 20;
  const BOTTOM_MARGIN = 15;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // タイムライン - 垂直方向に中央配置
  const itemCount = Math.min(timelineItems.length, 6);
  const availableHeight = PAGE_HEIGHT - HEADER_HEIGHT - BOTTOM_MARGIN;
  const startY = HEADER_HEIGHT + availableHeight * 0.2; // 日付の位置（上から20%）
  const lineY = startY + 45; // タイムライン線
  const itemWidth = (PAGE_WIDTH - CONTENT_PADDING * 2) / itemCount;

  // 横線
  const line = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, CONTENT_PADDING, lineY, PAGE_WIDTH - CONTENT_PADDING * 2, 3);
  line.getFill().setSolidFill(COLORS.lightGray);
  line.getBorder().setTransparent();

  const itemColors = ['#337ab7', '#4a8bc2', '#6ba3d6', '#8dbde8', '#afd4f2', '#c5e1f7'];

  timelineItems.slice(0, 6).forEach((item, i) => {
    const x = CONTENT_PADDING + (i * itemWidth) + itemWidth / 2;

    // ドット
    const dot = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, x - 10, lineY - 8, 20, 20);
    dot.getFill().setSolidFill(itemColors[i % itemColors.length]);
    dot.getBorder().setTransparent();

    // 日付
    if (item.date) {
      const dateBox = slide.insertTextBox(item.date, x - itemWidth / 2 + 5, startY, itemWidth - 10, 30);
      dateBox.getText().getTextStyle()
        .setFontSize(11)
        .setBold(true)
        .setForegroundColor(itemColors[i % itemColors.length])
        .setFontFamily(FONTS.accent);
      dateBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }

    // タイトル
    const titleY = lineY + 25;
    const itemTitle = slide.insertTextBox(item.title, x - itemWidth / 2 + 5, titleY, itemWidth - 10, 35);
    itemTitle.getText().getTextStyle()
      .setFontSize(12)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);
    itemTitle.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    // 説明
    if (item.description) {
      const descY = titleY + 40;
      const descHeight = PAGE_HEIGHT - descY - BOTTOM_MARGIN - 10;
      const descBox = slide.insertTextBox(item.description, x - itemWidth / 2 + 5, descY, itemWidth - 10, descHeight);
      descBox.getText().getTextStyle()
        .setFontSize(10)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);
      descBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  });

  // サイドバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================
// サイクルスライド（円形）
// ============================================

function createCycleSlide(slide, content, index) {
  const cycleItems = Array.isArray(content.cycle) ? content.cycle.filter(c => c && c.title) : [];

  if (cycleItems.length === 0) {
    createStandardSlide(slide, content, index);
    return;
  }

  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 20;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // サイクル図
  const itemCount = Math.min(cycleItems.length, 6);
  const centerX = PAGE_WIDTH / 2;
  const centerY = (PAGE_HEIGHT + HEADER_HEIGHT) / 2 + 10;
  const radius = 120;
  const itemSize = 80;

  const itemColors = ['#337ab7', '#4a8bc2', '#6ba3d6', '#8dbde8', '#28a745', '#f5a623'];

  // 中央の円
  const centerCircle = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, centerX - 35, centerY - 35, 70, 70);
  centerCircle.getFill().setSolidFill(COLORS.navy);
  centerCircle.getBorder().setTransparent();

  cycleItems.slice(0, 6).forEach((item, i) => {
    const angle = (i * 2 * Math.PI / itemCount) - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle) - itemSize / 2;
    const y = centerY + radius * Math.sin(angle) - itemSize / 2;

    // アイテムボックス
    const itemBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, y, itemSize, itemSize);
    itemBox.getFill().setSolidFill(itemColors[i % itemColors.length]);
    itemBox.getBorder().setTransparent();

    // タイトル
    const itemTitle = slide.insertTextBox(item.title, x + 5, y + 15, itemSize - 10, 25);
    itemTitle.getText().getTextStyle()
      .setFontSize(10)
      .setBold(true)
      .setForegroundColor(COLORS.white)
      .setFontFamily(FONTS.title);
    itemTitle.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    // 説明
    if (item.description) {
      const descBox = slide.insertTextBox(item.description, x + 5, y + 42, itemSize - 10, 35);
      descBox.getText().getTextStyle()
        .setFontSize(8)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.body);
      descBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }

    // 矢印（最後以外）
    if (i < itemCount) {
      const nextAngle = ((i + 1) * 2 * Math.PI / itemCount) - Math.PI / 2;
      const arrowAngle = (angle + nextAngle) / 2;
      const arrowX = centerX + (radius - 35) * Math.cos(arrowAngle);
      const arrowY = centerY + (radius - 35) * Math.sin(arrowAngle);
      const arrow = slide.insertTextBox('→', arrowX - 10, arrowY - 10, 20, 20);
      arrow.getText().getTextStyle()
        .setFontSize(14)
        .setBold(true)
        .setForegroundColor(COLORS.gray);
    }
  });

  // サイドバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================
// ファネルスライド
// ============================================

function createFunnelSlide(slide, content, index) {
  const funnelSteps = Array.isArray(content.funnel) ? content.funnel.filter(f => f && f.title) : [];

  if (funnelSteps.length === 0) {
    createStandardSlide(slide, content, index);
    return;
  }

  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 25;
  const BOTTOM_MARGIN = 15;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // ファネル
  const stepCount = Math.min(funnelSteps.length, 5);
  const startY = HEADER_HEIGHT + 15;
  const funnelHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN;
  const stepHeight = funnelHeight / stepCount;
  const maxWidth = 500;
  const minWidth = 150;
  const centerX = PAGE_WIDTH / 2;

  const stepColors = ['#337ab7', '#4a8bc2', '#6ba3d6', '#8dbde8', '#afd4f2'];

  funnelSteps.slice(0, 5).forEach((step, i) => {
    const widthRatio = 1 - (i * 0.18);
    const width = maxWidth * widthRatio;
    const x = centerX - width / 2;
    const y = startY + (i * stepHeight);

    // ステップボックス
    const stepBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, y, width, stepHeight - 3);
    stepBox.getFill().setSolidFill(stepColors[i % stepColors.length]);
    stepBox.getBorder().setTransparent();

    // タイトルと値
    let displayText = step.title;
    if (step.value) {
      displayText += '\n' + step.value;
    }
    const textBox = slide.insertTextBox(displayText, x + 10, y + 8, width - 20, stepHeight - 20);
    textBox.getText().getTextStyle()
      .setFontSize(12)
      .setBold(true)
      .setForegroundColor(COLORS.white)
      .setFontFamily(FONTS.title);
    textBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  });

  // サイドバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================
// テーブルスライド
// ============================================

function createTableSlide(slide, content, index) {
  const tableData = content.tableData;

  if (!tableData || !tableData.headers || !tableData.rows) {
    createStandardSlide(slide, content, index);
    return;
  }

  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 20;
  const BOTTOM_MARGIN = 15;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // テーブル
  const startY = HEADER_HEIGHT + 15;
  const tableHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN;
  const colCount = Math.min(tableData.headers.length, 6);
  const rowCount = Math.min(tableData.rows.length + 1, 8);
  const colWidth = (PAGE_WIDTH - CONTENT_PADDING * 2) / colCount;
  const rowHeight = tableHeight / rowCount;

  // ヘッダー行
  tableData.headers.slice(0, colCount).forEach((headerText, i) => {
    const x = CONTENT_PADDING + (i * colWidth);
    const cell = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, x, startY, colWidth - 2, rowHeight - 2);
    cell.getFill().setSolidFill(COLORS.navy);
    cell.getBorder().setTransparent();

    const cellText = slide.insertTextBox(headerText, x + 4, startY + 4, colWidth - 10, rowHeight - 10);
    cellText.getText().getTextStyle()
      .setFontSize(12)
      .setBold(true)
      .setForegroundColor(COLORS.white)
      .setFontFamily(FONTS.title);
    cellText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  });

  // データ行
  tableData.rows.slice(0, rowCount - 1).forEach((row, rowIndex) => {
    const y = startY + ((rowIndex + 1) * rowHeight);
    const bgColor = rowIndex % 2 === 0 ? COLORS.offWhite : COLORS.white;

    row.slice(0, colCount).forEach((cellValue, colIndex) => {
      const x = CONTENT_PADDING + (colIndex * colWidth);
      const cell = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, x, y, colWidth - 2, rowHeight - 2);
      cell.getFill().setSolidFill(bgColor);
      cell.getBorder().setTransparent();

      const cellText = slide.insertTextBox(cellValue || '', x + 4, y + 4, colWidth - 10, rowHeight - 10);
      cellText.getText().getTextStyle()
        .setFontSize(12)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);
      cellText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    });
  });

  // サイドバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================
// 縦型フロースライド
// ============================================

function createVerticalFlowSlide(slide, content, index) {
  const flowSteps = Array.isArray(content.flow) ? content.flow.filter(f => f && f.title) : [];

  if (flowSteps.length === 0) {
    createStandardSlide(slide, content, index);
    return;
  }

  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 30;
  const BOTTOM_MARGIN = 15;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // 縦型フロー
  const stepCount = Math.min(flowSteps.length, 6);
  const startY = HEADER_HEIGHT + 15;
  const flowHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN;
  const stepHeight = (flowHeight - (stepCount - 1) * 15) / stepCount;
  const stepWidth = 500;
  const startX = (PAGE_WIDTH - stepWidth) / 2;

  const stepColors = ['#337ab7', '#4a8bc2', '#6ba3d6', '#8dbde8', '#afd4f2', '#c5e1f7'];

  flowSteps.slice(0, 6).forEach((step, i) => {
    const y = startY + (i * (stepHeight + 15));

    // ステップ番号
    const numCircle = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, startX - 35, y + stepHeight / 2 - 12, 24, 24);
    numCircle.getFill().setSolidFill(stepColors[i % stepColors.length]);
    numCircle.getBorder().setTransparent();
    numCircle.getText().setText(String(i + 1));
    numCircle.getText().getTextStyle()
      .setFontSize(11)
      .setBold(true)
      .setForegroundColor(COLORS.white);
    numCircle.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    // ステップボックス
    const stepBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, startX, y, stepWidth, stepHeight);
    stepBox.getFill().setSolidFill(COLORS.offWhite);
    stepBox.getBorder().setTransparent();

    // タイトル
    const stepTitle = slide.insertTextBox(step.title, startX + 15, y + 8, stepWidth - 30, 22);
    stepTitle.getText().getTextStyle()
      .setFontSize(12)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);

    // 説明
    if (step.description) {
      const descBox = slide.insertTextBox(step.description, startX + 15, y + 32, stepWidth - 30, stepHeight - 40);
      descBox.getText().getTextStyle()
        .setFontSize(10)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);
    }

    // 矢印（最後以外）
    if (i < stepCount - 1) {
      const arrowY = y + stepHeight + 2;
      const arrow = slide.insertTextBox('↓', PAGE_WIDTH / 2 - 10, arrowY, 20, 15);
      arrow.getText().getTextStyle()
        .setFontSize(12)
        .setBold(true)
        .setForegroundColor(COLORS.blue);
    }
  });

  // サイドバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================
// グリッドスライド
// ============================================

function createGridSlide(slide, content, index) {
  const gridItems = Array.isArray(content.grid) ? content.grid.filter(g => g && g.title) : [];

  if (gridItems.length === 0) {
    createStandardSlide(slide, content, index);
    return;
  }

  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 20;
  const BOTTOM_MARGIN = 15;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // グリッド
  const itemCount = Math.min(gridItems.length, 9);
  const cols = itemCount <= 3 ? itemCount : (itemCount <= 6 ? 3 : 3);
  const rows = Math.ceil(itemCount / cols);
  const startY = HEADER_HEIGHT + 15;
  const gridHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN;
  const cellWidth = (PAGE_WIDTH - CONTENT_PADDING * 2 - (cols - 1) * 10) / cols;
  const cellHeight = (gridHeight - (rows - 1) * 10) / rows;

  const itemColors = ['#337ab7', '#4a8bc2', '#6ba3d6', '#28a745', '#f5a623', '#dc3545', '#8dbde8', '#6c757d', '#17a2b8'];

  gridItems.slice(0, 9).forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = CONTENT_PADDING + col * (cellWidth + 10);
    const y = startY + row * (cellHeight + 10);

    // セル背景
    const cell = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, y, cellWidth, cellHeight);
    cell.getFill().setSolidFill(COLORS.offWhite);
    cell.getBorder().setTransparent();

    // 上部カラーバー
    const colorBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, x, y, cellWidth, 4);
    colorBar.getFill().setSolidFill(itemColors[i % itemColors.length]);
    colorBar.getBorder().setTransparent();

    let currentY = y + 12;

    // アイコン
    if (item.icon) {
      const iconBox = slide.insertTextBox(item.icon, x + cellWidth / 2 - 15, currentY, 30, 30);
      iconBox.getText().getTextStyle()
        .setFontSize(22)
        .setForegroundColor(itemColors[i % itemColors.length]);
      iconBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
      currentY += 35;
    }

    // タイトル
    const itemTitle = slide.insertTextBox(item.title, x + 8, currentY, cellWidth - 16, 25);
    itemTitle.getText().getTextStyle()
      .setFontSize(11)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);
    itemTitle.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    currentY += 28;

    // 説明
    if (item.description) {
      const descBox = slide.insertTextBox(item.description, x + 8, currentY, cellWidth - 16, cellHeight - currentY + y - 10);
      descBox.getText().getTextStyle()
        .setFontSize(9)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);
      descBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  });

  // サイドバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================
// ベン図スライド
// ============================================

function createVennSlide(slide, content, index) {
  const venn = content.venn;

  if (!venn || (!venn.left && !venn.right)) {
    createStandardSlide(slide, content, index);
    return;
  }

  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 20;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // ベン図 - サイズ拡大
  const centerY = (PAGE_HEIGHT + HEADER_HEIGHT) / 2;
  const circleSize = 260;
  const overlap = 80;

  // 左の円
  const leftCircle = slide.insertShape(SlidesApp.ShapeType.ELLIPSE,
    PAGE_WIDTH / 2 - circleSize + overlap / 2, centerY - circleSize / 2, circleSize, circleSize);
  leftCircle.getFill().setSolidFill('#337ab7');
  leftCircle.getBorder().setTransparent();
  leftCircle.setContentAlignment(SlidesApp.ContentAlignment.TOP);

  // 右の円
  const rightCircle = slide.insertShape(SlidesApp.ShapeType.ELLIPSE,
    PAGE_WIDTH / 2 - overlap / 2, centerY - circleSize / 2, circleSize, circleSize);
  rightCircle.getFill().setSolidFill('#28a745');
  rightCircle.getBorder().setTransparent();

  // 左のラベル
  if (venn.left && venn.left.title) {
    const leftLabel = slide.insertTextBox(venn.left.title, PAGE_WIDTH / 2 - circleSize + overlap / 2, centerY - 50, circleSize - overlap, 30);
    leftLabel.getText().getTextStyle()
      .setFontSize(12)
      .setBold(true)
      .setForegroundColor(COLORS.white)
      .setFontFamily(FONTS.title);
    leftLabel.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    if (venn.left.items && venn.left.items.length > 0) {
      const leftItems = slide.insertTextBox(venn.left.items.slice(0, 3).join('\n'),
        PAGE_WIDTH / 2 - circleSize + overlap / 2 + 10, centerY - 15, circleSize - overlap - 20, 80);
      leftItems.getText().getTextStyle()
        .setFontSize(9)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.body);
      leftItems.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  }

  // 右のラベル
  if (venn.right && venn.right.title) {
    const rightLabel = slide.insertTextBox(venn.right.title, PAGE_WIDTH / 2 + overlap / 2, centerY - 50, circleSize - overlap, 30);
    rightLabel.getText().getTextStyle()
      .setFontSize(12)
      .setBold(true)
      .setForegroundColor(COLORS.white)
      .setFontFamily(FONTS.title);
    rightLabel.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    if (venn.right.items && venn.right.items.length > 0) {
      const rightItems = slide.insertTextBox(venn.right.items.slice(0, 3).join('\n'),
        PAGE_WIDTH / 2 + overlap / 2 + 10, centerY - 15, circleSize - overlap - 20, 80);
      rightItems.getText().getTextStyle()
        .setFontSize(9)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.body);
      rightItems.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  }

  // 中央（共通部分）
  if (venn.center && venn.center.title) {
    const centerLabel = slide.insertTextBox(venn.center.title, PAGE_WIDTH / 2 - 40, centerY - 40, 80, 25);
    centerLabel.getText().getTextStyle()
      .setFontSize(10)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);
    centerLabel.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    if (venn.center.items && venn.center.items.length > 0) {
      const centerItems = slide.insertTextBox(venn.center.items.slice(0, 2).join('\n'),
        PAGE_WIDTH / 2 - 40, centerY - 10, 80, 50);
      centerItems.getText().getTextStyle()
        .setFontSize(8)
        .setForegroundColor(COLORS.navy)
        .setFontFamily(FONTS.body);
      centerItems.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  }

  // サイドバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================
// ツリー図スライド
// ============================================

function createTreeSlide(slide, content, index) {
  const tree = content.tree;

  if (!tree || !tree.title) {
    createStandardSlide(slide, content, index);
    return;
  }

  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 20;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // ツリー図（シンプルな2階層）
  const startY = HEADER_HEIGHT + 30;
  const rootWidth = 150;
  const rootHeight = 45;
  const rootX = PAGE_WIDTH / 2 - rootWidth / 2;

  // ルートノード
  const rootBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, rootX, startY, rootWidth, rootHeight);
  rootBox.getFill().setSolidFill(COLORS.navy);
  rootBox.getBorder().setTransparent();

  const rootText = slide.insertTextBox(tree.title, rootX + 10, startY + 10, rootWidth - 20, rootHeight - 20);
  rootText.getText().getTextStyle()
    .setFontSize(12)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);
  rootText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // 子ノード
  if (tree.children && Array.isArray(tree.children) && tree.children.length > 0) {
    const childCount = Math.min(tree.children.length, 5);
    const childWidth = 120;
    const childHeight = 40;
    const childY = startY + rootHeight + 50;
    const totalWidth = childCount * childWidth + (childCount - 1) * 15;
    const startX = PAGE_WIDTH / 2 - totalWidth / 2;

    const childColors = ['#337ab7', '#4a8bc2', '#6ba3d6', '#8dbde8', '#afd4f2'];

    // 接続線（縦）
    const lineV = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, PAGE_WIDTH / 2 - 1, startY + rootHeight, 2, 25);
    lineV.getFill().setSolidFill(COLORS.gray);
    lineV.getBorder().setTransparent();

    // 接続線（横）
    const lineH = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, startX + childWidth / 2, startY + rootHeight + 25, totalWidth - childWidth, 2);
    lineH.getFill().setSolidFill(COLORS.gray);
    lineH.getBorder().setTransparent();

    tree.children.slice(0, 5).forEach((child, i) => {
      const x = startX + i * (childWidth + 15);

      // 接続線（縦）
      const lineVC = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, x + childWidth / 2 - 1, startY + rootHeight + 25, 2, 25);
      lineVC.getFill().setSolidFill(COLORS.gray);
      lineVC.getBorder().setTransparent();

      // 子ノード
      const childBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, childY, childWidth, childHeight);
      childBox.getFill().setSolidFill(childColors[i % childColors.length]);
      childBox.getBorder().setTransparent();

      const childText = slide.insertTextBox(child.title || '', x + 5, childY + 8, childWidth - 10, childHeight - 16);
      childText.getText().getTextStyle()
        .setFontSize(10)
        .setBold(true)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.title);
      childText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

      // 孫ノード（あれば）
      if (child.children && Array.isArray(child.children) && child.children.length > 0) {
        const grandChildY = childY + childHeight + 30;
        const gcCount = Math.min(child.children.length, 3);
        const gcWidth = 90;
        const gcStartX = x + childWidth / 2 - (gcCount * gcWidth + (gcCount - 1) * 5) / 2;

        child.children.slice(0, 3).forEach((gc, j) => {
          const gcX = gcStartX + j * (gcWidth + 5);
          const gcBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, gcX, grandChildY, gcWidth, 30);
          gcBox.getFill().setSolidFill(COLORS.lightGray);
          gcBox.getBorder().setTransparent();

          const gcText = slide.insertTextBox(gc.title || '', gcX + 5, grandChildY + 6, gcWidth - 10, 20);
          gcText.getText().getTextStyle()
            .setFontSize(8)
            .setForegroundColor(COLORS.navy)
            .setFontFamily(FONTS.body);
          gcText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
        });
      }
    });
  }

  // サイドバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================
// Q&Aスライド
// ============================================

function createQASlide(slide, content, index) {
  const qaItems = Array.isArray(content.qaItems) ? content.qaItems.filter(q => q && q.question) : [];

  if (qaItems.length === 0) {
    createStandardSlide(slide, content, index);
    return;
  }

  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 25;
  const BOTTOM_MARGIN = 15;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  const titleBox = slide.insertTextBox(content.title || 'Q&A', CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // Q&A
  const itemCount = Math.min(qaItems.length, 4);
  const startY = HEADER_HEIGHT + 15;
  const qaHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN;
  const itemHeight = qaHeight / itemCount;

  qaItems.slice(0, 4).forEach((qa, i) => {
    const y = startY + (i * itemHeight);

    // Q
    const qLabel = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, CONTENT_PADDING, y + 5, 28, 28);
    qLabel.getFill().setSolidFill(COLORS.blue);
    qLabel.getBorder().setTransparent();
    qLabel.getText().setText('Q');
    qLabel.getText().getTextStyle()
      .setFontSize(14)
      .setBold(true)
      .setForegroundColor(COLORS.white);
    qLabel.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    const qText = slide.insertTextBox(qa.question, CONTENT_PADDING + 38, y + 8, PAGE_WIDTH - CONTENT_PADDING * 2 - 45, 25);
    qText.getText().getTextStyle()
      .setFontSize(11)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);

    // A
    const aLabel = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, CONTENT_PADDING, y + 38, 28, 28);
    aLabel.getFill().setSolidFill(COLORS.green);
    aLabel.getBorder().setTransparent();
    aLabel.getText().setText('A');
    aLabel.getText().getTextStyle()
      .setFontSize(14)
      .setBold(true)
      .setForegroundColor(COLORS.white);
    aLabel.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    const aText = slide.insertTextBox(qa.answer || '', CONTENT_PADDING + 38, y + 40, PAGE_WIDTH - CONTENT_PADDING * 2 - 45, itemHeight - 50);
    aText.getText().getTextStyle()
      .setFontSize(10)
      .setForegroundColor(COLORS.darkGray)
      .setFontFamily(FONTS.body);
  });

  // サイドバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// ============================================
// 事例紹介スライド
// ============================================

function createCaseStudySlide(slide, content, index) {
  const caseStudy = content.caseStudy;

  if (!caseStudy || (!caseStudy.challenge && !caseStudy.solution && !caseStudy.result)) {
    createStandardSlide(slide, content, index);
    return;
  }

  const HEADER_HEIGHT = 55;
  const CONTENT_PADDING = 20;
  const BOTTOM_MARGIN = 15;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  let headerTitle = content.title || '事例紹介';
  if (caseStudy.company) {
    headerTitle = caseStudy.company + ' - ' + headerTitle;
  }

  const titleBox = slide.insertTextBox(headerTitle, CONTENT_PADDING, 12, PAGE_WIDTH - 90, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  addSlideNumber(slide, index);

  // 事例セクション
  const sections = [
    { label: '課題', content: caseStudy.challenge, color: COLORS.red },
    { label: '解決策', content: caseStudy.solution, color: COLORS.blue },
    { label: '成果', content: caseStudy.result, color: COLORS.green }
  ].filter(s => s.content);

  const startY = HEADER_HEIGHT + 15;
  const sectionHeight = (PAGE_HEIGHT - startY - BOTTOM_MARGIN) / sections.length;

  sections.forEach((section, i) => {
    const y = startY + (i * sectionHeight);

    // ラベル
    const labelBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, CONTENT_PADDING, y + 5, 60, 28);
    labelBox.getFill().setSolidFill(section.color);
    labelBox.getBorder().setTransparent();
    labelBox.getText().setText(section.label);
    labelBox.getText().getTextStyle()
      .setFontSize(11)
      .setBold(true)
      .setForegroundColor(COLORS.white);
    labelBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    // 内容
    const contentBox = slide.insertTextBox(section.content, CONTENT_PADDING + 75, y + 8, PAGE_WIDTH - CONTENT_PADDING * 2 - 80, sectionHeight - 20);
    contentBox.getText().getTextStyle()
      .setFontSize(11)
      .setForegroundColor(COLORS.darkGray)
      .setFontFamily(FONTS.body);
  });

  // サイドバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

// レスポンス生成
// ============================================

function createHtmlResponse(success, error, slideUrl) {
  const closeScript = `
    function closeWindow() {
      try {
        if (window.opener) {
          window.opener.postMessage({ type: 'closePopup' }, '*');
        }
      } catch(e) {}
      try { window.close(); } catch(e) {}
      setTimeout(function() {
        var container = document.querySelector('.container');
        if (container) {
          container.innerHTML = '<div style="color:#38a169;font-size:60px;margin-bottom:20px;">✓</div><h1 style="color:#1a365d;margin-bottom:10px;font-size:24px;">完了</h1><p style="color:#718096;font-size:16px;">右上の×ボタンでこのタブを閉じてください</p>';
        }
      }, 300);
    }
  `;

  let html;
  if (success && slideUrl) {
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SlideAI</title>
<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:linear-gradient(135deg,#1a365d,#2c5282)}.container{text-align:center;background:white;padding:50px;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3)}.success{color:#38a169;font-size:60px;margin-bottom:20px}h1{color:#1a365d;margin-bottom:10px;font-size:24px}p{color:#718096;margin-bottom:25px}a{display:inline-block;background:linear-gradient(135deg,#3182ce,#2c5282);color:white;padding:15px 35px;border-radius:10px;text-decoration:none;font-weight:bold;transition:transform 0.2s}a:hover{transform:scale(1.05)}.close{margin-top:25px;color:#a0aec0;cursor:pointer;font-size:14px;text-decoration:underline}</style></head>
<body><div class="container"><div class="success">✓</div><h1>スライド生成完了</h1><p>プレゼンテーションが作成されました</p><a href="${slideUrl}" target="_blank">スライドを開く</a><p class="close" onclick="closeWindow()">このウィンドウを閉じる</p></div>
<script>${closeScript}if(window.opener){window.opener.postMessage({type:'slideGenerated',success:true,slideUrl:'${slideUrl}'},'*')}</script></body></html>`;
  } else {
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SlideAI - Error</title>
<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fef2f2}.container{text-align:center;background:white;padding:50px;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.1)}.error{color:#e53e3e;font-size:60px;margin-bottom:20px}h1{color:#c53030;margin-bottom:10px}p{color:#718096;margin-bottom:20px}.close{color:#a0aec0;cursor:pointer;text-decoration:underline}</style></head>
<body><div class="container"><div class="error">✕</div><h1>エラー</h1><p>${error || 'スライドの生成に失敗しました'}</p><p class="close" onclick="closeWindow()">閉じる</p></div>
<script>${closeScript}if(window.opener){window.opener.postMessage({type:'slideGenerated',success:false,error:'${error||'Unknown error'}'},'*')}</script></body></html>`;
  }
  return HtmlService.createHtmlOutput(html);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// テスト用
// ============================================

function testCreatePresentation() {
  const testData = {
    title: 'デジタルトランスフォーメーション戦略',
    subtitle: '2024年度 経営企画部',
    slides: [
      {
        layout: 'section',
        title: '現状分析',
        message: 'デジタル化の遅れが競争力低下の主因'
      },
      {
        layout: 'stats',
        title: '市場環境の変化',
        message: 'デジタル市場は急速に拡大している',
        stats: [
          { value: '35%', label: 'DX投資増加率\n（前年比）' },
          { value: '72%', label: '企業のクラウド\n導入率' },
          { value: '¥5.2兆', label: '国内DX市場\n規模' }
        ]
      },
      {
        layout: 'flow',
        title: 'DX推進プロセス',
        flow: [
          { title: '現状分析', description: '業務プロセスの\n可視化と課題抽出' },
          { title: '戦略策定', description: 'ロードマップと\nKPI設定' },
          { title: '基盤構築', description: 'クラウド環境と\nデータ基盤整備' },
          { title: '導入展開', description: 'パイロット導入と\n全社展開' }
        ]
      },
      {
        layout: 'pyramid',
        title: 'DX成熟度モデル',
        pyramid: [
          { title: 'レベル5: 最適化', description: 'AI/MLによる自律最適化' },
          { title: 'レベル4: 予測', description: 'データドリブン意思決定' },
          { title: 'レベル3: 統合', description: 'システム間連携・データ統合' },
          { title: 'レベル2: デジタル化', description: '紙業務のデジタル移行' },
          { title: 'レベル1: 基礎', description: 'IT基盤整備' }
        ]
      },
      {
        layout: 'matrix',
        title: '施策優先度マトリクス',
        matrix: {
          xAxisLabel: '実現可能性 →',
          yAxisLabel: '効果 ↑',
          topLeft: { title: '優先実施', description: '効果高・実現容易\nすぐに着手すべき施策' },
          topRight: { title: '計画的推進', description: '効果高・実現困難\n中長期で取り組む施策' },
          bottomLeft: { title: 'クイックウィン', description: '効果低・実現容易\n余力があれば実施' },
          bottomRight: { title: '要検討', description: '効果低・実現困難\n優先度を下げる' }
        }
      },
      {
        layout: 'parallel',
        title: '推進体制',
        parallel: [
          {
            title: '経営層',
            icon: '👔',
            description: 'DX戦略の承認と\nリソース確保',
            bullets: ['ビジョン策定', '投資判断', 'KPIモニタリング']
          },
          {
            title: 'DX推進室',
            icon: '🚀',
            description: '全社DXの\n企画・推進',
            bullets: ['ロードマップ管理', '技術選定', '人材育成']
          },
          {
            title: '事業部門',
            icon: '💼',
            description: '現場での\n導入・活用',
            bullets: ['要件定義', 'ユーザーテスト', '業務改善']
          },
          {
            title: 'IT部門',
            icon: '💻',
            description: '技術基盤の\n構築・運用',
            bullets: ['インフラ整備', 'セキュリティ', 'サポート']
          }
        ]
      },
      {
        layout: 'comparison',
        title: 'DX推進による変化',
        comparison: {
          beforeTitle: '現状',
          beforeItems: ['紙ベースの業務プロセス', '属人的なノウハウ', '部門間のサイロ化'],
          afterTitle: 'DX後',
          afterItems: ['デジタルワークフロー', 'ナレッジの可視化', 'データ統合基盤']
        }
      },
      {
        layout: 'summary',
        title: 'まとめ',
        message: 'DXは選択ではなく必須の経営課題',
        bullets: [
          'デジタル投資を3年で2倍に拡大',
          '全社員のデジタルリテラシー向上',
          'データドリブン経営への転換'
        ]
      }
    ]
  };

  const result = createPresentation(testData);
  console.log('Created:', result.url);
}

// ============================================
// レイアウトカタログ生成
// ============================================

function generateLayoutCatalog() {
  const catalogData = {
    title: 'SlideAI レイアウトカタログ',
    subtitle: '全22種類のスライドレイアウト一覧',
    slides: [
      // 1. section
      {
        layout: 'section',
        title: '① section（セクション）',
        message: 'プレゼンの区切りや章タイトルに使用。大きなタイトルと補足メッセージで構成。'
      },
      // 2. standard
      {
        layout: 'standard',
        title: '② standard（標準）',
        message: '最も基本的なレイアウト。タイトル、メッセージ、箇条書きで構成。',
        bullets: ['箇条書き項目1：説明テキスト', '箇条書き項目2：説明テキスト', '箇条書き項目3：説明テキスト']
      },
      // 3. twoColumn
      {
        layout: 'twoColumn',
        title: '③ twoColumn（2カラム）',
        message: '左右2列で情報を対比・整理。各カラムに見出しと箇条書き。',
        leftColumn: { title: '左カラム', bullets: ['項目A-1', '項目A-2', '項目A-3'] },
        rightColumn: { title: '右カラム', bullets: ['項目B-1', '項目B-2', '項目B-3'] }
      },
      // 4. threeColumn (standardで代用されるが概念として)
      {
        layout: 'standard',
        title: '④ threeColumn（3カラム）',
        message: '3列構成で複数の要素を並列表示。比較や選択肢の提示に最適。',
        bullets: ['カラム1：オプションA', 'カラム2：オプションB', 'カラム3：オプションC']
      },
      // 5. stats
      {
        layout: 'stats',
        title: '⑤ stats（統計・数値）',
        message: '大きな数字で成果やKPIを視覚的にアピール。',
        stats: [
          { value: '150%', label: '売上成長率' },
          { value: '50万', label: '新規顧客数' },
          { value: '98%', label: '顧客満足度' }
        ]
      },
      // 6. comparison
      {
        layout: 'comparison',
        title: '⑥ comparison（比較）',
        message: 'Before/After形式で変化を明確に表現。',
        comparison: {
          beforeTitle: 'Before（導入前）',
          beforeItems: ['手作業での処理', '時間がかかる', 'ミスが発生'],
          afterTitle: 'After（導入後）',
          afterItems: ['自動化処理', '時間短縮', '精度向上']
        }
      },
      // 7. quote
      {
        layout: 'quote',
        title: '⑦ quote（引用）',
        quote: '優れたプレゼンテーションは、複雑なアイデアをシンプルに伝える力を持っている。',
        source: '著名なビジネスリーダー'
      },
      // 8. summary
      {
        layout: 'summary',
        title: '⑧ summary（まとめ）',
        message: 'プレゼンの締めくくりに使用。重要ポイントを整理。',
        bullets: ['重要ポイント1：本日の結論', '重要ポイント2：次のアクション', '重要ポイント3：期待される成果']
      },
      // 9. flow
      {
        layout: 'flow',
        title: '⑨ flow（フロー・横）',
        message: '左から右へのプロセスや手順を表現。',
        flow: [
          { title: 'Step 1', description: '企画立案' },
          { title: 'Step 2', description: '設計開発' },
          { title: 'Step 3', description: 'テスト' },
          { title: 'Step 4', description: 'リリース' }
        ]
      },
      // 10. verticalFlow
      {
        layout: 'verticalFlow',
        title: '⑩ verticalFlow（フロー・縦）',
        message: '上から下へのプロセスを表現。',
        flow: [
          { title: '第1段階', description: '要件定義と分析' },
          { title: '第2段階', description: '設計と開発' },
          { title: '第3段階', description: '運用と改善' }
        ]
      },
      // 11. pyramid
      {
        layout: 'pyramid',
        title: '⑪ pyramid（ピラミッド）',
        message: '階層構造や優先順位を視覚化。',
        pyramid: [
          { title: 'ビジョン', description: '最上位の目標' },
          { title: '戦略', description: '達成への道筋' },
          { title: '戦術', description: '具体的な施策' },
          { title: '実行', description: '日々のアクション' }
        ]
      },
      // 12. matrix
      {
        layout: 'matrix',
        title: '⑫ matrix（マトリクス）',
        message: '2x2の4象限で分類・分析。',
        matrix: {
          topLeft: { title: '高優先・低コスト', description: '即座に実行' },
          topRight: { title: '高優先・高コスト', description: '計画的に実行' },
          bottomLeft: { title: '低優先・低コスト', description: '余裕があれば' },
          bottomRight: { title: '低優先・高コスト', description: '見送り検討' }
        }
      },
      // 13. parallel
      {
        layout: 'parallel',
        title: '⑬ parallel（並列）',
        message: '複数の要素を均等に並べて表示。',
        parallel: [
          { title: '製品A', description: '高機能モデル' },
          { title: '製品B', description: 'スタンダード' },
          { title: '製品C', description: 'エントリー' }
        ]
      },
      // 14. grid
      {
        layout: 'grid',
        title: '⑭ grid（グリッド）',
        message: '複数項目をグリッド状に配置。',
        grid: [
          { title: '機能1', description: 'データ分析' },
          { title: '機能2', description: 'レポート' },
          { title: '機能3', description: '共有' },
          { title: '機能4', description: '連携' }
        ]
      },
      // 15. timeline
      {
        layout: 'timeline',
        title: '⑮ timeline（タイムライン）',
        timeline: [
          { date: '2024年Q1', title: '企画', description: '要件定義' },
          { date: '2024年Q2', title: '開発', description: '実装作業' },
          { date: '2024年Q3', title: 'テスト', description: '品質検証' },
          { date: '2024年Q4', title: 'リリース', description: '本番公開' }
        ]
      },
      // 16. cycle
      {
        layout: 'cycle',
        title: '⑯ cycle（サイクル）',
        message: '繰り返しプロセスを円形で表現。',
        cycle: [
          { title: 'Plan', description: '計画' },
          { title: 'Do', description: '実行' },
          { title: 'Check', description: '評価' },
          { title: 'Act', description: '改善' }
        ]
      },
      // 17. funnel
      {
        layout: 'funnel',
        title: '⑰ funnel（ファネル）',
        message: '段階的な絞り込みを表現。営業・マーケティングに最適。',
        funnel: [
          { title: '認知', value: '10,000人' },
          { title: '興味', value: '3,000人' },
          { title: '検討', value: '500人' },
          { title: '購入', value: '100人' }
        ]
      },
      // 18. table
      {
        layout: 'table',
        title: '⑱ table（テーブル）',
        message: '表形式でデータを整理して表示。',
        tableData: {
          headers: ['項目', '内容', '備考'],
          rows: [
            ['機能A', '基本機能', '標準搭載'],
            ['機能B', '拡張機能', 'オプション'],
            ['機能C', '高度機能', 'プレミアム']
          ]
        }
      },
      // 19. venn
      {
        layout: 'venn',
        title: '⑲ venn（ベン図）',
        message: '2つの要素の関係性と共通点を表現。',
        venn: {
          left: { title: '技術力', items: ['開発スキル', 'システム設計'] },
          right: { title: 'ビジネス力', items: ['市場理解', '顧客対応'] },
          center: { title: '共通', items: ['問題解決力'] }
        }
      },
      // 20. tree
      {
        layout: 'tree',
        title: '⑳ tree（ツリー）',
        message: '組織図や階層構造を表現。',
        tree: {
          title: '経営層',
          children: [
            { title: '営業部門', children: ['国内営業', '海外営業'] },
            { title: '開発部門', children: ['製品開発', '研究開発'] },
            { title: '管理部門', children: ['人事', '経理'] }
          ]
        }
      },
      // 21. qa
      {
        layout: 'qa',
        title: '㉑ qa（Q&A）',
        message: '質問と回答形式で情報を整理。FAQ向け。',
        qaItems: [
          { question: 'Q1. 導入期間は？', answer: '約3ヶ月で本番稼働可能です。' },
          { question: 'Q2. サポート体制は？', answer: '24時間365日対応しています。' },
          { question: 'Q3. 費用は？', answer: '月額10万円からご利用いただけます。' }
        ]
      },
      // 22. caseStudy
      {
        layout: 'caseStudy',
        title: '㉒ caseStudy（事例紹介）',
        caseStudy: {
          company: '株式会社サンプル',
          industry: '製造業',
          challenge: '業務効率化の遅れによる競争力低下',
          solution: 'デジタルツール導入と業務プロセス改革',
          result: '生産性30%向上、コスト20%削減を達成'
        }
      }
    ]
  };

  const result = createPresentation(catalogData);
  console.log('カタログ生成完了:', result.url);
  return result;
}
