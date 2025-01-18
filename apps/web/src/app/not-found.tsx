"use server";

import { MainContainer } from "@/components/main-container";

export default async function Page() {
  return (
    <MainContainer>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 pb-20">
        <div className="text-4xl font-bold">404 – Not Found</div>
        <div className="max-w-2xl font-mono text-sm">
          The page you are looking for does not exist or has been deleted.
        </div>
      </div>
    </MainContainer>
  );
}
