"use client"

import { use } from "react"
import { AuthGuard } from "@/lib/auth-guard"
import { TeamMembersContent } from "@/components/team-members-content"

export default function TeamMembersPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)
  return <TeamMembersContent teamId={teamId} />
} 