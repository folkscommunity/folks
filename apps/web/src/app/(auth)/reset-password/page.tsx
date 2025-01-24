import { prisma } from "@folks/db";

import { MainContainer } from "@/components/main-container";

import ResetPasswordRequest from "./reset-password-request";

export default async function Page() {
  return (
    <MainContainer>
      <ResetPasswordRequest />
    </MainContainer>
  );
}
