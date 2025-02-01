import { MainContainer } from "@/components/main-container";

import { Unsubscribe } from "./unsubscribe";

export default async function Page({
  params
}: {
  params: Promise<{ email: string }>;
}) {
  const email = (await params).email;

  return (
    <MainContainer>
      <Unsubscribe email={email} />
    </MainContainer>
  );
}
