import { AuthGuard } from "@/lib/auth-guard"
import { TeamMembersContent } from "@/components/team-members-content"

export default function TeamMembersPage({ params }: { params: { teamId: string } }) {
  return (
    <AuthGuard requiredRole="leader" teamId={params.teamId}>
      <TeamMembersContent teamId={params.teamId} />
    </AuthGuard>
  )
} 