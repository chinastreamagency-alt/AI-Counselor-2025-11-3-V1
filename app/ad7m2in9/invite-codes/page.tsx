"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Copy, Check } from "lucide-react"
import Link from "next/link"

interface InviteCode {
  id: string
  code: string
  created_by: string
  max_uses: number
  used_count: number
  status: string
  expires_at: string | null
  created_at: string
}

export default function InviteCodesPage() {
  const router = useRouter()
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // 创建表单状态
  const [newCode, setNewCode] = useState("")
  const [maxUses, setMaxUses] = useState(100)
  const [expiresInDays, setExpiresInDays] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const admin = localStorage.getItem("admin")
    if (!admin) {
      router.push("/ad7m2in9/login")
      return
    }
    fetchInviteCodes()
  }, [router])

  const fetchInviteCodes = async () => {
    try {
      const response = await fetch("/api/ad7m2in9/invite-codes")
      const data = await response.json()

      if (data.success) {
        setInviteCodes(data.inviteCodes)
      }
    } catch (error) {
      console.error("获取邀请码失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    try {
      const expiresAt = expiresInDays > 0 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null

      const response = await fetch("/api/ad7m2in9/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.toUpperCase(),
          createdBy: "admin",
          maxUses,
          expiresAt,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "创建失败")
      }

      // 重置表单
      setNewCode("")
      setMaxUses(100)
      setExpiresInDays(0)
      setShowCreateForm(false)

      // 刷新列表
      fetchInviteCodes()
    } catch (error) {
      setError(error instanceof Error ? error.message : "创建邀请码失败")
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      
      const response = await fetch("/api/ad7m2in9/invite-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (response.ok) {
        fetchInviteCodes()
      }
    } catch (error) {
      console.error("更新状态失败:", error)
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewCode(code)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/ad7m2in9"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回后台首页
            </Link>
            <h1 className="text-3xl font-bold text-indigo-900">邀请码管理</h1>
            <p className="text-indigo-600 mt-2">创建和管理分销商注册邀请码</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建邀请码
          </Button>
        </div>

        {/* 创建邀请码表单 */}
        {showCreateForm && (
          <Card className="mb-6 bg-white/90 backdrop-blur-md border-indigo-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-indigo-900">创建新邀请码</CardTitle>
              <CardDescription className="text-indigo-600">
                设置邀请码及其使用规则
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCode} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-indigo-900">
                      邀请码 *
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="code"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder="例如: WELCOME2025"
                        required
                        className="bg-white border-indigo-200"
                      />
                      <Button
                        type="button"
                        onClick={generateRandomCode}
                        variant="outline"
                        className="border-indigo-200"
                      >
                        随机生成
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxUses" className="text-indigo-900">
                      最大使用次数
                    </Label>
                    <Input
                      id="maxUses"
                      type="number"
                      value={maxUses}
                      onChange={(e) => setMaxUses(Number(e.target.value))}
                      min="1"
                      className="bg-white border-indigo-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiresInDays" className="text-indigo-900">
                      有效期（天）
                    </Label>
                    <Input
                      id="expiresInDays"
                      type="number"
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(Number(e.target.value))}
                      min="0"
                      placeholder="0 = 永不过期"
                      className="bg-white border-indigo-200"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    {isCreating ? "创建中..." : "创建邀请码"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setError(null)
                    }}
                    className="border-indigo-200"
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 邀请码列表 */}
        <Card className="bg-white/90 backdrop-blur-md border-indigo-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-indigo-900">邀请码列表</CardTitle>
            <CardDescription className="text-indigo-600">
              共 {inviteCodes.length} 个邀请码
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-indigo-600">加载中...</div>
            ) : inviteCodes.length === 0 ? (
              <div className="text-center py-8 text-indigo-600">
                还没有邀请码，点击上方按钮创建第一个邀请码
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-indigo-200">
                      <TableHead className="text-indigo-900">邀请码</TableHead>
                      <TableHead className="text-indigo-900">状态</TableHead>
                      <TableHead className="text-indigo-900">使用情况</TableHead>
                      <TableHead className="text-indigo-900">有效期</TableHead>
                      <TableHead className="text-indigo-900">创建时间</TableHead>
                      <TableHead className="text-indigo-900">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inviteCodes.map((code) => (
                      <TableRow key={code.id} className="border-indigo-200">
                        <TableCell className="font-mono font-semibold text-indigo-900">
                          <div className="flex items-center gap-2">
                            {code.code}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(code.code)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedCode === code.code ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-indigo-600" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={code.status === "active" ? "default" : "secondary"}
                            className={
                              code.status === "active"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }
                          >
                            {code.status === "active" ? "激活" : "停用"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-indigo-700">
                          {code.used_count} / {code.max_uses || "无限"}
                        </TableCell>
                        <TableCell className="text-indigo-700">
                          {code.expires_at
                            ? new Date(code.expires_at).toLocaleDateString("zh-CN")
                            : "永不过期"}
                        </TableCell>
                        <TableCell className="text-indigo-700">
                          {new Date(code.created_at).toLocaleDateString("zh-CN")}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(code.id, code.status)}
                            className="border-indigo-200"
                          >
                            {code.status === "active" ? "停用" : "激活"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

