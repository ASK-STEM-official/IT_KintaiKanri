"use client"

import { use } from "react"
import { AuthGuard } from "@/lib/auth-guard"
import { TeamDashboardContent } from "@/components/team-dashboard-content"

export default function TeamDashboardPage({ params }: { params: { teamId: string } }) {
  return <TeamDashboardContent teamId={params.teamId} />
} 