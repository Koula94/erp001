"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Project } from "@/lib/project-types"

interface ProjectTeamTabProps {
  project: Project
}

export function ProjectTeamTab({ project }: ProjectTeamTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Team</CardTitle>
        <CardDescription>Team members working on this project</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {project.manager_name
                  ? project.manager_name.split(" ").map((n: string) => n[0]).join("")
                  : "PM"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{project.manager_name || "No Manager Assigned"}</p>
              <p className="text-sm text-muted-foreground">Project Manager</p>
            </div>
            <Badge>Manager</Badge>
          </div>
          {project.team_members?.map((member, index) => (
            <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {member.name
                    ? member.name.split(" ").map((n: string) => n[0]).join("")
                    : "TM"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{member.name || "Unnamed Team Member"}</p>
                <p className="text-sm text-muted-foreground">Team Member</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
