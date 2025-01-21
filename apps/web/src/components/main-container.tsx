import Image from "next/image";
import Link from "next/link";

import { current_release } from "@/app/release-notes/release-notes";
import { ServerSession } from "@/lib/server-session";

import { AccountDropdown } from "./account-dropdown";
import { AlphaNotice } from "./alpha-notice";
import { CreateRibbonModal } from "./create-ribbon-modal";
import { HorizonalRibbon } from "./ribbon";
import { Separator } from "./separator";
import { StickersComing } from "./stickers-coming";

export async function MainContainer({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await ServerSession();

  return (
    <div className="mx-auto flex flex-col pt-10">
      <HorizonalRibbon fixed={true} top={true} />

      <div className="dark:bg-black-900 flex min-h-[calc(100dvh-80px)] w-full flex-col items-center bg-white px-20 pt-8 transition-all max-sm:px-4">
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

        <footer className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-8 max-md:gap-2">
          <Separator />
          <div className="flex gap-2 max-md:flex-col max-md:items-center max-md:gap-1">
            <Link
              href="/about"
              className="underline opacity-70 hover:opacity-100"
            >
              About
            </Link>
            <span className="max-md:hidden">·</span>
            <Link
              href="/privacy-policy"
              className="underline opacity-70 hover:opacity-100"
            >
              Privacy Policy
            </Link>
            <span className="max-md:hidden">·</span>
            <Link
              href="/guidelines"
              className="underline opacity-70 hover:opacity-100"
            >
              Community Guidelines
            </Link>
            <span className="max-md:hidden">·</span>
            <Link
              href="/discord"
              className="underline opacity-70 hover:opacity-100"
            >
              Discord
            </Link>
          </div>
          <Separator />
          <div className="flex flex-row gap-2 max-md:flex-col max-md:items-center">
            <Link href="/release-notes" className="underline">
              Release v{current_release}
            </Link>
            <span className="max-md:hidden">·</span>
            <div className="max-md:text-center">
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
          </div>
        </footer>
      </div>

      <AlphaNotice />
      <CreateRibbonModal />
      <StickersComing />

      <HorizonalRibbon />
    </div>
  );
}
