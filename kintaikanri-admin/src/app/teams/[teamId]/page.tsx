import { AuthGuard } from "@/lib/auth-guard"
import { TeamDashboardContent } from "@/components/team-dashboard-content"

export default function TeamDashboardPage({ params }: { params: { teamId: string } }) {
  return (
    <AuthGuard requiredRole="leader" teamId={params.teamId}>
      <TeamDashboardContent teamId={params.teamId} />
    </AuthGuard>
  )
} 