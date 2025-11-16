import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

/**
 * Groq Whisper API - 语音转文字
 *
 * 优势：
 * - 完全不依赖浏览器语音引擎
 * - 所有浏览器通用（只需麦克风权限）
 * - 识别准确度业界顶级（Whisper-large-v3）
 * - 完全免费（Groq 提供）
 * - 速度极快（< 1秒）
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      )
    }

    console.log("[Whisper] Received audio file:", audioFile.name, audioFile.size, "bytes")

    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      console.error("[Whisper] GROQ_API_KEY not configured")
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      )
    }

    const groq = new Groq({
      apiKey: apiKey,
    })

    // 调用 Whisper API 进行语音识别
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3", // 最新最准确的模型
      language: "en", // 英文识别（可改为 "zh" 中文，或 undefined 自动检测）
      response_format: "json",
      temperature: 0.0, // 0.0 = 最准确，1.0 = 更有创意
    })

    console.log("[Whisper] Transcription:", transcription.text)

    return NextResponse.json({
      text: transcription.text,
      language: transcription.language || "en",
    })
  } catch (error) {
    console.error("[Whisper] Error:", error)

    // 详细的错误信息
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        error: "Transcription failed",
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
