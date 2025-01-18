import Image from "next/image";
import Link from "next/link";

import { ServerSession } from "@/lib/server-session";

export async function MainContainer({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await ServerSession();

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col border-l border-r border-neutral-200 font-mono dark:border-neutral-800">
      <header className="flex flex-col items-start gap-8 border-b border-neutral-200 px-6 pb-8 pt-8 dark:border-neutral-800">
        <div className="flex w-full flex-row items-center justify-between gap-4 max-sm:flex-col">
          <Link href="/">
            <Image
              src="/images/logo.svg"
              alt="Folks Logo"
              width={100}
              height={33}
              className="dark:invert"
            />
          </Link>

          <div className="flex flex-row gap-4">
            {user && (
              <>
                <Link href={`/${user.username}`}>Profile</Link>
                <span>–</span>
                <a href="/api/auth/logout">Logout</a>
              </>
            )}

            {!user && (
              <>
                <Link href="/login">Login</Link>
                <span>–</span>
                <Link href="/register">Register</Link>
              </>
            )}
          </div>
        </div>

        {!user && (
          <div className="font-bold">
            Folks is a place for <strong>product people</strong>. We celebrate
            one another, share accomplishments, assume good intent, and reject
            negativity.
          </div>
        )}
      </header>

      {children}
    </div>
  );
}
