"use client";

import dayjs from "dayjs";
import Link from "next/link";

import { Button } from "@/components/button";

export function Articles({ articles }: { articles: any[] }) {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="leading-[42px]">Your Articles</h1>

        <Link href="/articles/create">
          <Button>New Article</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {articles &&
          articles.length > 0 &&
          articles.map((article: any) => (
            <div key={article.id}>
              <Link
                href={`/articles/${article.id}`}
                className="group hover:no-underline"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-md break-words group-hover:underline">
                    {article.title}
                  </div>
                  <div className="text-md flex flex-col items-end text-nowrap opacity-80">
                    {article.published ? (
                      <span className="text-green-500">[ Published ]</span>
                    ) : (
                      <span className="text-blue-500">[ Draft ]</span>
                    )}

                    <span>
                      {dayjs(article.created_at).format("MMM D, YYYY (HH:mm)")}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}

        {(!articles || articles.length === 0) && (
          <div>You haven't written any articles yet.</div>
        )}
      </div>
    </div>
  );
}
