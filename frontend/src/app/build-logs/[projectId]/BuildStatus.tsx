"use client"
import { CheckCircle, Loader2 } from "lucide-react"
import { Button } from "~/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Deployment, Project } from "~/lib/res-types"


interface BuildStatusProps {
  project: Project;
  deployment: Deployment;
}

export default function BuildStatus({ project, deployment  }: BuildStatusProps) {

  const [buildStatus, setBuildStatus] = useState<string>(deployment?.status || 'building');
  const [buildLogs, setBuildLogs] = useState<string[]>([])

  useEffect(() => {

     // Simulate build process
    const steps = [
      `Cloning repository: ${project?.gitURL}...`,
      "Installing dependencies...",
      `Building project: ${project?.name}...`,
      "Running tests...",
      "Optimizing assets...",
      project?.customDomain ? `Configuring custom domain: ${project?.customDomain}...` : `Configuring ${project?.subDomain}...`,
      "Deploying to edge network...",
    ]

    steps.forEach((step, index) => {
      setTimeout(
        () => {
          setBuildLogs((prev) => [...prev, step])
          if (index === steps.length - 1) {
            setBuildStatus("deployed")
          }
        },
        (index + 1) * 2000,
      )
    })
    
  }, [project, deployment])

  return (
    <div className="mt-8 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-4">Build Status: {buildStatus}</h2>
      <div className="bg-gray-100 p-4 rounded-md mb-4">
        {buildLogs.map((log, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            {index === buildLogs.length - 1 && buildStatus !== "deployed" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span>{log}</span>
          </div>
        ))}
      </div>
      {buildStatus === "deployed" && (
        <div className="mt-4 text-center text-green-600 font-semibold mb-4">Deployment successful!</div>
      )}
      <Link href="/" passHref>
        <Button className="w-full">Back to Home</Button>
      </Link>
    </div>
  )
}