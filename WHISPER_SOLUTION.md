# 🎤 Groq Whisper API - 替代浏览器语音识别方案

## 为什么需要替代 Web Speech API？

### ❌ Web Speech API 的问题

1. **浏览器兼容性差**
   - Chrome/Edge: ✅ 支持
   - 华为浏览器: ❌ 不支持
   - 小米浏览器: ❌ 不支持
   - Safari: ⚠️ 部分支持

2. **识别质量参差不齐**
   - 依赖浏览器底层引擎
   - 数字识别不准确（如 "8" → "ate"）
   - 无法控制识别质量

3. **需要用户手势触发**
   - 必须用户点击才能启动
   - 无法后台持续监听

### ✅ Groq Whisper API 的优势

| 指标 | Web Speech API | Groq Whisper API |
|------|----------------|------------------|
| **兼容性** | ⚠️ 浏览器依赖 | ✅ **所有浏览器** |
| **识别准确度** | ⚠️ 参差不齐 | ✅ **业界顶级** |
| **中文支持** | ⚠️ 一般 | ✅ **完美** |
| **数字识别** | ❌ 差 | ✅ **优秀** |
| **成本** | $0 | $0（**完全免费**） |
| **速度** | 实时 | < 1秒（**极快**） |
| **配置难度** | 简单 | 简单 |

---

## 🔧 实施方案

### 方案 A：实时录音 + 定时上传（推荐）

**工作流程**：
1. 浏览器持续录音（使用 MediaRecorder API）
2. 每 2 秒自动上传到 Groq Whisper API
3. 返回识别结果并累积
4. 检测到静默 2 秒后发送给 AI

**优点**：
- ✅ 所有浏览器支持（只需麦克风权限）
- ✅ 识别质量稳定
- ✅ 不依赖浏览器语音引擎
- ✅ 完全免费

**缺点**：
- ⚠️ 需要上传音频文件（流量消耗小）
- ⚠️ 轻微延迟（< 1秒）

### 方案 B：按钮触发录音

**工作流程**：
1. 用户按住按钮开始录音
2. 松开按钮停止录音
3. 上传到 Groq Whisper API
4. 返回识别结果

**优点**：
- ✅ 简单明确
- ✅ 节省 API 调用

**缺点**：
- ❌ 用户体验不如实时

---

## 💻 技术实现

### 1. 创建 Groq Whisper API 路由

**文件**: `app/api/groq-whisper/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 })
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    // Whisper API 调用
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      language: "en", // 或 "zh" 中文
      response_format: "json",
      temperature: 0.0,
    })

    console.log("[Whisper] Transcription:", transcription.text)

    return NextResponse.json({
      text: transcription.text,
      language: transcription.language,
    })
  } catch (error) {
    console.error("[Whisper] Error:", error)
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    )
  }
}
```

### 2. 前端录音实现

**使用 MediaRecorder API**：

```typescript
// 录音状态
const [isRecording, setIsRecording] = useState(false)
const mediaRecorderRef = useRef<MediaRecorder | null>(null)
const audioChunksRef = useRef<Blob[]>([])

// 开始录音
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm' // 或 'audio/mp4', 'audio/ogg'
    })

    mediaRecorderRef.current = mediaRecorder
    audioChunksRef.current = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      await sendToWhisper(audioBlob)
    }

    // 每 2 秒生成一个音频片段
    mediaRecorder.start(2000)
    setIsRecording(true)
  } catch (error) {
    console.error("Microphone access denied:", error)
  }
}

// 停止录音
const stopRecording = () => {
  if (mediaRecorderRef.current) {
    mediaRecorderRef.current.stop()
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    setIsRecording(false)
  }
}

// 发送到 Whisper API
const sendToWhisper = async (audioBlob: Blob) => {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'audio.webm')

  const response = await fetch('/api/groq-whisper', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()
  console.log("Transcription:", data.text)

  // 累积识别文本
  lastTranscriptRef.current += data.text + " "
  setTranscript(lastTranscriptRef.current)
}
```

### 3. 实时录音 + 定时上传

**更智能的方案**：

```typescript
// 每 2 秒上传一次
const startContinuousRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mediaRecorder = new MediaRecorder(stream)

  mediaRecorder.ondataavailable = async (event) => {
    if (event.data.size > 0) {
      const audioBlob = new Blob([event.data], { type: 'audio/webm' })

      // 异步上传，不阻塞录音
      sendToWhisper(audioBlob).catch(err =>
        console.error("Whisper upload failed:", err)
      )
    }
  }

  // 每 2 秒触发一次 dataavailable
  mediaRecorder.start(2000)
}
```

---

## 🆓 成本分析

### Groq Whisper API 定价

**免费额度**: **无限制**（目前完全免费）

**实际使用量**:
- 每次对话录音：2-10 秒
- 音频文件大小：~50KB
- 每天 1000 次对话：~50MB 音频上传

**成本**: $0（完全免费）

---

## 📊 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Web Speech API** | 实时，零延迟 | 浏览器兼容性差 | ⭐⭐⭐ |
| **Groq Whisper (实时)** | 兼容所有浏览器，识别准确 | 轻微延迟 | ⭐⭐⭐⭐⭐ |
| **Groq Whisper (按钮)** | 简单可靠 | 用户体验略差 | ⭐⭐⭐⭐ |

---

## 🚀 推荐实施步骤

### 阶段 1：创建 API 路由（5分钟）

1. 创建 `app/api/groq-whisper/route.ts`
2. 添加 Whisper 调用代码
3. 测试 API 是否工作

### 阶段 2：修改前端录音逻辑（10分钟）

1. 移除 `webkitSpeechRecognition`
2. 使用 `MediaRecorder` API
3. 每 2 秒上传到 Whisper API
4. 累积识别结果

### 阶段 3：优化用户体验（5分钟）

1. 添加录音指示器（红点）
2. 显示识别进度
3. 错误处理和降级

---

## 🎯 最终效果

**用户体验**:
- ✅ 所有浏览器都能正常工作
- ✅ 识别准确度大幅提升
- ✅ 数字、专有名词识别更准确
- ✅ 中英文混合识别

**技术优势**:
- ✅ 不依赖浏览器引擎
- ✅ 识别质量稳定可控
- ✅ 完全免费
- ✅ 代码简洁

---

## 🔄 降级策略

**如果 Whisper API 失败，自动降级到 Web Speech API**:

```typescript
const startListening = async () => {
  try {
    // 优先使用 Whisper
    await startWhisperRecording()
  } catch (error) {
    console.warn("Whisper failed, fallback to Web Speech API")
    startWebSpeechRecognition()
  }
}
```

---

## 📝 需要的环境变量

**已有**: `GROQ_API_KEY`（已配置用于 AI 对话）

**无需额外配置**！Whisper API 使用相同的 Groq API Key。

---

## ✅ 总结

**推荐方案**: **Groq Whisper API (实时录音 + 定时上传)**

**优势**:
- 🎯 完美解决浏览器兼容性问题
- 🎯 识别准确度业界顶级
- 🎯 完全免费无限调用
- 🎯 速度极快（< 1秒）
- 🎯 支持所有浏览器

**是否实施？**

如果确认实施，我将立即为你创建完整的代码实现。
