"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";

import { ChangeAvatar } from "./change-avatar";

export function Settings({ user }: { user: any }) {
  const [display_name, setDisplayName] = useState(user.display_name);
  const [occupation, setOccupation] = useState(user.occupation || "");
  const [location, setLocation] = useState(user.location || "");
  const [pronouns, setPronouns] = useState(user.pronouns || "");
  const [website, setWebsite] = useState(user.website || "");

  function updateProfile() {
    fetch("/api/user", {
      method: "PATCH",
      body: JSON.stringify({
        display_name: display_name,
        occupation: occupation,
        location: location,
        pronouns: pronouns,
        website: website
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success("Profile updated.");
        } else {
          if (res.msg) {
            toast.error(res.msg);
          } else {
            toast.error("Something went wrong.");
          }
        }
      })
      .catch((err) => {
        if (err.msg) {
          toast.error(err.msg);
        } else {
          toast.error("Something went wrong.");
        }
      });
  }

  return (
    <div className="flex min-h-[80dvh] w-full max-w-3xl flex-col gap-2">
      <div className="max-w-[83ch]">
        <h2 className="pb-4">Settings</h2>
        <div className="pb-4">
          <div className="font-bold">Avatar: </div>
          <ChangeAvatar user={user} />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex max-w-sm flex-col gap-2">
            <label htmlFor="display_name" className="font-bold">
              Name:{" "}
            </label>

            <input
              type="text"
              id="display_name"
              value={display_name}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            />
          </div>

          <div className="flex max-w-sm flex-col gap-2">
            <label htmlFor="occupation" className="font-bold">
              Occupation:{" "}
            </label>

            <input
              type="text"
              id="occupation"
              value={occupation}
              placeholder="Designer, engineer, etc."
              onChange={(e) => setOccupation(e.target.value)}
              className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            />
          </div>

          <div className="flex max-w-sm flex-col gap-2">
            <label htmlFor="location" className="font-bold">
              Location:{" "}
            </label>

            <input
              type="text"
              id="location"
              placeholder="Your homebase"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            />
          </div>

          <div className="flex max-w-sm flex-col gap-2">
            <label htmlFor="pronouns" className="font-bold">
              Pronouns:{" "}
            </label>

            <input
              type="text"
              id="pronouns"
              placeholder="Them/them, etc."
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            />
          </div>

          <div className="flex max-w-sm flex-col gap-2">
            <label htmlFor="website" className="font-bold">
              Website:{" "}
            </label>

            <input
              type="url"
              id="website"
              value={website}
              placeholder="https://example.com"
              onChange={(e) => setWebsite(e.target.value)}
              className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            />
          </div>

          <div className="flex max-w-sm flex-col gap-2 pt-4">
            <button
              className="bg-black-900 dark:bg-black-800 text-black-100 rounded-full border border-neutral-300/0 p-2 px-4 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
              onClick={updateProfile}
              disabled={
                (display_name || undefined) === user.display_name &&
                (occupation || undefined) === user.occupation &&
                (location || undefined) === user.location &&
                (pronouns || undefined) === user.pronouns &&
                (website || undefined) === user.website
              }
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
