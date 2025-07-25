import Image from "next/image";
import Link from "next/link";

import { current_release } from "@/app/release-notes/release-notes";
import { parsePostBody } from "@/lib/post-utils";
import { redis } from "@/lib/redis";
import { ServerRibbon } from "@/lib/server-ribbon";
import { ServerSession } from "@/lib/server-session";
import { cn } from "@/lib/utils";

import { AccountDropdown } from "./account-dropdown";
import { CreateRibbonModal } from "./create-ribbon-modal";
import { EasterEgg } from "./easter-egg";
import { FolksAboutTop } from "./folks-about-top";
import { MobileNavigation } from "./mobile-navigation";
import { NavDMsLink } from "./nav-dms-link";
import { Notifications } from "./notifications";
import { PushNotificationManager } from "./push-manager";
import { HorizonalRibbon } from "./ribbon";
import { Separator } from "./separator";
import { StickersComing } from "./stickers-coming";
import { VerificationEmailAlert } from "./verification-email";

export async function MainContainer({
  children,
  hideAbout,
  hideFooter,
  hideTopSeparator,
  hideTopRibbon,
  hideBottomRibbon,
  wide
}: {
  children: React.ReactNode;
  hideAbout?: boolean;
  hideFooter?: boolean;
  hideTopSeparator?: boolean;
  hideTopRibbon?: boolean;
  hideBottomRibbon?: boolean;
  wide?: boolean;
}) {
  const user = await ServerSession();
  const ribbon = await ServerRibbon();

  const announcement = await redis.get("announcement");

  return (
    <div className={cn("mx-auto flex flex-col", !hideTopRibbon && "pt-[32px]")}>
      {!hideTopRibbon && (
        <HorizonalRibbon
          fixed={true}
          top={true}
          ribbonString={ribbon}
          user={user}
        />
      )}

      <div
        className={cn(
          "dark:bg-black-900 flex w-full flex-col items-center gap-2 bg-white transition-all max-sm:pb-[60px]",
          !wide && "px-4"
        )}
        style={{
          paddingTop: hideTopRibbon ? 8 : 16,
          minHeight: `calc(100dvh - ${(hideBottomRibbon ? 0 : 32) + (hideTopRibbon ? 0 : 32)}px)`
        }}
      >
        <header
          className={cn(
            "mx-auto flex w-full max-w-3xl select-none flex-col items-start gap-2 py-1 max-sm:pb-2",
            wide && "px-4"
          )}
        >
          <div className="flex w-full flex-row items-center justify-center gap-2 max-sm:flex-col">
            <div className="max-sm:flex max-sm:w-full max-sm:items-center max-sm:justify-center">
              <Link href="/">
                <Image
                  src="/images/logo.svg"
                  alt="Folks Logo"
                  width={80}
                  height={80 * 0.3221}
                  className="dark:invert"
                />
              </Link>
            </div>

            {user && (
              <div className="text-md flex flex-1 flex-row justify-end gap-2 pt-2 max-sm:hidden">
                <Link href="/">Posts</Link>
                <span>·</span>
                <Link href="/boards">Boards</Link>
                <span>·</span>
                <Link href="/articles">Articles</Link>
                <span>·</span>

                <NavDMsLink />

                <span>·</span>

                <Notifications user={user} small={true} />
                <span>·</span>
                <AccountDropdown user={user} />
              </div>
            )}

            {!user && (
              <div className="text-md flex flex-1 flex-row justify-end gap-2 pt-4">
                <Link href="/login">Login</Link>
                <span>·</span>
                <Link href="/register">Register</Link>
                <span>·</span>
                <Link href="/support">Support</Link>
              </div>
            )}
          </div>

          {user && !user.email_verified && (
            <>
              <Separator />
              <VerificationEmailAlert />
            </>
          )}

          {!user && !hideAbout && <Separator />}

          {!user && !hideAbout && <FolksAboutTop />}

          {user && announcement && (
            <div className="flex w-full flex-col gap-2 text-center text-sm">
              <Separator />
              <div
                dangerouslySetInnerHTML={{
                  __html: parsePostBody(announcement)
                }}
              />
            </div>
          )}

          {user && <PushNotificationManager />}

          {!hideTopSeparator && <Separator />}

          {user && <MobileNavigation user={user} />}
        </header>

        {children}

        {!hideFooter && (
          <footer className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-8 pt-4 max-md:gap-2">
            <Separator />
            <div className="flex gap-2 max-md:flex-col max-md:items-center max-md:gap-1">
              <Link
                href="/manifesto"
                className="underline opacity-70 hover:opacity-100"
              >
                Manifesto
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
                href="/support"
                className="underline opacity-70 hover:opacity-100"
              >
                Support
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
        )}
      </div>

      <CreateRibbonModal />
      <StickersComing />

      {!hideBottomRibbon && (
        <HorizonalRibbon ribbonString={ribbon} user={user} />
      )}
    </div>
  );
}
