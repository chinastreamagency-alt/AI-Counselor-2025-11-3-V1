import type { UserProfile } from "@/lib/user-profile"
import { getLastConversationSummary } from "@/lib/session-storage"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[v0] OPENAI_API_KEY is not set")
      return new Response(JSON.stringify({ error: "OpenAI API key is not configured" }), { status: 500 })
    }

    const { messages, userProfile, userId } = await req.json()
    console.log("[v0] Therapy chat request with", messages.length, "messages")

    if (userProfile) {
      console.log("[v0] User profile included, session count:", userProfile.sessionCount)
    }

    const lastConversation = userId ? getLastConversationSummary(userId) : []
    const isResumingConversation = lastConversation.length > 0 && messages.length <= 2

    const systemPrompt = `You are Aria, a professional AI psychological counselor with expertise in Cognitive Behavioral Therapy (CBT), Positive Psychology, and Solution-Focused Brief Therapy.

CRITICAL: Respond in the SAME LANGUAGE the user speaks. If Chinese, respond in Chinese. If English, respond in English. Match their language naturally.

${
  isResumingConversation
    ? `
CONVERSATION RESUME MODE:
The user is returning after a break. Their last conversation included:
${lastConversation.join("\n")}

When they start speaking, naturally acknowledge the previous conversation and help them continue from where they left off. For example:
"Welcome back! I remember we were discussing [topic]. How have things been since we last talked?"

Do NOT repeat your introduction. Jump right into continuing the conversation.
`
    : ""
}

Professional Counseling Standards:

1. GREETING PHASE (First Session ONLY):
   - Introduce yourself warmly: "Hi! I'm Aria, your personal AI counselor. It's wonderful to meet you. I'm here to listen and support you in a safe, confidential space."
   - Build trust and rapport before diving into issues
   - ONLY introduce yourself ONCE at the very beginning of the FIRST session

2. LISTENING PHASE:
   - Use empathetic validation: "That sounds really challenging" or "I can sense how much this is affecting you"
   - Reflect back what you hear: "So if I understand correctly, you're feeling..."
   - Avoid repetitive phrases - vary your empathetic responses
   - Show genuine understanding without being formulaic

3. GUIDING PHASE:
   - Ask targeted, meaningful questions based on what they share
   - Example: If they say "work stress", ask "Is it the workload itself, or perhaps the dynamics with colleagues?"
   - Avoid generic questions - make each question specific to their situation
   - Help them explore root causes and patterns

4. FEEDBACK PHASE (Within 20-30 minute session):
   - Provide specific, actionable advice based on their situation
   - Example: "Since you mentioned difficulty sleeping due to work anxiety, you might try spending 10 minutes before bed writing down tomorrow's top 3 priorities. This can help reduce the mental load."
   - Offer concrete coping strategies, not just validation
   - Help them identify their strengths and resources

Response Style:
- Keep responses concise (2-4 sentences typically)
- Be warm, patient, and professional - like a trusted advisor
- Adjust tone based on their emotional state (calm them if agitated, energize if depressed)
- Make them feel heard, understood, and supported
- Provide real value - not just questions, but insights and guidance

${
  userProfile
    ? `
Client Profile:
- Name: ${userProfile.name || "Not yet shared"}
- Age: ${userProfile.age || "Not yet shared"}
- Status: ${userProfile.status || "Not yet shared"}
- Session Count: ${userProfile.sessionCount} sessions
${userProfile.mainConcerns.length > 0 ? `- Main Concerns: ${userProfile.mainConcerns.join(", ")}` : ""}
${userProfile.topThreeConcerns.length > 0 ? `- Top 3 Issues: ${userProfile.topThreeConcerns.join(", ")}` : ""}
${userProfile.difficultPeople.length > 0 ? `- Difficult People: ${userProfile.difficultPeople.map((p: any) => `${p.name} (${p.relationship})`).join(", ")}` : ""}
${userProfile.strengths.length > 0 ? `- Strengths: ${userProfile.strengths.join(", ")}` : ""}
${userProfile.goals.length > 0 ? `- Goals: ${userProfile.goals.join(", ")}` : ""}

Remember previous sessions and build on them. Reference past discussions naturally.
`
    : `
This is the first session. After greeting, gradually collect:
- Name/nickname (naturally, not forced)
- Age and life stage
- Main concerns (top 3 issues)
- Key relationships
- Strengths and goals

Collect this over multiple sessions (7-30 sessions), not all at once. Be patient and natural.
`
}

IMPORTANT: 
- Do NOT introduce yourself in every response - only at the very beginning of the FIRST session
- If resuming a conversation, acknowledge the previous discussion and continue naturally
- Focus on listening, understanding, and providing value
- Make each session feel like progress toward their goals
- Balance empathy with forward movement
- Provide specific, actionable insights when appropriate`

    console.log("[v0] Calling OpenAI Chat Completions API...")

    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 300,
        temperature: 0.9,
      }),
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error("[v0] OpenAI API error:", apiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${apiResponse.status} ${errorText}`)
    }

    const data = await apiResponse.json()
    console.log("[v0] OpenAI response received")

    const messageText = data.choices[0]?.message?.content
    if (!messageText) {
      throw new Error("No message content in OpenAI response")
    }

    console.log("[v0] Response text length:", messageText.length)

    const profileUpdate = extractProfileUpdates(messages, messageText, userProfile)

    return new Response(JSON.stringify({ message: messageText, profileUpdate }), { status: 200 })
  } catch (error: any) {
    console.error("[v0] Error in therapy chat:", error)
    console.error("[v0] Error message:", error?.message)
    console.error("[v0] Error stack:", error?.stack)

    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
        details: error?.message || String(error),
      }),
      { status: 500 },
    )
  }
}

function extractProfileUpdates(
  messages: any[],
  response: string,
  currentProfile?: UserProfile,
): Partial<UserProfile> | null {
  const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || ""
  const lastUserMessageFull = messages[messages.length - 1]?.content || ""
  const updates: Partial<UserProfile> = {}

  const namePatterns = [/我叫(.{1,10})/, /叫我(.{1,10})/, /我是(.{1,10})/]
  for (const pattern of namePatterns) {
    const match = lastUserMessageFull.match(pattern)
    if (match && match[1] && !currentProfile?.name) {
      updates.name = match[1].trim()
      break
    }
  }

  const agePatterns = [/(\d{1,2})岁/, /今年(\d{1,2})/, /(\d{1,2})年/]
  for (const pattern of agePatterns) {
    const match = lastUserMessageFull.match(pattern)
    if (match && match[1] && !currentProfile?.age) {
      updates.age = match[1]
      break
    }
  }

  if (!currentProfile?.status) {
    if (lastUserMessage.includes("学生") || lastUserMessage.includes("上学") || lastUserMessage.includes("读书")) {
      updates.status = "student"
    } else if (
      lastUserMessage.includes("工作") ||
      lastUserMessage.includes("上班") ||
      lastUserMessage.includes("职场")
    ) {
      updates.status = "working"
    }
  }

  const concernKeywords = ["困扰", "问题", "烦恼", "担心", "焦虑", "压力", "难过", "郁闷", "痛苦"]
  if (concernKeywords.some((kw) => lastUserMessage.includes(kw))) {
    const concern = lastUserMessageFull.substring(0, 80)
    if (concern && currentProfile && !currentProfile.mainConcerns.some((c) => c.includes(concern.substring(0, 20)))) {
      updates.mainConcerns = [...(currentProfile.mainConcerns || []), concern].slice(-5)

      if (currentProfile.topThreeConcerns.length < 3) {
        updates.topThreeConcerns = [...(currentProfile.topThreeConcerns || []), concern].slice(0, 3)
      }
    }
  }

  const peoplePatterns = [
    { pattern: /同事(.{1,10})/, relationship: "colleague" },
    { pattern: /朋友(.{1,10})/, relationship: "friend" },
    { pattern: /家人(.{1,10})/, relationship: "family" },
    { pattern: /导师(.{1,10})/, relationship: "mentor" },
    { pattern: /老板(.{1,10})/, relationship: "boss" },
  ]

  for (const { pattern, relationship } of peoplePatterns) {
    const match = lastUserMessageFull.match(pattern)
    if (match && match[1]) {
      const name = match[1].trim()
      if (name && currentProfile && !currentProfile.difficultPeople.some((p) => p.name === name)) {
        updates.difficultPeople = [...(currentProfile.difficultPeople || []), { name, relationship }].slice(-5)
      }
    }
  }

  const relationshipKeywords = ["人际", "关系", "朋友", "家人", "同事", "导师"]
  if (relationshipKeywords.some((kw) => lastUserMessage.includes(kw))) {
    if (currentProfile && !currentProfile.recurringThemes.includes("人际关系")) {
      updates.recurringThemes = [...(currentProfile.recurringThemes || []), "人际关系"].slice(-5)
    }
  }

  const workKeywords = ["工作", "职场", "上班", "加班", "项目"]
  if (workKeywords.some((kw) => lastUserMessage.includes(kw))) {
    if (currentProfile && !currentProfile.recurringThemes.includes("工作压力")) {
      updates.recurringThemes = [...(currentProfile.recurringThemes || []), "工作压力"].slice(-5)
    }
  }

  return Object.keys(updates).length > 0 ? updates : null
}
