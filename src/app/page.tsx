"use client"

import Image from "next/image"
import { useState } from "react"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResponse("")

    try {
      const res = await fetch("/api/langchain/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "APIエラーが発生しました")
      }

      // ストリームの読み取り
      const reader = res.body?.getReader()
      if (!reader) {
        throw new Error("レスポンスボディを読み取れませんでした")
      }

      // テキストデコーダーの作成
      const decoder = new TextDecoder()
      let responseText = ""

      // ストリームからデータを読み取る
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // バイナリデータをテキストに変換
        const chunk = decoder.decode(value, { stream: true })

        // Server-Sent Events (SSE) の形式を解析
        const lines = chunk.split("\n\n")
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.substring(6)

            // 完了メッセージの確認
            if (data === "[DONE]") {
              setLoading(false)
              continue
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.token) {
                responseText += parsed.token
                setResponse(responseText)
              } else if (parsed.error) {
                throw new Error(parsed.error)
              }
            } catch (e) {
              // JSONパースエラーは無視（不完全なチャンクの場合）
              if (!(e instanceof SyntaxError)) {
                throw e
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("エラーが発生しました:", error)
      setResponse(`エラー: ${error instanceof Error ? error.message : "不明なエラー"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center w-full max-w-3xl">
        <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={180} height={38} priority />

        <div className="w-full bg-black/[.05] dark:bg-white/[.06] p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">LangChain.js デモ</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md bg-white text-black dark:bg-gray-800 dark:text-white"
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="質問を入力してください..."
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            >
              {loading ? "処理中..." : "送信"}
            </button>
          </form>

          {response && (
            <div className="mt-6 p-4 bg-white/[.08] dark:bg-black/[.15] rounded-md">
              <h3 className="font-bold mb-2">応答:</h3>
              <p className="whitespace-pre-wrap">{response}</p>
            </div>
          )}
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://js.langchain.com/docs/"
            target="_blank"
            rel="noopener noreferrer"
          >
            LangChain.js ドキュメント
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js ドキュメント
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  )
}
