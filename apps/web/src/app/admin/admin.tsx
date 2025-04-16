"use client";

import { useState } from "react";
import { toast } from "sonner";

export function Admin({ announcement }: { announcement: string | null }) {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2 max-sm:px-2">
      <div className="max-w-[83ch]">
        <div className="flex items-center gap-4 pb-2 max-sm:flex-col max-sm:items-start">
          <h2>Admin</h2>
        </div>

        <div className="text-foreground flex flex-col gap-2">
          <EditAnnouncement announcement={announcement} />
        </div>
      </div>
    </div>
  );
}

export function EditAnnouncement({
  announcement
}: {
  announcement: string | null;
}) {
  const [text, setText] = useState(announcement || "");

  function updateAnnouncement(text: string) {
    fetch("/api/admin/announcement", {
      method: "PATCH",
      body: JSON.stringify({
        announcement: text || undefined
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success("Announcement has been updated.");
          window.location.reload();
        } else {
          toast.error(res.msg || "Something went wrong. Please try again.");
        }
      })
      .catch((err) => {
        toast.error(err.msg || "Something went wrong. Please try again.");
        console.log(err);
      });
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="w-full">
        <label className="flex flex-col gap-1" htmlFor="announcement">
          Announcement:
        </label>
        <input
          type="text"
          id="announcement"
          className="w-full border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
          placeholder="Announcement"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div>
        <button
          onClick={() => {
            updateAnnouncement(text);
          }}
          className="w-full border border-gray-400 px-8 py-1 hover:bg-gray-500/20"
        >
          Save
        </button>
      </div>
    </div>
  );
}
