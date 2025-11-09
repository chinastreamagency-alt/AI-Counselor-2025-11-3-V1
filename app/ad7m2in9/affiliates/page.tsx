"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, DollarSign } from "lucide-react"
import Link from "next/link"

type Affiliate = {
  id: string
  email: string
  name: string | null
  referral_code: string
  commission_rate: number
  total_commission: number
  settled_commission: number
  unsettled_commission: number
  status: string
  created_at: string
  orderCount: number
}

type Commission = {
  id: string
  amount: number
  status: string
  settled_at: string | null
  created_at: string
  orders: {
    id: string
    amount: number
    created_at: string
    users: {
      email: string
      name: string | null
    }
  }
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSettling, setIsSettling] = useState(false)
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([])
  const [showCommissionsDialog, setShowCommissionsDialog] = useState(false)
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null)
  const [newCommissionRate, setNewCommissionRate] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const router = useRouter()

  useEffect(() => {
    const storedAdmin = localStorage.getItem("admin")
    if (!storedAdmin) {
      router.push("/ad7m2in9/login")
      return
    }

    fetchAffiliates()
  }, [statusFilter, router])

  const fetchAffiliates = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/ad7m2in9/affiliates?${params}`)
      if (!response.ok) throw new Error("Failed to fetch affiliates")

      const data = await response.json()
      setAffiliates(data.affiliates)
    } catch (error) {
      console.error("[v0] Error fetching affiliates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCommissions = async (affiliateId: string) => {
    try {
      const response = await fetch(`/api/ad7m2in9/affiliates/${affiliateId}/commissions`)
      if (!response.ok) throw new Error("Failed to fetch commissions")

      const data = await response.json()
      setCommissions(data.commissions)
    } catch (error) {
      console.error("[v0] Error fetching commissions:", error)
    }
  }

  const handleViewCommissions = async (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate)
    await fetchCommissions(affiliate.id)
    setShowCommissionsDialog(true)
  }

  const handleSettleCommissions = async () => {
    if (selectedCommissions.length === 0) return

    setIsSettling(true)
    try {
      const response = await fetch("/api/ad7m2in9/commissions/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionIds: selectedCommissions }),
      })

      if (!response.ok) throw new Error("Failed to settle commissions")

      // Refresh data
      await fetchCommissions(selectedAffiliate!.id)
      await fetchAffiliates()
      setSelectedCommissions([])
      alert("Commissions settled successfully!")
    } catch (error) {
      console.error("[v0] Error settling commissions:", error)
      alert("Failed to settle commissions")
    } finally {
      setIsSettling(false)
    }
  }

  const handleUpdateAffiliate = async () => {
    if (!editingAffiliate) return

    try {
      const updates: any = {}
      if (newCommissionRate) updates.commissionRate = Number.parseFloat(newCommissionRate)
      if (newStatus) updates.status = newStatus

      const response = await fetch("/api/ad7m2in9/affiliates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: editingAffiliate.id,
          ...updates,
        }),
      })

      if (!response.ok) throw new Error("Failed to update affiliate")

      await fetchAffiliates()
      setEditingAffiliate(null)
      setNewCommissionRate("")
      setNewStatus("")
      alert("Affiliate updated successfully!")
    } catch (error) {
      console.error("[v0] Error updating affiliate:", error)
      alert("Failed to update affiliate")
    }
  }

  const toggleCommissionSelection = (commissionId: string) => {
    setSelectedCommissions((prev) =>
      prev.includes(commissionId) ? prev.filter((id) => id !== commissionId) : [...prev, commissionId],
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Link href="/ad7m2in9">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-white">Affiliate Management</h1>
            <p className="text-white/70">Manage affiliates and settle commissions</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Affiliates</CardTitle>
            <CardDescription className="text-white/70">View and manage all affiliate partners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label className="text-white">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Affiliates Table */}
            <div className="rounded-lg border border-white/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20 hover:bg-white/5">
                    <TableHead className="text-white">Affiliate</TableHead>
                    <TableHead className="text-white">Referral Code</TableHead>
                    <TableHead className="text-white">Commission Rate</TableHead>
                    <TableHead className="text-white">Total Earned</TableHead>
                    <TableHead className="text-white">Unsettled</TableHead>
                    <TableHead className="text-white">Orders</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((affiliate) => (
                    <TableRow key={affiliate.id} className="border-white/20 hover:bg-white/5">
                      <TableCell className="text-white">
                        <div>
                          <div className="font-medium">{affiliate.name || "N/A"}</div>
                          <div className="text-sm text-white/70">{affiliate.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-mono">{affiliate.referral_code}</TableCell>
                      <TableCell className="text-white">{affiliate.commission_rate}%</TableCell>
                      <TableCell className="text-white">${affiliate.total_commission.toFixed(2)}</TableCell>
                      <TableCell className="text-white font-semibold">
                        ${affiliate.unsettled_commission.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-white">{affiliate.orderCount}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            affiliate.status === "active"
                              ? "bg-green-500/20 text-green-300"
                              : affiliate.status === "suspended"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {affiliate.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleViewCommissions(affiliate)}
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                          >
                            View
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingAffiliate(affiliate)
                                  setNewCommissionRate(affiliate.commission_rate.toString())
                                  setNewStatus(affiliate.status)
                                }}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-white/20">
                              <DialogHeader>
                                <DialogTitle className="text-white">Edit Affiliate</DialogTitle>
                                <DialogDescription className="text-white/70">
                                  Update affiliate settings
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-white">Commission Rate (%)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={newCommissionRate}
                                    onChange={(e) => setNewCommissionRate(e.target.value)}
                                    className="bg-white/10 border-white/20 text-white"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-white">Status</Label>
                                  <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="suspended">Suspended</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  onClick={handleUpdateAffiliate}
                                  className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white"
                                >
                                  Update Affiliate
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {affiliates.length === 0 && (
              <div className="text-center py-8">
                <p className="text-white/70">No affiliates found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commissions Dialog */}
        <Dialog open={showCommissionsDialog} onOpenChange={setShowCommissionsDialog}>
          <DialogContent className="bg-slate-900 border-white/20 max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                Commissions for {selectedAffiliate?.name || selectedAffiliate?.email}
              </DialogTitle>
              <DialogDescription className="text-white/70">Manage and settle affiliate commissions</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedCommissions.length > 0 && (
                <div className="flex justify-between items-center bg-violet-500/20 border border-violet-500/30 rounded-lg p-4">
                  <div className="text-white">
                    <span className="font-semibold">{selectedCommissions.length}</span> commission
                    {selectedCommissions.length > 1 ? "s" : ""} selected
                  </div>
                  <Button
                    onClick={handleSettleCommissions}
                    disabled={isSettling}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    {isSettling ? "Settling..." : "Settle Selected"}
                  </Button>
                </div>
              )}

              <div className="rounded-lg border border-white/20 overflow-hidden max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20 hover:bg-white/5">
                      <TableHead className="text-white">Select</TableHead>
                      <TableHead className="text-white">Customer</TableHead>
                      <TableHead className="text-white">Order Amount</TableHead>
                      <TableHead className="text-white">Commission</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission.id} className="border-white/20 hover:bg-white/5">
                        <TableCell>
                          {commission.status === "pending" && (
                            <input
                              type="checkbox"
                              checked={selectedCommissions.includes(commission.id)}
                              onChange={() => toggleCommissionSelection(commission.id)}
                              className="w-4 h-4"
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-white">
                          <div>
                            <div className="font-medium">{commission.orders.users.name || "N/A"}</div>
                            <div className="text-sm text-white/70">{commission.orders.users.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">${commission.orders.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-white font-semibold">${commission.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              commission.status === "settled"
                                ? "bg-green-500/20 text-green-300"
                                : "bg-yellow-500/20 text-yellow-300"
                            }`}
                          >
                            {commission.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-white">
                          {new Date(commission.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {commissions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-white/70">No commissions found</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
