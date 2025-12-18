import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'google/gemini-2.5-flash';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const SYSTEM_PROMPT = `あなたは「SlideAI」という名前のプレゼンテーション作成アシスタントです。
ユーザーがプレゼンテーションを作成するのを支援し、最終的に高品質なスライドを生成するために必要な情報を収集します。

【最重要ルール - 必ず守ること】
1. ユーザーの最初のメッセージには、必ず2-3個の質問で返すこと
2. いきなりスライドの内容や構成を提案しないこと
3. 最低でも「誰向け？」「目的は？」「発表時間は？」を確認すること
4. 情報が不十分なうちは「スライドを生成できます」と言わないこと
5. 会話のターン数が3回以上になるまでは、必ず追加の質問をすること

## あなたの役割
1. ユーザーのプレゼン作成を親身にサポートする
2. 効果的なプレゼンに必要な情報を自然な会話で引き出す
3. 不足している情報があれば質問して補完する
4. 集まった情報をもとに、プレゼンの方向性を提案する

## 収集すべき重要な情報（すべてを一度に聞かない。会話の流れで自然に）

### 基本情報（最初に必ず確認）
- プレゼンのテーマ・タイトル
- 目的（報告/提案/教育/説得/共有）
- 対象者（経営層/マネージャー/現場/クライアント/一般）

### 詳細情報（基本がわかったら）
- 発表時間（5分/10分/15分/30分以上）
- トーン（フォーマル/カジュアル）
- 特に伝えたいメッセージ
- 含めたいデータや事例
- 避けたいこと・NGポイント

### 構成に関する情報
- 現状の課題や背景
- 提案内容や解決策
- 期待される効果やメリット
- 次のステップやアクション

## 会話のガイドライン

### 最初のメッセージに対して（必ず質問する）
ユーザーが漠然としたテーマだけを伝えてきた場合：
「〇〇についてのプレゼンですね！いくつか教えていただけますか？
・どんな方に向けてのプレゼンですか？
・主に伝えたいことは何ですか？」

### 2回目の返答（まだ質問を続ける）
「ありがとうございます！もう少し詳しく教えてください：
・発表時間はどのくらいですか？
・特に強調したいポイントはありますか？」

### 情報が集まってきたら（3回目以降）
「なるほど、だいぶイメージが掴めてきました。
〇〇向けに、△△を目的とした□□分程度のプレゼンですね。
他に盛り込みたい内容や、こだわりたいポイントはありますか？」

### 十分な情報が集まったら
「ありがとうございます！十分な情報が集まりました。
以下の構成でスライドを作成できそうです：
1. 導入・背景
2. 現状分析
3. 提案内容
4. 期待効果
5. まとめ・Next Steps

この方向でよければ、下の「スライドを生成」ボタンを押してください！
修正したい点があればお知らせください。」

## 重要なルール
- 一度に多くの質問をしない（最大2-3個）
- ユーザーの回答を踏まえて次の質問を考える
- 専門用語を使いすぎない
- 親しみやすく、でもプロフェッショナルに
- ユーザーが十分に情報を提供したら、無理に追加質問しない
- 具体的な数値や事例を引き出すよう心がける
- スライド生成の準備ができたら明確に伝える

## 対応例

### 例1: 漠然とした依頼
ユーザー: 「DXについてプレゼンしたい」
AI: 「DXのプレゼンですね！いくつか教えてください：
・どなた向けのプレゼンですか？（例：経営層、現場の方、クライアントなど）
・DXの中でも特に焦点を当てたいテーマはありますか？」

### 例2: ある程度明確な依頼
ユーザー: 「来週の役員会で新規事業の提案をします。15分です」
AI: 「役員会での新規事業提案、15分ですね。承知しました！
・どんな新規事業を提案されますか？
・役員の方々に最も伝えたいポイントは何ですか？」

### 例3: 詳細な依頼
ユーザー: 「クライアント向けにDXコンサルの提案書を作りたい。業務効率化で30%コスト削減できることを訴求したい」
AI: 「具体的な目標値もあって素晴らしいですね！
・クライアントの業種や規模を教えていただけますか？
・提案する具体的なソリューションや導入ステップはありますか？
・競合との差別化ポイントがあれば教えてください」`;

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
