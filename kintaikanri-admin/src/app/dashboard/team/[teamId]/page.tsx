"use client"

import { use } from "react"
import { TeamDashboardContent } from "@/components/team-dashboard-content"

export default function TeamDashboardPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)
  return <TeamDashboardContent teamId={teamId} />
} 