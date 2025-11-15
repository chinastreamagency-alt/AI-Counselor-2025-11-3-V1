import { NextRequest, NextResponse } from "next/server"

/**
 * Microsoft Edge TTS API - 完全免费的 TTS 方案
 * 使用直接 HTTP 调用，避免 edge-tts 包的编译问题
 */
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

    // 生成 SSML（Speech Synthesis Markup Language）
    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${isChinese ? 'zh-CN' : 'en-US'}'>
      <voice name='${voice}'>
        <prosody rate='-5%' pitch='+0Hz'>
          ${escapeXml(text)}
        </prosody>
      </voice>
    </speak>`

    // 调用 Microsoft Edge TTS API
    const response = await fetch(
      `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&Sec-MS-GEC=0B5859F01DEA5D33B9B90D2EA54E7B02&Sec-MS-GEC-Version=1-${Date.now()}.${Math.floor(Math.random() * 1000000000)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
        },
        body: ssml,
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Edge TTS] API error:", response.status, errorText)
      throw new Error(`Edge TTS API error: ${response.status} ${errorText}`)
    }

    const audioBuffer = await response.arrayBuffer()

    console.log("[Edge TTS] Generated audio:", audioBuffer.byteLength, "bytes")

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
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

/**
 * 转义 XML 特殊字符
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
