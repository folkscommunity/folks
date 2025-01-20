"use client";

import { useLocalStorage } from "@uidotdev/usehooks";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AlphaNotice() {
  const [show, setShow] = useLocalStorage("show_alpha_notice", true);

  const router = useRouter();

  function goToWaitlist() {
    setShow(false);
    router.push("/request-access");
  }

  return (
    <>
      {show && (
        <div className="bg-black-900/80 fixed left-0 top-0 z-[99999] flex h-[100dvh] w-[100dvw] flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="z-[99999] flex max-w-xl flex-col bg-gray-100 p-5 outline-none dark:bg-slate-900">
            <div className="flex flex-col gap-2 px-4 py-4">
              <h2 className="pb-4 font-bold">Welcome!</h2>
              <p>
                <strong>Folks</strong> is currently in a closed alpha. We are
                still building out the platform and adding features.
              </p>
              <p>
                Feel free to{" "}
                <span
                  className="cursor-pointer underline"
                  onClick={goToWaitlist}
                >
                  join the waitlist
                </span>
                , and you'll be notified when we open up.
              </p>
              <p>
                If you're here from{" "}
                <Link
                  href="https://posts.cv"
                  className="font-bold underline"
                  target="_blank"
                >
                  Posts
                </Link>
                , put your username in the waitlist form and i'll accept you
                ASAP.
              </p>
              <p>
                ~ Johny (
                <Link
                  href="https://posts.cv/rokita"
                  className="font-bold underline"
                  target="_blank"
                >
                  posts.cv/rokita
                </Link>
                )
              </p>

              <button
                className="bg-black-900 dark:bg-black-800 text-black-100 rounded-full border border-neutral-300/0 p-2 px-4 dark:border-slate-800 dark:text-slate-400"
                onClick={() => setShow(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
