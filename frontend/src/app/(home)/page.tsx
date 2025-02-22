"use client"
import { useRouter } from "next/navigation"
import ProjectForm from "./ProjectForm"

export default function Home() {
  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL + "/project"

  const handleDeploy = async (projectName: string, repoUrl: string, customDomain: string) => {
    try {
      if (!process.env.NEXT_PUBLIC_API_URL) {
        throw new Error("API URL is not configured");
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          gitURL: repoUrl,
          customDomain: customDomain,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      alert(data.message);
      router.push(`/build-logs/${data.project.id}`);
    } catch (error) {
      console.error("Detailed error:", error);
      alert(`Failed to create project: ${(error as Error).message}`);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Vercel Clone</h1>
      <ProjectForm onSubmit={handleDeploy} />
    </main>
  )
}