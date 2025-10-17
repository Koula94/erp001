"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectsOverview } from "@/components/projects/projects-overview"
import { ProjectDetails } from "@/components/projects/project-details"

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Manage construction projects, tasks, and timelines</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedProjectId}>
            Project Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ProjectsOverview
            onSelectProject={(projectId) => {
              setSelectedProjectId(projectId)
              setActiveTab("details")
            }}
          />
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          {selectedProjectId && <ProjectDetails projectId={selectedProjectId} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
