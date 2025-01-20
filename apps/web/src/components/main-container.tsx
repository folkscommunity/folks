/* eslint-disable react/no-unescaped-entities */
import Image from "next/image";
import Link from "next/link";

import { ServerSession } from "@/lib/server-session";

import { AccountDropdown } from "./account-dropdown";
import { AlphaNotice } from "./alpha-notice";
import { CreateRibbonModal } from "./create-ribbon-modal";
import { HorizonalRibbon } from "./ribbon";
import { Separator } from "./separator";

export async function MainContainer({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await ServerSession();

  return (
    <div className="mx-auto flex flex-col pt-10">
      <HorizonalRibbon fixed={true} />
      <AlphaNotice />
      <CreateRibbonModal />
      <div className="dark:bg-black-900 dark:border-black-700 flex min-h-[calc(100dvh-80px)] w-full flex-col items-center border-t border-white bg-white px-20 pt-8 transition-all max-sm:px-4">
        <header className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 py-4">
          <div className="flex w-full flex-row items-center justify-between gap-4 max-sm:flex-col">
            <Link href="/">
              <Image
                src="/images/logo.svg"
                alt="Folks Logo"
                width={100}
                height={32.21}
                className="dark:invert"
              />
            </Link>

            <div className="text-md flex flex-row gap-2">
              {user && (
                <>
                  <Link href="/">Posts</Link>
                  <span>·</span>
                  <AccountDropdown user={user} />
                </>
              )}

              {!user && (
                <>
                  <Link href="/request-access">Request Access</Link>
                  <span>·</span>
                  <Link href="/login">Login</Link>
                  <span>·</span>
                  <Link href="/register">Register</Link>
                </>
              )}
            </div>
          </div>

          <Separator />
        </header>

        {children}

        <footer className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-8">
          <div className="flex gap-2">
            <Link
              href="/about"
              className="underline opacity-70 hover:opacity-100"
            >
              About
            </Link>
            <span>·</span>
            <Link
              href="/privacy-policy"
              className="underline opacity-70 hover:opacity-100"
            >
              Privacy Policy
            </Link>
            <span>·</span>
            <Link
              href="/guidelines"
              className="underline opacity-70 hover:opacity-100"
            >
              Community Guidelines
            </Link>
            <span>·</span>
            <Link
              href="/discord"
              className="underline opacity-70 hover:opacity-100"
            >
              Discord
            </Link>
          </div>
          <Separator />
          <div>
            Folks is open source,{" "}
            <Link
              href="https://github.com/folkscommunity/folks"
              target="_blank"
              className="underline opacity-70 hover:opacity-100"
            >
              click here
            </Link>{" "}
            for the repository.
          </div>
        </footer>
      </div>
      <HorizonalRibbon />
    </div>
  );
}
