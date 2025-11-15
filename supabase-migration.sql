-- =====================================================
-- AI 心理咨询师 - 数据库迁移脚本
-- 用于 Supabase PostgreSQL
-- =====================================================

-- 1. 扩展 users 表，添加用户画像字段
ALTER TABLE users
ADD COLUMN IF NOT EXISTS user_profile JSONB DEFAULT '{}'::jsonb;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_user_profile
ON users USING gin (user_profile);

-- 2. 创建治疗会话表
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_number INT NOT NULL,

  -- 时间戳
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,

  -- 会话内容
  key_insights TEXT,
  cognitive_patterns TEXT[] DEFAULT '{}',
  homework_assigned TEXT,
  homework_completed BOOLEAN DEFAULT FALSE,

  -- 评估分数
  phq9_score INT CHECK (phq9_score >= 0 AND phq9_score <= 27),
  gad7_score INT CHECK (gad7_score >= 0 AND gad7_score <= 21),
  wellness_score INT CHECK (wellness_score >= 1 AND wellness_score <= 10),

  -- 治疗目标进度（JSONB）
  goals_progress JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),

  -- 唯一约束：每个用户的会话号必须唯一
  UNIQUE(user_id, session_number)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_user_id
ON therapy_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_session_number
ON therapy_sessions(user_id, session_number DESC);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_started_at
ON therapy_sessions(started_at DESC);

-- 3. 创建治疗目标表
CREATE TABLE IF NOT EXISTS therapy_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  goal TEXT NOT NULL,
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_therapy_goals_user_id
ON therapy_goals(user_id);

CREATE INDEX IF NOT EXISTS idx_therapy_goals_status
ON therapy_goals(user_id, status);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_therapy_goals_updated_at
BEFORE UPDATE ON therapy_goals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. 创建认知模式表
CREATE TABLE IF NOT EXISTS cognitive_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('distortion', 'core_belief', 'coping_strategy')),
  pattern_name TEXT NOT NULL,

  is_helpful BOOLEAN DEFAULT NULL,  -- NULL for distortions/beliefs, TRUE/FALSE for coping strategies
  frequency INT DEFAULT 1,

  last_observed TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  -- 唯一约束：每个用户每种类型的模式名称唯一
  UNIQUE(user_id, pattern_type, pattern_name)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_cognitive_patterns_user_id
ON cognitive_patterns(user_id);

CREATE INDEX IF NOT EXISTS idx_cognitive_patterns_type
ON cognitive_patterns(user_id, pattern_type);

CREATE INDEX IF NOT EXISTS idx_cognitive_patterns_frequency
ON cognitive_patterns(user_id, frequency DESC);

-- 5. 创建对话历史表（可选，用于完整对话记录）
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_number INT NOT NULL,

  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_session
ON conversation_messages(user_id, session_number, created_at);

-- 6. 创建评估历史表
CREATE TABLE IF NOT EXISTS assessment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('phq9', 'gad7', 'wellness')),
  score INT NOT NULL,
  severity TEXT,

  responses JSONB,  -- 存储每个问题的答案

  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_assessment_history_user_type
ON assessment_history(user_id, assessment_type, created_at DESC);

-- 7. 创建辅助函数：获取下一个会话编号
CREATE OR REPLACE FUNCTION get_next_session_number(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  next_number INT;
BEGIN
  SELECT COALESCE(MAX(session_number), 0) + 1
  INTO next_number
  FROM therapy_sessions
  WHERE user_id = p_user_id;

  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建辅助函数：增加模式频率
CREATE OR REPLACE FUNCTION increment_pattern_frequency(
  p_user_id UUID,
  p_pattern_name TEXT,
  p_pattern_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO cognitive_patterns (user_id, pattern_type, pattern_name, frequency, last_observed)
  VALUES (p_user_id, p_pattern_type, p_pattern_name, 1, NOW())
  ON CONFLICT (user_id, pattern_type, pattern_name)
  DO UPDATE SET
    frequency = cognitive_patterns.frequency + 1,
    last_observed = NOW();
END;
$$ LANGUAGE plpgsql;

-- 9. 创建视图：用户会话统计
CREATE OR REPLACE VIEW user_therapy_stats AS
SELECT
  u.id AS user_id,
  u.email,
  COUNT(DISTINCT ts.id) AS total_sessions,
  MIN(ts.started_at) AS first_session_date,
  MAX(ts.started_at) AS last_session_date,
  COUNT(DISTINCT tg.id) FILTER (WHERE tg.status = 'active') AS active_goals,
  COUNT(DISTINCT tg.id) FILTER (WHERE tg.status = 'completed') AS completed_goals,
  AVG(tg.progress) FILTER (WHERE tg.status = 'active') AS avg_goal_progress,
  COUNT(DISTINCT cp.id) AS total_patterns_identified
FROM users u
LEFT JOIN therapy_sessions ts ON u.id = ts.user_id
LEFT JOIN therapy_goals tg ON u.id = tg.user_id
LEFT JOIN cognitive_patterns cp ON u.id = cp.user_id
GROUP BY u.id, u.email;

-- 10. 创建 RLS (Row Level Security) 策略
-- 确保用户只能访问自己的数据

ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_history ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的会话
CREATE POLICY therapy_sessions_user_policy ON therapy_sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- 用户只能查看自己的目标
CREATE POLICY therapy_goals_user_policy ON therapy_goals
  FOR ALL
  USING (auth.uid() = user_id);

-- 用户只能查看自己的认知模式
CREATE POLICY cognitive_patterns_user_policy ON cognitive_patterns
  FOR ALL
  USING (auth.uid() = user_id);

-- 用户只能查看自己的对话
CREATE POLICY conversation_messages_user_policy ON conversation_messages
  FOR ALL
  USING (auth.uid() = user_id);

-- 用户只能查看自己的评估
CREATE POLICY assessment_history_user_policy ON assessment_history
  FOR ALL
  USING (auth.uid() = user_id);

-- 11. 插入示例认知扭曲列表（供参考）
CREATE TABLE IF NOT EXISTS cognitive_distortion_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  example TEXT,
  category TEXT
);

INSERT INTO cognitive_distortion_types (name, description, example, category) VALUES
  ('all-or-nothing thinking', 'Seeing things in black and white categories', 'If I am not perfect, I am a failure', 'CBT'),
  ('overgeneralization', 'Seeing a single negative event as a never-ending pattern', 'I failed once, so I always fail', 'CBT'),
  ('mental filter', 'Dwelling on negatives and ignoring positives', 'Nothing good ever happens to me', 'CBT'),
  ('disqualifying the positive', 'Rejecting positive experiences', 'That compliment doesn''t count', 'CBT'),
  ('jumping to conclusions', 'Making negative interpretations without evidence', 'They think I am stupid', 'CBT'),
  ('magnification', 'Exaggerating the importance of things', 'This mistake will ruin everything', 'CBT'),
  ('emotional reasoning', 'Assuming feelings reflect reality', 'I feel worthless, so I must be worthless', 'CBT'),
  ('should statements', 'Criticizing self or others with shoulds', 'I should be better than this', 'CBT'),
  ('labeling', 'Attaching negative labels to self or others', 'I am a loser', 'CBT'),
  ('personalization', 'Blaming yourself for things outside your control', 'It is all my fault', 'CBT')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 迁移完成！
-- =====================================================

-- 验证表是否创建成功
DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('therapy_sessions', 'therapy_goals', 'cognitive_patterns', 'conversation_messages', 'assessment_history');

  IF table_count = 5 THEN
    RAISE NOTICE '✅ 所有表创建成功！共 % 个表。', table_count;
  ELSE
    RAISE NOTICE '⚠️ 警告：只创建了 % 个表，应该是 5 个。', table_count;
  END IF;
END $$;
