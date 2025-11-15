# 🧠 CBT/DBT 治疗流程逻辑 - 完整实施指南

## 📖 参考资料来源

### 官方手册（我的 Prompt 基于这些）：

1. **A Therapist's Guide to Brief Cognitive Behavioral Therapy**
   - 来源：美国退伍军人事务部（VA）
   - PDF：https://depts.washington.edu/dbpeds/therapists_guide_to_brief_cbtmanual.pdf

2. **mental-wellness-prompts** (GitHub)
   - 作者：joebwd（由临床心理学家和 AI 工程师团队开发）
   - 链接：https://github.com/joebwd/mental-wellness-prompts
   - 内容：生产级心理健康对话框架

3. **DBT Skills Training Manual** (Marsha Linehan)
   - DBT 创始人的官方手册
   - 结构化的 4 模块训练协议

---

## 🔄 CBT 会话结构（逐步流程）

### 📅 标准 CBT 会话模板（50 分钟）

```
时间分配：
├─ 0-5 分钟：签到和议程设定
├─ 5-10 分钟：回顾作业
├─ 10-40 分钟：核心治疗工作
│  ├─ 识别自动思维
│  ├─ 挑战认知扭曲
│  ├─ 行为实验
│  └─ 技能练习
├─ 40-45 分钟：布置新作业
└─ 45-50 分钟：总结和反馈
```

---

### 第 1 步：签到和议程设定（5 分钟）

**AI 的任务**：
1. ✅ 询问当前情绪状态（1-10 分）
2. ✅ 回顾上次会话要点
3. ✅ 协商今天的讨论主题

**具体对话流程**：

```
AI: "欢迎回来！在我们开始之前，我想先了解一下你现在的感受。

如果用 1-10 分来评估，1 是最糟糕，10 是最好，你现在的情绪是几分？"

[等待用户回答：假设回答 "4 分"]

AI: "4 分，听起来你现在挺不容易的。和上周相比有变化吗？

[等待用户回答]

我记得上次我们谈到了 [上次的主题，例如：工作压力和拖延症]。今天你希望我们讨论什么？是继续上周的话题，还是有新的困扰？"

[用户回答后，确认议程]

AI: "好的，那我们今天就重点讨论 [用户提到的主题]。我们大概有 45 分钟时间，这样安排可以吗？"
```

**代码实现逻辑**：
```typescript
// 签到阶段
if (sessionNumber === 1) {
  return "Hi, I'm Aria. Welcome! What brings you here today?"
} else {
  const lastSession = profile.session_summaries[0]
  return `Welcome back! Last time we talked about "${lastSession.key_insights}".

Before we dive in, on a scale of 1-10, how are you feeling today?

[After response]

Great. Today, what would be most helpful to discuss?`
}
```

---

### 第 2 步：回顾作业（5 分钟）

**AI 的任务**：
1. ✅ 询问作业完成情况
2. ✅ 探讨困难和收获
3. ✅ 强化成功经验

**具体对话流程**：

```
AI: "上周我们说好你会尝试 [具体作业，例如：每天写下 3 件你做得好的事]。你试过了吗？"

[如果完成]
AI: "太好了！你发现了什么？有哪些收获？"

[如果部分完成]
AI: "你做了几次？是什么阻碍了你每天都做？我们一起看看怎么调整这个练习，让它更适合你的生活。"

[如果未完成]
AI: "没关系，很多人都会遇到这种情况。是时间不够，还是忘了，还是有其他原因？

了解阻碍很重要，因为这能帮我们设计更实际的策略。"
```

**代码逻辑**：
```typescript
if (lastSession.homework_assigned && !lastSession.homework_completed) {
  return `I noticed you were going to try "${lastSession.homework_assigned}".

How did it go? What got in the way?

[This is non-judgmental exploration, not criticism]`
}
```

---

### 第 3 步：核心治疗工作（30 分钟）

#### 3A. 识别自动思维

**AI 引导用户找出负面想法**：

```
AI: "当 [触发事件] 发生时，你脑海中第一个想法是什么？"

[例如]
用户："我老板批评了我的报告"
AI: "当你老板批评你的报告时，你脑海中第一个想法是什么？"

用户："我想'我真是个失败者'"
AI: "好的，'我是个失败者'——这是你的自动思维。让我们记下来。"
```

**代码逻辑**：
```typescript
// 使用苏格拉底式提问提取自动思维
const questions = [
  "What went through your mind when that happened?",
  "What did that mean to you?",
  "What's the worst part about that?",
  "If that were true, what would it say about you?"
]

// 记录到认知模式表
await incrementPatternFrequency(userId, "I am a failure", "automatic_thought")
```

---

#### 3B. 识别认知扭曲

**AI 帮助用户识别思维陷阱**：

```
AI: "当你说'我是个失败者'，我注意到这可能是一种叫做'标签化'的思维模式。

标签化是指我们给自己贴上全面的负面标签，而不是看具体的行为。

你觉得这个描述符合你的情况吗？"

[如果用户认同]
AI: "那让我们来看看证据。你能想出任何你成功的例子吗？哪怕很小的事也算。"

[用户可能说："我这周完成了项目"、"我帮助了同事"]

AI: "很好！所以，如果你有这些成功的例子，'我是个失败者'这个想法是否 100% 准确？

或者，更准确的想法可能是什么？比如'我在这个报告上犯了错误，但我也有很多成功的时候'？"
```

**10 种常见认知扭曲**：

| 扭曲类型 | 定义 | 例子 |
|---------|------|------|
| **非黑即白** | 只看极端，没有中间地带 | "如果不是完美，就是失败" |
| **过度概括** | 从单一事件得出普遍结论 | "我失败了一次，所以我总是失败" |
| **心理过滤** | 只关注负面，忽略正面 | "他们说了 10 句好话，1 句批评，我只记得批评" |
| **否定正面** | 拒绝接受好的事情 | "他们只是客气，不是真心称赞我" |
| **跳跃结论** | 没有证据就下结论 | "他没回我信息，肯定是讨厌我"（读心术） |
| **放大/缩小** | 夸大坏事，缩小好事 | "这个小错误会毁了一切" |
| **情绪推理** | 认为感受等于事实 | "我感觉自己没用，所以我就是没用" |
| **应该陈述** | 用"应该"批评自己或他人 | "我应该做得更好" |
| **标签化** | 给自己贴负面标签 | "我是个失败者/笨蛋/废物" |
| **个人化** | 为不受控的事自责 | "项目失败都是我的错" |

**代码逻辑**：
```typescript
// 自动检测认知扭曲
const distortions = detectCognitiveDistortions(userMessage)
// 例如：检测到 "我总是"、"从来不" → all-or-nothing thinking

if (distortions.length > 0) {
  await incrementPatternFrequency(userId, distortions[0], "distortion")

  return `I notice you said "${extractedPhrase}". This sounds like ${distortions[0]} thinking.

${distortions[0]} is when ${explanation}.

Does this sound familiar to you?`
}
```

---

#### 3C. 挑战负面思维（苏格拉底式提问）

**5 个核心问题**：

```
1. "这个想法的证据是什么？"
   → 寻找支持和反对的证据

2. "有没有另一种方式来看待这件事？"
   → 探索替代解释

3. "最坏的情况是什么？最好的情况是什么？最可能的情况是什么？"
   → 现实化灾难化思维

4. "如果你的好朋友处在这种情况，你会对他/她说什么？"
   → 培养自我同情

5. "这个想法对你有帮助吗？它让你更接近还是远离你的目标？"
   → 实用性检验
```

**完整对话示例**：

```
AI: "让我们一起检验'我是个失败者'这个想法。

首先，支持这个想法的证据是什么？"

用户："我的报告被批评了"

AI: "好的。那有没有任何证据反对这个想法？你能想到任何成功的例子吗？"

用户："嗯...我上周的提案被采纳了"

AI: "太好了！所以我们有：
✅ 证据支持：报告被批评
✅ 证据反对：上周提案成功、帮助同事、完成项目

如果我们客观地看，哪个更准确：
A. '我是个失败者'
B. '我有时犯错，但我也有很多成功'

你觉得呢？"
```

**代码逻辑**：
```typescript
// 苏格拉底式提问序列
const socraticQuestions = [
  {
    stage: "evidence_for",
    question: "What evidence supports this thought?",
    followUp: "What evidence contradicts it?"
  },
  {
    stage: "alternative",
    question: "Is there another way to look at this?",
    followUp: "What would you tell a friend in this situation?"
  },
  {
    stage: "worst_best_likely",
    question: "What's the worst that could happen? The best? The most likely?",
    followUp: "How would you cope if the worst happened?"
  },
  {
    stage: "utility",
    question: "Is this thought helpful? Does it move you toward or away from your goals?",
    followUp: "What thought WOULD be more helpful?"
  }
]
```

---

#### 3D. 行为实验

**设计具体的行为测试**：

```
AI: "好的，我们找到了一个更平衡的想法：'我有时犯错，但我也有成功'。

现在，你愿意做一个小实验来测试这个新想法吗？

在接下来的一周，每天晚上睡前，写下：
1. 今天你做得好的 3 件事（无论多小）
2. 今天犯的 1 个错误
3. 这个错误占你全天活动的百分比是多少？

这样做的目的是帮你看到：错误只是你生活的一小部分，而不是全部。

你觉得这个练习可行吗？"
```

---

### 第 4 步：布置作业（5 分钟）

**SMART 作业原则**：
- **S**pecific（具体）：明确要做什么
- **M**easurable（可衡量）：能追踪进度
- **A**chievable（可实现）：难度适中
- **R**elevant（相关）：与治疗目标相关
- **T**ime-bound（有时限）：明确时间框架

**对话示例**：

```
AI: "好的，让我们确认一下作业：

📝 本周作业：
- 每天晚上写下 3 件做得好的事 + 1 个错误
- 估算错误占全天的百分比
- 持续 7 天

具体来说：
- 你打算什么时候做？（最好选一个固定时间）
- 你会用什么方式记录？（笔记本、手机备忘录？）
- 如果忘记了怎么办？（设置提醒？）

让我们计划得详细一些，这样成功的可能性会更大。"
```

**代码逻辑**：
```typescript
await saveTherapySession(userId, {
  session_number: sessionNumber + 1,
  key_insights: "Identified 'labeling' cognitive distortion. Challenged with evidence.",
  cognitive_patterns: ["labeling", "all-or-nothing thinking"],
  homework_assigned: "Daily log: 3 successes + 1 mistake + percentage calculation",
  phq9_score: assessmentScore
})
```

---

### 第 5 步：总结和反馈（5 分钟）

**AI 总结会话要点**：

```
AI: "好的，让我总结一下我们今天的讨论：

🔑 关键发现：
1. 当你被批评时，你的自动思维是'我是个失败者'
2. 这是一种'标签化'的认知扭曲
3. 我们找到了很多反证：你的提案成功、帮助同事等
4. 更平衡的想法是：'我有时犯错，但我也有成功'

📋 作业：
- 每天记录 3 件成功 + 1 个错误
- 持续一周

❓ 反馈：
- 今天的讨论对你有帮助吗？
- 有什么地方你觉得不清楚或想进一步探讨的吗？
- 你对作业有信心吗？需要调整吗？"
```

---

## 🧘 DBT 技能训练结构

### 4 大模块 + 具体练习

#### 模块 1：正念（Mindfulness）

**What 技能**（做什么）：
1. **观察**：注意但不评判
2. **描述**：用词语标记体验
3. **参与**：全身心投入当下

**How 技能**（怎么做）：
1. **非评判**：不用"好"或"坏"来评价
2. **一心一意**：一次只做一件事
3. **有效性**：做有用的事，而不是"对"的事

**具体练习**：
```
AI: "让我们一起做一个 5-4-3-2-1 接地练习：

看周围，说出：
- 5 样你能看到的东西
- 4 样你能触摸的东西
- 3 样你能听到的声音
- 2 样你能闻到的气味
- 1 样你能尝到的味道

这个练习帮助你回到当下，离开焦虑的想法。现在试试看？"
```

---

#### 模块 2：痛苦耐受（Distress Tolerance）

**TIPP 技能**（快速冷静）：
- **T**emperature：用冷水刺激脸部
- **I**ntense exercise：剧烈运动
- **P**aced breathing：调整呼吸
- **P**aired muscle relaxation：渐进肌肉放松

**ACCEPTS 技能**（分散注意力）：
- **A**ctivities：做活动
- **C**ontributing：帮助他人
- **C**omparisons：比较（"比上次好"）
- **E**motions：制造相反情绪（看喜剧）
- **P**ushing away：暂时推开问题
- **T**houghts：想其他事
- **S**ensations：强烈感官刺激（冰块、辣椒）

**对话示例**：

```
AI: "当你感到快要崩溃时，可以尝试 TIPP 技能中的'冷水法'：

1. 拿一盆冷水（加冰块更好）
2. 把脸浸入水中 30 秒
3. 或者用冷毛巾敷脸

这会激活你的'潜水反射'，强制降低心率，让你快速冷静。

你愿意下次焦虑时试试吗？"
```

---

#### 模块 3：情绪调节（Emotion Regulation）

**PLEASE 技能**（照顾身体）：
- **PL**：治疗身体疾病（Physical iLlness）
- **E**：平衡饮食（Eating）
- **A**：避免药物（Avoid drugs）
- **S**：平衡睡眠（Sleep）
- **E**：锻炼（Exercise）

**检查事实**（Check the Facts）：
```
AI: "让我们用'检查事实'技能来看看你的焦虑：

1. 触发事件是什么？（具体描述）
2. 你对这个事件的解释是什么？
3. 你的解释是基于事实还是假设？
4. 如果改变解释，你的情绪会改变吗？

让我们一步步来..."
```

---

#### 模块 4：人际效能（Interpersonal Effectiveness）

**DEAR MAN**（获得你想要的）：
- **D**escribe：描述情况
- **E**xpress：表达感受
- **A**ssert：明确要求
- **R**einforce：强化（说明好处）
- **M**indful：专注（不离题）
- **A**ppear confident：表现自信
- **N**egotiate：谈判

**对话示例**：

```
AI: "你说你想让你的伴侣多陪你，但不知道怎么说。让我们用 DEAR MAN 来练习：

D（描述）："最近两周你每晚都工作到很晚"
E（表达）："我感到孤独和被忽视"
A（明确要求）："我希望你每周至少三个晚上 8 点前回家"
R（强化）："这样我们可以一起吃晚餐，增进感情"

你试试用这个结构和你的伴侣谈谈？"
```

---

## 📊 治疗进度追踪

### 会话记录模板

```typescript
interface TherapySession {
  session_number: number

  // 评估
  wellness_score: number  // 1-10
  phq9_score?: number
  gad7_score?: number

  // 认知工作
  automatic_thoughts_identified: string[]
  cognitive_distortions: string[]
  alternative_thoughts: string[]

  // 技能练习
  skills_taught: string[]  // 例如：["5-4-3-2-1 grounding", "DEAR MAN"]
  skills_practiced: string[]

  // 作业
  homework_assigned: string
  homework_from_last_session_completed: boolean

  // 治疗目标
  goals_progress: {
    goal_id: string
    progress_update: number  // 0-100
  }[]

  // 关键洞察
  key_insights: string
  therapist_notes: string
}
```

---

## ✅ 总结

### CBT 的核心逻辑

```
识别情境 → 识别自动思维 → 识别情绪和行为
    ↓
识别认知扭曲 → 挑战思维 → 找到替代想法
    ↓
行为实验 → 验证新想法 → 强化改变
```

### DBT 的核心逻辑

```
教授技能 → 练习技能 → 家庭作业 → 回顾应用
    ↓
正念 → 痛苦耐受 → 情绪调节 → 人际效能
    ↓
持续强化 → 形成习惯 → 改善生活质量
```

### AI 治疗师的职责

1. ✅ **结构化引导**：遵循会话模板
2. ✅ **苏格拉底式提问**：帮助用户自己发现
3. ✅ **技能教学**：教具体的应对策略
4. ✅ **作业设计**：SMART 原则
5. ✅ **进度追踪**：记录模式和改进
6. ✅ **危机干预**：识别高危情况

---

**这就是完整的、基于循证的 CBT/DBT 治疗流程！** 🎯
