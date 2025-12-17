import { NextRequest, NextResponse } from 'next/server';
import type { SlideData, GenerateSlideResponse } from '@/types/slide';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL;
const MODEL = 'google/gemini-2.5-flash';

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const SYSTEM_PROMPT = `あなたは経営コンサルタント出身のプレゼンテーション構成の専門家です。
ユーザーとの会話履歴を深く分析し、McKinsey/BCG品質の説得力あるプレゼンテーションスライドをJSON形式で生成してください。

## 利用可能なレイアウト
各スライドに最適なlayoutを指定してください：

### 1. standard（デフォルト）
通常のコンテンツスライド。メッセージ + 本文 + 箇条書き
{
  "layout": "standard",
  "title": "スライドタイトル",
  "message": "キーメッセージ（必須）",
  "body": "補足説明文",
  "bullets": ["ポイント1", "ポイント2"],
  "highlights": ["重要キーワード"]
}

### 2. section
セクション区切り。大きなテーマの導入に使用
{
  "layout": "section",
  "title": "セクション名",
  "message": "このセクションの概要"
}

### 3. stats
数値・KPIを目立たせる。統計データや成果を示す時に使用
{
  "layout": "stats",
  "title": "タイトル",
  "message": "キーメッセージ",
  "stats": [
    { "value": "150%", "label": "売上成長率" },
    { "value": "3.2億円", "label": "利益額" },
    { "value": "98%", "label": "顧客満足度" }
  ]
}

### 4. comparison
Before/After、比較を示す
{
  "layout": "comparison",
  "title": "タイトル",
  "comparison": {
    "beforeTitle": "現状",
    "beforeItems": ["課題1", "課題2", "課題3"],
    "afterTitle": "改善後",
    "afterItems": ["解決策1", "解決策2", "解決策3"]
  }
}

### 5. twoColumn
2つの観点を並べて説明
{
  "layout": "twoColumn",
  "title": "タイトル",
  "leftColumn": {
    "title": "左カラムタイトル",
    "bullets": ["項目1", "項目2"]
  },
  "rightColumn": {
    "title": "右カラムタイトル",
    "bullets": ["項目1", "項目2"]
  }
}

### 6. quote
重要な引用やメッセージを強調
{
  "layout": "quote",
  "quote": "引用文やキャッチコピー",
  "source": "出典（任意）"
}

### 7. summary
まとめスライド。最後に使用
{
  "layout": "summary",
  "title": "まとめ",
  "message": "最も伝えたいこと",
  "bullets": ["結論1", "結論2", "結論3"]
}

## プレゼン全体の構成（8-12枚推奨）
1. 【section】導入・背景
2. 【stats/standard】現状分析・データ
3. 【comparison】課題と解決策
4. 【twoColumn/standard】詳細説明
5. 【stats】期待効果
6. 【summary】まとめ・Next Steps

## メッセージの書き方
悪い例:「売上について」「マーケティング戦略」
良い例:「売上は前年比150%増加し、目標を達成した」
良い例:「デジタルマーケティングへの投資を倍増すべきである」

## 重要なルール
- 各スライドにlayoutを必ず指定する
- messageフィールドは可能な限り設定（section, quoteは任意）
- statsレイアウトでは2-4個のstatsを含める
- 会話内容が薄くても、一般知識で補完して具体的な数値を入れる
- 8-12枚のスライドを生成する
- JSON以外のテキストは絶対に出力しない`;

export async function POST(request: NextRequest) {
  try {
    const { history } = await request.json();

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenRouter API key not configured' } as GenerateSlideResponse,
        { status: 500 }
      );
    }

    // Step 1: AIにスライド構造を生成させる
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((msg: ChatMessage) => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.parts[0].text,
      })),
      { role: 'user', content: '上記の会話内容をもとに、プレゼンテーションスライドのJSON構造を生成してください。' },
    ];

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Slide AI',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error('OpenRouter API error:', error);
      return NextResponse.json(
        { success: false, error: 'AIからの応答取得に失敗しました' } as GenerateSlideResponse,
        { status: 500 }
      );
    }

    const aiData = await aiResponse.json();
    const slideJsonString = aiData.choices?.[0]?.message?.content;

    if (!slideJsonString) {
      return NextResponse.json(
        { success: false, error: 'スライド構造の生成に失敗しました' } as GenerateSlideResponse,
        { status: 500 }
      );
    }

    let slideData: SlideData;
    try {
      slideData = JSON.parse(slideJsonString);
    } catch (e) {
      console.error('Failed to parse slide JSON:', slideJsonString);
      return NextResponse.json(
        { success: false, error: 'スライドJSONのパースに失敗しました' } as GenerateSlideResponse,
        { status: 500 }
      );
    }

    // Step 2: GASにスライドデータを送信
    if (!GAS_WEBAPP_URL) {
      // GAS未設定の場合はスライドデータのみ返す
      return NextResponse.json({
        success: true,
        slideData,
        message: 'GAS_WEBAPP_URLが設定されていないため、スライドデータのみ返します',
      });
    }

    const gasResponse = await fetch(GAS_WEBAPP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ slideData }),
      redirect: 'follow',
    });

    const gasText = await gasResponse.text();
    console.log('GAS Response:', gasText);

    let gasData;
    try {
      gasData = JSON.parse(gasText);
    } catch (e) {
      console.error('GAS API error (not JSON):', gasText);
      return NextResponse.json(
        { success: false, error: 'Google Slidesの生成に失敗しました', slideData } as GenerateSlideResponse & { slideData: SlideData },
        { status: 500 }
      );
    }

    if (!gasData.success) {
      console.error('GAS API error:', gasData.error);
      return NextResponse.json(
        { success: false, error: gasData.error || 'Google Slidesの生成に失敗しました', slideData } as GenerateSlideResponse & { slideData: SlideData },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slideUrl: gasData.slideUrl,
      slideId: gasData.slideId,
    } as GenerateSlideResponse);

  } catch (error) {
    console.error('Generate slides API error:', error);
    return NextResponse.json(
      { success: false, error: '内部エラーが発生しました' } as GenerateSlideResponse,
      { status: 500 }
    );
  }
}
