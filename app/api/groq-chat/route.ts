import { NextRequest, NextResponse } from "next/server"
import { detectCrisisSignals, CRISIS_RESOURCES } from "@/lib/assessment-tools"
import { ENHANCED_THERAPY_PROMPT } from "@/lib/therapy-prompts"
import { loadUserProfile, generateProfileContext } from "@/lib/user-profile-manager"

/**
 * Groq API Chat - 免费商用 LLM 方案
 *
 * 免费额度：
 * - 30,000 tokens/分钟
 * - 43,200,000 tokens/天
 * - 模型：Llama 3.3 70B（接近 GPT-4 质量）
 * - 速度：300+ tokens/秒
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, userId } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 })
    }

    console.log("[Groq Chat] Processing", messages.length, "messages for user:", userId)

    // 加载用户画像（长期记忆）
    let profileContext = ""
    if (userId) {
      const profile = await loadUserProfile(userId)
      profileContext = generateProfileContext(profile)
      console.log("[Groq Chat] Loaded user profile with", profile.total_sessions, "sessions")
    }

    // 危机检测
    const lastUserMessage = messages[messages.length - 1]
    if (lastUserMessage?.role === "user") {
      const crisisDetection = detectCrisisSignals(lastUserMessage.content)

      if (crisisDetection.hasCrisis) {
        console.log("[Groq Chat] CRISIS DETECTED:", crisisDetection.type, crisisDetection.urgency)

        // 检测语言
        const isChinese = /[\u4e00-\u9fa5]/.test(lastUserMessage.content)

        return NextResponse.json({
          message: CRISIS_RESOURCES[isChinese ? 'zh' : 'en'],
          needsCrisisIntervention: true,
          crisisType: crisisDetection.type,
          urgency: crisisDetection.urgency
        })
      }
    }

    // 构建完整的消息历史
    const groqMessages = [
      {
        role: "system",
        content: ENHANCED_THERAPY_PROMPT + (profileContext ? `\n\n## USER CONTEXT\n${profileContext}` : "")
      },
      ...messages
    ]

    // 调用 Groq API
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      console.error("[Groq Chat] GROQ_API_KEY not configured")
      return NextResponse.json(
        { error: "Groq API key not configured" },
        { status: 500 }
      )
    }

    console.log("[Groq Chat] Calling Groq API with model: llama-3.3-70b-versatile")

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.9,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Groq Chat] API error:", response.status, errorText)

      // 提供友好的错误信息
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid Groq API key. Please check GROQ_API_KEY environment variable." },
          { status: 500 }
        )
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again in a moment." },
          { status: 429 }
        )
      }

      throw new Error(`Groq API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()

    const assistantMessage = data.choices?.[0]?.message?.content

    if (!assistantMessage) {
      console.error("[Groq Chat] No response from Groq:", data)
      throw new Error("No response from Groq API")
    }

    console.log("[Groq Chat] Success! Response length:", assistantMessage.length)
    console.log("[Groq Chat] Tokens used:", data.usage?.total_tokens || "unknown")

    return NextResponse.json({
      message: assistantMessage,
      usage: data.usage,
      model: data.model
    })

  } catch (error) {
    console.error("[Groq Chat] Error:", error)
    return NextResponse.json(
      { error: "Chat failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
