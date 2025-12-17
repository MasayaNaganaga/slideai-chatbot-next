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

## 出力形式（JSONのみ、説明文不要）:
{
  "title": "プレゼンテーションタイトル",
  "subtitle": "サブタイトル・日付・発表者名など",
  "slides": [
    {
      "title": "スライドタイトル（端的に）",
      "message": "このスライドで最も伝えたいキーメッセージ（1文で結論を述べる）",
      "body": "メッセージを補足する説明文（2-3文程度）",
      "bullets": ["補足ポイント1", "補足ポイント2", "補足ポイント3"],
      "highlights": ["重要数値や強調キーワード"],
      "notes": "発表者用の詳細ノート"
    }
  ]
}

## スライド構成の原則（ピラミッド・プリンシプル）:

### 1. 各スライドの構造
- **title**: スライドの内容を端的に表す（10文字以内）
- **message**: そのスライドの結論・主張（必須！最も重要）
  - 「〜である」「〜すべきだ」など断定的に書く
  - このメッセージだけ読めばスライドの要点がわかるように
- **body**: messageを補足する説明（2-3文で背景や理由を説明）
- **bullets**: 具体的な根拠やポイント（3-5個）
- **highlights**: 印象に残したい数値やキーワード（1-3個）

### 2. プレゼン全体の構成
1. **表紙**（タイトル、サブタイトル）
2. **エグゼクティブサマリー**: 結論を最初に述べる（1枚）
3. **背景・課題**: なぜこの話が重要か（1-2枚）
4. **本論**: 主張を裏付ける内容（4-8枚）
5. **提案・アクション**: 具体的な次のステップ（1-2枚）
6. **まとめ**: キーメッセージの再確認（1枚）

### 3. メッセージラインの書き方
悪い例:「売上について」「マーケティング戦略」
良い例:「売上は前年比150%増加し、目標を達成した」
良い例:「デジタルマーケティングへの投資を倍増すべきである」

### 4. ボディの書き方
- メッセージの根拠や背景を説明
- 「なぜなら〜」「具体的には〜」「その結果〜」
- データや事例で裏付ける

### 5. 品質チェックポイント
- 各スライドのmessageを並べて読むと、ストーリーが伝わるか
- So What?（だから何？）に答えられているか
- 具体的な数値やファクトが含まれているか

## 重要
- messageフィールドは必須。空にしない
- 抽象的な見出しではなく、主張を込めたメッセージにする
- 会話内容が薄くても、一般知識で補完して充実させる
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
