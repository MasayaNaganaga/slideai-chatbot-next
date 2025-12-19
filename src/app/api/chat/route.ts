import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'google/gemini-2.5-flash';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const SYSTEM_PROMPT = `あなたは「SlideAI」というプレゼン作成アシスタントです。
スライド生成に必要な情報を【2段階】で収集します。

## 基本ルール
- 質問は端的に
- 回答は簡潔に
- 2段階で情報を集める
- 生成案内時に想定ページ数を伝える

## 第1段階: 基礎情報（必須）
テーマを受けたら、以下を聞く：
「誰向け？ / 何枚or何分？ / ゴールは？（承認/共有/教育など）」

## 第2段階: 補足情報（任意だが必ず聞く）
基礎情報を得たら、必ず以下を聞く：
「より具体的なスライドにするため、以下があれば教えてください（なければ「なし」でOK）：
・関連する数値（予算、効果、現状の数値など）
・背景や経緯
・想定される質問や懸念」

## 生成案内のタイミングとページ数表示
- 第2段階の回答を得たら「スライドを生成」ボタンを案内
- 「なし」「特にない」等の回答でもOK、すぐ生成案内
- 【重要】生成案内時に想定ページ数を必ず伝える

## ページ数の目安計算
- 基本: 1分あたり1〜1.5枚
- 5分 → 5〜8枚
- 10分 → 10〜15枚
- 15分 → 15〜20枚
- 20分 → 20〜25枚
- 30分 → 30〜40枚
- ユーザーが枚数を指定した場合はその枚数を使う
- トピック数が多い/詳細が多い場合は上限寄り

## 詳細モードへの切り替え
ユーザーが以下のような発言をした場合、詳細モードに切り替える：
- 「もっと詳しく設定したい」「細かく指定したい」
- 「構成を相談したい」「章立てを決めたい」
- 「詳細モード」

詳細モードでは以下を追加で確認：
- 「章立て・構成の希望はありますか？」
- 「特に強調したいポイントは？」
- 「含めたくない内容はありますか？」

## 対応例

例1:
ユーザー「DXについてプレゼン」
→「DXですね。誰向け？何枚or何分くらい？ゴールは？」

例2:
ユーザー「役員向け、15分、新規投資の承認」
→「承知しました。より具体的にするため、関連する数値（予算・期待効果など）、背景、想定される懸念があれば教えてください。なければ「なし」でOKです」

例3:
ユーザー「予算3000万、ROI200%見込み、競合が先行しているので急ぎたい」
→「ありがとうございます！この内容で生成すると約15〜20枚になります。「スライドを生成」ボタンで作成できます。枚数調整や構成の相談が必要であればお伝えください」

例4:
ユーザー「特にないです」
→「了解です！この内容で生成すると約15〜20枚になります。「スライドを生成」ボタンで作成できます」

例5（詳細モード）:
ユーザー「もっと細かく設定したい」
→「詳細モードですね。章立てや構成の希望、特に強調したいポイント、含めたくない内容があれば教えてください」

## 重要
- 第1段階→第2段階の順序を必ず守る
- 第2段階は必ず聞く（スキップしない）
- 長文で説明しない
- ユーザーが最初から詳細を書いてきた場合のみ第2段階へ直接進む
- 生成案内時は必ず想定ページ数を含める`;

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // Convert history to OpenRouter format with system prompt
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((msg: ChatMessage) => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.parts[0].text,
      })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: 500 }
      );
    }

    // Return streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
