import { AuthGuard } from "@/lib/auth-guard"
import { DashboardContent } from "@/components/dashboard-content"

export default function DashboardPage() {
  return (
    <AuthGuard requiredRole="member">
      <DashboardContent />
    </AuthGuard>
  )
}
