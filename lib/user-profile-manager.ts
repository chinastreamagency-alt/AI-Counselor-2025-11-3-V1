import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface UserProfile {
  userId: string

  // 基本信息
  demographics: {
    age?: number
    occupation?: string
    relationship_status?: string
    location?: string
  }

  // 心理评估
  assessments: {
    phq9_score?: number
    phq9_severity?: string
    phq9_date?: Date
    gad7_score?: number
    gad7_severity?: string
    gad7_date?: Date
    wellness_scores?: number[]  // 历史健康评分 (1-10)
  }

  // 主诉问题
  presenting_concerns: string[]

  // 治疗目标
  therapy_goals: {
    goal: string
    progress: number  // 0-100
    status: 'active' | 'completed' | 'abandoned'
    created_at: Date
  }[]

  // 认知模式
  cognitive_patterns: {
    distortions: string[]  // e.g., ["catastrophizing", "black-and-white thinking"]
    core_beliefs: string[]  // e.g., ["I'm not good enough", "I must be perfect"]
  }

  // 应对策略
  coping_strategies: {
    helpful: string[]    // e.g., ["deep breathing", "exercise", "journaling"]
    unhelpful: string[]  // e.g., ["avoidance", "substance use", "rumination"]
  }

  // 会话历史摘要
  session_summaries: {
    session_number: number
    date: Date
    key_insights: string
    homework_assigned: string
    homework_completed: boolean
    cognitive_patterns_observed: string[]
  }[]

  // 元数据
  total_sessions: number
  first_session_date: Date
  last_session_date: Date
}

/**
 * 加载用户画像
 */
export async function loadUserProfile(userId: string): Promise<UserProfile> {
  try {
    console.log("[User Profile] Loading profile for user:", userId)

    // 加载用户基本信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_profile, email, created_at')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error("[User Profile] Error loading user:", userError)
    }

    // 加载会话历史（最近 5 次）
    const { data: sessions, error: sessionsError } = await supabase
      .from('therapy_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_number', { ascending: false })
      .limit(5)

    if (sessionsError) {
      console.error("[User Profile] Error loading sessions:", sessionsError)
    }

    // 加载治疗目标
    const { data: goals, error: goalsError } = await supabase
      .from('therapy_goals')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false })

    if (goalsError) {
      console.error("[User Profile] Error loading goals:", goalsError)
    }

    // 加载认知模式
    const { data: patterns, error: patternsError } = await supabase
      .from('cognitive_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('frequency', { ascending: false })
      .limit(20)

    if (patternsError) {
      console.error("[User Profile] Error loading patterns:", patternsError)
    }

    // 构建用户画像
    const profile: UserProfile = {
      userId,
      demographics: user?.user_profile?.demographics || {},
      assessments: user?.user_profile?.assessments || {},
      presenting_concerns: user?.user_profile?.presenting_concerns || [],
      therapy_goals: goals?.map(g => ({
        goal: g.goal,
        progress: g.progress || 0,
        status: g.status,
        created_at: new Date(g.created_at)
      })) || [],
      cognitive_patterns: {
        distortions: patterns
          ?.filter(p => p.pattern_type === 'distortion')
          .map(p => p.pattern_name) || [],
        core_beliefs: patterns
          ?.filter(p => p.pattern_type === 'core_belief')
          .map(p => p.pattern_name) || []
      },
      coping_strategies: {
        helpful: patterns
          ?.filter(p => p.pattern_type === 'coping_strategy' && p.is_helpful === true)
          .map(p => p.pattern_name) || [],
        unhelpful: patterns
          ?.filter(p => p.pattern_type === 'coping_strategy' && p.is_helpful === false)
          .map(p => p.pattern_name) || []
      },
      session_summaries: sessions?.map(s => ({
        session_number: s.session_number,
        date: new Date(s.started_at),
        key_insights: s.key_insights || '',
        homework_assigned: s.homework_assigned || '',
        homework_completed: s.homework_completed || false,
        cognitive_patterns_observed: s.cognitive_patterns || []
      })) || [],
      total_sessions: sessions?.length || 0,
      first_session_date: user?.created_at ? new Date(user.created_at) : new Date(),
      last_session_date: sessions?.[0]?.started_at ? new Date(sessions[0].started_at) : new Date()
    }

    console.log("[User Profile] Profile loaded successfully")
    console.log("[User Profile] Sessions:", profile.total_sessions)
    console.log("[User Profile] Goals:", profile.therapy_goals.length)
    console.log("[User Profile] Distortions:", profile.cognitive_patterns.distortions.length)

    return profile
  } catch (error) {
    console.error("[User Profile] Unexpected error:", error)

    // 返回空白画像
    return {
      userId,
      demographics: {},
      assessments: {},
      presenting_concerns: [],
      therapy_goals: [],
      cognitive_patterns: { distortions: [], core_beliefs: [] },
      coping_strategies: { helpful: [], unhelpful: [] },
      session_summaries: [],
      total_sessions: 0,
      first_session_date: new Date(),
      last_session_date: new Date()
    }
  }
}

/**
 * 更新用户画像
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
) {
  try {
    console.log("[User Profile] Updating profile for user:", userId)

    // 更新用户基本信息
    const { error } = await supabase
      .from('users')
      .update({
        user_profile: {
          demographics: updates.demographics,
          assessments: updates.assessments,
          presenting_concerns: updates.presenting_concerns
        }
      })
      .eq('id', userId)

    if (error) {
      console.error("[User Profile] Error updating profile:", error)
      throw error
    }

    console.log("[User Profile] Profile updated successfully")
  } catch (error) {
    console.error("[User Profile] Unexpected error:", error)
    throw error
  }
}

/**
 * 保存会话记录
 */
export async function saveTherapySession(
  userId: string,
  sessionData: {
    session_number: number
    key_insights: string
    cognitive_patterns?: string[]
    homework_assigned?: string
    phq9_score?: number
    gad7_score?: number
  }
) {
  try {
    console.log("[User Profile] Saving session", sessionData.session_number, "for user:", userId)

    // 保存会话记录
    const { error: sessionError } = await supabase
      .from('therapy_sessions')
      .insert({
        user_id: userId,
        session_number: sessionData.session_number,
        key_insights: sessionData.key_insights,
        cognitive_patterns: sessionData.cognitive_patterns || [],
        homework_assigned: sessionData.homework_assigned || '',
        phq9_score: sessionData.phq9_score,
        gad7_score: sessionData.gad7_score,
        started_at: new Date(),
        ended_at: new Date()
      })

    if (sessionError) {
      console.error("[User Profile] Error saving session:", sessionError)
      throw sessionError
    }

    // 更新认知模式频率
    if (sessionData.cognitive_patterns && sessionData.cognitive_patterns.length > 0) {
      for (const pattern of sessionData.cognitive_patterns) {
        await incrementPatternFrequency(userId, pattern, 'distortion')
      }
    }

    console.log("[User Profile] Session saved successfully")
  } catch (error) {
    console.error("[User Profile] Unexpected error:", error)
    throw error
  }
}

/**
 * 增加认知模式频率
 */
async function incrementPatternFrequency(
  userId: string,
  patternName: string,
  patternType: 'distortion' | 'core_belief' | 'coping_strategy'
) {
  try {
    // 检查是否已存在
    const { data: existing } = await supabase
      .from('cognitive_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('pattern_name', patternName)
      .eq('pattern_type', patternType)
      .single()

    if (existing) {
      // 更新频率
      await supabase
        .from('cognitive_patterns')
        .update({
          frequency: existing.frequency + 1,
          last_observed: new Date()
        })
        .eq('id', existing.id)
    } else {
      // 创建新记录
      await supabase
        .from('cognitive_patterns')
        .insert({
          user_id: userId,
          pattern_name: patternName,
          pattern_type: patternType,
          frequency: 1,
          last_observed: new Date()
        })
    }
  } catch (error) {
    console.error("[User Profile] Error updating pattern frequency:", error)
  }
}

/**
 * 添加治疗目标
 */
export async function addTherapyGoal(
  userId: string,
  goal: string
) {
  try {
    console.log("[User Profile] Adding goal for user:", userId, goal)

    const { error } = await supabase
      .from('therapy_goals')
      .insert({
        user_id: userId,
        goal,
        progress: 0,
        status: 'active'
      })

    if (error) {
      console.error("[User Profile] Error adding goal:", error)
      throw error
    }

    console.log("[User Profile] Goal added successfully")
  } catch (error) {
    console.error("[User Profile] Unexpected error:", error)
    throw error
  }
}

/**
 * 更新治疗目标进度
 */
export async function updateGoalProgress(
  goalId: string,
  progress: number,
  status?: 'active' | 'completed' | 'abandoned'
) {
  try {
    const updates: any = {
      progress: Math.min(100, Math.max(0, progress)),
      updated_at: new Date()
    }

    if (status) {
      updates.status = status
    }

    const { error } = await supabase
      .from('therapy_goals')
      .update(updates)
      .eq('id', goalId)

    if (error) {
      console.error("[User Profile] Error updating goal progress:", error)
      throw error
    }

    console.log("[User Profile] Goal progress updated successfully")
  } catch (error) {
    console.error("[User Profile] Unexpected error:", error)
    throw error
  }
}

/**
 * 生成用户画像上下文（用于 LLM）
 */
export function generateProfileContext(profile: UserProfile): string {
  const parts: string[] = []

  // 会话信息
  if (profile.total_sessions > 0) {
    parts.push(`This is session #${profile.total_sessions + 1} with this user.`)

    if (profile.session_summaries.length > 0) {
      const lastSession = profile.session_summaries[0]
      parts.push(`Last session (Session #${lastSession.session_number}):`)
      parts.push(`- Key insights: ${lastSession.key_insights}`)
      if (lastSession.homework_assigned) {
        parts.push(`- Homework assigned: ${lastSession.homework_assigned}`)
        parts.push(`- Homework completed: ${lastSession.homework_completed ? 'Yes' : 'No'}`)
      }
    }
  } else {
    parts.push("This is the FIRST session with this user. Use a warm greeting and build rapport.")
  }

  // 主诉问题
  if (profile.presenting_concerns.length > 0) {
    parts.push(`\nPresenting concerns: ${profile.presenting_concerns.join(", ")}`)
  }

  // 治疗目标
  if (profile.therapy_goals.length > 0) {
    parts.push("\nActive therapy goals:")
    profile.therapy_goals
      .filter(g => g.status === 'active')
      .forEach(g => {
        parts.push(`- "${g.goal}" (${g.progress}% progress)`)
      })
  }

  // 认知模式
  if (profile.cognitive_patterns.distortions.length > 0) {
    parts.push(`\nKnown cognitive distortions: ${profile.cognitive_patterns.distortions.slice(0, 5).join(", ")}`)
  }

  if (profile.cognitive_patterns.core_beliefs.length > 0) {
    parts.push(`Core beliefs identified: ${profile.cognitive_patterns.core_beliefs.slice(0, 3).join(", ")}`)
  }

  // 应对策略
  if (profile.coping_strategies.helpful.length > 0) {
    parts.push(`\nHelpful coping strategies: ${profile.coping_strategies.helpful.slice(0, 5).join(", ")}`)
  }

  if (profile.coping_strategies.unhelpful.length > 0) {
    parts.push(`Unhelpful patterns to address: ${profile.coping_strategies.unhelpful.slice(0, 3).join(", ")}`)
  }

  // 评估结果
  if (profile.assessments.phq9_score !== undefined) {
    parts.push(`\nPHQ-9 score: ${profile.assessments.phq9_score} (${profile.assessments.phq9_severity})`)
  }

  if (profile.assessments.gad7_score !== undefined) {
    parts.push(`GAD-7 score: ${profile.assessments.gad7_score} (${profile.assessments.gad7_severity})`)
  }

  return parts.join("\n")
}
