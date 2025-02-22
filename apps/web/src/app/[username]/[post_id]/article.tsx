"use client";

import Link from "next/link";

import { Separator } from "@/components/separator";
import { formatArticleDate } from "@/lib/utils";

export function Article({
  title,
  author,
  published_at,
  body
}: {
  title: string;
  author: any;
  published_at: any;
  body: string;
}) {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2">
      <div className="w-full flex-1 pb-8">
        <div>
          <div className="w-full pt-4 max-sm:text-center">
            <span className="text-primary/80 overflow-clip break-words font-serif text-4xl font-bold leading-8 max-sm:text-3xl">
              {title}
            </span>
          </div>
        </div>
        <div className="pb-3 pt-2 opacity-70">
          <div className="flex gap-[1ch] max-sm:flex-col max-sm:items-center max-sm:gap-0">
            <span>
              By{" "}
              <Link
                href={`/${author.username}`}
                className="group hover:no-underline"
              >
                <span className="group-hover:underline">
                  {author.display_name}
                </span>{" "}
                (
                <span className="group-hover:underline">
                  @{author.username}
                </span>
                )
              </Link>
            </span>
            <span className="max-sm:hidden"> – </span>
            <span>{formatArticleDate(published_at)}</span>
          </div>
        </div>
        <div>
          <div
            className="ProseMirror compiled text-md font-sans tracking-normal"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>
      </div>

      <Separator />
      <div className="text-md w-full pt-4 max-sm:text-center">
        Check out more content from {author.display_name} by{" "}
        <Link href={`/${author.username}`} className="underline">
          clicking here
        </Link>
        .
      </div>
    </div>
  );
}
