import { NextRequest } from "next/server"
import { ChatOpenAI } from "@langchain/openai"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { ChatPromptTemplate } from "@langchain/core/prompts"

// APIハンドラー
export async function POST(req: NextRequest) {
  try {
    // リクエストからデータを取得
    const { prompt } = await req.json()

    if (!prompt) {
      return new Response(JSON.stringify({ error: "プロンプトが必要です" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // ストリーミング用のエンコーダーとストリームを作成
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // OpenAIのモデルを初期化（ストリーミング有効）
    const model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken: async token => {
            // 新しいトークンを受け取るたびにストリームに書き込む
            await writer.write(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
          },
          handleLLMEnd: async () => {
            // 生成完了時にストリームを閉じる
            await writer.write(encoder.encode("data: [DONE]\n\n"))
            await writer.close()
          },
          handleLLMError: async error => {
            // エラー発生時にエラーメッセージをストリームに書き込み、ストリームを閉じる
            console.error("LLMエラー:", error)
            await writer.write(encoder.encode(`data: ${JSON.stringify({ error: "エラーが発生しました" })}\n\n`))
            await writer.close()
          },
        },
      ],
    })

    // プロンプトテンプレートを作成
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", "あなたは役立つAIアシスタントです。"],
      ["human", "{input}"],
    ])

    // LangChainのチェーンを作成
    const chain = promptTemplate.pipe(model).pipe(new StringOutputParser())

    // チェーンを非同期で実行（結果を待たない）
    chain
      .invoke({
        input: prompt,
      })
      .catch(error => {
        console.error("チェーン実行エラー:", error)
      })

    // ストリームを返す
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("エラーが発生しました:", error)
    return new Response(JSON.stringify({ error: "リクエストの処理中にエラーが発生しました" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
