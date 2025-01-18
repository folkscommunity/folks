"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

export function Composer({ onPost }: { onPost: () => void }) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");

  function createPost(body: string) {
    fetch("/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        body: body
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setText("");
          setError("");
          setFocused(false);
          onPost();
        } else {
          setError("An error occured.");
        }
      })
      .catch((err) => {
        setError("An error occured.");
      });
  }

  return (
    <div className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <textarea
        className="w-full resize-none border-0 bg-transparent px-2 py-1 font-sans placeholder:text-neutral-700 focus:outline-none"
        placeholder="Write something..."
        maxLength={300}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        onFocus={() => setFocused(true)}
      />

      {focused && (
        <div>
          <div className="flex items-center justify-between gap-2">
            <button className="rounded-md text-neutral-700 dark:text-neutral-600">
              <ImageIcon className="size-6" />
            </button>

            <div className="flex items-center gap-2">
              <button
                className="rounded-md border border-neutral-600 px-3 py-1 dark:border-neutral-800"
                onClick={() => {
                  setFocused(false);
                  setText("");
                  setError("");
                }}
              >
                Cancel
              </button>
              <button
                disabled={!text}
                className="rounded-md bg-neutral-900 px-3 py-1 text-white disabled:bg-neutral-400 dark:bg-neutral-600 dark:disabled:bg-neutral-800"
                onClick={() => createPost(text)}
              >
                Post
              </button>
            </div>
          </div>
          <div className="pt-2">
            {error && <span className="font-bold text-red-500">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
