import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 生成推荐码
function generateReferralCode(email: string): string {
  const prefix = email.substring(0, 3).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}${random}`
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, commissionRate, customReferralCode } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码是必填项" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少需要6个字符" }, { status: 400 })
    }

    // 检查邮箱是否已存在
    const { data: existing } = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("email", email)
      .single()

    if (existing) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 })
    }

    // 生成或使用自定义推荐码
    let referralCode = customReferralCode || generateReferralCode(email)
    
    //检查推荐码是否唯一
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      const { data: codeCheck } = await supabaseAdmin
        .from("affiliates")
        .select("id")
        .eq("referral_code", referralCode)
        .single()

      if (!codeCheck) {
        isUnique = true
      } else {
        if (customReferralCode) {
          return NextResponse.json({ error: "该推荐码已被使用" }, { status: 400 })
        }
        referralCode = generateReferralCode(email + attempts)
        attempts++
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: "无法生成唯一推荐码" }, { status: 500 })
    }

    // 哈希密码
    const passwordHash = await bcrypt.hash(password, 10)

    // 创建分销商
    const { data: affiliate, error } = await supabaseAdmin
      .from("affiliates")
      .insert({
        email,
        name: name || null,
        referral_code: referralCode,
        password_hash: passwordHash,
        commission_rate: parseFloat(commissionRate) || 10.0,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("[Admin] Error creating affiliate:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        email: affiliate.email,
        name: affiliate.name,
        referralCode: affiliate.referral_code,
        commissionRate: affiliate.commission_rate,
      },
    })
  } catch (error) {
    console.error("[Admin] Create affiliate error:", error)
    return NextResponse.json({ error: "创建分销商失败" }, { status: 500 })
  }
}

