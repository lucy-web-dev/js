import { notFound } from "next/navigation";
import { getAuthToken, getUserThirdwebClient } from "@/api/auth-token";
import { getProject } from "@/api/project/projects";
import { getSessions } from "./api/session";
import { ChatPageContent } from "./components/ChatPageContent";
import { ChatPageLayout } from "./components/ChatPageLayout";

export default async function Page(props: {
  params: Promise<{ team_slug: string; project_slug: string }>;
}) {
  const [params] = await Promise.all([props.params]);

  const [authToken, project] = await Promise.all([
    getAuthToken(),
    getProject(params.team_slug, params.project_slug),
  ]);

  if (!authToken) {
    notFound();
  }

  if (!project) {
    notFound();
  }

  const client = await getUserThirdwebClient({ teamId: project.teamId });

  const sessions = await getSessions({ project }).catch(() => []);

  return (
    <ChatPageLayout
      team_slug={params.team_slug}
      project={project}
      authToken={authToken}
      client={client}
      accountAddress={""}
      sessions={sessions}
    >
      <ChatPageContent
        project={project}
        accountAddress={""}
        authToken={authToken}
        client={client}
        initialParams={undefined}
        session={undefined}
        type="new-chat"
      />
    </ChatPageLayout>
  );
}
