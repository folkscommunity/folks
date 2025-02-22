"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Label } from "@/components/label";

export function CreateArticle({ user }: { user: any }) {
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!slugEdited && title.length > 0) {
      const slugfromtitle = title
        .replace(/\s/g, "-")
        .replace(/-{2,}/g, "-")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-$/, "");

      if (slugfromtitle.length > 0) {
        setSlug(slugfromtitle);
      }
    }
  }, [title, slug, slugEdited]);

  async function createArticle(article_title: string, article_slug: string) {
    setLoading(true);

    await fetch("/api/articles/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: article_title,
        slug: article_slug
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          router.push(`/articles/${res.data.id}`);
          window.location.href = `/articles/${res.data.id}`;
        } else {
          setError(res.message || "An error occured.");
          setLoading(false);
        }
      });
  }

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2">
      <div>
        <h1>Create an Article</h1>
      </div>
      <div className="mt-4">
        <p>
          Select a title for your article, and press Create to open the editor.
        </p>
      </div>
      <div className="mt-2">
        <div>
          <Label htmlFor="title" className="text-md">
            Title:
          </Label>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            maxLength={80}
            minLength={3}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            placeholder="A Great Title"
            className="text-primary/80 mt-2 min-w-full border-0 bg-transparent font-serif text-3xl font-bold outline-none"
          />
        </div>

        <div className="mt-4 flex">
          <Label htmlFor="slug" className="text-md">
            Slug: /{user.username}/
          </Label>
          <input
            id="slug"
            name="slug"
            type="text"
            minLength={3}
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              // slug must not have spaces and use - instead of spaces
              e.target.value = e.target.value.replace(/\s/g, "-");
              //slug must not have more then one - in a row
              e.target.value = e.target.value.replace(/-{2,}/g, "-");
              // turn letters to lowercase
              e.target.value = e.target.value.toLowerCase();
              // only allow letters, numbers, and -
              e.target.value = e.target.value.replace(/[^a-z0-9-]/g, "");

              setSlug(e.target.value);
            }}
            maxLength={60}
            placeholder="your-unique-slug"
            className="text-primary/80 text-md min-w-[25ch] flex-1 border-0 border-b border-transparent bg-transparent font-medium outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={async () => {
              await createArticle(title, slug);
            }}
            className="rounded-md bg-neutral-900 px-3 py-1 text-white disabled:bg-neutral-400 dark:bg-neutral-600 dark:disabled:bg-neutral-800"
            disabled={title.length < 3 || slug.length < 3 || loading}
            title="Both the slug and the title must be at least 3 characters."
          >
            Create
          </button>
          <button
            onClick={() => {
              setSlugEdited(false);
              setSlug("");
              setTitle("");
            }}
            className="rounded-md border border-neutral-900 px-3 py-1 text-black disabled:border-neutral-400 dark:border-neutral-600 dark:text-white dark:disabled:border-neutral-800"
          >
            Reset
          </button>
        </div>

        <p className="mt-2 opacity-70">
          ( Both the title and the slug must be at least 3 characters. )
        </p>

        {error && <p className="mt-2 font-bold text-red-500">{error}</p>}
      </div>
    </div>
  );
}
