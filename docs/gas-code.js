/**
 * SlideAI - Google Apps Script v2.0
 *
 * 複数レイアウト対応・高品質デザイン版
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
        message: 'SlideAI GAS API v2.0 is running',
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
  return 'standard';
}

// ============================================
// タイトルスライド
// ============================================

function createTitleSlide(slide, title, subtitle) {
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

  // タイトル
  const titleBox = slide.insertTextBox(title, 50, PAGE_HEIGHT / 2 - 55, PAGE_WIDTH - 200, 70);
  titleBox.getText().getTextStyle()
    .setFontSize(38)
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
  // 定数
  const CONTENT_PADDING = 50;
  const BOTTOM_MARGIN = 30;

  slide.getBackground().setSolidFill(COLORS.white);

  // タイトル
  const titleBox = slide.insertTextBox('Contents', CONTENT_PADDING, 35, 180, 35);
  titleBox.getText().getTextStyle()
    .setFontSize(26)
    .setBold(true)
    .setForegroundColor(COLORS.navy)
    .setFontFamily(FONTS.title);

  // アクセントライン（Dexallブルー）
  const line = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, CONTENT_PADDING, 75, 50, 3);
  line.getFill().setSolidFill(COLORS.blue);
  line.getBorder().setTransparent();

  // 目次項目（オーバーフロー防止）
  const startY = 95;
  const availableHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN;
  const itemHeight = 32;
  const maxItems = Math.min(slides.length, Math.floor(availableHeight / itemHeight), 8);

  slides.slice(0, maxItems).forEach((content, i) => {
    const y = startY + (i * itemHeight);
    if (y + itemHeight > PAGE_HEIGHT - BOTTOM_MARGIN) return;

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
  const HEADER_HEIGHT = 60;
  const CONTENT_START_Y = 75;
  const CONTENT_PADDING = 30;
  const BOTTOM_MARGIN = 25;
  const AVAILABLE_HEIGHT = PAGE_HEIGHT - CONTENT_START_Y - BOTTOM_MARGIN;

  // ヘッダーエリア（Dexall風 - クリーンなデザイン）
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 15, PAGE_WIDTH - 120, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(20)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号（アクセントカラーの丸背景）
  const numBg = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, PAGE_WIDTH - 50, 15, 30, 30);
  numBg.getFill().setSolidFill(COLORS.blue);
  numBg.getBorder().setTransparent();
  numBg.getText().setText(String(index + 1));
  numBg.getText().getTextStyle()
    .setFontSize(12)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.accent);
  numBg.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // コンテンツ領域の計算
  let hasMessage = Boolean(content.message);
  let hasBody = Boolean(content.body);
  let hasHighlights = Array.isArray(content.highlights) && content.highlights.filter(h => h).length > 0;
  let hasBullets = content.bullets && Array.isArray(content.bullets) && content.bullets.filter(b => b).length > 0;

  // 動的にスペースを配分
  let currentY = CONTENT_START_Y;
  const validBullets = hasBullets ? content.bullets.filter(b => b) : [];
  const bulletCount = validBullets.length;

  // 各セクションの高さを計算
  const messageHeight = hasMessage ? 45 : 0;
  const bodyHeight = hasBody ? 40 : 0;
  const highlightHeight = hasHighlights ? 42 : 0;
  const fixedHeight = messageHeight + bodyHeight + highlightHeight;
  const remainingHeight = AVAILABLE_HEIGHT - fixedHeight;
  const bulletHeight = bulletCount > 0 ? Math.min(Math.floor(remainingHeight / bulletCount), 32) : 0;

  // キーメッセージ
  if (hasMessage) {
    const msgBox = slide.insertTextBox(content.message, CONTENT_PADDING, currentY, PAGE_WIDTH - (CONTENT_PADDING * 2), 35);
    msgBox.getText().getTextStyle()
      .setFontSize(16)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);
    currentY += 40;

    // メッセージ下のアクセントライン（Dexallブルー）
    const msgLine = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, CONTENT_PADDING, currentY - 5, 60, 3);
    msgLine.getFill().setSolidFill(COLORS.blue);
    msgLine.getBorder().setTransparent();
  }

  // 本文
  if (hasBody) {
    const bodyBox = slide.insertTextBox(content.body, CONTENT_PADDING, currentY, PAGE_WIDTH - (CONTENT_PADDING * 2), 35);
    bodyBox.getText().getTextStyle()
      .setFontSize(12)
      .setForegroundColor(COLORS.darkGray)
      .setFontFamily(FONTS.body);
    currentY += 40;
  }

  // ハイライト（数値やキーワード）
  if (hasHighlights) {
    const validHighlights = content.highlights.filter(h => h);
    const hlCount = Math.min(validHighlights.length, 4); // 最大4つまで
    const hlWidth = Math.floor((PAGE_WIDTH - (CONTENT_PADDING * 2) - (hlCount - 1) * 10) / hlCount);

    validHighlights.slice(0, 4).forEach((hl, i) => {
      const hlText = String(hl);
      const hlX = CONTENT_PADDING + (i * (hlWidth + 10));
      const hlBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, hlX, currentY, hlWidth, 32);
      hlBox.getFill().setSolidFill(COLORS.lightGray);
      hlBox.getBorder().setTransparent();
      hlBox.getText().setText(hlText);
      hlBox.getText().getTextStyle()
        .setFontSize(11)
        .setBold(true)
        .setForegroundColor(COLORS.navy)
        .setFontFamily(FONTS.body);
      hlBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    });
    currentY += 42;
  }

  // 箇条書き（オーバーフロー防止）
  if (hasBullets) {
    const maxBullets = Math.min(bulletCount, Math.floor(remainingHeight / 24)); // 最大表示数を計算

    validBullets.slice(0, maxBullets).forEach((bullet, i) => {
      if (currentY + bulletHeight > PAGE_HEIGHT - BOTTOM_MARGIN) return; // オーバーフロー防止

      const bulletText = String(bullet);

      // ドット（Dexallブルー）
      const dot = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, CONTENT_PADDING + 5, currentY + 5, 6, 6);
      dot.getFill().setSolidFill(COLORS.blue);
      dot.getBorder().setTransparent();

      // テキスト
      const bulletBox = slide.insertTextBox(bulletText, CONTENT_PADDING + 20, currentY, PAGE_WIDTH - CONTENT_PADDING - 50, Math.min(bulletHeight, 28));
      bulletBox.getText().getTextStyle()
        .setFontSize(12)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);

      currentY += bulletHeight;
    });
  }

  // 左サイドのアクセントバー（Dexallブルー）
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

  // 定数
  const HEADER_HEIGHT = 60;
  const CONTENT_PADDING = 25;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー（Dexall風）
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 15, PAGE_WIDTH - 100, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(20)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  const numBg = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, PAGE_WIDTH - 50, 15, 30, 30);
  numBg.getFill().setSolidFill(COLORS.blue);
  numBg.getBorder().setTransparent();
  numBg.getText().setText(String(index + 1));
  numBg.getText().getTextStyle()
    .setFontSize(12)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.accent);
  numBg.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  const colGap = 20;
  const colWidth = Math.floor((PAGE_WIDTH - (CONTENT_PADDING * 2) - colGap) / 2);
  const startY = HEADER_HEIGHT + 15;

  // 左カラム
  if (content.leftColumn) {
    createColumnContent(slide, content.leftColumn, CONTENT_PADDING, startY, colWidth);
  }

  // 中央の区切り線
  const dividerX = CONTENT_PADDING + colWidth + (colGap / 2);
  const divider = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, dividerX, startY, 2, PAGE_HEIGHT - startY - 20);
  divider.getFill().setSolidFill(COLORS.lightGray);
  divider.getBorder().setTransparent();

  // 右カラム
  if (content.rightColumn) {
    createColumnContent(slide, content.rightColumn, CONTENT_PADDING + colWidth + colGap, startY, colWidth);
  }

  // 左サイドのアクセントバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, HEADER_HEIGHT, 4, PAGE_HEIGHT - HEADER_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.blue);
  sideBar.getBorder().setTransparent();
}

function createColumnContent(slide, column, x, y, width) {
  if (!column) return;
  let currentY = y;

  // カラムタイトル
  if (column.title) {
    const colTitle = slide.insertTextBox(column.title, x, currentY, width, 25);
    colTitle.getText().getTextStyle()
      .setFontSize(14)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);
    currentY += 30;
  }

  // 箇条書き
  if (column.bullets && Array.isArray(column.bullets)) {
    column.bullets.forEach(bullet => {
      if (!bullet) return;
      const dot = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, x + 5, currentY + 5, 6, 6);
      dot.getFill().setSolidFill(COLORS.blue);
      dot.getBorder().setTransparent();

      const bulletBox = slide.insertTextBox(String(bullet), x + 20, currentY, width - 25, 22);
      bulletBox.getText().getTextStyle()
        .setFontSize(11)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);
      currentY += 24;
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

  // 定数
  const HEADER_HEIGHT = 60;
  const CONTENT_PADDING = 25;

  slide.getBackground().setSolidFill(COLORS.offWhite);

  // ヘッダー（Dexall風）
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING, 15, PAGE_WIDTH - 100, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(20)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  const numBg = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, PAGE_WIDTH - 50, 15, 30, 30);
  numBg.getFill().setSolidFill(COLORS.blue);
  numBg.getBorder().setTransparent();
  numBg.getText().setText(String(index + 1));
  numBg.getText().getTextStyle()
    .setFontSize(12)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.accent);
  numBg.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  let startY = HEADER_HEIGHT + 15;

  // メッセージ
  if (content.message) {
    const msgBox = slide.insertTextBox(content.message, CONTENT_PADDING, startY, PAGE_WIDTH - (CONTENT_PADDING * 2), 30);
    msgBox.getText().getTextStyle()
      .setFontSize(14)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);
    startY += 40;
  }

  // カード配置
  const cardGap = 15;
  const totalGap = (cardCount - 1) * cardGap;
  const cardWidth = Math.floor((PAGE_WIDTH - (CONTENT_PADDING * 2) - totalGap) / cardCount);
  const cardHeight = 130;

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
    const valueBox = slide.insertTextBox(statValue, x + 8, startY + 20, cardWidth - 16, 45);
    valueBox.getText().getTextStyle()
      .setFontSize(28)
      .setBold(true)
      .setForegroundColor(cardColors[i % cardColors.length])
      .setFontFamily(FONTS.accent);
    valueBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    // ラベル
    if (statLabel) {
      const labelBox = slide.insertTextBox(statLabel, x + 8, startY + 70, cardWidth - 16, 50);
      labelBox.getText().getTextStyle()
        .setFontSize(11)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);
      labelBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  });

  // 補足（箇条書き - オーバーフロー防止）
  if (Array.isArray(content.bullets) && content.bullets.length > 0) {
    const validBullets = content.bullets.filter(b => b);
    if (validBullets.length > 0) {
      const noteY = startY + cardHeight + 15;
      if (noteY < PAGE_HEIGHT - 30) {
        const noteText = validBullets.slice(0, 2).map(b => `• ${String(b)}`).join('　');
        const noteBox = slide.insertTextBox(noteText, CONTENT_PADDING, noteY, PAGE_WIDTH - (CONTENT_PADDING * 2), 25);
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

  // 定数
  const HEADER_HEIGHT = 60;
  const CONTENT_PADDING = 20;
  const BOTTOM_MARGIN = 20;

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー（Dexall風）
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', CONTENT_PADDING + 5, 15, PAGE_WIDTH - 100, 32);
  titleBox.getText().getTextStyle()
    .setFontSize(20)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  const colGap = 30;
  const colWidth = Math.floor((PAGE_WIDTH - (CONTENT_PADDING * 2) - colGap) / 2);
  const startY = HEADER_HEIGHT + 15;
  const contentHeight = PAGE_HEIGHT - startY - BOTTOM_MARGIN;

  // Before/左側（薄いグレー背景）
  const leftBg = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, CONTENT_PADDING, startY, colWidth, contentHeight);
  leftBg.getFill().setSolidFill(COLORS.lightGray);
  leftBg.getBorder().setTransparent();

  const leftTitle = slide.insertTextBox(comp.beforeTitle || 'Before', CONTENT_PADDING + 15, startY + 12, colWidth - 30, 25);
  leftTitle.getText().getTextStyle()
    .setFontSize(14)
    .setBold(true)
    .setForegroundColor(COLORS.red)
    .setFontFamily(FONTS.title);

  if (comp.beforeItems && Array.isArray(comp.beforeItems)) {
    const itemHeight = 26;
    const maxItems = Math.min(comp.beforeItems.length, Math.floor((contentHeight - 50) / itemHeight));
    let y = startY + 45;
    comp.beforeItems.slice(0, maxItems).forEach(item => {
      if (!item || y + itemHeight > PAGE_HEIGHT - BOTTOM_MARGIN) return;
      const itemText = '✕ ' + String(item);
      const itemBox = slide.insertTextBox(itemText, CONTENT_PADDING + 15, y, colWidth - 30, 22);
      itemBox.getText().getTextStyle()
        .setFontSize(11)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);
      y += itemHeight;
    });
  }

  // 矢印（中央）
  const arrowX = CONTENT_PADDING + colWidth + (colGap / 2) - 12;
  const arrow = slide.insertTextBox('→', arrowX, PAGE_HEIGHT / 2 - 15, 24, 30);
  arrow.getText().getTextStyle()
    .setFontSize(22)
    .setBold(true)
    .setForegroundColor(COLORS.blue)
    .setFontFamily(FONTS.accent);

  // After/右側（ネイビー背景）
  const rightX = CONTENT_PADDING + colWidth + colGap;
  const rightBg = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, rightX, startY, colWidth, contentHeight);
  rightBg.getFill().setSolidFill(COLORS.navy);
  rightBg.getBorder().setTransparent();

  const rightTitle = slide.insertTextBox(comp.afterTitle || 'After', rightX + 15, startY + 12, colWidth - 30, 25);
  rightTitle.getText().getTextStyle()
    .setFontSize(14)
    .setBold(true)
    .setForegroundColor(COLORS.green)
    .setFontFamily(FONTS.title);

  if (comp.afterItems && Array.isArray(comp.afterItems)) {
    const itemHeight = 26;
    const maxItems = Math.min(comp.afterItems.length, Math.floor((contentHeight - 50) / itemHeight));
    let y = startY + 45;
    comp.afterItems.slice(0, maxItems).forEach(item => {
      if (!item || y + itemHeight > PAGE_HEIGHT - BOTTOM_MARGIN) return;
      const itemText = '✓ ' + String(item);
      const itemBox = slide.insertTextBox(itemText, rightX + 15, y, colWidth - 30, 22);
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
  const quoteOpen = slide.insertTextBox('"', 50, 80, 80, 100);
  quoteOpen.getText().getTextStyle()
    .setFontSize(120)
    .setBold(true)
    .setForegroundColor(COLORS.darkBlue)
    .setFontFamily('Georgia');

  // 引用文
  const quoteText = content.quote || content.message || content.title || '　';
  const quoteBox = slide.insertTextBox(quoteText, 80, 140, PAGE_WIDTH - 160, 150);
  if (quoteText.trim()) {
    quoteBox.getText().getTextStyle()
      .setFontSize(24)
      .setItalic(true)
      .setForegroundColor(COLORS.white)
      .setFontFamily(FONTS.body);
  }

  // 出典
  if (content.source) {
    const sourceBox = slide.insertTextBox('— ' + content.source, 80, PAGE_HEIGHT - 80, PAGE_WIDTH - 160, 30);
    sourceBox.getText().getTextStyle()
      .setFontSize(14)
      .setForegroundColor(COLORS.lightBlue)
      .setFontFamily(FONTS.body);
  }

  // スライド番号
  const numBox = slide.insertTextBox(String(index + 1), PAGE_WIDTH - 50, PAGE_HEIGHT - 40, 30, 30);
  numBox.getText().getTextStyle()
    .setFontSize(12)
    .setForegroundColor(COLORS.gray)
    .setFontFamily(FONTS.accent);
}

// ============================================
// まとめスライド
// ============================================

function createSummarySlide(slide, content, index) {
  // Dexall風ダークネイビー背景
  slide.getBackground().setSolidFill(COLORS.navy);

  // 定数
  const CONTENT_PADDING = 50;
  const BOTTOM_MARGIN = 40;

  // 装飾：右上の円
  const decorCircle = slide.insertShape(SlidesApp.ShapeType.ELLIPSE,
    PAGE_WIDTH - 120, -40, 200, 200);
  decorCircle.getFill().setSolidFill(COLORS.darkBlue);
  decorCircle.getBorder().setTransparent();
  decorCircle.sendToBack();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || 'まとめ', CONTENT_PADDING, 35, PAGE_WIDTH - (CONTENT_PADDING * 2), 45);
  titleBox.getText().getTextStyle()
    .setFontSize(28)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // アクセントライン（Dexallブルー）
  const line = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, CONTENT_PADDING, 85, 60, 3);
  line.getFill().setSolidFill(COLORS.blue);
  line.getBorder().setTransparent();

  let currentY = 100;

  // キーメッセージ
  if (content.message) {
    const msgBox = slide.insertTextBox(content.message, CONTENT_PADDING, currentY, PAGE_WIDTH - (CONTENT_PADDING * 2), 40);
    msgBox.getText().getTextStyle()
      .setFontSize(15)
      .setBold(true)
      .setForegroundColor(COLORS.lightBlue)
      .setFontFamily(FONTS.title);
    currentY += 50;
  }

  // ポイント（番号付き）- オーバーフロー防止
  if (content.bullets && Array.isArray(content.bullets) && content.bullets.length > 0) {
    const validBullets = content.bullets.filter(b => b);
    const availableHeight = PAGE_HEIGHT - currentY - BOTTOM_MARGIN;
    const bulletHeight = 38;
    const maxBullets = Math.min(validBullets.length, Math.floor(availableHeight / bulletHeight));

    validBullets.slice(0, maxBullets).forEach((bullet, bulletIndex) => {
      if (currentY + bulletHeight > PAGE_HEIGHT - BOTTOM_MARGIN) return;

      const bulletText = String(bullet);

      // 番号バッジ（Dexallブルー）
      const numBadge = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, CONTENT_PADDING, currentY, 26, 26);
      numBadge.getFill().setSolidFill(COLORS.blue);
      numBadge.getBorder().setTransparent();
      numBadge.getText().setText(String(bulletIndex + 1));
      numBadge.getText().getTextStyle()
        .setFontSize(12)
        .setBold(true)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.accent);
      numBadge.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

      // テキスト
      const bulletBox = slide.insertTextBox(bulletText, CONTENT_PADDING + 35, currentY + 2, PAGE_WIDTH - CONTENT_PADDING - 90, 26);
      bulletBox.getText().getTextStyle()
        .setFontSize(13)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.body);

      currentY += bulletHeight;
    });
  }

  // フッター
  const footer = slide.insertTextBox('Thank you', PAGE_WIDTH - 100, PAGE_HEIGHT - 30, 80, 20);
  footer.getText().getTextStyle()
    .setFontSize(10)
    .setItalic(true)
    .setForegroundColor(COLORS.gray)
    .setFontFamily(FONTS.body);
  footer.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.END);
}

// ============================================
// レスポンス生成
// ============================================

function createHtmlResponse(success, error, slideUrl) {
  const closeScript = `
    function closeWindow() {
      // 親ウィンドウに閉じるリクエストを送信
      try {
        if (window.opener) {
          window.opener.postMessage({ type: 'closePopup' }, '*');
        }
      } catch(e) {}
      // 閉じる試み
      try { window.close(); } catch(e) {}
      // メッセージを表示（閉じられなかった場合に見える）
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
        layout: 'twoColumn',
        title: '推進体制',
        leftColumn: {
          title: '組織体制',
          bullets: ['DX推進室の設置', '各部門へのDX担当配置', '外部パートナー連携']
        },
        rightColumn: {
          title: 'スケジュール',
          bullets: ['Q1: 基盤整備', 'Q2: パイロット導入', 'Q3-Q4: 全社展開']
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
