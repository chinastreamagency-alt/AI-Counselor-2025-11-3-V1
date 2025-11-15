import { NextRequest, NextResponse } from "next/server"
import { getAudioStream } from "edge-tts"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    console.log("[Edge TTS] Processing text:", text.substring(0, 50))

    // 检测语言
    const isChinese = /[\u4e00-\u9fa5]/.test(text)

    // 选择声音
    // 中文：XiaoxiaoNeural (温暖女声)
    // 英文：JennyNeural (友好女声)
    const voice = isChinese ? "zh-CN-XiaoxiaoNeural" : "en-US-JennyNeural"

    console.log("[Edge TTS] Using voice:", voice)

    // 调用 Edge TTS
    const audioStream = getAudioStream(text, {
      voice,
      rate: "-5%",    // 稍慢，更容易理解
      pitch: "+0Hz",  // 自然音调
    })

    // 收集音频数据
    const chunks: Buffer[] = []
    for await (const chunk of audioStream) {
      if (chunk.type === "audio") {
        chunks.push(chunk.data)
      }
    }

    const audioBuffer = Buffer.concat(chunks)

    console.log("[Edge TTS] Generated audio:", audioBuffer.length, "bytes")

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("[Edge TTS] Error:", error)
    return NextResponse.json(
      { error: "TTS generation failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
