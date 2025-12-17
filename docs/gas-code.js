/**
 * SlideAI - Google Apps Script
 *
 * このコードをGoogle Apps Scriptにコピーして使用してください。
 *
 * セットアップ手順:
 * 1. script.google.com で新しいプロジェクトを作成
 * 2. このコードをコピー＆ペースト
 * 3. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択
 * 4. アクセスできるユーザー: 「全員」を選択
 * 5. デプロイ後のURLを .env.local の GAS_WEBAPP_URL に設定
 */

/**
 * POSTリクエストを処理するエントリポイント（フォーム送信対応）
 */
function doPost(e) {
  try {
    let data;

    // フォームデータとして送信された場合
    if (e.parameter && e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    }
    // JSON本文として送信された場合
    else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    else {
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

/**
 * GETリクエストを処理（HTML応答対応）
 */
function doGet(e) {
  try {
    const dataParam = e.parameter.data;

    // データがない場合はステータスを返す
    if (!dataParam) {
      return createJsonResponse({
        success: true,
        message: 'SlideAI GAS API is running',
        timestamp: new Date().toISOString()
      });
    }

    // データをデコードしてパース
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

/**
 * HTML形式のレスポンスを作成（ポップアップ用）
 */
function createHtmlResponse(success, error, slideUrl) {
  let html;

  if (success && slideUrl) {
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SlideAI - 生成完了</title>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f9ff; }
    .container { text-align: center; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .success { color: #059669; font-size: 48px; margin-bottom: 20px; }
    h1 { color: #1e40af; margin-bottom: 10px; }
    p { color: #6b7280; margin-bottom: 20px; }
    a { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
    a:hover { background: #1d4ed8; }
    .close { margin-top: 20px; color: #6b7280; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <div class="success">✓</div>
    <h1>スライド生成完了！</h1>
    <p>プレゼンテーションが正常に作成されました</p>
    <a href="${slideUrl}" target="_blank">スライドを開く</a>
    <p class="close" onclick="window.close()">このウィンドウを閉じる</p>
  </div>
  <script>
    // 親ウィンドウに結果を通知
    if (window.opener) {
      window.opener.postMessage({ type: 'slideGenerated', success: true, slideUrl: '${slideUrl}' }, '*');
    }
  </script>
</body>
</html>`;
  } else {
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SlideAI - エラー</title>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fef2f2; }
    .container { text-align: center; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .error { color: #dc2626; font-size: 48px; margin-bottom: 20px; }
    h1 { color: #991b1b; margin-bottom: 10px; }
    p { color: #6b7280; margin-bottom: 20px; }
    .close { margin-top: 20px; color: #6b7280; cursor: pointer; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="error">✕</div>
    <h1>エラーが発生しました</h1>
    <p>${error || 'スライドの生成に失敗しました'}</p>
    <p class="close" onclick="window.close()">このウィンドウを閉じる</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'slideGenerated', success: false, error: '${error || 'Unknown error'}' }, '*');
    }
  </script>
</body>
</html>`;
  }

  return HtmlService.createHtmlOutput(html);
}

// デザインテーマの色設定
const THEME = {
  primary: '#1e40af',      // 濃い青
  secondary: '#3b82f6',    // 明るい青
  accent: '#f59e0b',       // オレンジ
  background: '#f8fafc',   // 薄いグレー
  titleBg: '#1e3a5f',      // タイトルスライド背景
  text: '#1f2937',         // テキスト色
  lightText: '#ffffff',    // 明るいテキスト
  headerBg: '#2563eb',     // ヘッダー背景
};

/**
 * プレゼンテーションを作成
 */
function createPresentation(slideData) {
  // 新しいプレゼンテーションを作成
  const presentation = SlidesApp.create(slideData.title);
  const presentationId = presentation.getId();

  // デフォルトのスライドを取得（タイトルスライド用に使用）
  const slides = presentation.getSlides();
  const titleSlide = slides[0];

  // タイトルスライドを設定
  setupTitleSlide(titleSlide, slideData.title, slideData.subtitle);

  // コンテンツスライドを追加
  slideData.slides.forEach((slideContent, index) => {
    const newSlide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
    setupContentSlide(newSlide, slideContent, index);
  });

  // プレゼンテーションを保存
  presentation.saveAndClose();

  return {
    id: presentationId,
    url: `https://docs.google.com/presentation/d/${presentationId}/edit`
  };
}

// Google Slidesの標準サイズ（16:9、ポイント単位）
const PAGE_WIDTH = 720;
const PAGE_HEIGHT = 405;

/**
 * タイトルスライドを設定
 */
function setupTitleSlide(slide, title, subtitle) {
  // 背景をグラデーション風の色に設定
  slide.getBackground().setSolidFill(THEME.titleBg);

  const shapes = slide.getShapes();

  shapes.forEach(shape => {
    if (shape.getShapeType() === SlidesApp.ShapeType.TEXT_BOX) {
      const placeholder = shape.getPlaceholderType();

      if (placeholder === SlidesApp.PlaceholderType.CENTERED_TITLE ||
          placeholder === SlidesApp.PlaceholderType.TITLE) {
        shape.getText().setText(title);
        shape.getText().getTextStyle()
          .setFontSize(44)
          .setBold(true)
          .setForegroundColor(THEME.lightText)
          .setFontFamily('Noto Sans JP');
      } else if (placeholder === SlidesApp.PlaceholderType.SUBTITLE) {
        shape.getText().setText(subtitle || 'Generated by SlideAI');
        shape.getText().getTextStyle()
          .setFontSize(18)
          .setForegroundColor('#94a3b8')
          .setFontFamily('Noto Sans JP');
      }
    }
  });

  // 装飾用のアクセントライン
  const accentLine = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 280, PAGE_WIDTH, 6);
  accentLine.getFill().setSolidFill(THEME.accent);
  accentLine.getBorder().setTransparent();

  // フッター
  const footer = slide.insertTextBox('Generated by SlideAI', PAGE_WIDTH - 200, PAGE_HEIGHT - 30, 180, 20);
  footer.getText().getTextStyle()
    .setFontSize(10)
    .setForegroundColor('#64748b')
    .setFontFamily('Noto Sans JP');
  footer.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.END);
}

/**
 * コンテンツスライドを設定（メッセージライン対応）
 */
function setupContentSlide(slide, content, index) {
  // 背景を薄いグレーに設定
  slide.getBackground().setSolidFill(THEME.background);

  // ヘッダー背景を追加
  const headerBg = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, PAGE_WIDTH, 70);
  headerBg.getFill().setSolidFill(THEME.headerBg);
  headerBg.getBorder().setTransparent();
  headerBg.sendToBack();

  // スライド番号を追加
  const slideNumber = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, PAGE_WIDTH - 50, 15, 35, 35);
  slideNumber.getFill().setSolidFill(THEME.accent);
  slideNumber.getBorder().setTransparent();
  slideNumber.getText().setText(String(index + 1));
  slideNumber.getText().getTextStyle()
    .setFontSize(16)
    .setBold(true)
    .setForegroundColor(THEME.lightText);
  slideNumber.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // 既存のプレースホルダーを削除して新規作成
  const shapes = slide.getShapes();
  shapes.forEach(shape => {
    if (shape.getShapeType() === SlidesApp.ShapeType.TEXT_BOX) {
      shape.remove();
    }
  });

  // タイトル（ヘッダー内）
  const titleBox = slide.insertTextBox(content.title || '', 20, 20, PAGE_WIDTH - 80, 40);
  titleBox.getText().getTextStyle()
    .setFontSize(22)
    .setBold(true)
    .setForegroundColor(THEME.lightText)
    .setFontFamily('Noto Sans JP');

  let currentY = 85;

  // キーメッセージ（最も重要）
  if (content.message) {
    const messageBox = slide.insertTextBox(content.message, 30, currentY, PAGE_WIDTH - 60, 45);
    messageBox.getText().getTextStyle()
      .setFontSize(18)
      .setBold(true)
      .setForegroundColor(THEME.primary)
      .setFontFamily('Noto Sans JP');

    // メッセージの下線
    const messageLine = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 30, currentY + 40, PAGE_WIDTH - 60, 2);
    messageLine.getFill().setSolidFill(THEME.secondary);
    messageLine.getBorder().setTransparent();

    currentY += 55;
  }

  // ボディ（説明文）
  if (content.body) {
    const bodyBox = slide.insertTextBox(content.body, 30, currentY, PAGE_WIDTH - 60, 50);
    bodyBox.getText().getTextStyle()
      .setFontSize(14)
      .setForegroundColor(THEME.text)
      .setFontFamily('Noto Sans JP');
    currentY += 55;
  }

  // ハイライト（強調数値やキーワード）
  if (content.highlights && content.highlights.length > 0) {
    const highlightWidth = (PAGE_WIDTH - 80) / content.highlights.length;
    content.highlights.forEach((highlight, i) => {
      const hlBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 30 + (i * highlightWidth) + 5, currentY, highlightWidth - 10, 40);
      hlBox.getFill().setSolidFill(THEME.accent);
      hlBox.getBorder().setTransparent();
      hlBox.getText().setText(highlight);
      hlBox.getText().getTextStyle()
        .setFontSize(14)
        .setBold(true)
        .setForegroundColor(THEME.lightText)
        .setFontFamily('Noto Sans JP');
      hlBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    });
    currentY += 50;
  }

  // 箇条書き
  if (content.bullets && content.bullets.length > 0) {
    const bulletText = content.bullets.map(b => `▸ ${b}`).join('\n');
    const bulletBox = slide.insertTextBox(bulletText, 35, currentY, PAGE_WIDTH - 70, PAGE_HEIGHT - currentY - 20);
    bulletBox.getText().getTextStyle()
      .setFontSize(14)
      .setForegroundColor(THEME.text)
      .setFontFamily('Noto Sans JP');

    // 各行の行間を調整
    bulletBox.getText().getParagraphStyle().setSpaceAbove(8);
  }

  // 左側のアクセントバー
  const accentBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 70, 6, PAGE_HEIGHT - 70);
  accentBar.getFill().setSolidFill(THEME.secondary);
  accentBar.getBorder().setTransparent();

  // スピーカーノートを追加
  if (content.notes) {
    slide.getNotesPage().getSpeakerNotesShape().getText().setText(content.notes);
  }
}

/**
 * JSON形式のレスポンスを作成
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * テスト用関数
 */
function testCreatePresentation() {
  const testData = {
    title: 'テストプレゼンテーション',
    slides: [
      {
        title: 'はじめに',
        bullets: ['ポイント1', 'ポイント2', 'ポイント3'],
        notes: 'このスライドでは概要を説明します'
      },
      {
        title: '主な内容',
        bullets: ['詳細1', '詳細2', '詳細3', '詳細4'],
        notes: ''
      },
      {
        title: 'まとめ',
        bullets: ['結論1', '結論2'],
        notes: '最後にまとめを伝えます'
      }
    ]
  };

  const result = createPresentation(testData);
  console.log('Created presentation:', result);
}
