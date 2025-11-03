"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (hours: number) => void
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
          <DialogTitle className="text-2xl font-bold text-center">Service Time Low</DialogTitle>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2">
            {userEmail
              ? "Your service time is running low. Purchase more time to continue."
              : "Please log in and purchase time to continue your counseling session."}
          </p>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="bg-gradient-to-br from-violet-50 to-cyan-50 dark:from-violet-950 dark:to-cyan-950 rounded-xl p-6 text-center border-2 border-violet-200 dark:border-violet-800">
            <Clock className="w-12 h-12 text-violet-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Choose Your Package</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select from 1, 5, 10, or 100 hours of counseling time
            </p>
            <Button
              onClick={handleNavigateToPayment}
              className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white font-semibold py-6 text-lg"
            >
              View Pricing Options
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs text-center text-gray-600 dark:text-gray-400">
              ✓ Time automatically syncs to your account
            </p>
            <p className="text-xs text-center text-gray-600 dark:text-gray-400">✓ Never expires</p>
            <p className="text-xs text-center text-gray-600 dark:text-gray-400">✓ Secure payment</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
