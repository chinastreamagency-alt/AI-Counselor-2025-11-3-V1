export function generateReferralCode(email: string): string {
  // Generate a unique referral code based on email and timestamp
  const emailPart = email.split("@")[0].substring(0, 6).toUpperCase()
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${emailPart}${randomPart}`
}
