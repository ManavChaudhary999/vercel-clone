"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

interface ProjectFormProps {
  onSubmit: (projectName: string, repoUrl: string, customDomain: string) => void
}

export default function ProjectForm({ onSubmit }: ProjectFormProps) {
  const [projectName, setProjectName] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [customDomain, setCustomDomain] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(projectName, repoUrl, customDomain)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div>
        <Label htmlFor="projectName">Project Name</Label>
        <Input
          id="projectName"
          type="text"
          placeholder="My Awesome Project"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="repoUrl">GitHub URL</Label>
        <Input
          id="repoUrl"
          type="url"
          placeholder="https://github.com/username/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="customDomain">Custom Domain (optional)</Label>
        <Input
          id="customDomain"
          type="text"
          placeholder="www.myproject.com"
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full">
        Deploy
      </Button>
    </form>
  )
}