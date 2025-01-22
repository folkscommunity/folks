import { MainContainer } from "@/components/main-container";

import VerifyPage from "./verify_page";

export default async function Page({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const token = (await params).token;

  return (
    <MainContainer>
      <VerifyPage token={token} />
    </MainContainer>
  );
}
