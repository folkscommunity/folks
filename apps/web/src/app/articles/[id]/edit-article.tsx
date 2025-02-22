"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FolksEditor } from "@folks/editor";

import { Label } from "@/components/label";

export function EditArticle({
  article_id,
  user,
  content,
  slug,
  title,
  published,
  published_at
}: {
  article_id: bigint;
  user: any;
  content: any;
  slug: string;
  title: string;
  published: boolean;
  published_at: any;
}) {
  const [isClient, setIsClient] = useState(false);
  const [cTitle, setCTitle] = useState(title || "");
  const [titleChanged, setTitleChanged] = useState(false);
  const [cSlug, setCSlug] = useState(slug || "");
  const [slugChanged, setSlugChanged] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  function publishArticle() {
    fetch("/api/articles/publish/" + article_id, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          window.location.reload();
        } else {
          throw new Error(res.message || "An error occured.");
        }
      });
  }

  function unpublishArticle() {
    fetch("/api/articles/unpublish/" + article_id, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          window.location.reload();
        } else {
          throw new Error(res.message || "An error occured.");
        }
      });
  }

  function updateSlug(slug: string) {
    fetch("/api/articles/update/" + article_id, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        slug: slug
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success("Slug has been updated.");
          setSlugChanged(false);
        } else {
          toast.error(res.message || "An error occured.");
        }
      })
      .catch((err) => {
        toast.error(err.message || "An error occured.");
      });
  }

  function updateTitle(title: string) {
    fetch("/api/articles/update/" + article_id, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: title
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success("Title has been updated.");
          setTitleChanged(false);
        } else {
          toast.error(res.message || "An error occured.");
        }
      })
      .catch((err) => {
        toast.error(err.message || "An error occured.");
      });
  }

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex flex-1 pr-4">
            {slugChanged && (
              <button
                className="absolute ml-[-72px] mt-[-2px] rounded-full border px-3 py-0.5"
                onClick={() => updateSlug(cSlug)}
              >
                Save
              </button>
            )}

            <Label htmlFor="slug" className="text-md">
              /{user.username}/
            </Label>
            <input
              id="slug"
              name="slug"
              type="text"
              minLength={3}
              value={cSlug}
              onChange={(e) => {
                setSlugChanged(true);
                // slug must not have spaces and use - instead of spaces
                e.target.value = e.target.value.replace(/\s/g, "-");
                //slug must not have more then one - in a row
                e.target.value = e.target.value.replace(/-{2,}/g, "-");
                // turn letters to lowercase
                e.target.value = e.target.value.toLowerCase();
                // only allow letters, numbers, and -
                e.target.value = e.target.value.replace(/[^a-z0-9-]/g, "");

                setCSlug(e.target.value);
              }}
              maxLength={60}
              placeholder="your-unique-slug"
              className="text-primary/80 text-md min-w-[25ch] flex-1 border-0 border-b border-transparent bg-transparent font-medium outline-none focus:border-blue-500"
            />
          </div>
          <div>
            {published ? (
              <button
                className="rounded-md border border-slate-900 px-3 py-1 text-white dark:border-slate-700"
                onClick={unpublishArticle}
              >
                Unpublish
              </button>
            ) : (
              <button
                className="rounded-md border border-slate-900 px-3 py-1 text-white dark:border-slate-700"
                onClick={publishArticle}
              >
                Publish
              </button>
            )}
          </div>
        </div>

        <div className="pt-4">
          {titleChanged && (
            <button
              className="absolute ml-[-72px] mt-[5px] rounded-full border px-3 py-0.5"
              onClick={() => updateTitle(cTitle)}
            >
              Save
            </button>
          )}

          <input
            id="title"
            name="title"
            type="text"
            value={cTitle}
            maxLength={80}
            minLength={3}
            onChange={(e) => {
              setTitleChanged(true);
              setCTitle(e.target.value);
            }}
            placeholder="The Title"
            className="text-primary/80 w-full min-w-full border-0 bg-transparent font-serif text-3xl font-bold outline-none"
          />
        </div>
      </div>
      <div className="text-md pt-5 font-sans">
        {isClient && (
          <FolksEditor article_id={article_id.toString()} content={content} />
        )}
      </div>
    </div>
  );
}
