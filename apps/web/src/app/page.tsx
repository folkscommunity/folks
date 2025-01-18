import { Feeds } from "@/components/feeds";
import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

export default async function Home() {
  const user = await ServerSession();

  return (
    <MainContainer>
      <main className="text-md flex flex-col gap-4">
        <Feeds is_authed={Boolean(user)} />
      </main>
    </MainContainer>
  );
}
