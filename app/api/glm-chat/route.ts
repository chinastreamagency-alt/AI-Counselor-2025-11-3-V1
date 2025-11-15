import { NextRequest, NextResponse } from "next/server"
import { ENHANCED_THERAPY_PROMPT, CRISIS_RESOURCES } from "@/lib/therapy-prompts"
import { shouldTriggerPHQ9, shouldTriggerGAD7, detectCrisisSignals } from "@/lib/assessment-tools"

export async function POST(request: NextRequest) {
  try {
    const { messages, userId } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    console.log("[GLM Chat] Processing request for user:", userId)
    console.log("[GLM Chat] Message count:", messages.length)

    // 检测危机信号
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    if (lastUserMessage) {
      const crisisDetection = detectCrisisSignals(lastUserMessage.content)

      if (crisisDetection.hasCrisis) {
        console.log("[GLM Chat] ⚠️ CRISIS DETECTED:", crisisDetection.type)

        // 检测语言
        const isChinese = /[\u4e00-\u9fa5]/.test(lastUserMessage.content)

        // 立即返回危机资源
        return NextResponse.json({
          message: CRISIS_RESOURCES[isChinese ? 'zh' : 'en'],
          needsCrisisIntervention: true,
          crisisType: crisisDetection.type
        })
      }
    }

    // 检查是否需要评估工具
    const needsPHQ9 = shouldTriggerPHQ9(messages)
    const needsGAD7 = shouldTriggerGAD7(messages)

    console.log("[GLM Chat] Assessment needs:", { needsPHQ9, needsGAD7 })

    // 构建发送给 GLM 的消息
    const glmMessages = [
      {
        role: "system",
        content: ENHANCED_THERAPY_PROMPT
      },
      ...messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    ]

    // 如果需要评估，在系统消息中添加提示
    if (needsPHQ9 || needsGAD7) {
      glmMessages[0].content += `\n\n[ASSESSMENT NEEDED: The user has shown signs of ${needsPHQ9 ? 'depression' : ''}${needsPHQ9 && needsGAD7 ? ' and ' : ''}${needsGAD7 ? 'anxiety' : ''}. Consider gently suggesting a ${needsPHQ9 ? 'PHQ-9' : ''}${needsPHQ9 && needsGAD7 ? ' and ' : ''}${needsGAD7 ? 'GAD-7' : ''} assessment in your next response.]`
    }

    console.log("[GLM Chat] Calling GLM-4-Flash API...")

    // 调用 GLM-4-Flash API
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GLM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "glm-4-flash",  // 免费模型
        messages: glmMessages,
        temperature: 0.7,  // 降低随机性，提高专业性
        top_p: 0.95,
        max_tokens: 500,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[GLM Chat] API Error:", response.status, errorText)

      // 如果是 API Key 问题，返回有用的错误信息
      if (response.status === 401) {
        return NextResponse.json(
          { error: "GLM API key is invalid or missing. Please set GLM_API_KEY in environment variables." },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: "GLM API request failed", details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.choices || data.choices.length === 0) {
      console.error("[GLM Chat] No choices in response:", data)
      return NextResponse.json({ error: "No response from GLM" }, { status: 500 })
    }

    const aiMessage = data.choices[0].message.content

    console.log("[GLM Chat] Success! Response length:", aiMessage.length)
    console.log("[GLM Chat] Usage:", data.usage)

    return NextResponse.json({
      message: aiMessage,
      needsPHQ9,
      needsGAD7,
      usage: data.usage  // 返回使用统计
    })

  } catch (error) {
    console.error("[GLM Chat] Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
