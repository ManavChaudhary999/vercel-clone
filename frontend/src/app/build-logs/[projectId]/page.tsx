import { Deployment, Project } from "~/lib/res-types";
import BuildStatus from "./BuildStatus"

export default async function BuildLogs(props: {
  params: Promise<{projectId: string}>
  }) {
  const params = await props.params;
  const projectId = params.projectId;
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL + "/deploy"

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId,
    }),
  });

  const data = await response.json();
  const project: Project = data.project;
  const deployment: Deployment = data.deployment;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Build Logs</h1>
      <BuildStatus project={project} deployment={deployment} />
    </main>
  )
}