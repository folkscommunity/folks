import { prisma } from "@folks/db";

import { MainContainer } from "@/components/main-container";

import ResetPassword from "./reset-password";

export default async function Page({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const token = (await params).token;

  const user = await prisma.user.findFirst({
    where: {
      reset_password_token: token,
      deleted_at: null
    }
  });

  if (
    !user ||
    !user.reset_password_token ||
    (user &&
      user.reset_password_expires &&
      new Date(user.reset_password_expires) < new Date())
  ) {
    return (
      <MainContainer>
        <ResetPassword token={token} invalidToken={true} />
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <ResetPassword token={token} />
    </MainContainer>
  );
}
