import { NextRequest, NextResponse } from "next/server"
import { ChatOpenAI } from "@langchain/openai"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { ChatPromptTemplate } from "@langchain/core/prompts"

// APIハンドラー
export async function POST(req: NextRequest) {
  try {
    // リクエストからデータを取得
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "プロンプトが必要です" }, { status: 400 })
    }

    // OpenAIのモデルを初期化
    const model = new ChatOpenAI({
      // OpenAI APIキーは環境変数から取得されます
      modelName: "gpt-3.5-turbo",
    })

    // プロンプトテンプレートを作成
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", "あなたは役立つAIアシスタントです。"],
      ["human", "{input}"],
    ])

    // LangChainのチェーンを作成
    const chain = promptTemplate.pipe(model).pipe(new StringOutputParser())

    // チェーンを実行
    const response = await chain.invoke({
      input: prompt,
    })

    // 結果を返す
    return NextResponse.json({ result: response })
  } catch (error) {
    console.error("エラーが発生しました:", error)
    return NextResponse.json({ error: "リクエストの処理中にエラーが発生しました" }, { status: 500 })
  }
}
