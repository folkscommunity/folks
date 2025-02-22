import { MainContainer } from "@/components/main-container";

import VerifyPage from "./verify-page";

export default async function Page({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const token = (await params).token;

  return (
    <MainContainer hideAbout={true}>
      <VerifyPage token={token} />
    </MainContainer>
  );
}
