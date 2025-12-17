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

// カラーパレット（プロフェッショナルなビジネステーマ）
const COLORS = {
  // プライマリ
  navy: '#1a365d',
  darkBlue: '#2c5282',
  blue: '#3182ce',
  lightBlue: '#63b3ed',

  // アクセント
  orange: '#ed8936',
  green: '#38a169',
  red: '#e53e3e',
  purple: '#805ad5',

  // ニュートラル
  white: '#ffffff',
  offWhite: '#f7fafc',
  lightGray: '#edf2f7',
  gray: '#a0aec0',
  darkGray: '#4a5568',
  black: '#1a202c',
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
  // 背景：グラデーション風の2色構成
  slide.getBackground().setSolidFill(COLORS.navy);

  // 装飾：右下の大きな円
  const decorCircle = slide.insertShape(SlidesApp.ShapeType.ELLIPSE,
    PAGE_WIDTH - 200, PAGE_HEIGHT - 150, 350, 350);
  decorCircle.getFill().setSolidFill(COLORS.darkBlue);
  decorCircle.getBorder().setTransparent();
  decorCircle.sendToBack();

  // 装飾：アクセントライン
  const accentLine = slide.insertShape(SlidesApp.ShapeType.RECTANGLE,
    60, PAGE_HEIGHT / 2 + 40, 100, 4);
  accentLine.getFill().setSolidFill(COLORS.orange);
  accentLine.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(title, 60, PAGE_HEIGHT / 2 - 60, PAGE_WIDTH - 120, 80);
  titleBox.getText().getTextStyle()
    .setFontSize(42)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // サブタイトル
  const subtitleText = subtitle || new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  const subtitleBox = slide.insertTextBox(subtitleText, 60, PAGE_HEIGHT / 2 + 55, PAGE_WIDTH - 120, 30);
  subtitleBox.getText().getTextStyle()
    .setFontSize(16)
    .setForegroundColor(COLORS.lightBlue)
    .setFontFamily(FONTS.body);

  // フッター
  const footer = slide.insertTextBox('Generated by SlideAI', PAGE_WIDTH - 180, PAGE_HEIGHT - 30, 160, 20);
  footer.getText().getTextStyle()
    .setFontSize(9)
    .setForegroundColor(COLORS.gray)
    .setFontFamily(FONTS.body);
  footer.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.END);
}

// ============================================
// 目次スライド
// ============================================

function createTableOfContents(slide, slides) {
  slide.getBackground().setSolidFill(COLORS.white);

  // タイトル
  const titleBox = slide.insertTextBox('Contents', 60, 40, 200, 40);
  titleBox.getText().getTextStyle()
    .setFontSize(28)
    .setBold(true)
    .setForegroundColor(COLORS.navy)
    .setFontFamily(FONTS.title);

  // アクセントライン
  const line = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 60, 85, 60, 3);
  line.getFill().setSolidFill(COLORS.orange);
  line.getBorder().setTransparent();

  // 目次項目
  const startY = 110;
  const itemHeight = 35;
  const maxItems = 8;

  slides.slice(0, maxItems).forEach((content, i) => {
    const y = startY + (i * itemHeight);
    const itemTitle = content.title || `スライド ${i + 1}`;

    // 番号
    const numBox = slide.insertTextBox(String(i + 1).padStart(2, '0'), 60, y, 40, 30);
    numBox.getText().getTextStyle()
      .setFontSize(14)
      .setBold(true)
      .setForegroundColor(COLORS.orange)
      .setFontFamily(FONTS.accent);

    // タイトル
    const itemBox = slide.insertTextBox(itemTitle, 110, y, PAGE_WIDTH - 180, 30);
    itemBox.getText().getTextStyle()
      .setFontSize(14)
      .setForegroundColor(COLORS.darkGray)
      .setFontFamily(FONTS.body);
  });

  // 左のアクセントバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, 8, PAGE_HEIGHT);
  sideBar.getFill().setSolidFill(COLORS.navy);
  sideBar.getBorder().setTransparent();
}

// ============================================
// セクション区切りスライド
// ============================================

function createSectionSlide(slide, content, index) {
  slide.getBackground().setSolidFill(COLORS.darkBlue);

  // セクション番号
  const numBox = slide.insertTextBox(String(index + 1).padStart(2, '0'), 60, PAGE_HEIGHT / 2 - 80, 100, 50);
  numBox.getText().getTextStyle()
    .setFontSize(48)
    .setBold(true)
    .setForegroundColor(COLORS.orange)
    .setFontFamily(FONTS.accent);

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', 60, PAGE_HEIGHT / 2 - 20, PAGE_WIDTH - 120, 60);
  titleBox.getText().getTextStyle()
    .setFontSize(36)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // メッセージ（あれば）
  if (content.message) {
    const msgBox = slide.insertTextBox(content.message, 60, PAGE_HEIGHT / 2 + 50, PAGE_WIDTH - 120, 40);
    msgBox.getText().getTextStyle()
      .setFontSize(16)
      .setForegroundColor(COLORS.lightBlue)
      .setFontFamily(FONTS.body);
  }

  // 装飾：右側の縦線
  const vertLine = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, PAGE_WIDTH - 60, 60, 4, PAGE_HEIGHT - 120);
  vertLine.getFill().setSolidFill(COLORS.orange);
  vertLine.getBorder().setTransparent();
}

// ============================================
// 標準スライド（メッセージ + 本文 + 箇条書き）
// ============================================

function createStandardSlide(slide, content, index) {
  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダーエリア
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, 70);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', 30, 20, PAGE_WIDTH - 100, 35);
  titleBox.getText().getTextStyle()
    .setFontSize(22)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  const numBox = slide.insertTextBox(String(index + 1), PAGE_WIDTH - 50, 22, 30, 30);
  numBox.getText().getTextStyle()
    .setFontSize(14)
    .setBold(true)
    .setForegroundColor(COLORS.lightBlue)
    .setFontFamily(FONTS.accent);
  numBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  let currentY = 85;

  // キーメッセージ
  if (content.message) {
    const msgBox = slide.insertTextBox(content.message, 30, currentY, PAGE_WIDTH - 60, 40);
    msgBox.getText().getTextStyle()
      .setFontSize(18)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);
    currentY += 50;

    // メッセージ下のアクセントライン
    const msgLine = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 30, currentY - 5, 80, 3);
    msgLine.getFill().setSolidFill(COLORS.orange);
    msgLine.getBorder().setTransparent();
  }

  // 本文
  if (content.body) {
    const bodyBox = slide.insertTextBox(content.body, 30, currentY, PAGE_WIDTH - 60, 45);
    bodyBox.getText().getTextStyle()
      .setFontSize(13)
      .setForegroundColor(COLORS.darkGray)
      .setFontFamily(FONTS.body);
    currentY += 50;
  }

  // ハイライト（数値やキーワード）
  if (content.highlights && content.highlights.length > 0) {
    const hlCount = Math.max(content.highlights.length, 1);
    const hlWidth = Math.max((PAGE_WIDTH - 80) / hlCount, 50);

    content.highlights.forEach((hl, i) => {
      const hlBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE,
        30 + (i * hlWidth) + 5, currentY, hlWidth - 10, 35);
      hlBox.getFill().setSolidFill(COLORS.lightGray);
      hlBox.getBorder().setTransparent();
      hlBox.getText().setText(hl);
      hlBox.getText().getTextStyle()
        .setFontSize(12)
        .setBold(true)
        .setForegroundColor(COLORS.navy)
        .setFontFamily(FONTS.body);
      hlBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    });
    currentY += 45;
  }

  // 箇条書き
  if (content.bullets && Array.isArray(content.bullets) && content.bullets.length > 0) {
    content.bullets.forEach((bullet, i) => {
      if (!bullet) return;
      const bulletText = String(bullet);

      // ドット
      const dot = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, 35, currentY + 6, 8, 8);
      dot.getFill().setSolidFill(COLORS.blue);
      dot.getBorder().setTransparent();

      // テキスト
      const bulletBox = slide.insertTextBox(bulletText, 55, currentY, PAGE_WIDTH - 90, 25);
      bulletBox.getText().getTextStyle()
        .setFontSize(13)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);

      currentY += 28;
    });
  }

  // 左サイドのアクセントバー
  const sideBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 70, 5, PAGE_HEIGHT - 70);
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

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, 70);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', 30, 20, PAGE_WIDTH - 100, 35);
  titleBox.getText().getTextStyle()
    .setFontSize(22)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  const numBox = slide.insertTextBox(String(index + 1), PAGE_WIDTH - 50, 22, 30, 30);
  numBox.getText().getTextStyle()
    .setFontSize(14)
    .setBold(true)
    .setForegroundColor(COLORS.lightBlue)
    .setFontFamily(FONTS.accent);
  numBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  const colWidth = (PAGE_WIDTH - 80) / 2;
  const startY = 90;

  // 左カラム
  if (content.leftColumn) {
    createColumnContent(slide, content.leftColumn, 30, startY, colWidth);
  }

  // 中央の区切り線
  const divider = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, PAGE_WIDTH / 2 - 1, startY, 2, PAGE_HEIGHT - startY - 30);
  divider.getFill().setSolidFill(COLORS.lightGray);
  divider.getBorder().setTransparent();

  // 右カラム
  if (content.rightColumn) {
    createColumnContent(slide, content.rightColumn, PAGE_WIDTH / 2 + 20, startY, colWidth);
  }
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
  slide.getBackground().setSolidFill(COLORS.offWhite);

  // ヘッダー
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, 70);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', 30, 20, PAGE_WIDTH - 100, 35);
  titleBox.getText().getTextStyle()
    .setFontSize(22)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // スライド番号
  const numBox = slide.insertTextBox(String(index + 1), PAGE_WIDTH - 50, 22, 30, 30);
  numBox.getText().getTextStyle()
    .setFontSize(14)
    .setBold(true)
    .setForegroundColor(COLORS.lightBlue)
    .setFontFamily(FONTS.accent);

  // メッセージ
  if (content.message) {
    const msgBox = slide.insertTextBox(content.message, 30, 85, PAGE_WIDTH - 60, 35);
    msgBox.getText().getTextStyle()
      .setFontSize(16)
      .setBold(true)
      .setForegroundColor(COLORS.navy)
      .setFontFamily(FONTS.title);
  }

  // 統計カード
  const stats = content.stats || [];
  const cardCount = Math.min(stats.length, 4);

  // statsが空の場合はstandardスライドとして処理
  if (cardCount === 0) {
    createStandardSlide(slide, content, index);
    return;
  }

  const cardWidth = (PAGE_WIDTH - 80) / cardCount;
  const cardHeight = 150;
  const startY = 135;

  const cardColors = [COLORS.blue, COLORS.green, COLORS.orange, COLORS.purple];

  stats.slice(0, 4).forEach((stat, i) => {
    const x = 30 + (i * cardWidth) + 10;
    const statValue = stat.value || '-';
    const statLabel = stat.label || '';

    // カード背景
    const card = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, startY, cardWidth - 20, cardHeight);
    card.getFill().setSolidFill(COLORS.white);
    card.getBorder().setWeight(0);

    // 上部のカラーバー
    const colorBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, x, startY, cardWidth - 20, 5);
    colorBar.getFill().setSolidFill(cardColors[i % cardColors.length]);
    colorBar.getBorder().setTransparent();

    // 数値
    const valueBox = slide.insertTextBox(statValue, x + 10, startY + 25, cardWidth - 40, 50);
    if (statValue) {
      valueBox.getText().getTextStyle()
        .setFontSize(32)
        .setBold(true)
        .setForegroundColor(cardColors[i % cardColors.length])
        .setFontFamily(FONTS.accent);
      valueBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }

    // ラベル
    if (statLabel) {
      const labelBox = slide.insertTextBox(statLabel, x + 10, startY + 85, cardWidth - 40, 50);
      labelBox.getText().getTextStyle()
        .setFontSize(12)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);
      labelBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  });

  // 補足（箇条書きがあれば下に表示）
  if (content.bullets && content.bullets.length > 0) {
    const noteY = startY + cardHeight + 20;
    const noteText = content.bullets.map(b => `• ${b}`).join('　　');
    const noteBox = slide.insertTextBox(noteText, 30, noteY, PAGE_WIDTH - 60, 30);
    noteBox.getText().getTextStyle()
      .setFontSize(11)
      .setForegroundColor(COLORS.gray)
      .setFontFamily(FONTS.body);
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

  slide.getBackground().setSolidFill(COLORS.white);

  // ヘッダー
  const header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, 70);
  header.getFill().setSolidFill(COLORS.navy);
  header.getBorder().setTransparent();

  // タイトル
  const titleBox = slide.insertTextBox(content.title || '', 30, 20, PAGE_WIDTH - 100, 35);
  titleBox.getText().getTextStyle()
    .setFontSize(22)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);
  const colWidth = (PAGE_WIDTH - 100) / 2;
  const startY = 90;

  // Before/左側
  const leftBg = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 30, startY, colWidth, PAGE_HEIGHT - startY - 30);
  leftBg.getFill().setSolidFill(COLORS.lightGray);
  leftBg.getBorder().setTransparent();

  const leftTitle = slide.insertTextBox(comp.beforeTitle || 'Before', 40, startY + 10, colWidth - 20, 30);
  leftTitle.getText().getTextStyle()
    .setFontSize(16)
    .setBold(true)
    .setForegroundColor(COLORS.red)
    .setFontFamily(FONTS.title);

  if (comp.beforeItems && Array.isArray(comp.beforeItems)) {
    let y = startY + 50;
    comp.beforeItems.forEach(item => {
      if (!item) return;
      const itemText = '✕ ' + String(item);
      const itemBox = slide.insertTextBox(itemText, 50, y, colWidth - 40, 25);
      itemBox.getText().getTextStyle()
        .setFontSize(12)
        .setForegroundColor(COLORS.darkGray)
        .setFontFamily(FONTS.body);
      y += 28;
    });
  }

  // 矢印
  const arrow = slide.insertTextBox('→', PAGE_WIDTH / 2 - 15, PAGE_HEIGHT / 2 - 20, 30, 40);
  arrow.getText().getTextStyle()
    .setFontSize(28)
    .setBold(true)
    .setForegroundColor(COLORS.navy)
    .setFontFamily(FONTS.accent);

  // After/右側
  const rightBg = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, PAGE_WIDTH / 2 + 20, startY, colWidth, PAGE_HEIGHT - startY - 30);
  rightBg.getFill().setSolidFill(COLORS.navy);
  rightBg.getBorder().setTransparent();

  const rightTitle = slide.insertTextBox(comp.afterTitle || 'After', PAGE_WIDTH / 2 + 30, startY + 10, colWidth - 20, 30);
  rightTitle.getText().getTextStyle()
    .setFontSize(16)
    .setBold(true)
    .setForegroundColor(COLORS.green)
    .setFontFamily(FONTS.title);

  if (comp.afterItems && Array.isArray(comp.afterItems)) {
    let y = startY + 50;
    comp.afterItems.forEach(item => {
      if (!item) return;
      const itemText = '✓ ' + String(item);
      const itemBox = slide.insertTextBox(itemText, PAGE_WIDTH / 2 + 40, y, colWidth - 40, 25);
      itemBox.getText().getTextStyle()
        .setFontSize(12)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.body);
      y += 28;
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
  slide.getBackground().setSolidFill(COLORS.darkBlue);

  // タイトル
  const titleBox = slide.insertTextBox(content.title || 'まとめ', 60, 40, PAGE_WIDTH - 120, 50);
  titleBox.getText().getTextStyle()
    .setFontSize(32)
    .setBold(true)
    .setForegroundColor(COLORS.white)
    .setFontFamily(FONTS.title);

  // アクセントライン
  const line = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 60, 95, 80, 4);
  line.getFill().setSolidFill(COLORS.orange);
  line.getBorder().setTransparent();

  // キーメッセージ
  if (content.message) {
    const msgBox = slide.insertTextBox(content.message, 60, 115, PAGE_WIDTH - 120, 50);
    msgBox.getText().getTextStyle()
      .setFontSize(18)
      .setBold(true)
      .setForegroundColor(COLORS.lightBlue)
      .setFontFamily(FONTS.title);
  }

  // ポイント（番号付き）
  if (content.bullets && Array.isArray(content.bullets) && content.bullets.length > 0) {
    let y = 180;
    let bulletIndex = 0;
    content.bullets.forEach((bullet) => {
      if (!bullet) return;
      const bulletText = String(bullet);

      // 番号バッジ
      const numBadge = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, 60, y, 28, 28);
      numBadge.getFill().setSolidFill(COLORS.orange);
      numBadge.getBorder().setTransparent();
      numBadge.getText().setText(String(bulletIndex + 1));
      numBadge.getText().getTextStyle()
        .setFontSize(14)
        .setBold(true)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.accent);
      numBadge.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

      // テキスト
      const bulletBox = slide.insertTextBox(bulletText, 100, y + 2, PAGE_WIDTH - 180, 28);
      bulletBox.getText().getTextStyle()
        .setFontSize(15)
        .setForegroundColor(COLORS.white)
        .setFontFamily(FONTS.body);

      y += 40;
      bulletIndex++;
    });
  }

  // フッター
  const footer = slide.insertTextBox('Thank you', PAGE_WIDTH - 120, PAGE_HEIGHT - 40, 100, 25);
  footer.getText().getTextStyle()
    .setFontSize(12)
    .setItalic(true)
    .setForegroundColor(COLORS.gray)
    .setFontFamily(FONTS.body);
  footer.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.END);
}

// ============================================
// レスポンス生成
// ============================================

function createHtmlResponse(success, error, slideUrl) {
  let html;
  if (success && slideUrl) {
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SlideAI</title>
<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:linear-gradient(135deg,#1a365d,#2c5282)}.container{text-align:center;background:white;padding:50px;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3)}.success{color:#38a169;font-size:60px;margin-bottom:20px}h1{color:#1a365d;margin-bottom:10px;font-size:24px}p{color:#718096;margin-bottom:25px}a{display:inline-block;background:linear-gradient(135deg,#3182ce,#2c5282);color:white;padding:15px 35px;border-radius:10px;text-decoration:none;font-weight:bold;transition:transform 0.2s}a:hover{transform:scale(1.05)}.close{margin-top:25px;color:#a0aec0;cursor:pointer;font-size:14px}</style></head>
<body><div class="container"><div class="success">✓</div><h1>スライド生成完了</h1><p>プレゼンテーションが作成されました</p><a href="${slideUrl}" target="_blank">スライドを開く</a><p class="close" onclick="window.close()">閉じる</p></div>
<script>if(window.opener){window.opener.postMessage({type:'slideGenerated',success:true,slideUrl:'${slideUrl}'},'*')}</script></body></html>`;
  } else {
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SlideAI - Error</title>
<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fef2f2}.container{text-align:center;background:white;padding:50px;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.1)}.error{color:#e53e3e;font-size:60px;margin-bottom:20px}h1{color:#c53030;margin-bottom:10px}p{color:#718096;margin-bottom:20px}.close{color:#a0aec0;cursor:pointer}</style></head>
<body><div class="container"><div class="error">✕</div><h1>エラー</h1><p>${error || 'スライドの生成に失敗しました'}</p><p class="close" onclick="window.close()">閉じる</p></div>
<script>if(window.opener){window.opener.postMessage({type:'slideGenerated',success:false,error:'${error||'Unknown error'}'},'*')}</script></body></html>`;
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
