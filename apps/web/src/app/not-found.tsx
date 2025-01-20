"use server";

import Link from "next/link";

import { MainContainer } from "@/components/main-container";

export default async function Page() {
  return (
    <MainContainer>
      <div className="flex min-h-[380px] flex-1 flex-col items-center justify-center gap-6 p-4 pb-20">
        <div className="text-4xl font-bold">404 – Not Found</div>
        <div className="max-w-[32ch] text-center font-mono text-sm">
          The page you are looking for does not exist or has been deleted.
        </div>
        <div>
          <Link href="/" className="underline">
            Go to the homepage
          </Link>
        </div>
      </div>
    </MainContainer>
  );
}
