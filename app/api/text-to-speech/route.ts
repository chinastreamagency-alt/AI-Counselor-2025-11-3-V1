export const maxDuration = 30

function detectLanguage(text: string): string {
  const chineseRegex = /[\u4e00-\u9fa5]/
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/
  const koreanRegex = /[\uac00-\ud7af]/
  const arabicRegex = /[\u0600-\u06ff]/

  if (chineseRegex.test(text)) return "zh"
  if (japaneseRegex.test(text)) return "ja"
  if (koreanRegex.test(text)) return "ko"
  if (arabicRegex.test(text)) return "ar"
  return "en"
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== "string") {
      console.error("[v0] Invalid text parameter:", text)
      return new Response(
        JSON.stringify({
          error: "invalid_text",
          message: "Text parameter is required and must be a string",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("[v0] ElevenLabs TTS request for text length:", text.length)

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error("[v0] ELEVENLABS_API_KEY is not configured")
      return new Response(
        JSON.stringify({
          error: "no_api_key",
          message: "ElevenLabs API key is not configured.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    const language = detectLanguage(text)

    const voiceId = "EXAVITQu4vr4xnSDxMaL" // Bella - young female multilingual voice

    console.log("[v0] Using ElevenLabs voice:", voiceId, "for detected language:", language)

    const voiceSettings =
      language === "zh"
        ? {
            // Optimized for natural Chinese pronunciation
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          }
        : {
            // Default settings for other languages
            stability: 0.65,
            similarity_boost: 0.85,
            style: 0.5,
            use_speaker_boost: true,
          }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: voiceSettings,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] ElevenLabs API error:", response.status, errorData)

      return new Response(
        JSON.stringify({
          error: "elevenlabs_error",
          status: response.status,
          message: "ElevenLabs API request failed",
          details: errorData,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("[v0] ElevenLabs TTS succeeded")
    const audioBuffer = await response.arrayBuffer()

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Error in text-to-speech:", error)

    return new Response(
      JSON.stringify({
        error: "server_error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
