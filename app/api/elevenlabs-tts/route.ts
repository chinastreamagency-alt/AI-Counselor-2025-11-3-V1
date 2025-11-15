import { NextRequest, NextResponse } from "next/server"

/**
 * ElevenLabs TTS API - 最佳真人语音效果
 *
 * 免费额度：10,000 字符/月
 * 音质：⭐⭐⭐⭐⭐ 顶级真人
 * 成本（超出后）：$22/月（300,000 字符）
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    console.log("[ElevenLabs] Processing text:", text.substring(0, 50))

    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      console.error("[ElevenLabs] API key not configured")
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      )
    }

    // 检测语言
    const isChinese = /[\u4e00-\u9fa5]/.test(text)

    // 选择声音
    // Rachel (英文): 21m00Tcm4TlvDq8ikWAM - 温暖友好女声
    // Bella (多语言): EXAVITQu4vr4xnSDxMaL - 柔和女声，支持中文
    const voiceId = isChinese ? "EXAVITQu4vr4xnSDxMaL" : "21m00Tcm4TlvDq8ikWAM"

    console.log("[ElevenLabs] Using voice:", voiceId, "Language:", isChinese ? "Chinese" : "English")

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2", // 支持中文
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[ElevenLabs] API error:", response.status, errorText)

      // 如果是配额用完或其他错误，返回特定错误信息
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid ElevenLabs API key" },
          { status: 401 }
        )
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: "ElevenLabs quota exceeded" },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: `ElevenLabs TTS failed: ${response.status}` },
        { status: response.status }
      )
    }

    const audioBuffer = await response.arrayBuffer()

    console.log("[ElevenLabs] Generated audio:", audioBuffer.byteLength, "bytes")

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("[ElevenLabs] Error:", error)
    return NextResponse.json(
      { error: "TTS generation failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
