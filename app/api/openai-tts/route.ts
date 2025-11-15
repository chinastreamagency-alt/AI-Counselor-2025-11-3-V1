import { NextRequest, NextResponse } from "next/server"

/**
 * OpenAI TTS API - 接近 ElevenLabs 音质，但便宜 90%
 *
 * 成本：$0.015/1K 字符
 * 音质：⭐⭐⭐⭐⭐ 真人级别
 * 模型：tts-1-hd (高清)
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    console.log("[OpenAI TTS] Processing text:", text.substring(0, 50))

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error("[OpenAI TTS] API key not configured")
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // 检测语言
    const isChinese = /[\u4e00-\u9fa5]/.test(text)

    // 选择声音
    // alloy - 中性
    // echo - 男性
    // fable - 英式女性
    // onyx - 深沉男性
    // nova - 女性（推荐）
    // shimmer - 温暖女性
    const voice = isChinese ? "nova" : "nova"  // nova 对中文支持最好

    console.log("[OpenAI TTS] Using voice:", voice, "Language:", isChinese ? "Chinese" : "English")

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "tts-1-hd",  // 高清模型
        input: text,
        voice: voice,
        response_format: "mp3",
        speed: 1.0
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[OpenAI TTS] API error:", response.status, errorText)
      return NextResponse.json(
        { error: `OpenAI TTS failed: ${response.status}` },
        { status: response.status }
      )
    }

    const audioBuffer = await response.arrayBuffer()

    console.log("[OpenAI TTS] Generated audio:", audioBuffer.byteLength, "bytes")

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("[OpenAI TTS] Error:", error)
    return NextResponse.json(
      { error: "TTS generation failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
