import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export const maxDuration = 30

const systemPrompt = `You are a compassionate and professional AI therapist. Your role is to:
- Listen actively and empathetically
- Ask thoughtful follow-up questions
- Provide supportive guidance
- Help users explore their feelings
- Maintain professional boundaries
- Keep responses concise (2-3 sentences) for natural conversation flow

Remember: You are not a replacement for professional mental health services. If someone is in crisis, encourage them to seek immediate professional help.`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    console.log("[v0] Chat API received messages:", messages?.length)

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 150, // Keep responses concise for voice
    })

    console.log("[v0] AI response generated:", result.text.substring(0, 50) + "...")

    // 返回普通 JSON 响应（兼容前端代码）
    return Response.json({
      message: result.text,
    })
  } catch (error) {
    console.error("[v0] Error in chat API:", error)
    return new Response(
      JSON.stringify({
        error: "server_error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
