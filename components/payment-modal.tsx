"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (hours: number) => void
  userEmail?: string
}

const pricingPackages = [
  {
    hours: 1,
    price: 19,
    pricePerHour: 19,
    popular: false,
    gumroadUrl: "https://chinastream.gumroad.com/l/arina?wanted=true&variant=1hour",
  },
  {
    hours: 10,
    price: 150,
    pricePerHour: 15,
    popular: true,
    savings: "Save $40",
    gumroadUrl: "https://chinastream.gumroad.com/l/arina?wanted=true&variant=10hours",
  },
  {
    hours: 100,
    price: 1400,
    pricePerHour: 14,
    popular: false,
    savings: "Save $500",
    gumroadUrl: "https://chinastream.gumroad.com/l/arina?wanted=true&variant=100hours",
  },
]

export function PaymentModal({ isOpen, onClose, onSuccess, userEmail }: PaymentModalProps) {
  const router = useRouter()

  const handleNavigateToPayment = () => {
    onClose()
    router.push("/payment")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="h-5 w-5" />
            <DialogTitle>Service Time Low</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {userEmail
              ? "Your service time is running low. Purchase more time to continue."
              : "Please log in and purchase time to continue your counseling session."}
          </p>

          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Choose Your Package</h3>
            <p className="text-sm text-muted-foreground mb-3">Select from 1, 5, 10, or 100 hours of counseling time</p>
            <Button onClick={handleNavigateToPayment} className="w-full">
              View Pricing Options
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>✓ Time automatically syncs to your account</p>
            <p>✓ Never expires</p>
            <p>✓ Secure payment</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
