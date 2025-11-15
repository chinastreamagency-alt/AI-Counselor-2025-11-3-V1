// PHQ-9 抑郁症筛查工具
export const PHQ9_QUESTIONS = [
  {
    id: 1,
    zh: "在过去两周内，你有多少天感到兴趣或乐趣很少？",
    en: "Over the last 2 weeks, how often have you had little interest or pleasure in doing things?"
  },
  {
    id: 2,
    zh: "感到情绪低落、沮丧或绝望？",
    en: "Feeling down, depressed, or hopeless?"
  },
  {
    id: 3,
    zh: "入睡困难、睡眠浅或睡眠过多？",
    en: "Trouble falling or staying asleep, or sleeping too much?"
  },
  {
    id: 4,
    zh: "感到疲倦或没有精力？",
    en: "Feeling tired or having little energy?"
  },
  {
    id: 5,
    zh: "食欲不振或进食过多？",
    en: "Poor appetite or overeating?"
  },
  {
    id: 6,
    zh: "觉得自己很糟糕或是一个失败者，或让自己或家人失望？",
    en: "Feeling bad about yourself or that you are a failure or have let yourself or your family down?"
  },
  {
    id: 7,
    zh: "难以集中注意力，例如阅读报纸或看电视时？",
    en: "Trouble concentrating on things, such as reading the newspaper or watching television?"
  },
  {
    id: 8,
    zh: "行动或说话缓慢到别人已经注意到？或相反，烦躁不安，无法静坐？",
    en: "Moving or speaking so slowly that other people could have noticed? Or being so fidgety or restless that you have been moving around a lot more than usual?"
  },
  {
    id: 9,
    zh: "有想要伤害自己或认为自己死了更好的念头？",
    en: "Thoughts that you would be better off dead, or of hurting yourself?"
  }
]

export const PHQ9_OPTIONS = [
  { value: 0, zh: "完全不会", en: "Not at all" },
  { value: 1, zh: "几天", en: "Several days" },
  { value: 2, zh: "一半以上的天数", en: "More than half the days" },
  { value: 3, zh: "几乎每天", en: "Nearly every day" }
]

export function interpretPHQ9(score: number): {
  severity: string
  severityZh: string
  recommendation: string
  recommendationZh: string
} {
  if (score <= 4) {
    return {
      severity: "minimal",
      severityZh: "最小",
      recommendation: "Continue monitoring and maintain healthy lifestyle",
      recommendationZh: "继续监测，保持健康生活方式"
    }
  } else if (score <= 9) {
    return {
      severity: "mild",
      severityZh: "轻度",
      recommendation: "Consider counseling or self-help therapy",
      recommendationZh: "考虑心理咨询或自助疗法"
    }
  } else if (score <= 14) {
    return {
      severity: "moderate",
      severityZh: "中度",
      recommendation: "Professional counseling recommended",
      recommendationZh: "建议寻求专业心理咨询"
    }
  } else if (score <= 19) {
    return {
      severity: "moderately_severe",
      severityZh: "中重度",
      recommendation: "Strongly recommend professional treatment",
      recommendationZh: "强烈建议寻求专业治疗"
    }
  } else {
    return {
      severity: "severe",
      severityZh: "重度",
      recommendation: "Immediate professional help needed, consider medication",
      recommendationZh: "需要立即寻求专业帮助，考虑药物治疗"
    }
  }
}

// GAD-7 焦虑症筛查工具
export const GAD7_QUESTIONS = [
  {
    id: 1,
    zh: "在过去两周内，你有多少天感到紧张、焦虑或处于崩溃边缘？",
    en: "Over the last 2 weeks, how often have you been feeling nervous, anxious, or on edge?"
  },
  {
    id: 2,
    zh: "无法停止或控制担忧？",
    en: "Not being able to stop or control worrying?"
  },
  {
    id: 3,
    zh: "对各种事情过度担忧？",
    en: "Worrying too much about different things?"
  },
  {
    id: 4,
    zh: "难以放松？",
    en: "Trouble relaxing?"
  },
  {
    id: 5,
    zh: "烦躁不安，难以静坐？",
    en: "Being so restless that it is hard to sit still?"
  },
  {
    id: 6,
    zh: "容易烦恼或易怒？",
    en: "Becoming easily annoyed or irritable?"
  },
  {
    id: 7,
    zh: "感到害怕，好像会发生可怕的事情？",
    en: "Feeling afraid, as if something awful might happen?"
  }
]

export function interpretGAD7(score: number): {
  severity: string
  severityZh: string
  recommendation: string
  recommendationZh: string
} {
  if (score <= 4) {
    return {
      severity: "minimal",
      severityZh: "最小",
      recommendation: "Continue monitoring and maintain healthy lifestyle",
      recommendationZh: "继续监测，保持健康生活方式"
    }
  } else if (score <= 9) {
    return {
      severity: "mild",
      severityZh: "轻度",
      recommendation: "Consider learning anxiety management techniques",
      recommendationZh: "考虑学习焦虑管理技巧"
    }
  } else if (score <= 14) {
    return {
      severity: "moderate",
      severityZh: "中度",
      recommendation: "Professional counseling recommended",
      recommendationZh: "建议寻求专业心理咨询"
    }
  } else {
    return {
      severity: "severe",
      severityZh: "重度",
      recommendation: "Strongly recommend professional treatment",
      recommendationZh: "强烈建议寻求专业治疗"
    }
  }
}

// 检测是否需要进行 PHQ-9 评估
export function shouldTriggerPHQ9(messages: { role: string; content: string }[]): boolean {
  const keywords = [
    "抑郁", "郁闷", "没兴趣", "疲倦", "失眠", "睡不着", "食欲",
    "没精神", "无力", "绝望", "想死", "自杀", "自残",
    "depression", "depressed", "hopeless", "suicide", "suicidal", "tired",
    "no energy", "sleep", "insomnia", "appetite", "worthless"
  ]

  const recentMessages = messages.slice(-10).map(m => m.content.toLowerCase())
  const matchCount = recentMessages.filter(msg =>
    keywords.some(kw => msg.includes(kw.toLowerCase()))
  ).length

  return matchCount >= 3  // 最近10条消息中提到3次以上
}

// 检测是否需要进行 GAD-7 评估
export function shouldTriggerGAD7(messages: { role: string; content: string }[]): boolean {
  const keywords = [
    "焦虑", "紧张", "担心", "害怕", "恐慌", "不安", "烦躁", "压力",
    "anxiety", "anxious", "worried", "worry", "panic", "nervous", "restless", "stress"
  ]

  const recentMessages = messages.slice(-10).map(m => m.content.toLowerCase())
  const matchCount = recentMessages.filter(msg =>
    keywords.some(kw => msg.includes(kw.toLowerCase()))
  ).length

  return matchCount >= 3
}

// 检测危机信号
export function detectCrisisSignals(message: string): {
  hasCrisis: boolean
  type?: 'suicide' | 'self_harm' | 'harm_others'
  urgency: 'low' | 'medium' | 'high'
} {
  const suicideKeywords = [
    "自杀", "想死", "不想活", "结束生命", "suicide", "kill myself",
    "end my life", "better off dead", "want to die"
  ]

  const selfHarmKeywords = [
    "自残", "割腕", "伤害自己", "self harm", "cut myself", "hurt myself"
  ]

  const harmOthersKeywords = [
    "杀", "伤害别人", "报复", "kill", "hurt others", "revenge", "harm someone"
  ]

  const msgLower = message.toLowerCase()

  if (suicideKeywords.some(kw => msgLower.includes(kw.toLowerCase()))) {
    return { hasCrisis: true, type: 'suicide', urgency: 'high' }
  }

  if (selfHarmKeywords.some(kw => msgLower.includes(kw.toLowerCase()))) {
    return { hasCrisis: true, type: 'self_harm', urgency: 'high' }
  }

  if (harmOthersKeywords.some(kw => msgLower.includes(kw.toLowerCase()))) {
    return { hasCrisis: true, type: 'harm_others', urgency: 'high' }
  }

  return { hasCrisis: false, urgency: 'low' }
}

// 危机干预资源
export const CRISIS_RESOURCES = {
  zh: `
🚨 我很担心你的安全。请立即联系专业帮助：

**紧急求助**：
- 中国心理危机干预热线：400-161-9995
- 北京心理危机研究与干预中心：010-82951332
- 生命热线（香港）：2382 0000
- 生命线（台湾）：1995

**24小时服务**：
- 免费心理援助热线：12320
- 紧急情况请拨打：110 或 120

记住：你的生命很重要，请寻求帮助。
`,
  en: `
🚨 I'm concerned about your safety. Please reach out immediately:

**Crisis Hotlines**:
- National Suicide Prevention Lifeline: 988 (US)
- Crisis Text Line: Text HOME to 741741 (US)
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

**Emergency**:
- Call 911 (US)
- Call 999 (UK)
- Call 000 (Australia)

Remember: Your life matters. Please seek help.
`
}
