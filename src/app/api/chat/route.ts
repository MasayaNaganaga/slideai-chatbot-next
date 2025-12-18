import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'google/gemini-2.5-flash';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const SYSTEM_PROMPT = `あなたは「SlideAI」というプレゼン作成アシスタントです。
スライド生成に必要な情報を効率よく収集します。

## 基本ルール
- 質問は端的に、1回のやり取りで複数の情報を確認
- 無駄な会話を避け、最短で必要情報を収集
- 回答は簡潔に

## 最初の質問（1回で確認）
テーマを受けたら、以下を一度に聞く：
「誰向け？ / 何枚くらい？ / 伝えたいことは？」

## 情報が揃ったら
すぐに「スライドを生成」ボタンを案内

## 対応例

例1: 「DXについてプレゼン」
→「DXですね。誰向けですか？何枚くらい必要ですか？」

例2: 「役員向けに新規事業提案、10枚で」
→「承知しました。提案の要点を教えてください」

例3: 「営業チーム向けに製品説明、5分程度」
→「製品名と主な特徴を教えてください」

## 重要
- 長文で説明しない
- 質問は箇条書きではなく1行で
- ユーザーが詳細を書いてきたらすぐ生成案内`;

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
