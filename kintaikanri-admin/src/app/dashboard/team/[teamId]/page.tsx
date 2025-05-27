"use client"

import { use } from "react"
import { AuthGuard } from "@/lib/auth-guard"
import { TeamDashboardContent } from "@/components/team-dashboard-content"

export default function TeamDashboardPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)
  return (
    <AuthGuard requiredRole="leader" teamId={teamId}>
      <TeamDashboardContent teamId={teamId} />
    </AuthGuard>
  )
} 